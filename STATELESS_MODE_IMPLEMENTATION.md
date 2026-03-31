# Stateless Mode Implementation Guide

This document explains how to implement stateless streaming in the agent-chat-ui application, allowing runs without thread persistence.

## Overview

By default, the application uses **stateful mode** where each conversation creates a thread that persists messages to the LangGraph server. **Stateless mode** allows running the agent without creating/persisting threads - messages exist only in browser memory during the session.

## Architecture

### Mode Comparison

| Feature | Stateful Mode (default) | Stateless Mode |
|---------|------------------------|----------------|
| Thread created on server | ✅ Yes | ❌ No |
| Messages persisted | ✅ Yes (server DB) | ❌ No (browser memory only) |
| Thread history sidebar | ✅ Visible | ❌ Hidden |
| New thread button | ✅ Visible | ❌ Hidden |
| API endpoint used | `/threads/{id}/runs/stream` | `/runs/stream` |
| Conversation history | ✅ Survives refresh | ❌ Lost on refresh |
| Message accumulation | Server-side (thread) | Client-side (browser) |

### Feature Parity with `useStream`

The `useStatelessStream` hook provides **near-complete feature parity** with the SDK's `useStream` hook:

| Feature | `useStream` | `useStatelessStream` |
|---------|-------------|---------------------|
| Thread management | ✅ | ❌ (by design) |
| History/Branching | ✅ | ❌ (by design) |
| **Interrupts** | ✅ | ❌ (see explanation below) |
| Message streaming | ✅ | ✅ |
| Token-by-token streaming | ✅ | ✅ |
| Message chunk merging | ✅ | ✅ |
| **Client-side message accumulation** | N/A | ✅ |
| Subgraph events | ✅ | ✅ |
| Namespace parsing | ✅ | ✅ |
| `onError` callback | ✅ | ✅ |
| `onFinish` callback | ✅ | ✅ |
| `onStop` callback | ✅ | ✅ |
| `onUpdateEvent` callback | ✅ | ✅ |
| `onCustomEvent` callback | ✅ | ✅ |
| `onMetadataEvent` callback | ✅ | ✅ |
| `onLangChainEvent` callback | ✅ | ✅ |
| `onDebugEvent` callback | ✅ | ✅ |
| `onCheckpointEvent` callback | ✅ | ✅ |
| `onTaskEvent` callback | ✅ | ✅ |
| Stream error handling | ✅ | ✅ |
| Concurrent request protection | ✅ | ✅ |
| Optimistic updates | ✅ | ✅ |
| Optimistic rollback on error | ✅ | ✅ |
| Auto stream mode tracking | ✅ | ✅ |
| `getMessagesMetadata` | ✅ | ✅ |

## Why Interrupts Don't Work in Stateless Mode

Interrupts are **fundamentally a thread-based feature** and cannot work in stateless mode. Here's why:

### How Interrupts Work in Stateful Mode

1. **Checkpoint Storage**: When an interrupt occurs, the graph pauses and saves a **checkpoint** containing:
   - Current state values
   - Tasks array with interrupt information
   - Next nodes to execute when resumed

2. **Retrieval via Thread API**: The interrupt data is retrieved by calling:
   ```
   GET /threads/{thread_id}/state
   GET /threads/{thread_id}/history
   ```
   These return `ThreadState` objects containing `tasks[].interrupts`.

3. **Resume via Thread**: Resuming requires sending a command to the specific thread:
   ```javascript
   client.runs.stream(threadId, assistantId, {
     command: { resume: interruptResponse }
   });
   ```

### Why Stateless Mode Can't Support Interrupts

| Requirement | Stateful | Stateless |
|-------------|----------|-----------|
| Checkpoint storage | ✅ Persisted in DB | ❌ Discarded |
| Thread ID for queries | ✅ Available | ❌ `null` |
| `client.threads.getState()` | ✅ Works | ❌ No threadId |
| Resume command target | ✅ Thread exists | ❌ No thread to resume |
| Interrupt data retrieval | ✅ From history | ❌ Nowhere to get it |

**In stateless mode:**
- `threadId = null` → No checkpoint is persisted
- No way to call `client.threads.getState()` or `client.threads.getHistory()`
- Even if an interrupt occurs during streaming, the checkpoint is discarded
- There's no thread to send a resume command to

**Bottom line**: Interrupts require persistent state that can be queried and resumed. Stateless mode, by definition, has no persistent state.

## Files Modified/Created

### 1. New File: `src/hooks/use-stateless-stream.tsx`

A comprehensive React hook that implements true stateless streaming by calling `client.runs.stream(null, ...)` directly, with full feature parity to the SDK's `useStream` hook.

**Key Components:**

#### `StreamError` class (in `src/lib/stream-error.ts`)
Handles structured error responses from the LangGraph API:
```typescript
export class StreamError extends Error {
  static isStructuredError(error: unknown): boolean;
}
```

#### `MessageTupleManager` class
Handles proper message chunk merging during streaming:
- Converts serialized messages to LangChain message objects
- Concatenates message chunks using `chunk.concat()` 
- Preserves message metadata from streaming events
- Manages message indices for correct ordering

#### `StatelessStreamManager` class
Core state management for stateless streaming:
- Concurrent request protection (prevents double-submit)
- Optimistic updates with rollback on error
- Full event handling with namespace parsing
- `mutate` function for callback state updates

#### `useStatelessStream` hook
The main hook that provides:
- Same interface as `useStream` for drop-in compatibility
- Automatic stream mode tracking based on callbacks
- All event callbacks with namespace support

### 2. New File: `src/lib/stream-error.ts`

```typescript
export class StreamError extends Error {
  constructor(data: { message: string; name?: string; error?: string });
  static isStructuredError(error: unknown): boolean;
}
```

### 3. Modified: `src/providers/Stream.tsx`

**Changes:**
- Added import for `useStatelessStream` hook
- Added `isStatelessMode` constant that reads from env variable
- Added `StatelessStreamSession` component for stateless mode
- `StreamProvider` conditionally renders either:
  - `StatelessStreamSession` (when `NEXT_PUBLIC_STATELESS_MODE=true`)
  - `StreamSession` (original, for stateful mode)

### 4. Modified: `src/components/thread/index.tsx`

**Changes:**
- Added `isStatelessMode` constant
- Conditionally hides thread-related UI elements:
  - Thread history sidebar
  - Chat history toggle buttons (panel icons)
  - New thread button (SquarePen icon)

## API Reference

### `useStatelessStream` Options

```typescript
interface UseStatelessStreamOptions<StateType> {
  // Required
  apiUrl: string;
  assistantId: string;
  
  // Optional
  apiKey?: string;
  messagesKey?: string;  // Default: "messages"
  initialValues?: StateType | null;
  
  // Callbacks
  onError?: (error: unknown) => void;
  onFinish?: (state: StateType) => void;
  onStop?: (options: { mutate: MutateFn<StateType> }) => void;
  onUpdateEvent?: (data: unknown, options: EventOptions<StateType>) => void;
  onCustomEvent?: (data: unknown, options: EventOptions<StateType>) => void;
  onMetadataEvent?: (data: unknown) => void;
  onLangChainEvent?: (data: unknown) => void;
  onDebugEvent?: (data: unknown, options: { namespace: string[] | undefined }) => void;
  onCheckpointEvent?: (data: unknown, options: { namespace: string[] | undefined }) => void;
  onTaskEvent?: (data: unknown, options: { namespace: string[] | undefined }) => void;
}
```

### `useStatelessStream` Return Value

```typescript
interface UseStatelessStream<StateType> {
  // State
  values: StateType;
  messages: Message[];
  error: unknown;
  isLoading: boolean;
  
  // Actions
  submit: (values: unknown, options?: SubmitOptions<StateType>) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
  
  // Client
  client: Client;
  assistantId: string;
  
  // Metadata
  getMessagesMetadata: (message: Message, index?: number) => MessageMetadata | undefined;
  
  // Compatibility stubs (no-op in stateless mode)
  interrupt: undefined;
  history: never[];
  branch: string;
  setBranch: (branch: string) => void;
  isThreadLoading: boolean;
  experimental_branchTree: { children: never[] };
  joinStream: () => Promise<void>;
}
```

### `SubmitOptions`

```typescript
interface SubmitOptions<StateType> {
  config?: Record<string, unknown>;
  context?: Record<string, unknown>;
  streamMode?: StreamMode[];
  streamSubgraphs?: boolean;
  optimisticValues?: Partial<StateType> | ((prev: StateType) => Partial<StateType>);
  metadata?: Record<string, unknown>;
  interruptBefore?: "*" | string[];  // Note: Has no effect in stateless mode
  interruptAfter?: "*" | string[];   // Note: Has no effect in stateless mode
}
```

> **Note**: `interruptBefore` and `interruptAfter` are accepted for API compatibility but have no effect in stateless mode since interrupts require thread persistence.

## Implementation Details

### Client-Side Message Accumulation

The key difference from stateful mode is that **the client maintains conversation history**:

```typescript
// In use-stateless-stream.tsx submit():

// 1. Get current messages from state
const currentMessages = getMessages(stream.values);

// 2. Extract new messages from input
const newMessages = inputValues?.[messagesKey];

// 3. Build accumulated input with full history
const accumulatedInput = {
  ...inputValues,
  [messagesKey]: [...currentMessages, ...newMessages],
};

// 4. Apply optimistic update (show user message immediately)
stream.setStreamValues({
  ...currentValues,
  [messagesKey]: accumulatedInput[messagesKey],
});

// 5. Send full history to server
client.runs.stream(null, assistantId, { input: accumulatedInput, ... });
```

This ensures:
- Previous messages are never lost between requests
- Server receives full context for each response
- UI shows the complete conversation history

### Message Chunk Merging

The hook properly handles token-by-token streaming by:

1. Receiving `[serialized_message, metadata]` tuples from the `messages-tuple` stream mode
2. Converting serialized messages to LangChain message objects
3. Using `chunk.concat()` to merge consecutive chunks for the same message ID
4. Converting the merged chunk back to a serializable dict for React state

```typescript
// Example of how chunks are merged
const message = coerceMessageLikeToMessage(serialized);
const chunk = convertToChunk(message);
this.chunks[id].chunk = prevChunk?.concat(chunk) ?? chunk;
```

### Namespace Parsing for Subgraph Events

Events from subgraphs come with namespaces in the format `event|namespace1|namespace2`:

```typescript
// "updates|my_subgraph|inner_node" parses to:
{
  event: "updates",
  namespace: ["my_subgraph", "inner_node"]
}
```

All event callbacks receive the parsed namespace:
```typescript
onUpdateEvent: (data, { namespace, mutate }) => {
  if (namespace?.includes("my_subgraph")) {
    // Handle subgraph update
  }
}
```

### Stream Mode Auto-Tracking

The hook automatically adds stream modes based on registered callbacks:

```typescript
// If you register onDebugEvent, "debug" stream mode is auto-added
const stream = useStatelessStream({
  onDebugEvent: (data) => console.log(data),
  // "debug" stream mode automatically included
});
```

### Concurrent Request Protection

The hook prevents double-submission:

```typescript
start = async (action, options) => {
  if (this.state.isLoading) {
    console.warn("[StatelessStream] Stream already in progress, ignoring");
    return;
  }
  // ... proceed with stream
};
```

### Optimistic Updates with Rollback

```typescript
// Store snapshot before optimistic update
this.optimisticSnapshot = this.state.values?.[0] ?? null;

// Apply optimistic values
stream.setStreamValues((prev) => ({
  ...prev,
  ...submitOptions.optimisticValues,
}));

// On error, rollback
if (this.optimisticSnapshot != null) {
  this.setStreamValues(this.optimisticSnapshot);
}
```

## Implementation Steps

### Step 1: Create the Stream Error Class

Create file `src/lib/stream-error.ts`:

```typescript
export class StreamError extends Error {
  constructor(data: { message: string; name?: string; error?: string }) {
    super(data.message);
    this.name = data.name ?? data.error ?? "StreamError";
  }

  static isStructuredError(error: unknown): boolean {
    return typeof error === "object" && error != null && "message" in error;
  }
}
```

### Step 2: Create the Stateless Stream Hook

Create file `src/hooks/use-stateless-stream.tsx` (see full implementation in the repository).

### Step 3: Update Stream Provider

In `src/providers/Stream.tsx`:

```typescript
// Add import
import { useStatelessStream } from "@/hooks/use-stateless-stream";

// Add env check at module level
const isStatelessMode = process.env.NEXT_PUBLIC_STATELESS_MODE === "true";

// Add StatelessStreamSession component
const StatelessStreamSession = ({ children, apiKey, apiUrl, assistantId }) => {
  const rawStream = useStatelessStream<StateType>({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    // ... callbacks
  });
  
  // ... rest of implementation
};

// Update StreamProvider to conditionally render
export const StreamProvider = ({ children }) => {
  // ... existing code ...
  
  if (isStatelessMode) {
    return (
      <StatelessStreamSession {...props}>
        {children}
      </StatelessStreamSession>
    );
  }
  
  return (
    <StreamSession {...props}>
      {children}
    </StreamSession>
  );
};
```

### Step 4: Update Thread UI Component

In `src/components/thread/index.tsx`:

```typescript
// Add env check
const isStatelessMode = process.env.NEXT_PUBLIC_STATELESS_MODE === "true";

// Wrap thread history sidebar
{!isStatelessMode && (
  <div className="relative hidden lg:flex">
    {/* Thread history sidebar */}
  </div>
)}

// Wrap chat history toggle buttons
{!isStatelessMode && (!chatHistoryOpen || !isLargeScreen) && (
  <Button onClick={() => setChatHistoryOpen((p) => !p)}>
    {/* Panel icons */}
  </Button>
)}

// Wrap new thread button
{!isStatelessMode && (
  <TooltipIconButton tooltip="New thread" onClick={() => setThreadId(null)}>
    <SquarePen />
  </TooltipIconButton>
)}
```

### Step 5: Configure Environment Variable

Add to `.env` or `.env.local`:

```bash
# Enable stateless mode
NEXT_PUBLIC_STATELESS_MODE=true
```

Or leave unset/false for normal stateful mode:

```bash
# Stateful mode (default)
NEXT_PUBLIC_STATELESS_MODE=false
```

## How It Works

### Stateless Mode Flow

1. User sends a message
2. `useStatelessStream.submit()` is called
3. **Client-side accumulation**: New message is appended to existing messages in browser state
4. SDK calls `client.runs.stream(null, assistantId, { input: accumulatedMessages, ... })`
5. Request goes to `/runs/stream` endpoint (not `/threads/{id}/runs/stream`)
6. Server receives the **full conversation history** and processes it
7. Response streams back to browser with AI response
8. State updated with complete conversation (previous + new)

### Client-Side Message Accumulation

Since the server is stateless, the **client must maintain conversation history**:

```typescript
// On each submit:
1. Get current messages from state: [user1, ai1, user2, ai2]
2. Append new message: [user1, ai1, user2, ai2, user3]
3. Send full history to server
4. Server returns: [user1, ai1, user2, ai2, user3, ai3]
5. State updated with full conversation
```

This is handled automatically by the hook:

```typescript
// Inside submit():
const currentMessages = getMessages(stream.values);
const accumulatedInput = {
  ...inputValues,
  [messagesKey]: [...currentMessages, ...newMessages],
};
// Send accumulatedInput to server
```

### API Calls

**Stateful mode:**
```
POST /threads              (create thread)
POST /threads/{id}/runs/stream  (stream with thread - server maintains history)
```

**Stateless mode:**
```
POST /runs/stream          (stream without thread - client sends full history each time)
```

## Backend Requirements

The LangGraph server must support stateless runs via the `/runs/stream` endpoint with `null` thread ID. 

**Note:** If you encounter a 404 error like:
```
Thread with ID '...' not found
```

This is a server-side authentication issue in `check_run_stream_auth`. The server creates a temporary thread internally but fails to find it. Check your backend auth configuration.

## Testing

1. Set `NEXT_PUBLIC_STATELESS_MODE=true` in `.env`
2. Restart the dev server (`pnpm dev`)
3. Open browser DevTools Network tab
4. Send a message
5. Verify the request goes to `/runs/stream` (not `/threads/.../runs/stream`)
6. Verify thread history sidebar and new thread button are hidden

## Rollback

To revert to stateful mode:
1. Set `NEXT_PUBLIC_STATELESS_MODE=false` or remove the variable
2. Restart the dev server

The original thread-based functionality remains intact.
