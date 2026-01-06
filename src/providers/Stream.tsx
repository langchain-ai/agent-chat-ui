"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Client, type Checkpoint, type Message, type ThreadState } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  isUIMessage,
  isRemoveUIMessage,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { getApiKey } from "@/lib/api-key";
import { useThreads } from "./Thread";
import { toast } from "sonner";

export type StateType = { messages: Message[]; ui?: UIMessage[]; context?: Record<string, unknown> };

// Interface matching the SDK's useStream return type for compatibility
interface StreamContextType {
  // Data
  messages: Message[];
  values: StateType;
  isLoading: boolean;
  error: unknown;
  interrupt: unknown;
  history: ThreadState<StateType>[];

  // SDK compatibility properties (stubs for LoadExternalComponent)
  isThreadLoading: boolean;
  branch: string | null;
  experimental_branchTree: unknown;
  client: Client;
  threadId: string | null;
  assistantId: string;

  // Methods
  submit: (
    values: Partial<StateType> | Record<string, unknown> | null | undefined,
    options?: {
      streamMode?: string[];
      streamSubgraphs?: boolean;
      streamResumable?: boolean;
      optimisticValues?: (prev: StateType) => Partial<StateType>;
      checkpoint?: { checkpoint_id?: string | null } | null;
      command?: { resume?: unknown; goto?: string };
    }
  ) => void;
  stop: () => Promise<void>;
  getMessagesMetadata: (message: Message) => {
    firstSeenState?: {
      parent_checkpoint?: Checkpoint | null;
      values?: StateType;
    };
    branch?: string;
    branchOptions?: string[];
  } | undefined;
  setBranch: (branch: string) => void;
  joinStream: (threadId: string) => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads, setThreads } = useThreads();

  // State management (replaces SDK's useSyncExternalStore)
  const [messages, setMessages] = useState<Message[]>([]);
  const [ui, setUi] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [interrupt, setInterrupt] = useState<unknown>(undefined);

  // Refs for abort controller and stable function references
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const uiRef = useRef<UIMessage[]>([]);

  // Keep refs in sync
  messagesRef.current = messages;
  uiRef.current = ui;

  // Use refs to access functions without adding to callback dependencies
  const setThreadIdRef = useRef(setThreadId);
  const getThreadsRef = useRef(getThreads);
  const setThreadsRef = useRef(setThreads);

  // Update refs on each render
  setThreadIdRef.current = setThreadId;
  getThreadsRef.current = getThreads;
  setThreadsRef.current = setThreads;

  // Create LangGraph client
  const client = useMemo(() => {
    return new Client({
      apiUrl,
      apiKey: apiKey ?? undefined,
    });
  }, [apiUrl, apiKey]);

  // Handle thread ID changes
  const handleThreadId = useCallback((id: string) => {
    setThreadIdRef.current(id);
    // Refetch threads list when thread ID changes.
    sleep().then(() =>
      getThreadsRef.current().then(setThreadsRef.current).catch(console.error)
    );
  }, []);

  // Stop function
  const stop = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // Submit function - main streaming logic
  const submit = useCallback(
    async (
      inputValues: Partial<StateType> | Record<string, unknown> | null | undefined,
      options?: {
        streamMode?: string[];
        streamSubgraphs?: boolean;
        streamResumable?: boolean;
        optimisticValues?: (prev: StateType) => Partial<StateType>;
        checkpoint?: { checkpoint_id?: string | null } | null;
        command?: { resume?: unknown };
      }
    ) => {
      // Apply optimistic update if provided
      if (options?.optimisticValues) {
        const currentState: StateType = { messages: messagesRef.current, ui: uiRef.current };
        const optimistic = options.optimisticValues(currentState);
        if (optimistic.messages) {
          setMessages(optimistic.messages as Message[]);
        }
        if (optimistic.ui) {
          setUi(optimistic.ui as UIMessage[]);
        }
      }

      setIsLoading(true);
      setError(null);
      setInterrupt(undefined);

      // Create abort controller for this stream
      abortControllerRef.current = new AbortController();

      try {
        // Determine current thread ID or create new one
        let currentThreadId = threadId;

        if (!currentThreadId) {
          // Create a new thread
          const thread = await client.threads.create();
          currentThreadId = thread.thread_id;
          handleThreadId(currentThreadId);
        }

        // Build stream options
        const streamOptions: Record<string, unknown> = {
          streamMode: options?.streamMode ?? ["values"],
          streamSubgraphs: options?.streamSubgraphs ?? true,
        };

        // Add input or command
        if (options?.command) {
          streamOptions.command = options.command;
        } else if (inputValues) {
          streamOptions.input = inputValues;
        }

        // Add checkpoint for regeneration
        if (options?.checkpoint) {
          streamOptions.checkpoint = options.checkpoint;
        }

        // Start the stream
        const stream = client.runs.stream(
          currentThreadId,
          assistantId,
          streamOptions
        );

        // Process stream events
        for await (const event of stream) {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const eventType = event.event;
          const eventData = event.data as Record<string, unknown>;

          // Handle values event - update messages
          if (eventType === "values") {
            const newMessages = eventData.messages as Message[] | undefined;
            if (newMessages) {
              setMessages(newMessages);
            }
          }

          // Handle metadata event - may contain interrupt info
          if (eventType === "metadata" || eventType === "updates") {
            // Check for interrupt in various locations
            const interruptData = eventData.__interrupt__ ?? eventData.interrupt;
            if (interruptData) {
              setInterrupt(interruptData);
            }
          }

          // Handle custom event - UI components
          if (eventType === "custom") {
            if (isUIMessage(eventData) || isRemoveUIMessage(eventData)) {
              setUi((prev) => uiMessageReducer(prev, eventData as UIMessage | RemoveUIMessage));
            }
          }

          // Handle error event
          if (eventType === "error") {
            setError(eventData);
          }
        }

        // After stream completes, check for final interrupt state
        if (!abortControllerRef.current?.signal.aborted) {
          try {
            const state = await client.threads.getState(currentThreadId);
            if (state.tasks && state.tasks.length > 0) {
              // Collect interrupts from all tasks
              const allInterrupts = state.tasks.flatMap(
                (task: { interrupts?: unknown[] }) => task.interrupts ?? []
              );
              if (allInterrupts.length > 0) {
                setInterrupt(allInterrupts.length === 1 ? allInterrupts[0] : allInterrupts);
              }
            }
          } catch (e) {
            // Ignore state fetch errors
            console.warn("Failed to fetch final state:", e);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err);
          console.error("Stream error:", err);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [client, assistantId, threadId, handleThreadId]
  );

  // Stub functions for branching (not implemented in custom version)
  const getMessagesMetadata = useCallback(() => undefined, []);
  const setBranch = useCallback(() => {}, []);
  const joinStream = useCallback(() => {}, []);

  // Build context value
  const contextValue: StreamContextType = useMemo(
    () => ({
      messages,
      values: { messages, ui },
      isLoading,
      error,
      interrupt,
      history: [], // Stub - branching not implemented
      // SDK compatibility properties
      isThreadLoading: false, // Thread loading handled elsewhere
      branch: null, // Branching not implemented
      experimental_branchTree: undefined,
      client,
      threadId,
      assistantId,
      // Methods
      submit,
      stop,
      getMessagesMetadata,
      setBranch,
      joinStream,
    }),
    [messages, ui, isLoading, error, interrupt, client, threadId, assistantId, submit, stop, getMessagesMetadata, setBranch, joinStream]
  );

  // Clear state when thread changes
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setUi([]);
      setInterrupt(undefined);
      setError(null);
    } else {
      // Load existing thread state
      client.threads.getState(threadId).then((state) => {
        const stateValues = state.values as StateType | undefined;
        if (stateValues?.messages) {
          setMessages(stateValues.messages);
        }
        if (stateValues?.ui) {
          setUi(stateValues.ui);
        }
        // Check for pending interrupts
        if (state.tasks && state.tasks.length > 0) {
          const allInterrupts = state.tasks.flatMap(
            (task: { interrupts?: unknown[] }) => task.interrupts ?? []
          );
          if (allInterrupts.length > 0) {
            setInterrupt(allInterrupts.length === 1 ? allInterrupts[0] : allInterrupts);
          }
        }
      }).catch((err) => {
        console.warn("Failed to load thread state:", err);
      });
    }
  }, [threadId, client]);

  // Check graph status on mount
  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code> and
              your API key is correctly set (if connecting to a deployed graph).
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl]);

  return (
    <StreamContext.Provider value={contextValue}>
      {children}
    </StreamContext.Provider>
  );
};

// Default values
const DEFAULT_API_URL = "http://localhost:2024";
const DEFAULT_ASSISTANT_ID = "deep_agent_builder";

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined =
    process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params with env var fallbacks, defaulting to constants if not set
  const [apiUrl] = useQueryState("apiUrl", {
    defaultValue: envApiUrl || DEFAULT_API_URL,
  });
  const [assistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId || DEFAULT_ASSISTANT_ID,
  });

  // For API key, use localStorage with env var fallback
  const [apiKey] = useState(() => {
    const storedKey = getApiKey();
    return storedKey || "";
  });

  // Use final values (always have defaults now)
  const finalApiUrl = apiUrl || DEFAULT_API_URL;
  const finalAssistantId = assistantId || DEFAULT_ASSISTANT_ID;

  return (
    <StreamSession
      apiKey={apiKey}
      apiUrl={finalApiUrl}
      assistantId={finalAssistantId}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
