"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Client } from "@langchain/langgraph-sdk";
import type { Message } from "@langchain/langgraph-sdk";
import {
  convertToChunk,
  coerceMessageLikeToMessage,
  isBaseMessageChunk,
  type BaseMessageChunk,
  type BaseMessage,
} from "@langchain/core/messages";
import { StreamError } from "@/lib/stream-error";

// ============================================================================
// Types
// ============================================================================

type StreamMode =
  | "values"
  | "updates"
  | "messages-tuple"
  | "custom"
  | "debug"
  | "events"
  | "checkpoints"
  | "tasks";

type MutateFn<StateType> = (
  update: Partial<StateType> | ((prev: StateType) => Partial<StateType>)
) => void;

interface EventOptions<StateType> {
  namespace: string[] | undefined;
  mutate: MutateFn<StateType>;
}

interface StatelessStreamCallbacks<StateType> {
  onError?: (error: unknown) => void;
  onFinish?: (state: StateType) => void;
  onStop?: (options: { mutate: MutateFn<StateType> }) => void;
  onUpdateEvent?: (data: unknown, options: EventOptions<StateType>) => void;
  onCustomEvent?: (data: unknown, options: EventOptions<StateType>) => void;
  onMetadataEvent?: (data: unknown) => void;
  onLangChainEvent?: (data: unknown) => void;
  onDebugEvent?: (
    data: unknown,
    options: { namespace: string[] | undefined }
  ) => void;
  onCheckpointEvent?: (
    data: unknown,
    options: { namespace: string[] | undefined }
  ) => void;
  onTaskEvent?: (
    data: unknown,
    options: { namespace: string[] | undefined }
  ) => void;
}

export interface UseStatelessStreamOptions<StateType>
  extends StatelessStreamCallbacks<StateType> {
  apiUrl: string;
  apiKey?: string;
  assistantId: string;
  messagesKey?: string;
  /**
   * Initial values for the state.
   */
  initialValues?: StateType | null;
}

export interface SubmitOptions<StateType> {
  config?: Record<string, unknown>;
  context?: Record<string, unknown>;
  streamMode?: StreamMode[];
  streamSubgraphs?: boolean;
  optimisticValues?:
    | Partial<StateType>
    | ((prev: StateType) => Partial<StateType>);
  metadata?: Record<string, unknown>;
  interruptBefore?: "*" | string[];
  interruptAfter?: "*" | string[];
}

interface MessageMetadata {
  messageId: string;
  streamMetadata: Record<string, unknown> | undefined;
}

export interface UseStatelessStream<StateType> {
  values: StateType;
  messages: Message[];
  error: unknown;
  isLoading: boolean;
  submit: (
    values: unknown,
    options?: SubmitOptions<StateType>
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
  client: Client;
  assistantId: string;
  // Dummy properties to maintain compatibility with useStream interface
  interrupt: undefined;
  history: never[];
  branch: string;
  setBranch: (branch: string) => void;
  isThreadLoading: boolean;
  getMessagesMetadata: (
    message: Message,
    index?: number
  ) => MessageMetadata | undefined;
  experimental_branchTree: { children: never[] };
  joinStream: () => Promise<void>;
}

// ============================================================================
// MessageTupleManager - Handles message chunk merging for streaming
// ============================================================================

/**
 * Converts a message to a serializable dictionary format
 */
function toMessageDict(chunk: BaseMessageChunk | BaseMessage): Message {
  const { type, data } = (chunk as BaseMessageChunk).toDict?.()
    ? (chunk as BaseMessageChunk).toDict()
    : { type: chunk._getType(), data: chunk };
  return { ...data, type } as Message;
}

/**
 * Try to convert a message to a chunk, returns null if not possible
 */
function tryConvertToChunk(
  message: BaseMessage
): BaseMessageChunk | null {
  try {
    return convertToChunk(message);
  } catch {
    return null;
  }
}

interface MessageChunkEntry {
  chunk?: BaseMessageChunk | BaseMessage;
  metadata?: Record<string, unknown>;
  index?: number;
}

/**
 * MessageTupleManager handles proper message chunk merging during streaming.
 * This ensures tokens are concatenated correctly to form complete messages.
 */
class MessageTupleManager {
  private chunks: Record<string, MessageChunkEntry> = {};

  /**
   * Add a serialized message chunk and merge with existing chunks
   */
  add(
    serialized: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): string | null {
    // Handle MessageChunk suffix from API
    let { type } = serialized as { type?: string };
    if (type?.endsWith("MessageChunk")) {
      type = type.slice(0, -"MessageChunk".length).toLowerCase();
      serialized = { ...serialized, type };
    }

    const message = coerceMessageLikeToMessage(
      serialized as Parameters<typeof coerceMessageLikeToMessage>[0]
    );
    const chunk = tryConvertToChunk(message);
    const id = (chunk ?? message).id;

    if (!id) {
      console.warn(
        "[MessageTupleManager] No message ID found for chunk, ignoring",
        serialized
      );
      return null;
    }

    this.chunks[id] ??= {};
    this.chunks[id].metadata = metadata ?? this.chunks[id].metadata;

    if (chunk) {
      const prev = this.chunks[id].chunk;
      // Concatenate chunks if previous exists and is a chunk
      this.chunks[id].chunk =
        (isBaseMessageChunk(prev) ? prev : null)?.concat(chunk) ?? chunk;
    } else {
      this.chunks[id].chunk = message;
    }

    return id;
  }

  /**
   * Get a message chunk entry by ID
   */
  get(
    id: string | null | undefined,
    defaultIndex?: number
  ): MessageChunkEntry | null {
    if (id == null) return null;
    if (this.chunks[id] == null) return null;
    if (defaultIndex != null) {
      this.chunks[id].index ??= defaultIndex;
    }
    return this.chunks[id];
  }

  /**
   * Clear all stored chunks
   */
  clear(): void {
    this.chunks = {};
  }
}

// ============================================================================
// StatelessStreamManager - Core state management for stateless streaming
// ============================================================================

type ValueKind = "stream" | "stop" | "initial";

class StatelessStreamManager<StateType extends Record<string, unknown>> {
  private abortRef = new AbortController();
  private listeners = new Set<() => void>();
  private messages: MessageTupleManager;
  private optimisticSnapshot: StateType | null = null;

  private state: {
    isLoading: boolean;
    values: [StateType, ValueKind] | null;
    error: unknown;
  };

  constructor(private initialValues: StateType) {
    this.state = { isLoading: false, values: null, error: undefined };
    this.messages = new MessageTupleManager();
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  private setState(newState: Partial<typeof this.state>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): typeof this.state => this.state;

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get values(): StateType {
    return this.state.values?.[0] ?? this.initialValues;
  }

  get error(): unknown {
    return this.state.error;
  }

  // ---------------------------------------------------------------------------
  // Value Setters
  // ---------------------------------------------------------------------------

  setStreamValues = (
    values:
      | StateType
      | ((
          prev: StateType | null,
          kind: ValueKind
        ) => StateType | null)
      | null,
    kind: ValueKind = "stream"
  ): void => {
    if (typeof values === "function") {
      const [prevValues, prevKind] = this.state.values ?? [null, "initial"];
      const nextValues = values(prevValues, prevKind);
      this.setState({
        values: nextValues != null ? [nextValues, kind] : null,
      });
    } else {
      this.setState({
        values: values != null ? [values, kind] : null,
      });
    }
  };

  /**
   * Get a mutate function for updating state from callbacks
   */
  getMutateFn = (
    kind: ValueKind,
    historyValues: StateType
  ): MutateFn<StateType> => {
    return (update) => {
      const prev = { ...historyValues, ...this.state.values?.[0] };
      const next = typeof update === "function" ? update(prev) : update;
      this.setStreamValues({ ...prev, ...next }, kind);
    };
  };

  // ---------------------------------------------------------------------------
  // Event Matching
  // ---------------------------------------------------------------------------

  /**
   * Match event types including subgraph namespaces (e.g., "updates|subgraph_name")
   */
  private matchEventType(expected: string, actual: string): boolean {
    return expected === actual || actual.startsWith(`${expected}|`);
  }

  /**
   * Parse namespace from event string (e.g., "updates|ns1|ns2" -> ["ns1", "ns2"])
   */
  private parseNamespace(event: string): string[] | undefined {
    if (!event.includes("|")) return undefined;
    return event.split("|").slice(1);
  }

  // ---------------------------------------------------------------------------
  // Stream Lifecycle
  // ---------------------------------------------------------------------------

  start = async (
    action: (
      signal: AbortSignal
    ) => Promise<AsyncIterable<{ event: string; data: unknown }>>,
    options: {
      getMessages: (values: StateType) => Message[];
      setMessages: (current: StateType, messages: Message[]) => StateType;
      initialValues: StateType;
      callbacks: StatelessStreamCallbacks<StateType>;
    }
  ): Promise<void> => {
    // Prevent concurrent streams
    if (this.state.isLoading) {
      console.warn("[StatelessStream] Stream already in progress, ignoring");
      return;
    }

    // Store optimistic snapshot for potential rollback
    this.optimisticSnapshot = this.state.values?.[0] ?? null;

    try {
      this.setState({ isLoading: true, error: undefined });
      this.abortRef = new AbortController();

      const run = await action(this.abortRef.signal);
      let streamError: StreamError | undefined;

      for await (const { event, data } of run) {
        // Handle error events
        if (event === "error") {
          streamError = new StreamError(
            StreamError.isStructuredError(data)
              ? data
              : { message: typeof data === "string" ? data : JSON.stringify(data) }
          );
          break;
        }

        const namespace = this.parseNamespace(event);
        const mutate = this.getMutateFn("stream", options.initialValues);

        // Metadata event (no namespace)
        if (event === "metadata") {
          options.callbacks.onMetadataEvent?.(data);
        }

        // LangChain events (events stream mode)
        if (event === "events") {
          options.callbacks.onLangChainEvent?.(data);
        }

        // Update events
        if (this.matchEventType("updates", event)) {
          options.callbacks.onUpdateEvent?.(data, { namespace, mutate });
        }

        // Custom events
        if (this.matchEventType("custom", event)) {
          options.callbacks.onCustomEvent?.(data, { namespace, mutate });
        }

        // Checkpoint events
        if (this.matchEventType("checkpoints", event)) {
          options.callbacks.onCheckpointEvent?.(data, { namespace });
        }

        // Task events
        if (this.matchEventType("tasks", event)) {
          options.callbacks.onTaskEvent?.(data, { namespace });
        }

        // Debug events
        if (this.matchEventType("debug", event)) {
          options.callbacks.onDebugEvent?.(data, { namespace });
        }

        // Values event - update full state
        if (event === "values") {
          // Don't update values on interrupt values event
          if (
            typeof data === "object" &&
            data !== null &&
            "__interrupt__" in data
          ) {
            continue;
          }
          this.setStreamValues(data as StateType);
        }

        // Message tuple events - handle token streaming
        if (this.matchEventType("messages", event)) {
          const [serialized, metadata] = data as [
            Record<string, unknown>,
            Record<string, unknown>?
          ];

          const messageId = this.messages.add(serialized, metadata);
          if (!messageId) {
            console.warn(
              "[StatelessStream] Failed to add message, no ID found"
            );
            continue;
          }

          this.setStreamValues((streamValues) => {
            const values = {
              ...options.initialValues,
              ...streamValues,
            } as StateType;
            const messages = options.getMessages(values).slice();
            const entry = this.messages.get(messageId, messages.length);

            if (!entry?.chunk || entry.index == null) return values;

            messages[entry.index] = toMessageDict(entry.chunk);
            return options.setMessages(values, messages);
          });
        }
      }

      // Throw stream error if encountered
      if (streamError != null) {
        throw streamError;
      }

      // Success - call onFinish with final state
      const finalValues = this.state.values?.[0] ?? options.initialValues;
      options.callbacks.onFinish?.(finalValues);

      // Clear optimistic snapshot on success
      this.optimisticSnapshot = null;
    } catch (error) {
      // Ignore abort/timeout errors
      if (
        !(
          error instanceof Error &&
          (error.name === "AbortError" || error.name === "TimeoutError")
        )
      ) {
        console.error("[StatelessStream] Error:", error);

        // Rollback to optimistic snapshot on error
        if (this.optimisticSnapshot != null) {
          this.setStreamValues(this.optimisticSnapshot);
          this.optimisticSnapshot = null;
        }

        this.setState({ error });
        options.callbacks.onError?.(error);
      }
    } finally {
      this.setState({ isLoading: false });
      this.abortRef = new AbortController();
    }
  };

  /**
   * Stop the current stream
   */
  stop = async (
    historyValues: StateType,
    options?: { onStop?: StatelessStreamCallbacks<StateType>["onStop"] }
  ): Promise<void> => {
    if (this.abortRef) {
      this.abortRef.abort();
      this.abortRef = new AbortController();
    }
    options?.onStop?.({ mutate: this.getMutateFn("stop", historyValues) });
  };

  /**
   * Clear state and messages
   */
  clear = (): void => {
    this.setState({ error: undefined, values: null });
    this.messages.clear();
    this.optimisticSnapshot = null;
  };

  /**
   * Get message metadata by ID
   */
  getMessageMetadata(
    id: string | null | undefined
  ): Record<string, unknown> | undefined {
    return this.messages.get(id)?.metadata;
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * A stateless streaming hook that provides feature parity with useStream
 * (minus thread-based features like interrupts, history, and branching).
 *
 * Features:
 * - Proper message chunk merging for token streaming
 * - All event callbacks with namespace support
 * - Concurrent request protection
 * - Optimistic updates with rollback on error
 * - Automatic stream mode tracking based on callbacks
 */
export function useStatelessStream<
  StateType extends Record<string, unknown> = Record<string, unknown>
>(options: UseStatelessStreamOptions<StateType>): UseStatelessStream<StateType> {
  const client = useMemo(
    () =>
      new Client({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
      }),
    [options.apiUrl, options.apiKey]
  );

  const initialValues = useMemo(
    () =>
      options.initialValues ?? ({ messages: [] } as unknown as StateType),
    [options.initialValues]
  );

  const [stream] = useState(
    () => new StatelessStreamManager<StateType>(initialValues)
  );

  // Subscribe to stream state changes
  useSyncExternalStore(stream.subscribe, stream.getSnapshot, stream.getSnapshot);

  // ---------------------------------------------------------------------------
  // Message Helpers
  // ---------------------------------------------------------------------------

  const getMessages = useCallback(
    (value: StateType): Message[] => {
      const messagesKey = options.messagesKey ?? "messages";
      const messages = value[messagesKey];
      return Array.isArray(messages) ? messages : [];
    },
    [options.messagesKey]
  );

  const setMessages = useCallback(
    (current: StateType, messages: Message[]): StateType => {
      const messagesKey = options.messagesKey ?? "messages";
      return { ...current, [messagesKey]: messages };
    },
    [options.messagesKey]
  );

  // ---------------------------------------------------------------------------
  // Callback Reference (to avoid stale closures)
  // ---------------------------------------------------------------------------

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // ---------------------------------------------------------------------------
  // Stream Mode Tracking
  // ---------------------------------------------------------------------------

  const trackStreamModeRef = useRef<StreamMode[]>([]);

  const trackStreamMode = useCallback((...modes: StreamMode[]) => {
    const ref = trackStreamModeRef.current;
    for (const mode of modes) {
      if (!ref.includes(mode)) ref.push(mode);
    }
  }, []);

  // Auto-calculate stream modes based on registered callbacks
  const callbackStreamModes = useMemo(() => {
    const modes: StreamMode[] = [];
    if (options.onUpdateEvent) modes.push("updates");
    if (options.onCustomEvent) modes.push("custom");
    if (options.onLangChainEvent) modes.push("events");
    if (options.onDebugEvent) modes.push("debug");
    if (options.onCheckpointEvent) modes.push("checkpoints");
    if (options.onTaskEvent) modes.push("tasks");
    return modes;
  }, [
    options.onUpdateEvent,
    options.onCustomEvent,
    options.onLangChainEvent,
    options.onDebugEvent,
    options.onCheckpointEvent,
    options.onTaskEvent,
  ]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const submit = useCallback(
    async (values: unknown, submitOptions?: SubmitOptions<StateType>) => {
      console.log(
        "[StatelessStream] submit called - true stateless mode (null threadId)"
      );

      // Get current state to accumulate messages
      const currentValues = stream.values;
      const currentMessages = getMessages(currentValues);
      
      // Extract new messages from the input
      const inputValues = values as Record<string, unknown> | null | undefined;
      const messagesKey = options.messagesKey ?? "messages";
      const newMessages = inputValues?.[messagesKey];
      
      // Build accumulated input: current messages + new messages
      let accumulatedInput: Record<string, unknown>;
      if (Array.isArray(newMessages)) {
        // Append new messages to existing messages
        accumulatedInput = {
          ...inputValues,
          [messagesKey]: [...currentMessages, ...newMessages],
        };
      } else if (newMessages != null) {
        // Single message - append to existing
        accumulatedInput = {
          ...inputValues,
          [messagesKey]: [...currentMessages, newMessages],
        };
      } else {
        // No messages in input, just use current messages
        accumulatedInput = {
          ...inputValues,
          [messagesKey]: currentMessages,
        };
      }

      console.log(
        "[StatelessStream] Accumulated messages count:",
        (accumulatedInput[messagesKey] as unknown[])?.length ?? 0
      );

      // Apply optimistic values if provided
      // For stateless mode, we also want to optimistically add the new messages to the UI
      const optimisticState = {
        ...(currentValues ?? initialValues),
        [messagesKey]: accumulatedInput[messagesKey],
        ...(submitOptions?.optimisticValues != null
          ? typeof submitOptions.optimisticValues === "function"
            ? submitOptions.optimisticValues(currentValues ?? initialValues)
            : submitOptions.optimisticValues
          : {}),
      } as StateType;
      
      stream.setStreamValues(optimisticState);

      // Merge stream modes: user-provided + callback-based + tracked
      const streamMode = unique([
        ...(submitOptions?.streamMode ?? ["values"]),
        ...trackStreamModeRef.current,
        ...callbackStreamModes,
      ]);

      await stream.start(
        async (signal) => {
          console.log(
            "[StatelessStream] Calling client.runs.stream(null, ...) for stateless run"
          );
          return client.runs.stream(null, options.assistantId, {
            input: accumulatedInput,
            config: submitOptions?.config,
            context: submitOptions?.context,
            metadata: submitOptions?.metadata,
            interruptBefore: submitOptions?.interruptBefore,
            interruptAfter: submitOptions?.interruptAfter,
            streamMode,
            streamSubgraphs: submitOptions?.streamSubgraphs,
            signal,
          });
        },
        {
          getMessages,
          setMessages,
          initialValues: optimisticState, // Use optimistic state as the base for streaming
          callbacks: callbacksRef.current,
        }
      );
    },
    [
      client,
      options.assistantId,
      options.messagesKey,
      getMessages,
      setMessages,
      stream,
      initialValues,
      callbackStreamModes,
    ]
  );

  // ---------------------------------------------------------------------------
  // Stop
  // ---------------------------------------------------------------------------

  const stop = useCallback(async () => {
    await stream.stop(initialValues, { onStop: callbacksRef.current.onStop });
  }, [stream, initialValues]);

  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------

  const clear = useCallback(() => {
    stream.clear();
  }, [stream]);

  // ---------------------------------------------------------------------------
  // Compatibility stubs
  // ---------------------------------------------------------------------------

  const [branch, setBranch] = useState("");

  // ---------------------------------------------------------------------------
  // Return Value
  // ---------------------------------------------------------------------------

  return {
    get values() {
      trackStreamMode("values");
      return stream.values;
    },
    get messages() {
      trackStreamMode("messages-tuple", "values");
      return getMessages(stream.values);
    },
    error: stream.error,
    isLoading: stream.isLoading,
    submit,
    stop,
    clear,
    client,
    assistantId: options.assistantId,

    // Stubs for useStream compatibility (stateless mode doesn't use these)
    interrupt: undefined,
    history: [],
    branch,
    setBranch,
    isThreadLoading: false,
    getMessagesMetadata(message: Message, index?: number) {
      trackStreamMode("values");
      const streamMetadata = stream.getMessageMetadata(message.id);
      if (streamMetadata != null) {
        return {
          messageId: (message.id ?? index)?.toString() ?? "",
          streamMetadata,
        };
      }
      return undefined;
    },
    experimental_branchTree: { children: [] },
    joinStream: async () => {},
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Remove duplicates from an array while preserving order
 */
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
