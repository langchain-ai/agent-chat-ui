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
  StoredThread
} from "@/utils/thread-storage";

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
  const [apiUrl] = useQueryState("apiUrl");
  const [assistantId] = useQueryState("assistantId");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];

    try {
      const client = createClient(apiUrl, getApiKey() ?? undefined);

      // Try multiple search strategies to find threads
      let threads: Thread[] = [];

      // Strategy 1: Search with metadata
      try {
        threads = await client.threads.search({
          metadata: {
            ...getThreadSearchMetadata(assistantId),
          },
          limit: 100,
        });
        console.log(`Found ${threads.length} threads with metadata search`);
      } catch (error) {
        console.warn("Metadata search failed:", error);
      }

      // Strategy 2: If no threads found, try without metadata (fallback)
      if (threads.length === 0) {
        try {
          threads = await client.threads.search({
            limit: 100,
          });
          console.log(`Found ${threads.length} threads with general search`);
        } catch (error) {
          console.warn("General search failed:", error);
        }
      }

      // Strategy 3: If server search fails, use local storage as fallback
      if (threads.length === 0) {
        console.log("Using local storage fallback for threads");
        const storedThreads = getStoredThreads();
        threads = convertStoredThreadsToThreads(storedThreads);
        console.log(`Found ${threads.length} threads from local storage`);
      }

      return threads;
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      return [];
    }
  }, [apiUrl, assistantId]);

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
