"use client";

import { useEffect } from "react";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useAgentChat } from "@/hooks/useAgentChat";
import type { AgentSummary } from "@/lib/types/agent-builder";
import { toast } from "sonner";

interface AgentChatProps {
  agent: AgentSummary;
  onBack?: () => void;
}

export function AgentChat({ agent, onBack }: AgentChatProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming } =
    useAgentChat(agent.agent_id);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error("Failed to send message", {
        description: error,
        richColors: true,
        closeButton: true,
      });
    }
  }, [error]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      <ChatHeader agent={agent} onBack={onBack} />
      <ChatMessages messages={messages} isStreaming={isStreaming} />
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        placeholder={`Message ${agent.agent_name}...`}
      />
    </div>
  );
}

// Re-export components for individual use
export { ChatHeader } from "./chat-header";
export { ChatMessages } from "./chat-messages";
export { ChatInput } from "./chat-input";
