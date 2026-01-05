"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "@langchain/langgraph-sdk";
import { streamAgentChat } from "@/lib/api/agent-builder";

// Simplified state type matching StreamProvider
export type AgentStateType = { messages: Message[] };

// Context type matching essential StreamProvider interface
interface AgentStreamContextType {
  // State
  messages: Message[];
  values: AgentStateType;
  isLoading: boolean;
  error: unknown;

  // Methods
  submit: (
    values: { messages?: Message[] } | null | undefined,
    options?: { optimisticValues?: (prev: AgentStateType) => Partial<AgentStateType> }
  ) => Promise<void>;
  stop: () => Promise<void>;

  // Agent-specific
  agentId: string;
  threadId: string | null;

  // Stub methods for compatibility (features not supported by agent-builder)
  interrupt: undefined;
  branch: string;
  setBranch: (branch: string) => void;
  history: [];
  getMessagesMetadata: () => undefined;
}

const AgentStreamContext = createContext<AgentStreamContextType | undefined>(
  undefined
);

interface AgentStreamProviderProps {
  agentId: string;
  children: ReactNode;
}

export function AgentStreamProvider({
  agentId,
  children,
}: AgentStreamProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Track current tool call being streamed (chunks are accumulated)
  const currentToolCallRef = useRef<{
    id: string;
    name: string;
    args: string;
  } | null>(null);

  // Ref to access messages in callbacks without adding to dependencies
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const stop = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const submit = useCallback(
    async (
      values: { messages?: Message[] } | null | undefined,
      options?: { optimisticValues?: (prev: AgentStateType) => Partial<AgentStateType> }
    ) => {
      // Get the last human message from input
      const inputMessages = values?.messages || [];
      const lastHumanMessage = inputMessages.find((m) => m.type === "human");

      if (!lastHumanMessage || typeof lastHumanMessage.content !== "string") {
        return;
      }

      const userContent = lastHumanMessage.content;

      // Generate thread ID for new conversation
      const currentThreadId = threadId || uuidv4();
      if (!threadId) {
        setThreadId(currentThreadId);
      }

      // Apply optimistic update if provided
      if (options?.optimisticValues) {
        const optimistic = options.optimisticValues({ messages: messagesRef.current });
        if (optimistic.messages) {
          setMessages(optimistic.messages as Message[]);
        }
      } else {
        // Add user message optimistically
        const humanMessage: Message = {
          id: lastHumanMessage.id || uuidv4(),
          type: "human",
          content: userContent,
        };
        setMessages((prev) => [...prev, humanMessage]);
      }

      // Create AI message placeholder
      const aiMessageId = uuidv4();
      const aiMessage: Message = {
        id: aiMessageId,
        type: "ai",
        content: "",
      };
      setMessages((prev) => [...prev, aiMessage]);

      setIsLoading(true);
      setError(null);

      // Create abort controller for this stream
      abortControllerRef.current = new AbortController();

      try {
        const stream = streamAgentChat(
          agentId,
          userContent,
          currentThreadId,
          abortControllerRef.current.signal
        );

        // Helper to finalize current tool call with parsed args
        const finalizeCurrentToolCall = () => {
          if (currentToolCallRef.current) {
            const toolCall = currentToolCallRef.current;
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(toolCall.args);
            } catch {
              // Args might be incomplete or invalid JSON
            }

            // Update tool call with parsed args
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === aiMessageId && msg.type === "ai") {
                  const existingToolCalls = (msg as any).tool_calls || [];
                  return {
                    ...msg,
                    tool_calls: existingToolCalls.map((tc: any) =>
                      tc.id === toolCall.id
                        ? { ...tc, args: parsedArgs }
                        : tc
                    ),
                  };
                }
                return msg;
              })
            );
            currentToolCallRef.current = null;
          }
        };

        for await (const event of stream) {
          if (event.event === "token") {
            // Finalize any pending tool call before processing token
            finalizeCurrentToolCall();

            // Extract text from content array
            const tokenData = event.data as { content: Array<{ text: string }>; node: string };
            const content = tokenData.content;
            const text = Array.isArray(content) ? content[0]?.text || "" : "";
            if (text) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: (msg.content as string) + text }
                    : msg
                )
              );
            }
          } else if (event.event === "tool_call") {
            // data is now a direct array: [{name, args}]
            const chunks = event.data as Array<{ name: string | null; args: string }>;
            const tc = chunks[0];
            if (!tc) continue;

            // First chunk has name - finalize previous tool call and start new one
            if (tc.name) {
              // Finalize any pending tool call before starting new one
              finalizeCurrentToolCall();

              const toolCallId = uuidv4();
              currentToolCallRef.current = {
                id: toolCallId,
                name: tc.name,
                args: tc.args || "",
              };
              // Add tool call to message immediately
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === aiMessageId && msg.type === "ai") {
                    const existingToolCalls = (msg as any).tool_calls || [];
                    return {
                      ...msg,
                      tool_calls: [
                        ...existingToolCalls,
                        {
                          id: toolCallId,
                          name: tc.name,
                          args: {},
                        },
                      ],
                    };
                  }
                  return msg;
                })
              );
            } else if (currentToolCallRef.current) {
              // Subsequent chunks have args fragments
              currentToolCallRef.current.args += tc.args || "";
            }
          } else if (event.event === "tool_result") {
            // Finalize any pending tool call before processing result
            finalizeCurrentToolCall();

            const resultData = event.data as { result: string };
            const resultId = uuidv4();

            // Add tool result to separate tool_results array
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === aiMessageId && msg.type === "ai") {
                  const existingResults = (msg as any).tool_results || [];
                  return {
                    ...msg,
                    tool_results: [
                      ...existingResults,
                      { id: resultId, result: resultData.result },
                    ],
                  };
                }
                return msg;
              })
            );
          } else if (event.event === "end") {
            // Finalize any pending tool call before ending
            finalizeCurrentToolCall();

            // Update thread ID if returned
            const endData = event.data as { thread_id?: string };
            if (endData?.thread_id) {
              setThreadId(endData.thread_id);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [agentId, threadId]
  );

  const contextValue = useMemo<AgentStreamContextType>(
    () => ({
      messages,
      values: { messages },
      isLoading,
      error,
      submit,
      stop,
      agentId,
      threadId,
      // Stub values for features not supported by agent-builder
      interrupt: undefined,
      branch: "main",
      setBranch: () => {},
      history: [],
      getMessagesMetadata: () => undefined,
    }),
    [messages, isLoading, error, submit, stop, agentId, threadId]
  );

  return (
    <AgentStreamContext.Provider value={contextValue}>
      {children}
    </AgentStreamContext.Provider>
  );
}

export function useAgentStreamContext(): AgentStreamContextType {
  const context = useContext(AgentStreamContext);
  if (context === undefined) {
    throw new Error(
      "useAgentStreamContext must be used within an AgentStreamProvider"
    );
  }
  return context;
}

export default AgentStreamContext;
