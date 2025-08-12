# LangGraph Stream Caching: Messages, UI Values, Interrupts

This document explains how our custom stream caching handles messages, UI values (widgets), and interrupts: what we receive from LangGraph, how events flow through the system, how we cache partial/complete data, how ordering is maintained, and how this differs from `@langchain/langgraph-sdk/react`.

## Architecture at a glance

- Event normalization: `normalizeEvent(eventName, data)` converts raw stream events into `{ type, subtype?, payload, receivedAt }`.
- Per-thread serialization: `ThreadActor.enqueue(threadId, op)` guarantees in-order application per thread.
- Canonical store: `Store` keeps per-thread state with deterministic reducers and stable ordering for messages and UI.
- Persistence: `Persistence.saveThread(threadId, snapshot)` writes through to `localStorage` after each reducer application.
- Hook facade: `useStream` consumes all the above, exposes `{ values: { messages, ui }, messages, submit, joinStream, interrupt, … }`.

---

## Messages

### What we receive from LangGraph

- Event names: `messages`, `messages|<subgraph>`, optionally suffixed by `/partial` or `/metadata`.

```3:20:src/lib/stream/core/event-router.js
// Normalize LangGraph stream events …
if (baseEvent === "messages" || name.startsWith("messages")) {
  let subtype = "base";
  if (name.includes("/partial")) subtype = "partial";
  else if (name.includes("/metadata")) subtype = "metadata";
  return { type: "message", subtype, payload: data, receivedAt };
}
```

### Where it goes next in the flow

- Normalized events are enqueued per thread; reducers, persistence, and snapshot emission happen inside the actor.

```97:123:src/lib/stream/useStream.js
const applyNormalized = useCallback((tid, normalized) => {
  actorRef.current.enqueue(tid, async () => {
    if (normalized.type === "message") {
      storeRef.current.applyMessage(tid, normalized.payload, normalized.subtype);
    }
    const snap = storeRef.current.snapshot(tid);
    persistRef.current.saveThread(tid, snap);
    if (tid === threadId || threadId == null) setValues({ messages: snap.messages, ui: snap.ui });
  });
}, [threadId]);
```

### How it is cached (partial and complete)

- Partial chunks replace the previous partial for the same message id (avoid double concatenation).
- Base/metadata chunks concatenate using LangChain chunk rules. First-seen ordering is preserved.
- Display gating: `partialDisplay` mode controls whether partials are immediately visible or held until non-partial.

```44:79:src/lib/stream/core/store.js
applyMessage(threadId, serializedOrArray, subtype = "base") {
  …
  if (chunk) {
    if (subtype === "partial") {
      state.messagesById.set(id, { chunk });               // replace partial
    } else {
      const prev = existing?.chunk;
      const merged = (isBaseMessageChunk(prev) ? prev : null)?.concat(chunk) ?? chunk; // concat
      state.messagesById.set(id, { chunk: merged });
    }
  } else {
    state.messagesById.set(id, { chunk: message });
  }
  if (!state.messageOrder.includes(id)) state.messageOrder.push(id);  // first-seen order

  if (this.partialMode === "append" || subtype !== "partial") {
    state.displayedMessageIds.add(id);                                 // reveal gating
  }
  …
}
```

- Snapshots only include messages marked for display and maintain stable first-seen order.

```134:148:src/lib/stream/core/store.js
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
```

- Write-through persistence per event:

```26:43:src/lib/stream/core/persistence.js
saveThread(threadId, snapshot) {
  const current = this.loadAll();
  current.threads[threadId] = {
    messages: snapshot.messages ?? [],
    ui: snapshot.ui ?? [],
    lastUpdatedAt: snapshot.lastUpdatedAt ?? Date.now(),
  };
  window.localStorage.setItem("langgraph-stream-cache", JSON.stringify({ ...current, schemaVersion: 1 }));
}
```

### How this differs from `@langchain/langgraph-sdk/react`

- SDK uses an in-memory `MessageTupleManager` to merge chunks and updates a transient `streamValues` array; it does not persist messages and refreshes final values from thread history after the run.

```410:427:node_modules/@langchain/langgraph-sdk/dist/react/stream.js
if (event === "messages") {
  const [serialized] = data;
  const messageId = messageManagerRef.current.add(serialized);
  setStreamValues((streamValues) => {
    const values = { …historyValues, …streamValues };
    const messages = getMessages(values).slice();
    const { chunk, index } = messageManagerRef.current.get(messageId, messages.length) ?? {};
    messages[index] = toMessageDict(chunk);
    return { …values, [messagesKey]: messages };
  });
}
```

- SDK surfaces partials immediately (no hold mode); we provide `partialDisplay: "hold" | "append"` with proper visibility gating in snapshots.

---

## UI Values (widgets)

### What we receive from LangGraph

- Event names: `custom`, `custom|<subgraph>` that encode UI add/remove messages.
- We normalize only UI-shaped custom events (others are ignored).

```23:29:src/lib/stream/core/event-router.js
if (baseEvent === "custom" || name.startsWith("custom")) {
  if (isUIMessage(data) || isRemoveUIMessage(data)) {
    return { type: "ui", payload: data, receivedAt };
  }
  return { type: "ignore", payload: data, receivedAt };
}
```

### Where it goes next in the flow

- Same per-thread actor path; UI reducer, persistence, and snapshot emission occur within the serialized op.

### How it is cached (partial and complete)

- We apply `uiMessageReducer` to compute the next UI array and then maintain a canonical id-map plus stable `uiOrder` for rendering and persistence.

```81:100:src/lib/stream/core/store.js
const prevArray = state.uiOrder.map((id) => state.uiById.get(id)).filter(Boolean).map((v) => v.value);
const nextArray = uiMessageReducer(prevArray ?? [], uiEvent);

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
```

### How this differs from `@langchain/langgraph-sdk/react`

- SDK exposes `onCustomEvent` to let app code mutate `streamValues`; there is no built-in reducer, ordering map, or persistence for UI events if you don’t wire it.

```389:401:node_modules/@langchain/langgraph-sdk/dist/react/stream.js
if (event === "custom")
  options.onCustomEvent?.(data, {
    mutate: (update) => setStreamValues((prev) => ({
      …prev,
      …(typeof update === "function" ? update(prev) : update),
    })),
  });
```

- Our implementation always normalizes and reduces UI events deterministically, keeps a stable order, and persists per thread automatically.

---

## Interrupts

### What we receive from LangGraph

- Event name: `values` (may include `__interrupt__`).

```31:33:src/lib/stream/core/event-router.js
if (baseEvent === "values") {
  return { type: "values", payload: data, receivedAt };
}
```

### Where it goes next in the flow

- Enqueued per-thread; we upsert any `messages`/`ui` present in `values` and update `interrupt` in the hook state.

```102:131:src/lib/stream/core/store.js
applyValues(threadId, values) {
  if (Array.isArray(values?.messages)) {
    for (const msg of values.messages) {
      const id = msg?.id; if (!id) continue;
      const wrapped = { toDict: () => ({ type: msg.type, data: msg }) };
      state.messagesById.set(id, { chunk: wrapped });
      if (!state.messageOrder.includes(id)) state.messageOrder.push(id);
      state.displayedMessageIds.add(id); // reveal all on values
    }
  }
  if (Array.isArray(values?.ui)) {
    for (const u of values.ui) {
      if (!u?.id) continue;
      if (!state.uiById.has(u.id)) { state.uiById.set(u.id, { value: u }); state.uiOrder.push(u.id); }
      else { state.uiById.set(u.id, { value: u }); }
    }
  }
  state.lastUpdatedAt = Date.now();
}
```

```108:113:src/lib/stream/useStream.js
if (normalized.payload && typeof normalized.payload === "object" && "__interrupt__" in normalized.payload) {
  setInterrupt({ value: normalized.payload.__interrupt__ });
}
```

### How it is cached (partial and complete)

- Any `messages`/`ui` from `values` are written into the canonical store, ordered, revealed, and persisted. The `interrupt` object itself is not persisted; it is exposed via `api.interrupt`.

### How this differs from `@langchain/langgraph-sdk/react`

- SDK derives `interrupt` from the thread head (history tasks/next), not from `values`; it isn’t cached locally.

```471:485:node_modules/@langchain/langgraph-sdk/dist/react/stream.js
get interrupt() {
  if (isLoading) return undefined;
  const interrupts = threadHead?.tasks?.at(-1)?.interrupts;
  if (!interrupts?.length) {
    const next = threadHead?.next ?? [];
    if (!next.length || error != null) return undefined;
    return { when: "breakpoint" };
  }
  return interrupts.at(-1);
}
```

---

## Ordering and Consistency Guarantees

- Per-thread strict serialization: operations are chained by `ThreadActor` to prevent interleaving updates for the same thread.

```12:28:src/lib/stream/core/thread-actor.js
enqueue(threadId, op) {
  const current = this.chains.get(threadId) ?? Promise.resolve();
  const next = current
    .then(async () => { this.lastStartedAt.set(threadId, Date.now()); await op(); })
    .catch((err) => { console.warn("[ACTOR] op failed", threadId, err); })
    .finally(() => { this.lastStartedAt.delete(threadId); });
  this.chains.set(threadId, next);
  this._armWatchdog(threadId);
}
```

- Message ordering: first-seen order via `messageOrder`; subsequent updates never reorder; reveal is gated by `partialDisplay` policy.
- UI ordering: the reducer determines the array; we normalize to `uiById` + `uiOrder` to preserve stable order based on first sight.
- Cross-channel consistency: a later `values` event can upsert/reveal messages and UI so snapshots stay coherent across subgraphs and interrupts.
- Persistence timing: write-through after each applied event ensures `localStorage` is at least as fresh as the UI snapshot; hydration restores state on mount and thread switch.

```84:93:src/lib/stream/useStream.js
// Hydrate on first mount
const { threads } = persistRef.current.loadAll();
if (threads && threadId && threads[threadId]) {
  storeRef.current.hydrate(threadId, threads[threadId]);
  const snap = storeRef.current.snapshot(threadId);
  setValues({ messages: snap.messages, ui: snap.ui });
}
```

---

## Differences vs SDK (summary)

- Messages: hold/append policy, deterministic merge, persisted per event vs. SDK’s in-memory tuple manager and post-run history refresh.
- UI values: normalized and reduced with stable ordering and persistence vs. SDK’s callback-only mutation with no built-in persistence.
- Interrupts: sourced from `values.__interrupt__` and not persisted vs. SDK’s history-derived interrupt state.
- Ordering: per-thread actor + first-seen orders for both messages and UI vs. SDK’s per-stream tuple indexing and final server history order.

---

## Plan: Inline, persistent Interrupt widgets (ordering + read-only + refresh-safe)

This plan extends the current message/UI caching to fully support interrupt widgets with strict inline ordering relative to messages and UI, automatic read-only freezing on submission, and localStorage-backed hydration.

### 1) Unified blocks timeline (dev-only, breaking change)

- Add a canonical, append-only timeline to the store, where each entry is a "block":
  - `Block = { id: string; kind: "message" | "ui" | "interrupt"; receivedAt: number; anchorId?: string; }`
  - Maintain `blocksById: Map<string, BlockData>` and `blockOrder: string[]` similar to messages/UI.
  - `BlockData` for:
    - `message`: `{ messageChunk }` (existing), `visible: boolean` (partial gating)
    - `ui`: `{ uiValue }` (existing reduced item)
    - `interrupt`: `{ value: any; completed: boolean; frozenValue?: any }`
- Expose only `values.blocks` (aka unified timeline) for rendering. All chat UIs should render from blocks; message/UI specific selectors can be removed during dev.

Persistence:

- Bump schema to `schemaVersion: 2`. Persist `{ blocks, lastUpdatedAt }` (messages/ui no longer persisted in dev-only mode).
- Hydration: No migration path needed in dev; clear old cache or ignore missing fields.

### 2) Event normalization and insertion rules

- Treat `values` events that include `__interrupt__` as an explicit interrupt insertion:
  - Keep current normalization (`type: "values"`), but extend `Store.applyValues()` to call `Store.applyInterrupt(interruptValue, meta)` if `__interrupt__` is present.
  - Alternatively, normalize to a new internal type `interrupt` at the router level; both approaches are equivalent internally.
- `applyInterrupt(threadId, interrupt)`:
  - Determine `interruptId`:
    - Prefer `interrupt.interrupt_id` if present.
    - Else generate a deterministic id (e.g., `hash(JSON.stringify(interrupt) + receivedAt)`), stored in `blocksById`.
  - Determine anchor position:
    - If `interrupt.value?.metadata?.attachmentId` references a known UI id, insert the interrupt block immediately after that UI block.
    - Else, anchor to the most recent visible message block at the time of application (per-thread actor preserves order), inserting after it.
    - Fallback: append to the end.
  - Insert once: if a block with the same `interruptId` already exists, update its `value` but never reorder it.
  - Mark `completed: false` by default.

### 3) Read-only after submission (generic, minimal widget code)

- Provide a single API on the stream hook to freeze an interrupt:
  - `thread.completeInterrupt(interruptId: string, frozenValue?: any)` which sets `{ completed: true, frozenValue: frozenValue ?? currentValue }` in the store and persists.
- Wire this generically at submission points:
  - Wrap `thread.submit(...)` (or provide `submitInterruptResponse(...)`) so that on successful resume it calls `completeInterrupt` for the in-flight interrupt id.
  - A small helper `useInterruptSubmission()` already exists; update it to call the new store method instead of an in-memory context.
- Rendering contract for widgets (generic):
  - `DynamicRenderer` (or equivalent) receives an `interrupt` object. We will pass-through a derived prop `readOnly = block.completed`.
  - Widgets should honor `readOnly` by disabling inputs; no widget-specific code beyond checking this flag.
  - For best UX, `frozenValue` (if provided) is passed instead of `value` to guarantee the UI shows the last visible state at submission time.

### 4) Refresh-safe persistence and hydration

- On every interrupt insert/update/complete, write-through to `localStorage` via `Persistence.saveThread` (v2 shape including `blocks`).
- On mount or thread switch, `Store.hydrate` restores `blocks` and `useStream` sets `values.blocks` for inline renderers.
- All renderers should be updated to use `values.blocks` exclusively during dev.

### 5) Minimal changes to existing rendering

- Provide a new helper for views that want inline rendering:
  - `selectTimeline(snapshot): Array<{ kind, id, node }>` that:
    - For `message` kinds: returns the toDict message as today.
    - For `ui` kinds: returns the reduced UI value.
    - For `interrupt` kinds: returns `{ type, props, readOnly }` suitable for `DynamicRenderer`.
- Update chat thread to iterate `values.blocks` exclusively. Remove in-memory `InterruptPersistenceContext` usage in dev mode; ordering and persistence come from the timeline.

### 6) Data model and API sketch

Store additions:

- `applyInterrupt(threadId, interruptValue, receivedAt, anchorId?)`
- `completeInterrupt(threadId, interruptId, frozenValue?)`
- `snapshot(threadId)` now returns `{ blocks, lastUpdatedAt }` (messages/ui derived only if explicitly needed).

Hook additions:

- `values.blocks` on `useStream`
- `completeInterrupt(interruptId, frozenValue?)` exposed off the returned API

Persistence:

- `schemaVersion: 2`
- Thread record: `{ blocks: BlockSnapshot[], lastUpdatedAt: number }`

### 7) Edge cases

- Duplicate interrupts (retries/subgraphs): de-dupe by `interrupt_id` when provided; otherwise, keep first seen and update the payload in place.
- Out-of-order arrivals across subgraphs: per-thread actor guarantees the relative order we apply is stable; anchor rules ensure deterministic placement.
- Partial UI/message visibility: interrupts anchored to a message hidden by hold-mode are still inserted after that message and will appear when the message becomes visible.

### 8) SDK differences (updated)

- We maintain a persisted, unified blocks timeline with explicit `interrupt` entries; the SDK does not provide ordering/persistence for interrupts or UI out of the box.
- Post-submit freezing is handled locally via `completeInterrupt`, guaranteeing read-only widgets on reload.

---

## Implementation checklist (internal)

- Store: add blocks timeline and interrupt APIs, integrate into `applyValues`.
- Persistence: bump schema to v2, include blocks in snapshot, hydrate/upgrade from v1.
- Hook: expose `values.blocks`, add `completeInterrupt` API, update hydration and save points.
- Rendering: add a helper to render `values.blocks` and pass `readOnly` to widgets; migrate chat to use it.
- Remove/retire in-memory `InterruptPersistenceContext` once blocks timeline is adopted.
