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
        lastUpdatedAt: 0,
        displayedMessageIds: new Set(), // controls UI visibility (used for hold mode)
      };
      this.byThread.set(threadId, s);
    }
    return s;
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

    state.lastUpdatedAt = Date.now();
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
      }
    }

    // Upsert ui if provided
    if (Array.isArray(values?.ui)) {
      for (const u of values.ui) {
        if (!u?.id) continue;
        if (!state.uiById.has(u.id)) {
          state.uiById.set(u.id, { value: u });
          state.uiOrder.push(u.id);
        } else {
          state.uiById.set(u.id, { value: u });
        }
      }
    }

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

    return { messages, ui, lastUpdatedAt: state.lastUpdatedAt };
  }

  hydrate(threadId, payload) {
    if (!payload) return;
    const state = this._ensure(threadId);
    // Upsert messages
    if (Array.isArray(payload.messages)) {
      for (const msg of payload.messages) {
        const id = msg.id;
        if (!id) continue;
        state.messagesById.set(id, { chunk: { toDict: () => ({ type: msg.type, data: msg }) } });
        if (!state.messageOrder.includes(id)) state.messageOrder.push(id);
        state.displayedMessageIds.add(id);
      }
    }
    // Upsert ui
    if (Array.isArray(payload.ui)) {
      for (const u of payload.ui) {
        if (!u?.id) continue;
        if (!state.uiById.has(u.id)) {
          state.uiById.set(u.id, { value: u });
          state.uiOrder.push(u.id);
        } else {
          state.uiById.set(u.id, { value: u });
        }
      }
    }
    state.lastUpdatedAt = payload.lastUpdatedAt || Date.now();
  }
} 