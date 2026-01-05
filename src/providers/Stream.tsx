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
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
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

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
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

  // Use refs to access functions without adding to callback dependencies
  const setThreadIdRef = useRef(setThreadId);
  const getThreadsRef = useRef(getThreads);
  const setThreadsRef = useRef(setThreads);

  // Update refs on each render
  setThreadIdRef.current = setThreadId;
  getThreadsRef.current = getThreads;
  setThreadsRef.current = setThreads;

  // Memoize callbacks to prevent useStream from reinitializing
  const handleCustomEvent = useCallback(
    (event: UIMessage | RemoveUIMessage, options: { mutate: (fn: (prev: StateType) => StateType) => void }) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          const ui = uiMessageReducer(prev.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },
    []
  );

  const handleThreadId = useCallback(
    (id: string) => {
      setThreadIdRef.current(id);
      // Refetch threads list when thread ID changes.
      // Wait for some seconds before fetching so we're able to get the new thread that was created.
      sleep().then(() =>
        getThreadsRef.current().then(setThreadsRef.current).catch(console.error)
      );
    },
    [] // Empty deps - refs are always stable
  );

  // DEBUG: Track render count
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // Memoize the entire config object to prevent useStream from reinitializing
  const streamConfig = useMemo(
    () => {
      console.log('[StreamSession] streamConfig recalculating');
      return {
        apiUrl,
        apiKey: apiKey ?? undefined,
        assistantId,
        threadId: threadId ?? null,
        fetchStateHistory: true,
        onCustomEvent: handleCustomEvent,
        onThreadId: handleThreadId,
      };
    },
    [apiUrl, apiKey, assistantId, threadId, handleCustomEvent, handleThreadId]
  );

  const streamValue = useTypedStream(streamConfig);

  // DEBUG: Log StreamSession renders and key state
  console.log('[StreamSession] render #', renderCountRef.current, {
    threadId,
    isLoading: streamValue.isLoading,
    hasInterrupt: !!streamValue.interrupt,
    messagesCount: streamValue.messages?.length,
    historyLength: streamValue.history?.length,
  });

  // DEBUG: Track streamValue reference changes
  const prevStreamValueRef = useRef(streamValue);
  useEffect(() => {
    if (prevStreamValueRef.current !== streamValue) {
      console.log('[StreamSession] streamValue reference changed');
      prevStreamValueRef.current = streamValue;
    }
  }, [streamValue]);

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
    <StreamContext.Provider value={streamValue}>
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
