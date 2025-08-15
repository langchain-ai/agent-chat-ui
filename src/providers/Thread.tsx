import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { Thread } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
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
import {
  getStoredThreads,
  convertStoredThreadsToThreads,
  StoredThread,
} from "@/utils/thread-storage";
import { getJwtToken, GetUserId } from "@/services/authService";

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
  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined =
    process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params with env var fallbacks
  const [apiUrl] = useQueryState("apiUrl", {
    defaultValue: envApiUrl || "",
  });
  const [assistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId || "",
  });

  // Determine final values to use, prioritizing URL params then env vars
  const finalApiUrl = apiUrl || envApiUrl;
  const finalAssistantId = assistantId || envAssistantId;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    // Use resolved values with env fallbacks
    if (!finalApiUrl || !finalAssistantId) return [];

    setThreadsLoading(true);
    try {
      const client = createClient(finalApiUrl, getApiKey() ?? undefined);

      let fetchedThreads: Thread[] = [];

      // Determine current user id (if available)
      const jwtToken = getJwtToken();
      const currentUserId = jwtToken ? GetUserId(jwtToken) : "";

      try {
        const metadata = getThreadSearchMetadata(finalAssistantId);
        const metadataFilter: Record<string, any> = { ...metadata };
        if (currentUserId) {
          metadataFilter.user_id = currentUserId;
        }
        fetchedThreads = await client.threads.search({
          metadata: metadataFilter,
          limit: 20,
          sortBy: "created_at",
          sortOrder: "desc",
        });
      } catch (error) {
        console.warn("ThreadProvider: Metadata search failed:", error);
      }

      // Update shared state so consumers reflect new data
      setThreads(fetchedThreads);
      return fetchedThreads;
    } catch (error) {
      console.error("💥 ThreadProvider: Failed to fetch threads:", error);
      return [];
    } finally {
      setThreadsLoading(false);
    }
  }, [finalApiUrl, finalAssistantId]);

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
