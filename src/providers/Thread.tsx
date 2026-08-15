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

interface ThreadContextType {
  getThreads: (limit?: number, offset?: number) => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
  hasMore: boolean;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  loadMoreThreads: () => Promise<void>;
  deleteThread: (thread: Thread) => Promise<void>;
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
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined =
    process.env.NEXT_PUBLIC_ASSISTANT_ID;
  const envAuthScheme: string | undefined = process.env.NEXT_PUBLIC_AUTH_SCHEME;

  const [apiUrl] = useQueryState("apiUrl", {
    defaultValue: envApiUrl || "",
  });
  const [assistantId] = useQueryState("assistantId");
  const [authScheme] = useQueryState("authScheme", {
    defaultValue: envAuthScheme || "",
  });
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const getThreads = useCallback(
    async (limit: number = 100, offset: number = 0): Promise<Thread[]> => {
      const resolvedAssistantId = assistantId || envAssistantId;
      if (!apiUrl || !resolvedAssistantId) return [];
      const client = createClient(
        apiUrl,
        getApiKey() ?? undefined,
        authScheme || undefined,
      );

      const threads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(resolvedAssistantId),
        },
        limit,
        offset,
      });

      return threads;
    },
    [apiUrl, assistantId, authScheme, envAssistantId],
  );

  const loadMoreThreads = useCallback(async (): Promise<void> => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const newThreads = await getThreads(100, threads.length);
      if (newThreads.length < 100) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setThreads((prev) => {
        const existingIds = new Set(prev.map((t) => t.thread_id));
        const filteredNew = newThreads.filter(
          (t) => !existingIds.has(t.thread_id),
        );
        return [...prev, ...filteredNew];
      });
    } catch (error) {
      console.error("Failed to load more threads:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [getThreads, hasMore, isLoadingMore, threads.length]);

  const deleteThread = useCallback(
    async (thread: Thread): Promise<void> => {
      const resolvedAssistantId = assistantId || envAssistantId;
      if (!apiUrl || !resolvedAssistantId) return;
      const client = createClient(
        apiUrl,
        getApiKey() ?? undefined,
        authScheme || undefined,
      );

      // Optimistic state update: remove thread immediately for 0ms latency
      setThreads((prev) =>
        prev.filter((t) => t.thread_id !== thread.thread_id),
      );

      try {
        await client.threads.delete(thread.thread_id);
      } catch (err) {
        // Roll back the optimistic removal so the UI stays in sync with the backend.
        console.error("Failed to delete thread:", err);
        setThreads((prev) =>
          prev.some((t) => t.thread_id === thread.thread_id)
            ? prev
            : [...prev, thread],
        );
        throw err;
      }
    },
    [apiUrl, assistantId, authScheme, envAssistantId],
  );

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    hasMore,
    setHasMore,
    loadMoreThreads,
    deleteThread,
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
