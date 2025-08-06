# Subgraph Message Persistence Fix

## Problem Description

When using LangGraph with subgraphs, messages from subgraphs were disappearing from the UI after the first interrupt was submitted and resolved. This was causing a poor user experience where subgraph messages would vanish, making it appear as if the conversation had lost context.

### Root Cause Analysis

The issue was in the `langgraph-stream.js` file's caching and merging logic:

1. **Cache Overwriting**: When new `streamValues` came in (like when an interrupt completes), they completely overwrote the cache instead of merging with existing cached messages.

2. **Conditional Merging**: The merging logic only preserved cached messages if the current values had fewer messages, which was insufficient for preserving subgraph messages.

3. **Thread Contamination**: The cache was not thread-specific, causing messages from previous chat sessions to appear in new chats.

4. **Null ThreadId Handling**: When opening a new chat, `threadId` was initially `null`, but the cache was still being accessed, causing cross-thread contamination.

## Solution Implementation

### 1. Thread-Specific Cache Storage

**Before:**

```javascript
// Single cache reference shared across all threads
const streamValuesCacheRef = useRef(null);
```

**After:**

```javascript
// Map of threadId -> cached values for isolation
const streamValuesCacheRef = useRef(new Map()); // Map<threadId, cachedValues>
```

### 2. Smart Cache Merging Instead of Overwriting

**Before:**

```javascript
// Completely overwrite cache
streamValuesCacheRef.current = streamValues;
```

**After:**

```javascript
// Merge with existing cache instead of overwriting
if (streamValuesCacheRef.current && streamValues.messages) {
  const existingCache = streamValuesCacheRef.current;
  const newMessages = streamValues.messages;

  // Combine existing cached messages with new messages, removing duplicates
  const allMessages = [...(existingCache.messages || [])];
  newMessages.forEach((msg) => {
    if (!allMessages.find((existing) => existing.id === msg.id)) {
      allMessages.push(msg);
    }
  });

  // Create merged cache
  const mergedCache = {
    ...existingCache,
    ...streamValues,
    messages: allMessages,
  };

  streamValuesCacheRef.current.set(threadId, mergedCache);
}
```

### 3. Always Merge Instead of Conditional Merging

**Before:**

```javascript
// Only merge if current has fewer messages
if (
  cached.messages &&
  (!current.messages || current.messages.length < cached.messages.length)
) {
  finalValues = { ...finalValues, messages: cached.messages };
}
```

**After:**

```javascript
// Always merge ALL cached messages with current messages
if (cached.messages && current.messages) {
  // Combine cached and current messages, removing duplicates by ID
  const allMessages = [...cached.messages];
  current.messages.forEach((msg) => {
    const existingIndex = allMessages.findIndex(
      (existing) => existing.id === msg.id,
    );
    if (existingIndex === -1) {
      allMessages.push(msg);
    } else {
      // Update existing message with new content
      allMessages[existingIndex] = msg;
    }
  });
  finalValues = { ...finalValues, messages: allMessages };
}
```

### 4. Thread-Specific Cache Access

**Before:**

```javascript
// Always tried to access cache even with null threadId
const cached = streamValuesCacheRef.current.get(threadId);
```

**After:**

```javascript
// Only access cache if threadId is valid
const cached = threadId ? streamValuesCacheRef.current.get(threadId) : null;
```

### 5. Thread-Specific Cache Storage

**Before:**

```javascript
// Could cache with null threadId
streamValuesCacheRef.current.set(threadId, streamValues);
```

**After:**

```javascript
// Only cache if threadId is valid
if (!threadId) {
  console.log("🔍 [CACHE DEBUG] Skipping cache - no valid threadId");
  return;
}
streamValuesCacheRef.current.set(threadId, streamValues);
```

## Key Technical Details

### Cache Structure

```javascript
// Map<threadId, cachedValues>
const streamValuesCacheRef = useRef(new Map());
```

### Message Deduplication Logic

```javascript
// Remove duplicates by message ID while preserving content updates
const existingIndex = allMessages.findIndex(
  (existing) => existing.id === msg.id,
);
if (existingIndex === -1) {
  allMessages.push(msg); // Add new message
} else {
  allMessages[existingIndex] = msg; // Update existing message with new content
}
```

### Thread Isolation

```javascript
// Each thread has its own cache entry
streamValuesCacheRef.current.set(threadId, mergedCache);
const cached = threadId ? streamValuesCacheRef.current.get(threadId) : null;
```

## Debug Logging

Comprehensive logging was added to track the caching and merging process:

### Cache Debug Logs

```javascript
console.log("🔍 [CACHE DEBUG] streamValues changed for thread:", threadId);
console.log("🔍 [CACHE DEBUG] Messages to cache for thread:", threadId);
console.log(
  "🔍 [CACHE DEBUG] Merged cache - existing:",
  existingCount,
  "new:",
  newCount,
  "total:",
  totalCount,
);
```

### Merge Debug Logs

```javascript
console.log(
  "🔍 [MERGE DEBUG] Cached messages count:",
  cached.messages?.length || 0,
);
console.log(
  "🔍 [MERGE DEBUG] Current messages count:",
  current.messages?.length || 0,
);
console.log(
  "🔍 [MERGE DEBUG] Merged ALL cached messages:",
  cachedCount,
  "with current:",
  currentCount,
  "added:",
  addedCount,
  "updated:",
  updatedCount,
  "total:",
  totalCount,
);
```

### Interrupt Debug Logs

```javascript
console.log(
  "🔍 [INTERRUPT DEBUG] No interrupts active, cache preserved for thread:",
  threadId,
);
```

## Benefits of the Fix

1. **Message Persistence**: All messages (main graph, subgraph, nested subgraph) stay on screen throughout the conversation.

2. **Thread Isolation**: Each chat session has its own isolated cache, preventing cross-contamination.

3. **Content Updates**: Messages that start incomplete get updated with complete content when it arrives.

4. **Proper Deduplication**: Duplicate messages are handled intelligently - new content updates existing messages.

5. **Clean State Management**: New chats start with a clean slate, no residual messages from previous sessions.

## Testing Scenarios

### Scenario 1: Subgraph Messages Persistence

1. Start a conversation that triggers a subgraph
2. Subgraph messages appear on screen
3. Submit first interrupt → Subgraph messages should stay visible
4. Submit second interrupt → All previous messages (including subgraph) should remain

### Scenario 2: Thread Isolation

1. Start a conversation in Chat A
2. Open a new chat (Chat B)
3. Chat B should be completely empty, no messages from Chat A

### Scenario 3: Message Content Updates

1. A message arrives with incomplete content (`content: 'no content'`)
2. Same message arrives later with complete content
3. Message should be updated with the complete content, not duplicated

## Future Improvements

1. **Cache Size Management**: Implement LRU cache to prevent memory leaks with many threads
2. **Persistent Storage**: Consider persisting cache to localStorage for session recovery
3. **Cache Invalidation**: Add mechanisms to invalidate stale cache entries
4. **Performance Optimization**: Optimize merge operations for large message histories
5. **Error Handling**: Add better error handling for cache operations

## Files Modified

- `src/lib/langgraph-stream.js`: Main implementation of thread-specific caching and smart merging logic

## Related Issues

- Subgraph messages disappearing after interrupt resolution
- Cross-thread message contamination
- Incomplete message content not being updated
- Cache not being thread-specific

## Dependencies

- React hooks: `useRef`, `useState`, `useCallback`, `useEffect`
- LangGraph SDK: `Client`, message handling
- Browser APIs: `Map` for thread-specific cache storage
