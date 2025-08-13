/* eslint-disable */
import { coerceMessageLikeToMessage, convertToChunk, isBaseMessageChunk } from "@langchain/core/messages";
import { uiMessageReducer } from "@langchain/langgraph-sdk/react-ui";

function tryConvertToChunk(message) {
  try {
    return convertToChunk(message);
  } catch {
    return null;
  }
}

function toMessageDict(chunk) {
  const { type, data } = chunk.toDict();
  return { ...data, type };
}

function hashString(input) {
  // Simple djb2 hash for stability across sessions
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return (hash >>> 0).toString(16);
}

export class Store {
  constructor() {
    this.byThread = new Map();
    this.partialMode = "append"; // 'append' | 'hold'
  }

  setPartialMode(mode) {
    this.partialMode = mode === "hold" ? "hold" : "append";
  }

  _ensure(threadId) {
    let s = this.byThread.get(threadId);
    if (!s) {
      s = {
        messagesById: new Map(),
        messageOrder: [],
        uiById: new Map(),
        uiOrder: [],
        // unified blocks timeline
        blocksById: new Map(), // blockId -> { kind, refId, value?, completed?, frozenValue?, receivedAt }
        blockOrder: [],        // blockId[] in first-seen order
        lastUpdatedAt: 0,
        displayedMessageIds: new Set(), // controls UI visibility (used for hold mode)
      };
      this.byThread.set(threadId, s);
    }
    return s;
  }

  _blockIdFor(kind, refId) {
    if (!refId) return null;
    const prefix = kind === "message" ? "m:" : kind === "ui" ? "u:" : "i:";
    return `${prefix}${refId}`;
  }

  _deriveInterruptId(interruptValue) {
    // Unwrap array payloads (LangGraph can send a list of interrupt objects)
    const iv = Array.isArray(interruptValue) ? (interruptValue[0] ?? null) : interruptValue;
    const supplied = iv?.interrupt_id || iv?.id;
    if (supplied) return String(supplied);
    // Derive from widget payload or entire value to ensure stability across duplicate events
    try {
      const core = iv?.value?.widget ?? iv?.widget ?? iv?.value?.value?.widget ?? iv?.value ?? iv;
      const json = JSON.stringify(core);
      return `auto-${hashString(json)}`;
    } catch {
      return `auto-${Date.now().toString(16)}`;
    }
  }

  _ensureBlock(threadId, kind, refId, receivedAt) {
    const state = this._ensure(threadId);
    const blockId = this._blockIdFor(kind, refId);
    if (!blockId) return null;
    if (!state.blocksById.has(blockId)) {
      state.blocksById.set(blockId, { kind, refId, receivedAt: receivedAt ?? Date.now() });
      state.blockOrder.push(blockId);
    }
    return blockId;
  }

  _insertBlockAfter(threadId, blockIdToInsert, afterBlockId) {
    const state = this._ensure(threadId);
    const exists = state.blockOrder.includes(blockIdToInsert);
    if (!exists) {
      // default append
      state.blockOrder.push(blockIdToInsert);
    }
    if (!afterBlockId) return;
    const currentIndex = state.blockOrder.indexOf(blockIdToInsert);
    const afterIndex = state.blockOrder.indexOf(afterBlockId);
    if (afterIndex === -1) return;
    const desiredIndex = afterIndex + 1;
    if (currentIndex === desiredIndex) return;
    // Remove and re-insert only if we are inserting for the first time
    if (!exists || currentIndex !== desiredIndex) {
      // never move blocks that already existed before (preserve first-seen order)
      if (exists) return;
      state.blockOrder.splice(currentIndex, 1);
      state.blockOrder.splice(desiredIndex, 0, blockIdToInsert);
    }
  }

  applyMessage(threadId, serializedOrArray, subtype = "base") {
    const state = this._ensure(threadId);
    const serialized = Array.isArray(serializedOrArray) ? serializedOrArray[0] : serializedOrArray;
    if (!serialized) return;

    // coerce to message or chunk
    if (serialized.type && typeof serialized.type === 'string' && serialized.type.endsWith("MessageChunk")) {
      serialized.type = serialized.type.slice(0, -"MessageChunk".length).toLowerCase();
    }
    const message = coerceMessageLikeToMessage(serialized);
    const chunk = tryConvertToChunk(message);
    const id = (chunk ?? message).id;
    if (!id) return;

    const existing = state.messagesById.get(id);
    if (chunk) {
      if (subtype === "partial") {
        // Replace with latest partial to avoid duplicative concatenation
        state.messagesById.set(id, { chunk });
      } else {
        const prev = existing?.chunk;
        const merged = (isBaseMessageChunk(prev) ? prev : null)?.concat(chunk) ?? chunk;
        state.messagesById.set(id, { chunk: merged });
      }
    } else {
      state.messagesById.set(id, { chunk: message });
    }
    if (!state.messageOrder.includes(id)) state.messageOrder.push(id);

    // Control visibility: in hold mode, only reveal on base (non-partial) or values event
    if (this.partialMode === "append" || subtype !== "partial") {
      state.displayedMessageIds.add(id);
    }

    // ensure message block exists (first-seen order)
    this._ensureBlock(threadId, "message", id);

    state.lastUpdatedAt = Date.now();
  }

  addOptimisticHumanBlock(threadId, humanMessage) {
    const state = this._ensure(threadId);
    try {
      const msgId = humanMessage?.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const blockId = this._blockIdFor("message", msgId);
      if (!blockId) return;
      if (!state.blocksById.has(blockId)) {
        state.blocksById.set(blockId, {
          kind: "message",
          refId: msgId,
          receivedAt: Date.now(),
          inlineMessage: humanMessage, // used until server-provided message arrives
          optimistic: true,
        });
        state.blockOrder.push(blockId);
      } else {
        const prev = state.blocksById.get(blockId) || {};
        state.blocksById.set(blockId, { ...prev, inlineMessage: humanMessage, optimistic: true });
      }
      state.lastUpdatedAt = Date.now();
    } catch {}
  }

  applyUI(threadId, uiEvent) {
    const state = this._ensure(threadId);
    const prevArray = state.uiOrder.map((id) => state.uiById.get(id)).filter(Boolean).map((v) => v.value);
    const nextArray = uiMessageReducer(prevArray ?? [], uiEvent);

    // rebuild maps from array, preserving first-seen order when possible
    const newById = new Map();
    const newOrder = [];
    for (const ui of nextArray) {
      if (!newById.has(ui.id)) {
        newById.set(ui.id, { value: ui });
        newOrder.push(ui.id);
        // ensure ui block on first sight only
        if (!state.uiById.has(ui.id)) this._ensureBlock(threadId, "ui", ui.id);
      } else {
        newById.set(ui.id, { value: ui });
      }
    }
    state.uiById = newById;
    state.uiOrder = newOrder;
    state.lastUpdatedAt = Date.now();
  }

  applyValues(threadId, values) {
    const state = this._ensure(threadId);

    // Upsert messages if provided
    if (Array.isArray(values?.messages)) {
      for (const msg of values.messages) {
        const id = msg?.id;
        if (!id) continue;
        const wrapped = { toDict: () => ({ type: msg.type, data: msg }) };
        state.messagesById.set(id, { chunk: wrapped });
        if (!state.messageOrder.includes(id)) state.messageOrder.push(id);
        // Reveal all messages on values update
        state.displayedMessageIds.add(id);
        // ensure message block exists
        this._ensureBlock(threadId, "message", id);
      }
    }

    // Upsert ui if provided
    if (Array.isArray(values?.ui)) {
      for (const u of values.ui) {
        if (!u?.id) continue;
        if (!state.uiById.has(u.id)) {
          state.uiById.set(u.id, { value: u });
          state.uiOrder.push(u.id);
          // ensure ui block exists on first sight
          this._ensureBlock(threadId, "ui", u.id);
        } else {
          state.uiById.set(u.id, { value: u });
        }
      }
    }

    // Insert interrupt block if present (dedup by derived id)
    if (values && typeof values === "object" && values.__interrupt__) {
      this.applyInterrupt(threadId, values.__interrupt__);
    }

    state.lastUpdatedAt = Date.now();
  }

  applyInterrupt(threadId, interruptValue) {
    const state = this._ensure(threadId);
    if (!interruptValue || (Array.isArray(interruptValue) && !interruptValue[0])) return;
    const iv = Array.isArray(interruptValue) ? interruptValue[0] : interruptValue;
    // Determine interrupt id (stable)
    const interruptId = this._deriveInterruptId(interruptValue);
    const blockId = this._blockIdFor("interrupt", interruptId);
    const exists = state.blocksById.has(blockId);

    // Create or update block
    if (!exists) {
      state.blocksById.set(blockId, {
        kind: "interrupt",
        refId: interruptId,
        value: interruptValue,
        completed: false,
        receivedAt: Date.now(),
      });
      // compute anchor: after attachment UI if exists, else after last message, else append
      let afterBlockId = null;
      const attachmentId = iv?.value?.metadata?.attachmentId || iv?.widget?.args?.attachmentId || iv?.value?.value?.widget?.args?.attachmentId;
      if (attachmentId) {
        const uiBlockId = this._blockIdFor("ui", attachmentId);
        if (state.blocksById.has(uiBlockId)) afterBlockId = uiBlockId;
      }
      if (!afterBlockId) {
        // find last message block
        for (let i = state.blockOrder.length - 1; i >= 0; i--) {
          const bid = state.blockOrder[i];
          const b = state.blocksById.get(bid);
          if (b?.kind === "message") { afterBlockId = bid; break; }
        }
      }
      // ensure insertion position
      this._insertBlockAfter(threadId, blockId, afterBlockId);
    } else {
      const prev = state.blocksById.get(blockId) || {};
      state.blocksById.set(blockId, { ...prev, value: interruptValue });
    }

    state.lastUpdatedAt = Date.now();
  }

  completeInterrupt(threadId, interruptId, frozenValue) {
    const state = this._ensure(threadId);
    const blockId = this._blockIdFor("interrupt", interruptId);
    const b = state.blocksById.get(blockId);
    if (!b) return;
    state.blocksById.set(blockId, {
      ...b,
      completed: true,
      frozenValue: frozenValue ?? b.value,
    });
    state.lastUpdatedAt = Date.now();
  }

  snapshot(threadId) {
    const state = this._ensure(threadId);
    const messages = state.messageOrder
      .filter((id) => state.displayedMessageIds.has(id))
      .map((id) => state.messagesById.get(id))
      .filter(Boolean)
      .map(({ chunk }) => toMessageDict(chunk));

    const ui = state.uiOrder
      .map((id) => state.uiById.get(id))
      .filter(Boolean)
      .map(({ value }) => value);

    const blocks = state.blockOrder.map((blockId) => {
      const b = state.blocksById.get(blockId);
      if (!b) return null;
      if (b.kind === "message") {
        const msgChunk = state.messagesById.get(b.refId)?.chunk;
        const msgDict = msgChunk ? toMessageDict(msgChunk) : (b.inlineMessage ? b.inlineMessage : null);
        if (!msgDict) return null;
        return { id: blockId, kind: "message", data: msgDict };
      }
      if (b.kind === "ui") {
        const u = state.uiById.get(b.refId)?.value;
        return { id: blockId, kind: "ui", data: u ?? null };
      }
      // interrupt
      return { id: blockId, kind: "interrupt", data: { value: b.value, completed: !!b.completed, frozenValue: b.frozenValue, interrupt_id: b.refId } };
    }).filter(Boolean);

    return { messages, ui, blocks, lastUpdatedAt: state.lastUpdatedAt };
  }

  hydrate(threadId, payload) {
    if (!payload) return;
    const state = this._ensure(threadId);
    // Optional hydrate from messages/ui
    if (Array.isArray(payload.messages)) {
      for (const msg of payload.messages) {
        const id = msg.id;
        if (!id) continue;
        state.messagesById.set(id, { chunk: { toDict: () => ({ type: msg.type, data: msg }) } });
        if (!state.messageOrder.includes(id)) state.messageOrder.push(id);
        state.displayedMessageIds.add(id);
        this._ensureBlock(threadId, "message", id);
      }
    }
    if (Array.isArray(payload.ui)) {
      for (const u of payload.ui) {
        if (!u?.id) continue;
        if (!state.uiById.has(u.id)) {
          state.uiById.set(u.id, { value: u });
          state.uiOrder.push(u.id);
          this._ensureBlock(threadId, "ui", u.id);
        } else {
          state.uiById.set(u.id, { value: u });
        }
      }
    }
    // Hydrate blocks if present (authoritative ordering)
    if (Array.isArray(payload.blocks)) {
      state.blocksById = new Map();
      state.blockOrder = [];
      for (const blk of payload.blocks) {
        if (!blk?.id || !blk?.kind) continue;
        const { id: blockId, kind, data } = blk;
        if (kind === "message") {
          const msgId = data?.id;
          state.blocksById.set(blockId, { kind: "message", refId: msgId, receivedAt: Date.now() });
          state.blockOrder.push(blockId);
          if (msgId && !state.messagesById.has(msgId) && data) {
            state.messagesById.set(msgId, { chunk: { toDict: () => ({ type: data.type, data }) } });
            if (!state.messageOrder.includes(msgId)) state.messageOrder.push(msgId);
            state.displayedMessageIds.add(msgId);
          }
        } else if (kind === "ui") {
          const uiId = data?.id;
          state.blocksById.set(blockId, { kind: "ui", refId: uiId, receivedAt: Date.now() });
          state.blockOrder.push(blockId);
          if (uiId && !state.uiById.has(uiId) && data) {
            state.uiById.set(uiId, { value: data });
            if (!state.uiOrder.includes(uiId)) state.uiOrder.push(uiId);
          }
        } else if (kind === "interrupt") {
          const interruptId = blk.refId || data?.value?.interrupt_id || data?.interrupt_id || blockId.slice(2);
          state.blocksById.set(blockId, { kind: "interrupt", refId: interruptId, value: data?.value ?? data, completed: !!data?.completed, frozenValue: data?.frozenValue, receivedAt: Date.now() });
          state.blockOrder.push(blockId);
        }
      }
    }
    state.lastUpdatedAt = payload.lastUpdatedAt || Date.now();
  }
} 