"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAgentEdit } from "@/providers/AgentEdit";
import {
  AgentStreamProvider,
  useAgentStreamContext,
} from "@/providers/AgentStream";
import { SquarePen, Bot, ArrowUp, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarkdownText } from "@/components/thread/markdown-text";
import {
  ToolCallDisplay,
  parseToolCalls,
  type ToolCall,
} from "@/components/thread/tool-call-display";
import { getContentString } from "@/components/thread/utils";
import type { Message } from "@langchain/langgraph-sdk";

// Message components matching agent-thread.tsx
function HumanMessage({ message }: { message: Message }) {
  const contentString = getContentString(message.content);
  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="flex flex-col gap-2">
        <p className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap">
          {contentString}
        </p>
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: Message }) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);

  // Parse tool calls from content (XML patterns - legacy support)
  const { toolCalls: parsedToolCalls, cleanContent } =
    parseToolCalls(contentString);

  // Get tool calls from message.tool_calls (from tool_call events)
  const messageToolCalls = (message as any).tool_calls || [];
  const structuredToolCalls: ToolCall[] = messageToolCalls.map((tc: any) => ({
    id: tc.id,
    name: tc.name || "",
    parameters:
      typeof tc.args === "object" && tc.args !== null
        ? Object.fromEntries(
            Object.entries(tc.args).map(([k, v]) => [k, String(v)])
          )
        : {},
    result: tc.result,
    status: tc.status,
  }));

  // Combine both sources (structured first, then parsed from content)
  const allToolCalls = [...structuredToolCalls, ...parsedToolCalls];

  return (
    <div className="mr-auto flex w-full items-start gap-2">
      <div className="flex w-full flex-col gap-2">
        {allToolCalls.length > 0 && <ToolCallDisplay toolCalls={allToolCalls} />}
        {cleanContent.length > 0 && (
          <div className="py-1">
            <MarkdownText>{cleanContent}</MarkdownText>
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-2">
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
      </div>
    </div>
  );
}

export function TestChat() {
  const { editedConfig } = useAgentEdit();
  const [chatKey, setChatKey] = useState(0);

  if (!editedConfig) return null;

  const handleNewThread = () => setChatKey((k) => k + 1);

  return (
    <AgentStreamProvider key={chatKey} agentId={editedConfig.agent_id}>
      <TestChatContent
        agentName={editedConfig.agent_name}
        onNewThread={handleNewThread}
      />
    </AgentStreamProvider>
  );
}

function TestChatContent({
  agentName,
  onNewThread,
}: {
  agentName: string;
  onNewThread: () => void;
}) {
  const stream = useAgentStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastError = useRef<string | undefined>(undefined);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle errors
  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        return;
      }
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // Track first token received
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }
    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim().length === 0 || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    stream.submit(
      { messages: [newHumanMessage] },
      {
        optimisticValues: (prev) => ({
          ...prev,
          messages: [...(prev.messages ?? []), newHumanMessage],
        }),
      }
    );

    setInput("");
  };

  const chatStarted = messages.length > 0;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Test Chat</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewThread}
          title="New test thread"
          className="size-8"
        >
          <SquarePen className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!chatStarted ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Bot className="size-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Try out {agentName}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Test your agent with unsaved changes
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
            {messages.map((message, index) =>
              message.type === "human" ? (
                <HumanMessage
                  key={message.id || `${message.type}-${index}`}
                  message={message}
                />
              ) : (
                <AssistantMessage
                  key={message.id || `${message.type}-${index}`}
                  message={message}
                />
              )
            )}
            {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="bg-muted relative flex items-end rounded-2xl border border-gray-200 dark:border-gray-700">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.metaKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  const el = e.target as HTMLElement | undefined;
                  const form = el?.closest("form");
                  form?.requestSubmit();
                }
              }}
              placeholder="Test your agent..."
              rows={1}
              className="field-sizing-content max-h-[200px] min-h-[48px] w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <div className="absolute bottom-2 right-2">
              {isLoading ? (
                <Button
                  type="button"
                  onClick={() => stream.stop()}
                  size="icon"
                  className="size-9 rounded-full"
                >
                  <LoaderCircle className="size-4 animate-spin" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="size-9 rounded-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:hover:bg-gray-100 dark:disabled:bg-gray-600"
                >
                  <ArrowUp className="size-4 text-white dark:text-gray-900" />
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
