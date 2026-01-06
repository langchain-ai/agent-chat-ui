import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading, Interrupt } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  MessageSquarePlus,
  XIcon,
} from "lucide-react";
import { ModelSelector } from "./model-selector";
import { useQueryState } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSidebarState } from "@/hooks/useSidebarState";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
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
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
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

// ThreadContent - Main content without sidebar (used in shared layout)
export function ThreadContent() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  const setThreadId = (id: string | null) => {
    _setThreadId(id);

    // close artifact and reset artifact context
    closeArtifact();
    setArtifactContext({});
  };

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

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const chatStarted = useMemo(
    () => !!threadId || !!messages.length,
    [threadId, messages.length]
  );
  const hasNoAIOrToolMessages = useMemo(
    () => !messages.find((m) => m.type === "ai" || m.type === "tool"),
    [messages]
  );

  return (
    <div
      className={cn(
        "grid h-full w-full grid-cols-[1fr_0fr] transition-all duration-500",
        artifactOpen && "grid-cols-[3fr_2fr]",
      )}
    >
      <div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col overflow-hidden",
          !chatStarted && "grid-rows-[1fr]",
        )}
      >
        {!chatStarted && (
          <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between gap-3 p-2 pl-4">
            <div>
              {(!sidebarOpen || !isLargeScreen) && (
                <Button
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  variant="ghost"
                  onClick={() => setSidebarOpen((p) => !p)}
                >
                  {sidebarOpen ? (
                    <PanelRightOpen className="size-5" />
                  ) : (
                    <PanelRightClose className="size-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
        {chatStarted && (
          <div className="relative z-10 flex items-center justify-between gap-3 p-2">
            <div className="relative flex items-center justify-start gap-2">
              <div className="absolute left-0 z-10">
                {(!sidebarOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    variant="ghost"
                    onClick={() => setSidebarOpen((p) => !p)}
                  >
                    {sidebarOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                )}
              </div>
              <button
                className="flex cursor-pointer items-center gap-2"
                onClick={() => setThreadId(null)}
                style={{
                  marginLeft: !sidebarOpen ? 48 : 0,
                  transition: "margin-left 0.2s ease-out",
                }}
              >
                <span className="text-xl font-semibold tracking-tight">
                  Deep Agent Builder
                </span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <TooltipIconButton
                size="lg"
                className="p-4"
                tooltip="New thread"
                variant="ghost"
                onClick={() => setThreadId(null)}
              >
                <MessageSquarePlus className="size-5" />
              </TooltipIconButton>
            </div>

            <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
          </div>
        )}

        <StickToBottom className="relative flex-1 overflow-hidden">
          <StickyToBottomContent
            className={cn(
              "absolute inset-0 overflow-y-scroll px-4 bg-white dark:bg-black [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-gray-600",
              !chatStarted && "flex flex-col items-center justify-center",
              chatStarted && "grid grid-rows-[1fr_auto]",
            )}
            contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
            content={
              <>
                {messages
                  .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                  .map((message, index) =>
                    message.type === "human" ? (
                      <HumanMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                      />
                    ) : (
                      <AssistantMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                        handleRegenerate={handleRegenerate}
                      />
                    ),
                  )}
                {/* Single Interrupt render - replaces per-message Interrupt components */}
                <Interrupt
                  interrupt={stream.interrupt}
                  isLastMessage={true}
                  hasNoAIOrToolMessages={hasNoAIOrToolMessages}
                />
                {isLoading && !firstTokenReceived && (
                  <AssistantMessageLoading />
                )}
              </>
            }
            footer={
              <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-white dark:bg-black w-full">
                {!chatStarted && (
                  <div className="mx-4 flex min-h-0 grow flex-col items-center justify-center gap-4 text-center max-w-3xl w-full lg:mx-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24px"
                      height="24px"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="size-8 text-gray-900 dark:text-gray-50 [&_path]:stroke-1"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2px"
                        d="M4.5 22v-5m0-10V2M2 4.5h5m-5 15h5M13 3l-1.734 4.509c-.282.733-.423 1.1-.643 1.408a3 3 0 0 1-.706.707c-.308.219-.675.36-1.408.642L4 12l4.509 1.734c.733.282 1.1.423 1.408.643.273.194.512.433.707.706.219.308.36.675.642 1.408L13 21l1.734-4.509c.282-.733.423-1.1.643-1.408.194-.273.433-.512.706-.707.308-.219.675-.36 1.408-.642L22 12l-4.509-1.734c-.733-.282-1.1-.423-1.408-.642a3 3 0 0 1-.706-.707c-.22-.308-.36-.675-.643-1.408z"
                      />
                    </svg>
                    <h1 className="text-2xl font-medium leading-tight tracking-tighter text-gray-900 dark:text-gray-50">
                      생성하려는 에이전트에 대해 알려주세요
                    </h1>
                    <h3 className="text-base leading-tight tracking-tight font-normal text-gray-500 dark:text-gray-400">
                      원하는 에이전트가 무엇을 하길 원하는지 설명해 주시면, 단계별로 안내해 드리겠습니다
                    </h3>
                  </div>
                )}

                <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                <div className={cn("bg-muted relative z-10 mx-4 mb-4 w-full max-w-3xl rounded-2xl border border-solid shadow-xs transition-all lg:mx-auto", !chatStarted && "mb-[20vh]")}>
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
                      placeholder={chatStarted ? "메시지를 입력하세요..." : "구축하려는 에이전트에 대해 설명해 주세요..."}
                      className="field-sizing-content min-h-[2.5rem] resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                      {!chatStarted && (
                        <div className="flex flex-wrap items-center gap-3">
                          <ModelSelector />
                        </div>
                      )}
                      <div className={`flex justify-end gap-2 ${chatStarted ? 'w-full' : 'ml-auto'}`}>
                        {stream.isLoading ? (
                          <Button
                            key="stop"
                            onClick={() => stream.stop()}
                          >
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
                    </div>
                    {!chatStarted && (
                      <div className="flex justify-center pb-3">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-sm text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          직접 수동으로 생성하기
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            }
          />
        </StickToBottom>
      </div>
      <div className="relative flex flex-col border-l">
        <div className="absolute inset-0 flex min-w-[30vw] flex-col">
          <div className="grid grid-cols-[1fr_auto] border-b p-4">
            <ArtifactTitle className="truncate overflow-hidden" />
            <button
              onClick={closeArtifact}
              className="cursor-pointer"
            >
              <XIcon className="size-5" />
            </button>
          </div>
          <ArtifactContent className="relative flex-grow" />
        </div>
      </div>
    </div>
  );
}

// Legacy Thread export for backwards compatibility
export function Thread() {
  return <ThreadContent />;
}
