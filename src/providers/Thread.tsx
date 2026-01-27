"use client";

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
import { useSession } from "next-auth/react";
import { withThreadSpan } from "@/lib/otel-client";

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
  const { data: session } = useSession();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];

    return withThreadSpan(
      "thread.list",
      {
        "thread.assistant_id": assistantId,
        "api.url": apiUrl,
      },
      async () => {
        // Read organization context from localStorage
        const orgContext = typeof window !== 'undefined' ? localStorage.getItem('reflexion_org_context') : null;
        const headers: Record<string, string> = {};
        if (orgContext) {
          headers['X-Organization-Context'] = orgContext;
        }

        // apiUrl could be null from useQueryState, createClient expects string
        // Prefer session token (fresh) over localStorage (potentially stale)
        const token = session?.user?.idToken || getApiKey();
        const client = createClient(apiUrl || "", token ?? undefined, headers);

        const threads = await client.threads.search({
          metadata: {
            ...getThreadSearchMetadata(assistantId),
          },
          limit: 100,
        });

        return threads;
      }
    );
  }, [apiUrl, assistantId, session]);

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
