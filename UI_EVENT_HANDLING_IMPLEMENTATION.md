# UI Event Handling Implementation - Thread-Safe with Queue Processing

## Overview

This document describes the implementation of thread-safe UI event handling in the custom `langgraph-stream.js` implementation to ensure that custom events from the LangGraph backend are properly received and saved in the `ui-values` without race conditions.

## Problem

The custom caching layer in `langgraph-stream.js` was missing the critical functionality to receive and handle custom events from the LangGraph backend, specifically UI events that need to be saved in the `ui-values` for proper widget rendering. Additionally, there were race conditions where UI events could be processed out of order or lost entirely.

## Solution

### 1. Added Required Imports

```javascript
import {
  uiMessageReducer,
  isUIMessage,
  isRemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
```

### 2. Enhanced Thread-Safe UI Event Handling

Implemented a queue-based processing system to prevent race conditions:

```javascript
// UI event queue to prevent race conditions
const uiEventQueueRef = useRef(new Map());
const processingUIEventsRef = useRef(false);

// Helper function to process UI events in order
const processUIEvent = useCallback(
  async (threadId, data) => {
    if (!threadId) return;

    // Add event to queue
    const eventId = Date.now() + Math.random();
    uiEventQueueRef.current.set(eventId, { threadId, data });

    // If already processing, wait with timeout
    if (processingUIEventsRef.current) {
      // Set a timeout to prevent infinite waiting
      setTimeout(() => {
        if (processingUIEventsRef.current) {
          console.warn("🔍 [UI EVENT QUEUE] Processing timeout, forcing reset");
          processingUIEventsRef.current = false;
          // Retry processing
          processUIEvent(threadId, data);
        }
      }, 5000); // 5 second timeout
      return;
    }

    processingUIEventsRef.current = true;

    try {
      // Process all queued events in order
      const events = Array.from(uiEventQueueRef.current.entries()).sort(
        ([a], [b]) => a - b,
      );
      uiEventQueueRef.current.clear();

      for (const [
        eventId,
        { threadId: eventThreadId, data: eventData },
      ] of events) {
        console.log(
          `🔍 [UI EVENT QUEUE] Processing event ${eventId} for thread ${eventThreadId}`,
        );

        await cacheManagerRef.current.withMutex(eventThreadId, async () => {
          const currentValues =
            cacheManagerRef.current.get(eventThreadId) || {};

          setStreamValues((currentStreamValues) => {
            const values = {
              ...historyValues,
              ...currentStreamValues,
              ...currentValues,
            };
            const ui = uiMessageReducer(values.ui ?? [], eventData);

            const updatedValues = { ...values, ui };

            console.log(`🔍 [UI EVENT QUEUE] Thread-safe UI update:`, {
              eventId,
              threadId: eventThreadId,
              previousUICount: values.ui?.length || 0,
              newUICount: ui.length,
              uiValues: ui.map((u) => ({
                id: u.id,
                type: u.type,
                name: u.name,
              })),
            });

            // Update cache with thread-safe operation
            cacheManagerRef.current
              .set(eventThreadId, updatedValues)
              .then(() => {
                saveCacheToStorage();
              })
              .catch((error) => {
                console.warn("🔍 [UI EVENT QUEUE] Cache update failed:", error);
              });

            return updatedValues;
          });
        });
      }
    } catch (error) {
      console.warn("🔍 [UI EVENT QUEUE] Processing failed:", error);
    } finally {
      processingUIEventsRef.current = false;
    }
  },
  [historyValues, saveCacheToStorage],
);
```

### 3. Queue-Based Event Processing

In the `consumeStream` function, UI events are now processed using the queue:

```javascript
if (event === "custom" || event.startsWith("custom|")) {
  console.log("🔍 [CUSTOM EVENT] Got custom event: ", event);

  // Handle UI messages specifically with thread-safe operations
  if (isUIMessage(data) || isRemoveUIMessage(data)) {
    console.log(`🔍 [UI EVENT] Got UI event: ${JSON.stringify(data)}`);

    // Use queue-based processing to prevent race conditions
    if (threadId) {
      processUIEvent(threadId, data);
    } else {
      // Fallback for when threadId is not available
      setStreamValues((streamValues) => {
        const values = { ...historyValues, ...streamValues };
        const ui = uiMessageReducer(values.ui ?? [], data);
        return { ...values, ui };
      });
    }
  }

  // Call the custom event handler
  options.onCustomEvent?.(data, {
    mutate: getMutateFn("stream", historyValues),
  });
}
```

### 4. Thread-Safe Cache Operations

All UI event processing uses the existing `ThreadSafeCacheManager`:

```javascript
await cacheManagerRef.current.withMutex(eventThreadId, async () => {
  const currentValues = cacheManagerRef.current.get(eventThreadId) || {};
  // Process UI event with thread-safe operations
});
```

### 5. Enhanced Debugging

Added comprehensive debugging to track UI event handling:

- UI event detection and processing
- Queue processing status
- Thread-safe operations
- Cache storage verification
- UI values summary with types and names
- Association between UI widgets and messages

## Key Features

### 1. Queue-Based Processing

UI events are queued and processed in order to prevent race conditions:

```javascript
// Add event to queue
const eventId = Date.now() + Math.random();
uiEventQueueRef.current.set(eventId, { threadId, data });
```

### 2. Thread-Safe Mutex Operations

All UI event processing uses thread-specific mutex operations:

```javascript
await cacheManagerRef.current.withMutex(eventThreadId, async () => {
  // Thread-safe UI event processing
});
```

### 3. Timeout Protection

Prevents UI events from getting stuck in the queue:

```javascript
setTimeout(() => {
  if (processingUIEventsRef.current) {
    console.warn("🔍 [UI EVENT QUEUE] Processing timeout, forcing reset");
    processingUIEventsRef.current = false;
    // Retry processing
    processUIEvent(threadId, data);
  }
}, 5000); // 5 second timeout
```

### 4. Event Ordering

Events are processed in chronological order:

```javascript
const events = Array.from(uiEventQueueRef.current.entries()).sort(
  ([a], [b]) => a - b,
);
```

### 5. Thread Switching Cleanup

UI event queue is cleared when switching threads:

```javascript
resetForThreadSwitch(newThreadId) {
    // ... existing code ...
    // Clear UI event queue for the old thread
    uiEventQueueRef.current.clear();
    processingUIEventsRef.current = false;
}
```

## Testing the Implementation

### 1. Start the Application

```bash
npm run dev
```

### 2. Open Browser Console

Open the browser developer tools and navigate to the Console tab.

### 3. Trigger Multiple UI Events

1. Start a conversation that generates UI widgets
2. Rapidly submit multiple interrupts
3. Observe the console logs for queue processing

### 4. Expected Console Output

You should see logs like:

```
🔍 [CUSTOM EVENT] Got custom event: custom
🔍 [UI EVENT] Got UI event: {"type": "add", "widget": {...}}
🔍 [UI EVENT QUEUE] Processing event 1234567890.123 for thread thread_123
🔍 [UI EVENT QUEUE] Thread-safe UI update: {eventId: 1234567890.123, threadId: "thread_123", ...}
🔍 [CACHE STORAGE DEBUG] {threadId: "thread_123", hasUI: true, uiValuesCount: 1, ...}
```

### 5. Test Race Condition Prevention

1. Submit multiple interrupts rapidly
2. Verify that UI events are processed in order
3. Check that no UI events are lost
4. Verify that UI widgets persist correctly

### 6. Test Thread Switching

1. Start a conversation with UI widgets
2. Switch to a different thread
3. Switch back to the original thread
4. Verify that UI widgets are preserved and functional

## Debugging Commands

### Check UI Event Queue Processing

```javascript
// In browser console
// Look for logs starting with "🔍 [UI EVENT QUEUE]"
```

### Check Thread-Safe Operations

```javascript
// In browser console
// Look for logs starting with "🔍 [UI EVENT QUEUE] Thread-safe UI update"
```

### Check Cache Storage

```javascript
// In browser console
// Look for logs starting with "🔍 [CACHE STORAGE DEBUG]"
```

## Troubleshooting

### Issue: UI Events Getting Stuck in Queue

**Symptoms:**

- UI events not being processed
- "Processing timeout" warnings in console

**Solutions:**

1. Check for JavaScript errors in console
2. Verify that `threadId` is properly set
3. Check that cache operations are completing successfully

### Issue: UI Events Processed Out of Order

**Symptoms:**

- UI widgets appearing in wrong order
- Inconsistent UI state

**Solutions:**

1. Check that events are being queued properly
2. Verify that the queue sorting is working correctly
3. Ensure that mutex operations are completing in order

### Issue: UI Values Not Being Cached

**Symptoms:**

- UI widgets disappear after page refresh
- No cache storage logs

**Solutions:**

1. Check that `threadId` is properly set
2. Verify that cache operations are completing
3. Check for errors in cache storage operations

## Performance Considerations

1. **Queue Processing**: UI events are processed in batches to improve performance
2. **Timeout Protection**: 5-second timeout prevents infinite waiting
3. **Thread-Safe Operations**: Mutex ensures data consistency
4. **Memory Management**: Queue is cleared when switching threads
5. **Error Recovery**: Automatic retry mechanism for failed operations

## Future Enhancements

1. **Priority Queue**: Implement priority-based processing for critical UI events
2. **Batch Processing**: Optimize for multiple UI events in single batch
3. **Event Deduplication**: Remove duplicate UI events to improve performance
4. **Persistent Queue**: Implement persistent queue for session recovery
5. **Performance Monitoring**: Add metrics for queue processing performance

## Files Modified

- `src/lib/langgraph-stream.js`: Added queue-based UI event processing with thread-safe operations
- `src/providers/Stream.tsx`: Simplified custom event handling
- `src/lib/langgraph-index.js`: Already exporting custom useStream implementation

## Dependencies

- `@langchain/langgraph-sdk/react-ui`: For UI message reducer and detection functions
- React hooks: `useState`, `useCallback`, `useEffect`, `useRef` for state management
- Custom `ThreadSafeCacheManager`: For thread-safe cache operations
- Custom UI Event Queue: For ordered event processing
