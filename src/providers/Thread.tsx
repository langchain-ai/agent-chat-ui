import { validate } from "uuid";
import { Thread } from "@langchain/langgraph-sdk";
import { useQueryParam, StringParam } from "use-query-params";
import { useUser } from "@/contexts/UserContext";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { createClient } from "./client";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [apiUrl] = useQueryParam("apiUrl", StringParam);
  const [assistantId] = useQueryParam("assistantId", StringParam);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const { session } = useUser();

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    console.log("[ThreadProvider] Starting getThreads call", {
      hasApiUrl: !!apiUrl,
      hasAssistantId: !!assistantId,
      apiUrl,
      assistantId
    });

    if (!apiUrl || !assistantId) {
      console.log("[ThreadProvider] Missing required params, returning empty array");
      return [];
    }
    
    console.log("[ThreadProvider] Session state:", {
      hasSession: !!session,
      accessToken: session?.access_token ? "[present]" : "[missing]"
    });
    
    try {
      const client = createClient(apiUrl, session?.access_token);
      console.log("[ThreadProvider] Created client, fetching threads with metadata:", 
        getThreadSearchMetadata(assistantId)
      );

      const threads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(assistantId),
        },
        limit: 100,
      });

      console.log("[ThreadProvider] Successfully fetched threads:", {
        threadCount: threads.length,
        threadIds: threads.map(t => t.thread_id)
      });

      return threads;
    } catch (error) {
      console.error("[ThreadProvider] Error fetching threads:", error);
      throw error; // Re-throw to be handled by caller
    }
  }, [apiUrl, assistantId, session?.access_token]);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
