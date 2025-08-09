# LangGraph Stream Caching Rewrite Plan

## Goals

- Provide consistent, thread-safe caching of messages and ui-values (ui-widgets) per `threadId`.
- Eliminate race conditions caused by asynchronous stream events (including subgraph events and interrupts).
- Recover reliably after reloads (localStorage-backed cache).
- Keep the `useStream` API drop-in compatible and generic so the rest of the codebase remains abstracted from internals.
- Maintain good separation of concerns and a simple extension path.

## Constraints

- LangGraph streams may emit incomplete or out-of-order event sequences, especially for subgraphs and during interrupts.
- We must support events with prefixes (e.g., `messages|`, `custom|`) and normalize them.
- Essential persisted state: messages and ui-values only. Interrupts will be handled as part of values but not persisted beyond what is required to reconstruct UI state.
- Cache must be isolated by `threadId` and never leak data across threads.
- All cache updates must be serialized per `threadId` (thread-safe at the application level).

## Scope Decisions

- No new public APIs beyond the `useStream` facade; internals are modular but private.
- No extra testing or observability hooks in the initial implementation; focus on correctness. Migration steps retained.
- 5-layer architecture kept: small modules, low overhead, clear responsibilities; suitable for race-free streams.
- Use `uiMessageReducer` as the deterministic reducer for ui-values; we normalize to maps/order around it.
- LocalStorage key will be non-versioned: `langgraph-stream-cache`. Optionally include `schemaVersion` in the payload for future-safe migrations.

## High-Level Design

We split the implementation into 5 layers. Each layer is independently testable and replaceable:

1. Event Router: Normalizes raw LangGraph events and routes them to per-thread processors.
2. Thread Actor: Serializes all per-thread operations (a single-flight queue with a microtask chain) to avoid race conditions.
3. Store (In-Memory): Canonical per-thread store with deterministic merge reducers for messages and ui-values. Provides snapshots for the UI.
4. Persistence: LocalStorage-backed persistence with versioning and bounded eviction; writes occur inside the thread actor for atomicity.
5. Hook API: Public `useStream` that consumes the above, remains generic and compatible, and abstracts away concurrency and persistence.

### 1) Event Router

- Accepts async events from LangGraph run.stream/joinStream.
- Normalizes event shapes into a small, typed set:
  - MessageDelta, MessageComplete
  - UIAdd/Remove (based on `uiMessageReducer` semantics)
  - ValuesUpdate (for interrupts/other values)
- Handles `custom` and `custom|` as UI events; `messages` and `messages|` as message events.
- Adds a monotonic `receivedAt` timestamp to each event for ordering when needed.
- Immediately enqueues the normalized event into the Thread Actor for the target `threadId`.

### 2) Thread Actor (Per Thread)

- A map `threadId -> ActorState` where each actor has:
  - `queue`: an array of pending operations
  - `chain`: a promise that resolves after the last op (the mutex)
- `enqueue(op)` attaches to `chain = chain.then(() => op())`, guaranteeing strict in-order execution per thread.
- Timeouts and watchdog logging protect against permanent stalls. If a stall is detected, the actor resets its chain safely.
- No React state is accessed outside the actor; all reading and writing of shared state (cache, localStorage) and emit snapshots happen inside `enqueue`.

### 3) Store (In-Memory Canonical State)

Per thread we keep a single canonical state object:

```
ThreadState = {
  messagesById: Map<string, Message>,
  messageOrder: string[],           // preserves order for UI rendering
  uiById: Map<string, UIMessage>,   // keyed by ui.id
  uiOrder: string[],                // preserves order when needed
  lastUpdatedAt: number
}
```

- Deterministic reducers:
  - `applyMessageChunk/Complete` merges by message `id` using LC chunk concat rules.
  - `applyUIEvent` uses `uiMessageReducer` semantics but stores normalized (by id) and updates `uiOrder`.
  - Reducers must be idempotent and commutative where possible; if the same item re-arrives, it updates-in-place.
- Order: If a UI references a message not yet present, we still store UI. Later arrival of the message will not remove UI. Linking is best-effort by `metadata.message_id`.
- Snapshots for React:
  - `toValuesSnapshot()` returns `{ messages: Message[], ui: UIMessage[] }` preserving order from `messageOrder`/`uiOrder`.

### 4) Persistence (LocalStorage)

- `Storage Key`: `langgraph-stream-cache` (non-versioned). Optional `schemaVersion` field inside the persisted root object for future migrations.
- Per-thread persistence: `cache[threadId] = { messages: Message[], ui: UIMessage[], lastUpdatedAt }`.
- Writes happen inside the actor, immediately after the store mutation, to ensure the cache is always ahead of or equal to UI state.
- Bounded size: keep the latest N threads (e.g., 50). Implement LRU by `lastUpdatedAt`.
- On boot, load cache once and hydrate the in-memory store for threads on demand.
- SSR-safe: guard `window` checks; no persistence on server.

### 5) Hook API (`useStream`)

- Public API remains close to `@langchain/langgraph-sdk/react` `useStream` but we own the internals.
- Returns:
  - `values`: `{ messages, ui }` produced from the canonical store snapshot for the active `threadId`.
  - `messages`: convenience getter from `values.messages`.
  - `submit`, `joinStream`, `stop`
  - `isLoading`, `error`, `branch` and history helpers (as needed),
  - `resetForThreadSwitch(threadId)`, `clearThreadCache(threadId)`.
- Guarantees:
  - All updates for the active `threadId` are serialized.
  - Persistence is per-thread and atomic w.r.t in-memory store.
  - Widgets (ui-values) are never dropped if their referenced message arrives late.

## Detailed Flow

1. Hook mounts:
   - Load persisted cache (if any). Do not emit until the first snapshot is available for the active `threadId`.
   - Create actor(s) on demand when a thread first receives an event or becomes active.

2. Submitting/Joining a run:
   - Consume the async iterator from LangGraph.
   - For each event, normalize and `enqueue` into the appropriate thread actor.

3. Actor processing loop (per event):
   - Read and update the in-memory `ThreadState` via reducers.
   - Persist updated `{ messages, ui }` to localStorage (per-thread) immediately.
   - Compute a new snapshot and publish to React via `setState`.

4. Thread switching:
   - `resetForThreadSwitch(newThreadId)` moves active view; does not clear the cache.
   - UI event queues in the previous thread actor are isolated; no leakage.

5. Errors:
   - If a stream error occurs, actor persists the last good snapshot then emits error.
   - Actor chain has a timeout watchdog to reset blocked chains and log diagnostics.

## API and Extension Points

- `EventRouter` interface

```
route(rawEvent: { event: string; data: any; threadId?: string }): NormalizedEvent
```

- `ThreadActor` interface

```
enqueue(threadId: string, op: () => Promise<void>): void
flush(threadId: string): Promise<void> // for testing
reset(threadId: string): void // watchdog recovery
```

- `Store` operations

```
getState(threadId): ThreadState
apply(threadId, event: NormalizedEvent): void
snapshot(threadId): { messages: Message[]; ui: UIMessage[] }
```

- `Persistence` operations

```
loadAll(): Cache
saveThread(threadId, snapshot): void
prune(maxThreads): void
```

These interfaces make the system generic and easily replaceable (e.g., swap localStorage for IndexedDB without touching the hook API).

## Reducer Rules (Deterministic Merge)

- Messages
  - Merge by `id`. For chunks, concat with LC `isBaseMessageChunk` semantics; for completes, replace.
  - `messageOrder`: append on first sight; do not reorder on subsequent updates.

- UI Values
  - Use `uiMessageReducer` to compute the new array from the previous array plus the incoming UI event.
  - Convert resulting array to `uiById` + `uiOrder` (preserve stable order based on first sight or explicit positions if provided later).
  - Never drop UI entries just because the referenced message has not arrived yet.

## Handling Subgraphs and Interrupts

- Treat `custom|` events as UI events. Treat `messages|` as message events. Normalize them all the same way.
- Values events carrying `__interrupt__` are applied to the store but not persisted beyond messages/ui, unless needed for consistency.
- If interrupts are involved, we still persist any messages/ui that were derived from the event so the UI remains stable after reload.

## Persistence Strategy

- Write-through cache: after each successful reducer application in the actor, immediately write to localStorage for that `threadId`.
- Debounce is optional; correctness first. If needed, a microtask batch (Promise.resolve().then) can reduce excessive writes but must not risk loss.
- Evict older threads beyond a limit using LRU on `lastUpdatedAt`.

## Error Recovery and Watchdog

- Each actor tracks `lastOpStartedAt`. If an operation exceeds a timeout (e.g., 5s), log diagnostics and reset its chain to an empty resolved promise.
- On reset, the actor does not discard state; it only ensures the queue is usable again.
- Persistence writes are wrapped in try/catch; failures log warnings but do not interrupt the actor.

## Testing Plan

- Unit tests (targeting the 5 layers independently):
  - Event normalization for all event types (`messages`, `messages|sub`, `custom`, `custom|sub`, `values` with interrupts).
  - Deterministic reducers (idempotency, merge-by-id, order preservation).
  - Actor serialization: ensure no interleaving writes occur for the same `threadId`.
  - Persistence read/write; version migrations; eviction logic.

- Integration tests:
  - Simulate out-of-order event arrival (UI before message, vice versa) and verify snapshot consistency.
  - Rapid-fire UI events (interrupts) and verify the UI array is correct, ordered, and persisted.
  - Thread switching; ensure no leakage between threads and correct rehydration.

- Manual validation (Console logs gated by `NODE_ENV === 'development'`):
  - Event intake, actor enqueue/dequeue, snapshot sizes, persistence success/failure.

## Migration Plan

1. Introduce a new internal module layout (non-breaking to the rest of the app):
   - `src/lib/stream/core/EventRouter.ts`
   - `src/lib/stream/core/ThreadActor.ts`
   - `src/lib/stream/core/Store.ts`
   - `src/lib/stream/core/Persistence.ts`
   - `src/lib/stream/useStream.ts` (public hook)

2. Replace `src/lib/langgraph-stream.js` with a small façade that re-exports the new hook (keeps import paths stable for now).

3. Ensure `src/lib/langgraph-index.js` continues to export `useStream` from the new module.

4. Keep `GenericInterruptView` behavior unchanged; it will benefit from the stabilized snapshots.

5. Add feature flags or an env var to toggle verbose debug logs during rollout.

## Example Pseudocode Snippets

- Thread Actor

```ts
class ThreadActor {
  private chains = new Map<string, Promise<void>>();
  enqueue(threadId: string, op: () => Promise<void>) {
    const chain = this.chains.get(threadId) ?? Promise.resolve();
    const next = chain.then(op).catch((err) => {
      console.warn("[Actor] op failed", threadId, err);
    });
    this.chains.set(threadId, next);
  }
}
```

- Write-through after reducer

```ts
actor.enqueue(threadId, async () => {
  store.apply(threadId, normalizedEvent);
  const snapshot = store.snapshot(threadId);
  persistence.saveThread(threadId, snapshot); // write-through
  setReactState(threadId, snapshot); // emit to hook state
});
```

## Observability

- Add scoped, opt-in debug logs:
  - `[ROUTER]` for normalized events
  - `[ACTOR]` for enqueue/dequeue and watchdog resets
  - `[STORE]` for reducer applications and sizes
  - `[PERSIST]` for save/load/evict operations

## Future Extensions

- Swap localStorage for IndexedDB for larger caches.
- Priority channels in the actor (e.g., UI removals before additions if needed).
- Batching multiple events in a single actor tick when high throughput is detected.
- Cross-tab synchronization via the `storage` event, if needed.

## Acceptance Criteria

- UI widgets (ui-values) never intermittently disappear when the referenced message arrives late or not at all.
- Rapid interrupts and subgraph emissions do not cause lost updates.
- After refresh, the last session’s messages and ui-values per-thread are present and consistent.
- No data mixing across different `threadId`s.
- Public `useStream` remains generic and abstract; no downstream code changes required.
