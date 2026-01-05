"use client";

import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
import { MarkdownText } from "@/components/thread/markdown-text";
import type { ChatMessage } from "@/lib/types/agent-builder";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[80%] items-start gap-3">
        <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2 text-white">
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <User className="size-4 text-gray-600 dark:text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming: boolean;
}) {
  const isEmpty = !message.content.trim();

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[80%] items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Bot className="size-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2 dark:bg-gray-800",
            isEmpty && "animate-pulse"
          )}
        >
          {isEmpty ? (
            <div className="flex items-center gap-1">
              <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-gray-400" />
            </div>
          ) : (
            <div className="text-sm text-gray-900 dark:text-gray-100">
              <MarkdownText>{message.content}</MarkdownText>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Bot className="size-8 text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Start a conversation
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send a message to begin chatting with this agent
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              isStreaming={isStreaming && index === messages.length - 1}
            />
          )
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
