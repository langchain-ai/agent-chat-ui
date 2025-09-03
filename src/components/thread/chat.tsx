import { v4 as uuidv4 } from "uuid";
import { FormEvent, useEffect, useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useLocationContext } from "@/providers/LocationContext";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
  UI_WIDGET_PREFIX,
} from "@/lib/ensure-tool-responses";
import { FlyoLogoSVG } from "../icons/langgraph";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  LoaderCircle,
  XIcon,
  Plane,
  CalendarDays,
  ArrowLeftRight,
  Ticket,
  Clock,
  Armchair,
} from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
  useArtifactOpen,
} from "./artifact";
import {
  getJwtToken,
  GetUserId,
  getUserFirstName,
} from "@/services/authService";
import { getSelectedCurrency } from "@/utils/currency-storage";
import { InterruptManager } from "./messages/interrupt-manager";
import { GenericInterruptView } from "./messages/generic-interrupt";
import { NonAgentFlowReopenButton } from "./NonAgentFlowReopenButton";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { NetworkStatusBanner } from "@/components/common/ui/NetworkStatusBanner";

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
      <span className="hidden sm:inline">Scroll to bottom</span>
    </Button>
  );
}

// Add this utility function to filter out tool call messages with empty content
function isDisplayableMessage(m: Message) {
  if (m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)) return false;
  if (m.id?.startsWith(UI_WIDGET_PREFIX)) return true;

  // Hide tool call messages with empty content
  if (
    (m.type === "ai" &&
      (!m.content ||
        (Array.isArray(m.content) && m.content.length === 0) ||
        m.content === "") &&
      m.tool_calls &&
      m.tool_calls.length > 0) ||
    m.type === "tool"
  ) {
    return false;
  }

  return true;
}

export function Thread() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();
  const { locationData } = useLocationContext();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [assistantId] = useQueryState("assistantId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );
  const [input, setInput] = useState("");
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const [firstTokenReceived, setFirstTokenReceived] = useState(false); //TODO: remove if not needed
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    try {
      const name = getUserFirstName();
      if (name) setFirstName(name);
    } catch {}
  }, []);

  const stream = useStreamContext();
  const blocks = (stream.values?.blocks ?? []) as Array<{
    id: string;
    kind: string;
    data: any;
  }>;
  const isLoading = stream.isLoading;

  // Derived message blocks for some UX computations
  const messageBlocks = blocks.filter(
    (b) => b.kind === "message" && !!b.data,
  ) as Array<{ id: string; kind: "message"; data: Message }>;

  // Force rerender when message count changes (defensive against identity reuse)
  const [, forceTick] = useState(0);
  const prevCountRef = useRef(0);
  useEffect(() => {
    if ((messageBlocks?.length || 0) !== prevCountRef.current) {
      prevCountRef.current = messageBlocks?.length || 0;
      forceTick((x) => x + 1);
    }
  }, [messageBlocks?.length]);

  // Track the last threadId to reset display state on thread switch
  const lastThreadId = useRef<string | null>(null);
  useEffect(() => {
    console.log("🔄 [THREAD DEBUG] threadId changed:", {
      from: lastThreadId.current,
      to: threadId,
      hasStreamValues: !!stream.values,
      blocksCount: blocks.length || 0,
    });

    if (lastThreadId.current !== threadId && threadId) {
      if (stream.resetForThreadSwitch) {
        stream.resetForThreadSwitch(threadId);
      }
    }
    lastThreadId.current = threadId;
  }, [threadId, stream, blocks.length]);

  // Clear input and contentBlocks when threadId changes
  useEffect(() => {
    setInput("");
    setContentBlocks([]);
    setFirstTokenReceived(false);
  }, [threadId, setContentBlocks]);

  const lastError = useRef<string | undefined>(undefined);

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
      console.error("Error in Chat.tsx :", message);
      // toast.error("An error occurred. Please try again.", {
      //   description: (
      //     <p>
      //       <strong>Error:</strong> <code>{message}</code>
      //     </p>
      //   ),
      //   richColors: true,
      //   closeButton: true,
      // });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // Track first AI token to gate loader
  const prevMessageLength = useRef(0);
  useEffect(() => {
    const hasNewAi =
      messageBlocks.length !== prevMessageLength.current &&
      messageBlocks?.length > 0 &&
      (messageBlocks[messageBlocks.length - 1].data as any)?.type === "ai";

    if (hasNewAi) setFirstTokenReceived(true);
    if (!isLoading) setFirstTokenReceived(true);

    prevMessageLength.current = messageBlocks.length;
  }, [isLoading, messageBlocks.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading)
      return;
    setFirstTokenReceived(false);

    // Get user ID from JWT token
    const jwtToken = getJwtToken();
    const userId = jwtToken ? GetUserId(jwtToken) : null;

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const existingMessages: Message[] = threadId
      ? messageBlocks.map((b) => b.data as Message)
      : [];
    const toolMessages = threadId
      ? ensureToolCallsHaveResponses(existingMessages)
      : [];

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    // Include userId and location data in the submission
    const submissionData: any = {
      messages: [...toolMessages, newHumanMessage],
      context,
    };

    if (userId) {
      submissionData.userId = userId;
    }

    if (locationData) {
      submissionData.userLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
      };
    }

    // Get user currency preference
    const userCurrency = getSelectedCurrency();
    if (userCurrency) {
      submissionData.userCurrency = userCurrency;
    }

    const submitOptions: any = {
      streamMode: ["updates"],
      streamSubgraphs: true,
      optimisticHumanMessage: newHumanMessage,
    };

    if (!threadId) {
      // Generate a valid UUID thread id for immediate optimistic render and server creation
      const clientThreadId = uuidv4();
      submitOptions.threadId = clientThreadId;
      submitOptions.metadata = {
        ...(submitOptions.metadata ?? {}),
        assistant_id: assistantId,
        graph_id: assistantId,
        created_at: new Date().toISOString(),
        user_id: userId || "anonymous",
      };
    }

    stream.submit(submissionData, submitOptions);

    setInput("");
    setContentBlocks([]);
  };

  // Quick Actions: one-click prompts to guide users
  const quickActions: Array<{ label: string; text: string; icon?: ReactNode }> =
    [
      {
        label: "Book me a flight",
        text: "Book me a flight",
        icon: <Plane className="h-3.5 w-3.5" />,
      },
      // {
      //   label: "Flexible dates",
      //   text: "Show cheapest month from BLR to GOI",
      //   icon: <CalendarDays className="h-3.5 w-3.5" />,
      // },
      // {
      //   label: "Round trip",
      //   text: "Round trip NYC to SFO for 2 adults in premium economy",
      //   icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
      // },
      {
        label: "Show Past Flights",
        text: "Show me my past flights",
        icon: <Ticket className="h-3.5 w-3.5" />,
      },
      {
        label: "Show Free Lounge Access",
        text: "Show me free lounge access for Delhi airport Terminal 1",
        icon: <Armchair className="h-3.5 w-3.5" />,
      },
      // {
      //   label: "Flight status",
      //   text: "What is the status of AI 102 tomorrow?",
      //   icon: <Clock className="h-3.5 w-3.5" />,
      // },
    ];

  const handleQuickActionClick = (text: string) => {
    if (isLoading) return;
    setFirstTokenReceived(false);

    const jwtToken = getJwtToken();
    const userId = jwtToken ? GetUserId(jwtToken) : null;

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [{ type: "text", text }],
    };

    const existingMessages: Message[] = threadId
      ? messageBlocks.map((b) => b.data as Message)
      : [];
    const toolMessages = threadId
      ? ensureToolCallsHaveResponses(existingMessages)
      : [];

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    const submissionData: any = {
      messages: [...toolMessages, newHumanMessage],
      context,
    };

    if (userId) {
      submissionData.userId = userId;
    }
    if (locationData) {
      submissionData.userLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
      };
    }

    // Get user currency preference
    const userCurrency = getSelectedCurrency();
    if (userCurrency) {
      submissionData.userCurrency = userCurrency;
    }

    const submitOptions: any = {
      streamMode: ["updates"],
      streamSubgraphs: true,
      optimisticHumanMessage: newHumanMessage,
    };

    if (!threadId) {
      const clientThreadId = uuidv4();
      submitOptions.threadId = clientThreadId;
      submitOptions.metadata = {
        ...(submitOptions.metadata ?? {}),
        assistant_id: assistantId,
        graph_id: assistantId,
        created_at: new Date().toISOString(),
        user_id: userId || "anonymous",
      };
    }

    stream.submit(submissionData, submitOptions);
    setInput("");
    setContentBlocks([]);
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["updates"],
      streamSubgraphs: true,
    });
  };

  const chatStarted = !!threadId;
  const hasNoAIOrToolMessages = !messageBlocks.find(
    (b: any) => b.data?.type === "ai" || b.data?.type === "tool",
  );

  return (
    <InterruptManager>
      <div className="flex h-full w-full overflow-hidden">
        <div
          className={cn(
            "grid w-full grid-cols-[1fr_0fr] transition-all duration-500",
            artifactOpen && "grid-cols-[3fr_2fr]",
          )}
        >
          <motion.div
            className={cn(
              "relative flex min-w-0 flex-1 flex-col overflow-hidden",
              !chatStarted && "grid-rows-[1fr]",
            )}
            layout={isLargeScreen}
          >
            <div className="flex h-full min-h-0 flex-col">
              <NetworkStatusBanner className="px-4" />
              {!chatStarted ? (
                // New thread layout - centered content
                <div className="flex flex-1 flex-col items-center justify-center px-4">
                  {/* Centered Logo */}
                  <div className="mb-5 flex items-center justify-center">
                    <FlyoLogoSVG
                      width={120}
                      height={120}
                      className="sm:h-[150px] sm:w-[150px]"
                    />
                  </div>

                  {/* Welcome Text */}
                  {
                    <div className="mb-6 text-center text-xl font-medium tracking-tight text-neutral-800 sm:text-2xl">
                      {"Hi "}
                      {firstName ? (
                        <span className="text-primary font-semibold">
                          {firstName}
                        </span>
                      ) : (
                        "Traveller"
                      )}
                      {", where are we flying today?"}
                    </div>
                  }

                  {/* Centered Chat Input */}
                  <div className="w-full max-w-3xl py-8">
                    <div className="mx-auto mb-3 w-full max-w-3xl overflow-x-auto px-1 text-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
                      <div className="inline-flex items-center gap-2 whitespace-nowrap">
                        {quickActions.map((qa) => (
                          <button
                            key={qa.label}
                            type="button"
                            onClick={() => handleQuickActionClick(qa.text)}
                            className="group hover:text-primary inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:outline-none"
                            aria-label={qa.label}
                          >
                            {qa.icon}
                            <span>{qa.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div
                      ref={dropRef}
                      className={cn(
                        "bg-muted relative z-10 mx-auto w-full rounded-2xl shadow-xs transition-all",
                        dragOver
                          ? "border-primary border-2 border-dotted"
                          : "border border-solid",
                      )}
                    >
                      <form
                        onSubmit={handleSubmit}
                        className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                      >
                        <ContentBlocksPreview
                          blocks={contentBlocks}
                          onRemove={removeBlock}
                        />
                        <div className="relative">
                          <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onPaste={handlePaste}
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
                            placeholder="Type your message..."
                            className="field-sizing-content sm:field-sizing-content resize-none border-none bg-transparent p-2 pb-0 pr-16 sm:pr-2 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none min-h-[2.5rem] max-h-[2.5rem] sm:h-auto sm:max-h-none leading-tight w-full"
                          />
                          {/* Mobile: Button inside input area */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:hidden">
                            {stream.isLoading ? (
                              <Button
                                key="stop"
                                onClick={() => stream.stop()}
                                size="sm"
                                className="h-8 px-3"
                              >
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              </Button>
                            ) : (
                              <Button
                                type="submit"
                                size="sm"
                                className="h-8 px-3 shadow-md transition-all"
                                disabled={
                                  isLoading ||
                                  (!input.trim() && contentBlocks.length === 0)
                                }
                              >
                                Send
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Desktop: Button below input */}
                        <div className="hidden sm:flex items-center gap-6 p-2 pt-2">
                          <input
                            id="file-input"
                            type="file"
                            onChange={handleFileUpload}
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                            className="hidden"
                          />
                          {stream.isLoading ? (
                            <Button
                              key="stop"
                              onClick={() => stream.stop()}
                              className="ml-auto"
                            >
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Cancel
                            </Button>
                          ) : (
                            <Button
                              type="submit"
                              className="ml-auto shadow-md transition-all"
                              disabled={
                                isLoading ||
                                (!input.trim() && contentBlocks.length === 0)
                              }
                            >
                              Send
                            </Button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                // Existing chat layout
                <StickToBottom className="relative flex-1 overflow-hidden">
                  <StickyToBottomContent
                    className={cn(
                      "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                      chatStarted && "grid grid-rows-[1fr_auto]",
                    )}
                    contentClassName="pt-4 pb-16 sm:pt-8 sm:pb-24 max-w-3xl mx-auto flex flex-col gap-4 w-full"
                    content={
                      <>
                        {blocks.map((block, index) => {
                          if (
                            block.kind === "message" &&
                            block.data &&
                            block.data.content &&
                            (block.data.content.length > 0 || block.data.id) &&
                            isDisplayableMessage(block.data as Message)
                          ) {
                            const message = block.data as Message;
                            return message.type === "human" ? (
                              <HumanMessage
                                key={block.id || `${message.type}-${index}`}
                                message={message}
                                isLoading={isLoading}
                              />
                            ) : (
                              <AssistantMessage
                                key={block.id || `${message.type}-${index}`}
                                message={message}
                                isLoading={isLoading}
                                handleRegenerate={handleRegenerate}
                              />
                            );
                          }
                          if (block.kind === "interrupt") {
                            const interruptData = block.data as Record<
                              string,
                              any
                            >;
                            return (
                              <GenericInterruptView
                                key={block.id || `interrupt-${index}`}
                                interrupt={interruptData}
                              />
                            );
                          }
                          // optionally render UI blocks here if desired
                          return null;
                        })}
                        {isLoading && <AssistantMessageLoading />}
                      </>
                    }
                    footer={
                      <div className="sticky bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-white/80 via-white/40 to-transparent pt-3 pb-[env(safe-area-inset-bottom)] sm:gap-8 sm:pt-8">
                        <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full right-4 mb-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:mb-4 rounded-full sm:rounded-md" />

                        <div
                          ref={dropRef}
                          className={cn(
                            "relative z-10 mx-auto mb-3 w-full max-w-3xl rounded-2xl border border-gray-200/50 bg-white/95 shadow-xl backdrop-blur-md transition-all sm:mb-8",
                            dragOver
                              ? "border-primary border-2 border-dotted"
                              : "border border-solid",
                          )}
                        >
                          <form
                            onSubmit={handleSubmit}
                            className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                          >
                            <ContentBlocksPreview
                              blocks={contentBlocks}
                              onRemove={removeBlock}
                            />
                            <div className="relative">
                              <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onPaste={handlePaste}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    !e.shiftKey &&
                                    !e.metaKey &&
                                    !e.nativeEvent.isComposing
                                  ) {
                                    e.preventDefault();
                                    const el = e.target as
                                      | HTMLElement
                                      | undefined;
                                    const form = el?.closest("form");
                                    form?.requestSubmit();
                                  }
                                }}
                                placeholder="Type your message...."
                                className="field-sizing-content sm:field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 pr-20 sm:pr-3.5 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none min-h-[3.5rem] max-h-[3.5rem] sm:h-auto sm:max-h-none leading-tight w-full"
                              />
                              {/* Mobile: Button inside input area */}
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:hidden">
                                {stream.isLoading ? (
                                  <Button
                                    key="stop"
                                    onClick={() => stream.stop()}
                                    size="sm"
                                    className="h-8 px-3"
                                  >
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                  </Button>
                                ) : (
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="h-8 px-3 shadow-md transition-all"
                                    disabled={
                                      isLoading ||
                                      (!input.trim() &&
                                        contentBlocks.length === 0)
                                    }
                                  >
                                    Send
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Desktop: Button below input */}
                            <div className="hidden sm:flex items-center gap-6 p-2 pt-4">
                              {stream.isLoading ? (
                                <Button
                                  key="stop"
                                  onClick={() => stream.stop()}
                                  className="ml-auto"
                                >
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                  Cancel
                                </Button>
                              ) : (
                                <Button
                                  type="submit"
                                  className="ml-auto shadow-md transition-all"
                                  disabled={
                                    isLoading ||
                                    (!input.trim() &&
                                      contentBlocks.length === 0)
                                  }
                                >
                                  Send
                                </Button>
                              )}
                            </div>
                          </form>
                        </div>
                      </div>
                    }
                  />
                </StickToBottom>
              )}
            </div>
          </motion.div>
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
        <NonAgentFlowReopenButton />
      </div>
    </InterruptManager>
  );
}
