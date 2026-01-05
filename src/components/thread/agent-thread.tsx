"use client";

import { useEffect, useRef, useMemo, useState, FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AgentStreamProvider,
  useAgentStreamContext,
} from "@/providers/AgentStream";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  MessageSquarePlus,
  Bot,
  Pencil,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebarState } from "@/hooks/useSidebarState";
import { MarkdownText } from "./markdown-text";
import { getContentString } from "./utils";
import { ToolCallDisplay, parseToolCalls, type ToolCall } from "./tool-call-display";
import { toast } from "sonner";
import type { Message } from "@langchain/langgraph-sdk";
import type { AgentSummary } from "@/lib/types/agent-builder";

// Simplified message components for agent-builder (no branching/regeneration)
function AgentHumanMessage({ message }: { message: Message }) {
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

function AgentAssistantMessage({ message }: { message: Message }) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);

  // Parse tool calls from content (XML patterns - legacy support)
  const { toolCalls: parsedToolCalls, cleanContent } = parseToolCalls(contentString);

  // Get tool calls from message.tool_calls (from tool_call events)
  const messageToolCalls = (message as any).tool_calls || [];
  const structuredToolCalls: ToolCall[] = messageToolCalls.map((tc: any) => ({
    id: tc.id,
    name: tc.name || "",
    parameters: typeof tc.args === "object" && tc.args !== null
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

function AgentAssistantMessageLoading() {
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

function StickyToBottomContent(props: {
  content: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>
      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

interface AgentThreadContentProps {
  agent: AgentSummary;
}

function AgentThreadContent({ agent }: AgentThreadContentProps) {
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useAgentStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

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

  const chatStarted = useMemo(() => !!messages.length, [messages.length]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {(!sidebarOpen || !isLargeScreen) && (
              <Button
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen((p) => !p)}
              >
                {sidebarOpen ? (
                  <PanelRightOpen className="size-5" />
                ) : (
                  <PanelRightClose className="size-5" />
                )}
              </Button>
            )}
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Bot className="size-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {agent.agent_name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {agent.agent_description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            title="New thread"
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MessageSquarePlus className="size-5" />
          </Button>
          <Link href={`/agent/${agent.agent_id}/edit`}>
            <Button className="gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              <Pencil className="size-4" />
              Edit Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <StickToBottom className="relative flex-1 overflow-hidden">
        <StickyToBottomContent
          className={cn(
            "absolute inset-0 overflow-y-scroll px-4 bg-white dark:bg-black [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-gray-600",
            !chatStarted && "flex flex-col items-center justify-center",
            chatStarted && "grid grid-rows-[1fr_auto]"
          )}
          contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
          content={
            <>
              {messages.map((message, index) =>
                message.type === "human" ? (
                  <AgentHumanMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                  />
                ) : (
                  <AgentAssistantMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                  />
                )
              )}
              {isLoading && !firstTokenReceived && <AgentAssistantMessageLoading />}
            </>
          }
          footer={
            <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-white dark:bg-black w-full">
              {!chatStarted && (
                <div className="mx-4 flex min-h-[40vh] grow flex-col items-center justify-center gap-4 text-center max-w-3xl w-full lg:mx-auto">
                  <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Bot className="size-8 text-gray-400" />
                  </div>
                  <h1 className="text-2xl font-medium leading-tight tracking-tighter text-gray-900 dark:text-gray-50">
                    {agent.agent_name}와 대화하세요
                  </h1>
                  <h3 className="text-base leading-tight tracking-tight font-normal text-gray-500 dark:text-gray-400">
                    {agent.agent_description || "이 에이전트에게 질문하세요"}
                  </h3>
                </div>
              )}

              <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

              <div className="bg-muted relative z-10 mx-4 mb-8 w-full max-w-3xl rounded-2xl border border-solid shadow-xs transition-all lg:mx-auto">
                <form
                  onSubmit={handleSubmit}
                  className="grid w-full grid-rows-[1fr_auto] gap-2"
                >
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
                    placeholder={`Message ${agent.agent_name}...`}
                    className="field-sizing-content min-h-[2.5rem] resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2 p-3">
                    {stream.isLoading ? (
                      <Button key="stop" onClick={() => stream.stop()}>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        취소
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="rounded-full p-2 shadow-md transition-all"
                        disabled={isLoading || !input.trim()}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          }
        />
      </StickToBottom>
    </div>
  );
}

interface AgentThreadProps {
  agent: AgentSummary;
}

export function AgentThread({ agent }: AgentThreadProps) {
  return (
    <AgentStreamProvider agentId={agent.agent_id}>
      <AgentThreadContent agent={agent} />
    </AgentStreamProvider>
  );
}
