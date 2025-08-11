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

## Upcoming Tasks

### Event Naming Strategy: Align and Harden

- What to do
  - Align on the authoritative SDK event names: `messages`, `values`, `custom`, `metadata`, `events`, `debug`, `updates`.
  - Do not rely on event-name suffixes for partials or metadata (e.g., `messages/partial`, `messages/metadata`). Treat partialness based on payload chunk types (`*MessageChunk`) and merge via LangChain chunk rules.
  - Keep defensive normalization so we gracefully handle server variants:
    - Strip subgraph namespaces: treat `messages|…` and `custom|…` as `messages`/`custom`.
    - If suffixes like `/partial` or `/metadata` appear, map to internal `subtype` hints only; behavior must not depend on them.
  - Maintain dev logging of raw event names to detect unexpected variants without breaking behavior.

- How to do it
  1. Router updates (`src/lib/stream/core/event-router.js`)
     - Ensure base event extraction uses the portion before `|` and `/` to produce canonical names. Keep setting `subtype` as a non-authoritative hint when `/partial` or `/metadata` appears.
     - Add/keep a small dev-only log for `[ROUTER]` showing the raw event and normalized type for observability.
  2. Store behavior (`src/lib/stream/core/store.js`)
     - Continue determining partial vs. base via `convertToChunk` and `isBaseMessageChunk` concatenation. Treat `subtype === "partial"` as a hint to replace the prior partial but do not depend on its presence for correctness.
     - Verify message/UI ordering remains first-seen and stable; no reordering on subsequent updates.
  3. Hook-level logging (`src/lib/stream/useStream.js`)
     - Retain `[STREAM] event` logging in development to record raw names and payloads.
     - Keep normalization + actor enqueue flow unchanged to preserve serialization semantics.
  4. Tests
     - Add unit tests for the router covering: plain `messages`, `values`, `custom`; piped (`messages|subgraph`), and slashed (`messages/partial`, `messages/metadata`) names mapping to canonical types.
     - Add store tests to confirm: partial replacement, base concat, idempotency, first-seen order, and visibility gating (`append` vs `hold`).
     - Add integration test simulating mixed `custom` + `messages` + `values` events with subgraph and suffix variations to validate snapshots and persistence are consistent.
  5. Docs & notes
     - Update developer docs to state the authoritative event set and the rationale for defensive normalization.
     - Document how to enable verbose logs during rollout.

- Why this is needed
  - The SDK currently emits the base set of events and does not require suffixes; relying on suffixes is brittle.
  - Defensive normalization makes us forward-compatible with server-side naming variations (subgraphs and suffixes) without breaking the UI.
  - Payload-driven partial detection aligns with SDK semantics and ensures deterministic merges and stable ordering.
  - Observability via dev logs shortens feedback loops when server behavior changes.

- Acceptance
  - Streams remain stable if the server includes `|subgraph` or `/partial`/`/metadata` in event names.
  - Message/UI ordering and visibility are unchanged across variants.
  - No regressions in persistence or hydration behavior; local cache reflects the same snapshots the UI sees.

### Performance Mitigations for Persistence and Partials

#### Throttle/Debounce Persistence Writes

- Why
  - Write-through on every event can cause main-thread jank on low-end devices when partial chunks arrive rapidly; JSON stringify + localStorage.setItem are synchronous.
- What
  - Introduce a short debounce (e.g., 50–100ms) or micro-batching so multiple quick mutations persist once per window without risking data loss.
- How
  - Buffer the latest snapshot per thread and schedule a write using `setTimeout(…, 50)` or `requestIdleCallback` (fallback to setTimeout). On subsequent events, replace the buffered snapshot and skip additional writes until the window elapses.
  - Ensure a final flush on stream completion, unmount, or visibility change.
- Where
  - `src/lib/stream/core/persistence.js`: add a per-thread debounce map and `saveThreadDebounced(threadId, snapshot)`; keep `saveThread` for immediate writes (used by tests or critical paths).
  - `src/lib/stream/useStream.js`: switch to debounced persistence after `store.snapshot()` in `applyNormalized`, gated by a flag.
- Acceptance
  - Noticeable reduction in write frequency under high-chunk streams with no stale UI; no lost updates across refresh.

#### Persist on Meaningful Boundaries

- Why
  - Persisting every partial yields minimal recovery value and maximum write cost; persisting at logical milestones reduces overhead.
- What
  - Persist only when: a non-partial/base message arrives, a `values` event arrives, a UI array changes, or every N events (e.g., N=10) as a safety net.
- How
  - In `applyMessage`, mark partials vs non-partials. If subtype is `partial`, skip persistence; on base/metadata, persist.
  - For `applyUI` and `applyValues`, persist immediately (UI changes are sparse; values are stateful milestones).
  - Optionally, add a counter per thread; persist every N events regardless of type.
- Where
  - `src/lib/stream/useStream.js`: decide persistence policy based on normalized event type/subtype and a thread-local counter.
- Acceptance
  - Fewer writes during token streaming; identical recovery after refresh.

#### Snapshot Size Management

- Why
  - Large snapshots increase stringify cost and storage size, compounding jank.
- What
  - Cap retained messages per thread (e.g., 200–500), drop oldest beyond cap; optionally compress long text fields (future).
- How
  - Before persisting, post-process snapshot to slice `messages` to last K by order and include all `ui`.
  - Keep full in-memory state; apply cap only to the persisted payload.
- Where
  - `src/lib/stream/core/persistence.js`: add a shaping step before `setItem` to trim `messages` to K.
- Acceptance
  - Similar UI behavior; faster persistence and smaller localStorage footprint.

#### Observability and A/B Toggle

- Why
  - Need to measure the trade-offs and guard for regressions.
- What
  - Add an env/config flag to enable/disable debouncing and boundary-based persistence; log metrics for time-to-first-visible-output and write frequency.
- How
  - Read a config from `useStream` options or `process.env.NEXT_PUBLIC_STREAM_PERSIST_MODE` with values: `immediate` | `debounced` | `milestones`.
  - Add dev-only logs for `[PERSIST] scheduled`, `[PERSIST] flushed`, and counters.
- Where
  - `src/lib/stream/useStream.js` (option plumb-through), `src/lib/stream/core/persistence.js` (mode handling), and docs.
- Acceptance
  - Ability to switch modes without code changes; metrics confirm reduced writes with unchanged perceived latency (append) or intentional delay (hold).

#### Partial Display Policy Notes

- Why
  - `hold` mode intentionally delays first visible output for smoother UX; needs clear guidance.
- What
  - Document the trade-off and default (`append`), and provide a per-hook option `partialDisplay: "hold" | "append"`.
- How
  - Already implemented via `Store.setPartialMode`; ensure docs and examples explain when to use each.
- Where
  - Docs: `documentation/LANGGRAPH_STREAM_CACHING_BEHAVIOR.md` and README usage snippets.
- Acceptance
  - Teams can pick mode per surface with predictable UX implications.
