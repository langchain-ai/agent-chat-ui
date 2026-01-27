"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
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
import { useSession } from "next-auth/react";
import { createClient } from "./client";
import { withThreadSpan } from "@/lib/otel-client";

export type StateType = {
  messages: Message[];
  ui?: UIMessage[];
  current_trigger_id?: string;
  confidence_score?: number;
  required_artifacts?: string[];
  governing_mechanisms?: string[];
  active_risks?: string[];
  user_project_description?: string;
  context?: Record<string, unknown>;
  active_agent?: "supervisor" | "hydrator";
  visualization_html?: string;
  workbench_view?: "map" | "workflow" | "artifacts" | "discovery" | "settings";
};

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

// Cast to the full UseStream type since we're using callbacks that return UseStreamCustom
// but we need access to the full API (getMessagesMetadata, setBranch, etc.)
import type { UseStream } from "@langchain/langgraph-sdk/react";
type StreamContextType = UseStream<StateType, {
  UpdateType: {
    messages?: Message[] | Message | string;
    ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    context?: Record<string, unknown>;
  };
  CustomEventType: UIMessage | RemoveUIMessage;
}> & {
  setApiKey: (key: string) => void;
  setWorkbenchView: (view: "map" | "workflow" | "artifacts" | "discovery" | "settings" | "enrichment") => Promise<void>;
  apiUrl: string;
};
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    // Use Next.js API route to proxy to backend
    const res = await fetch("/api/info", {
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
  setApiKey,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
  setApiKey: (key: string) => void;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads, setThreads } = useThreads();

  // Load Org Context for Headers
  const [orgContext, setOrgContext] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrgContext(localStorage.getItem("reflexion_org_context"));
    }
  }, []);

  const rawStream = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId: assistantId || "reflexion",
    threadId: threadId || undefined,
    fetchStateHistory: !!threadId,
    defaultHeaders: orgContext ? { "X-Organization-Context": orgContext } : undefined,
    onCustomEvent: (event, options) => {
      console.log("[Stream] Custom event received:", event);
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          if (!prev) return { messages: [], ui: uiMessageReducer([], event) };
          return { ...prev, ui: uiMessageReducer(prev.ui ?? [], event) };
        });
      }
    },
    onError: (error) => {
      console.error("[Stream] SDK Error:", error);
    },
    onThreadId: (id) => {
      if (id && id !== threadId) {
        console.log("[Stream] Thread ID changed to:", id);
        setThreadId(id);
        // Trace thread creation/assignment
        // Note: withThreadSpan is async, but we don't await it to avoid blocking
        withThreadSpan(
          "thread.created",
          {
            "thread.id": id || "unknown",
            "thread.previous_id": threadId || "none",
            "api.url": apiUrl,
          },
          async () => {
            await sleep();
            await getThreads().then(setThreads).catch(console.error);
          }
        ).catch((err) => {
          console.error("[OTEL] Failed to trace thread creation:", err);
        });
      }
    },
  });

  // Detailed Client-Side Logging for State Transitions
  useEffect(() => {
    if (rawStream.values) {
      console.log("[Stream] Values Updated:", {
        agent: rawStream.values.active_agent,
        trigger: rawStream.values.current_trigger_id,
        risks: (rawStream.values as any).active_risks?.length ?? 0,
        hasContext: !!(rawStream.values as any).context,
      });
    }
  }, [rawStream.values]);

  // Method to update the backend state with the current view
  const setWorkbenchView = async (view: "map" | "workflow" | "artifacts" | "discovery" | "settings" | "enrichment") => {
    if (!threadId || !apiUrl) return;

    console.log(`[Stream] Updating active view to: ${view}`);
    try {
      const headers: Record<string, string> = {};
      if (orgContext) headers['X-Organization-Context'] = orgContext;

      const client = createClient(apiUrl, apiKey ?? undefined, headers);
      await client.threads.updateState(threadId, {
        values: { workbench_view: view }
      });
    } catch (e) {
      console.error("[Stream] Failed to update workbench view:", e);
    }
  };

  // Dynamic Proxy Wrapper
  // This ensure ANY access to the context always gets the latest hook state 
  // but with forced null-safety for problematic fields.
  const streamValue = useMemo(() => {
    return new Proxy({} as any, {
      get(_, prop) {
        // Direct property overrides from Provider state
        if (prop === "setApiKey") return setApiKey;
        if (prop === "apiUrl") return apiUrl;
        if (prop === "setWorkbenchView") return setWorkbenchView;

        // Safety check: if rawStream itself is null, provide safe defaults
        if (!rawStream) {
          if (prop === "messages") return [];
          if (prop === "values") return { messages: [], ui: [] };
          if (prop === "error") return null;
          if (prop === "isLoading") return false;
          if (prop === "stop" || prop === "submit") return () => { console.warn(`[Stream] Called ${String(prop)} while stream is null`); };
          return undefined;
        }

        // Dynamic property access from the raw hook state
        // We read from rawStream directly to ensure we have the absolute latest state
        const value = (rawStream as any)[prop];

        // Safety Fallbacks
        if (prop === "messages") return value ?? [];
        if (prop === "values") return value ?? { messages: [], ui: [] };
        if (prop === "error") return value ?? null;
        if (prop === "isLoading") return value ?? false;

        // Methods need to be bound or returned as-is
        if (typeof value === "function") return value.bind(rawStream);

        return value;
      }
    });
  }, [rawStream, apiKey, apiUrl, threadId, orgContext]);

  useEffect(() => {
    // For relative paths (like /api), check via /api/info endpoint
    // For absolute URLs, check directly
    const checkUrl = apiUrl && !apiUrl.startsWith("/") ? apiUrl : "/api";
    checkGraphStatus(checkUrl, apiKey).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              {apiUrl && !apiUrl.startsWith("/") 
                ? `Unable to connect to ${apiUrl}. Please ensure the backend is running and LANGGRAPH_API_URL is correctly configured.`
                : "Unable to connect to the backend. Please check that the backend is running and that LANGGRAPH_API_URL is correctly configured in the Next.js API routes."}
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

// Default values for the form
// In production, NEXT_PUBLIC_API_URL should be set to the frontend's own API proxy URL
// (e.g., https://reflexion-ui-staging.up.railway.app/api)
// For local development, the LangGraph SDK connects through Next.js API proxy at /api
// which then forwards to the backend at localhost:8080
const DEFAULT_API_URL = typeof window !== "undefined" && window.location.origin 
  ? `${window.location.origin}/api` 
  : "/api";
const DEFAULT_ASSISTANT_ID = "reflexion";

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined =
    process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params only for overrides (not defaults)
  // Don't sync defaults to URL - only use query params when explicitly set and different from env vars
  const [apiUrlParam, setApiUrlParam] = useQueryState("apiUrl");
  const [assistantIdParam, setAssistantIdParam] = useQueryState("assistantId");

  // Determine actual values: URL param > env var > default
  const apiUrl = apiUrlParam || envApiUrl || DEFAULT_API_URL;
  const assistantId = assistantIdParam || envAssistantId || DEFAULT_ASSISTANT_ID;

  // For API key, use localStorage with env var fallback
  const [apiKey, _setApiKey] = useState(() => {
    const storedKey = getApiKey();
    return storedKey || "";
  });

  const setApiKey = (key: string) => {
    window.localStorage.setItem("lg:chat:apiKey", key);
    _setApiKey(key);
  };

  // Clean up URL params if they match defaults/env vars (to keep URLs clean)
  useEffect(() => {
    // Remove query params that match defaults/env vars to keep URLs clean
    if (apiUrlParam) {
      if (apiUrlParam === DEFAULT_API_URL || apiUrlParam === envApiUrl) {
        setApiUrlParam(null, { history: 'replace', shallow: false });
      }
    }
    if (assistantIdParam) {
      if (assistantIdParam === DEFAULT_ASSISTANT_ID || assistantIdParam === envAssistantId) {
        setAssistantIdParam(null, { history: 'replace', shallow: false });
      }
    }
  }, [apiUrlParam, assistantIdParam, envApiUrl, envAssistantId, setApiUrlParam, setAssistantIdParam]);

  // Determine final values to use, prioritizing URL params then env vars, then defaults
  // Note: These are computed but not currently used - apiUrl and assistantId from context already have defaults
  const _finalApiUrl = apiUrl || envApiUrl || DEFAULT_API_URL;
  const _finalAssistantId = assistantId || envAssistantId || DEFAULT_ASSISTANT_ID;

  // Sync Session Token from NextAuth
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.idToken) {
      console.log("[StreamProvider] Syncing API Key from Google ID Token");
      // Use the ID token from Google Auth - MUST persist to localStorage via setApiKey wrapper
      setApiKey(session.user.idToken);
    }
  }, [session]);

  // Setup form has been removed - configuration is now handled via environment variables
  // or URL parameters. Defaults are automatically applied if neither is present.

  return (
    <StreamSession
      apiKey={apiKey}
      apiUrl={apiUrl}
      assistantId={assistantId}
      setApiKey={setApiKey}
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
