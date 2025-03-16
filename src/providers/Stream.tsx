import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryParam, StringParam } from "use-query-params";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { useUser } from "@/contexts/UserContext";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
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
  accessToken: string | undefined,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${apiUrl}/info`, {
      headers,
    });
    return response.ok;
  } catch (e) {
    console.error('Error checking graph status:', e);
    return false;
  }
}

const StreamSession = ({
  children,
  accessToken,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  accessToken: string | undefined;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const { getThreads, setThreads } = useThreads();

  console.log("[StreamSession] Initializing with:", {
    hasAccessToken: !!accessToken,
    accessTokenType: typeof accessToken,
    apiUrl,
    assistantId,
    currentThreadId: threadId
  });

  useEffect(() => {
    console.log("[StreamSession] Access token changed:", {
      hasAccessToken: !!accessToken,
      accessTokenType: typeof accessToken
    });
  }, [accessToken]);

  const stream = useTypedStream({
    apiUrl,
    defaultHeaders: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    assistantId,
    threadId: threadId ?? null,
    onThreadId: (id) => {
      console.log("[StreamSession] Thread ID changed:", {
        from: threadId,
        to: id,
        hasAccessToken: !!accessToken,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      });
      setThreadId(id);
      // Refetch threads list when thread ID changes
      console.log("[StreamSession] Starting sleep before thread refresh");
      sleep().then(() => {
        console.log("[StreamSession] Sleep finished, fetching threads with token:", !!accessToken);
        getThreads()
          .then(threads => {
            console.log("[StreamSession] Thread fetch completed", {
              threadCount: threads.length,
              hasAccessToken: !!accessToken
            });
            setThreads(threads);
          })
          .catch(error => {
            console.error("[StreamSession] Error fetching threads after sleep:", error, {
              hasAccessToken: !!accessToken
            });
          });
      });
    },
  });

  return (
    <StreamContext.Provider value={stream}>{children}</StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { session, loading } = useUser();
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_LANGCHAIN_API_URL;
  const assistantId = import.meta.env.VITE_ASSISTANT_ID || "agent";

  console.log("[StreamProvider] Rendering with session:", {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    accessTokenType: session?.access_token ? typeof session.access_token : 'undefined',
    isLoading: loading
  });

  useEffect(() => {
    if (!loading && !session?.access_token) {
      console.log("[StreamProvider] No valid session, redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [loading, session?.access_token, navigate]);

  // Show loading state while session is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading session...</h2>
          <p className="text-gray-600">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  // Return null if no session (navigation will happen in useEffect)
  if (!session?.access_token) {
    return null;
  }

  if (!apiUrl) {
    throw new Error("VITE_LANGCHAIN_API_URL environment variable is not set");
  }

  return (
    <StreamSession
      apiUrl={apiUrl}
      accessToken={session?.access_token}
      assistantId={assistantId}
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
