"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { streamAgentChat } from "@/lib/api/agent-builder";
import type { ChatMessage } from "@/lib/types/agent-builder";

interface UseAgentChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  stopStreaming: () => void;
}

export function useAgentChat(agentId: string): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return;

      // Reset error state
      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Create assistant message placeholder
      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Start streaming
      setIsStreaming(true);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const stream = streamAgentChat(
          agentId,
          content.trim(),
          undefined, // No thread_id (fresh sessions)
          abortControllerRef.current.signal
        );

        for await (const event of stream) {
          if (event.event === "token") {
            // Extract text from content array
            const tokenData = event.data as { content: Array<{ text: string }>; node: string };
            const content = tokenData.content;
            const text = Array.isArray(content) ? content[0]?.text || "" : "";
            if (text) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + text }
                    : msg
                )
              );
            }
          }
          // "end" event just means stream finished normally
          // "tool_call" and "tool_result" events are handled in AgentStreamProvider
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Streaming was cancelled by user
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        console.error("Streaming error:", err);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [agentId, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    stopStreaming,
  };
}
