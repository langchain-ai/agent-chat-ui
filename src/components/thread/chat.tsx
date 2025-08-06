import { v4 as uuidv4 } from "uuid";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { FlyoLogoSVG } from "../icons/langgraph";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  LoaderCircle,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  SquarePen,
  XIcon,
} from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";

import ThreadHistory from "./history";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
  useArtifactOpen,
} from "./artifact";
import { LogoutButton } from "@/components/auth";
import { getJwtToken, GetUserId } from "@/services/authService";
import { updateThreadWithMessage } from "@/utils/thread-storage";
import { InterruptManager } from "./messages/interrupt-manager";
import { PersistentInterruptList } from "./messages/persistent-interrupt";
import { useInterruptPersistenceContext } from "@/providers/InterruptPersistenceContext";
import {
  GenericInterruptView,
  UIWidgetPreserver,
} from "./messages/generic-interrupt";
import { NonAgentFlowReopenButton } from "./NonAgentFlowReopenButton";

// Add this utility function to filter out tool call messages with empty content
function isDisplayableMessage(m: Message) {
  if (m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)) return false;
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
  const interruptPersistence = useInterruptPersistenceContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

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

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  // Track the last threadId to reset displayMessages on thread switch
  const lastThreadId = useRef<string | null>(threadId);
  useEffect(() => {
    lastThreadId.current = threadId;
  }, [threadId, messages]);

  // Optionally clear input and contentBlocks when threadId changes
  useEffect(() => {
    setInput("");
    setContentBlocks([]);
    if (threadId === null) {
      // setDisplayMessages([]); // Remove this line //TODO: come back here
    }
  }, [threadId, setContentBlocks]);

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
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
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

  // TODO: this should be part of the useStream hook
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

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    // Include userId in the submission
    const submissionData: any = {
      messages: [...toolMessages, newHumanMessage],
      context,
    };

    if (userId) {
      submissionData.userId = userId;
    }

    // Add metadata to ensure thread is properly saved and searchable
    const submitOptions: any = {
      streamMode: ["updates"],
      streamSubgraphs: true,
      optimisticValues: (prev: any) => ({
        ...prev,
        context,
        messages: [...(prev.messages ?? []), ...toolMessages, newHumanMessage],
        ui: prev.ui ?? [], // Preserve UI state
      }),
    };

    // Add metadata for thread creation/updating
    if (!threadId) {
      // For new threads, add metadata to ensure they're searchable
      submitOptions.metadata = {
        assistant_id: assistantId,
        graph_id: assistantId,
        created_at: new Date().toISOString(),
        user_id: userId || "anonymous",
      };
    }

    console.log("Submitting with options:", submitOptions);

    // Store thread information locally for fallback
    const messageText =
      typeof newHumanMessage.content === "string"
        ? newHumanMessage.content
        : Array.isArray(newHumanMessage.content)
          ? newHumanMessage.content.find((c) => c.type === "text")?.text || ""
          : "";

    if (messageText && assistantId) {
      // Update local storage with thread info
      if (threadId) {
        updateThreadWithMessage(
          threadId,
          messageText,
          assistantId,
          userId ? String(userId) : undefined,
        );
      } else {
        // For new threads, we'll update after getting the thread ID from onThreadId callback
        console.log("Will update local storage after thread ID is assigned");
      }
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
      optimisticValues: (prev: any) => ({
        ...prev,
        ui: prev.ui ?? [], // Preserve UI state
      }),
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <InterruptManager>
      <UIWidgetPreserver />
      <div className="flex h-full w-full overflow-hidden">
        <div className="relative hidden lg:flex">
          <motion.div
            className="absolute z-20 h-full overflow-hidden border-r bg-white"
            style={{ width: 250 }}
            animate={
              isLargeScreen
                ? { x: chatHistoryOpen ? 0 : -260 }
                : { x: chatHistoryOpen ? 0 : -260 }
            }
            initial={{ x: -260 }}
            transition={
              isLargeScreen
                ? { type: "spring", stiffness: 300, damping: 30 }
                : { duration: 0 }
            }
          >
            <div
              className="relative h-full"
              style={{ width: 260 }}
            >
              <ThreadHistory />
            </div>
          </motion.div>
        </div>

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
            animate={{
              marginLeft: chatHistoryOpen ? (isLargeScreen ? 260 : 0) : 0,
              width: chatHistoryOpen
                ? isLargeScreen
                  ? "calc(100% - 260px)"
                  : "100%"
                : "100%",
            }}
            transition={
              isLargeScreen
                ? { type: "spring", stiffness: 300, damping: 30 }
                : { duration: 0 }
            }
          >
            <div className="flex h-full min-h-0 flex-col">
              {!chatStarted ? (
                // New thread layout - centered content
                <div className="flex flex-1 flex-col items-center justify-center px-4">
                  {/* Centered Logo */}
                  <div className="mb-8 flex items-center justify-center">
                    <FlyoLogoSVG
                      width={120}
                      height={120}
                      className="sm:h-[150px] sm:w-[150px]"
                    />
                  </div>

                  {/* Centered Chat Input */}
                  <div className="w-full max-w-3xl">
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
                          className="field-sizing-content resize-none border-none bg-transparent p-2 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                        />

                        <div className="flex items-center gap-6 p-2 pt-2">
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
                // Chat started layout - messages at top, input at bottom
                <>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto scroll-smooth px-4 pt-8 pb-4">
                    <div className="mx-auto flex max-w-3xl flex-col gap-4">
                      {messages
                        .filter(isDisplayableMessage)
                        .flatMap((message, index) => {
                          const messageElement =
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
                            );

                          // Check if there are any persisted interrupts associated with this message
                          const messageInterrupts = message.id
                            ? interruptPersistence.getInterruptsForMessage(
                                message.id,
                              )
                            : [];

                          // Return array of elements: message + persistent interrupts
                          const elements = [messageElement];

                          if (messageInterrupts.length > 0) {
                            elements.push(
                              <div
                                key={`${message.id || `${message.type}-${index}`}-interrupts`}
                                className="mt-2"
                              >
                                <PersistentInterruptList
                                  interrupts={messageInterrupts}
                                />
                              </div>,
                            );
                          }

                          return elements;
                        })}
                      {/* Special rendering case where there are no AI/tool messages, but there is an interrupt. */}
                      {hasNoAIOrToolMessages && !!stream.interrupt && (
                        <AssistantMessage
                          key="interrupt-msg"
                          message={undefined}
                          isLoading={isLoading}
                          handleRegenerate={handleRegenerate}
                        />
                      )}
                      {(() => {
                        console.log(
                          "🔍 Stream interrupt 2:",
                          JSON.stringify(stream.values.ui),
                        );
                        return null;
                      })()}
                      {isLoading && <AssistantMessageLoading />}
                      {/* Always render the interrupt widget at the end if present */}
                      {stream.interrupt && (
                        <GenericInterruptView
                          interrupt={stream.interrupt.value ?? {}}
                        />
                      )}
                    </div>
                  </div>

                  {/* Chat Input Area - Bottom */}
                  <div className="flex flex-shrink-0 flex-col items-center gap-2 border-t bg-white px-4 py-2">
                    <div
                      ref={dropRef}
                      className={cn(
                        "bg-muted relative z-10 mx-auto w-full max-w-3xl rounded-2xl shadow-xs transition-all",
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
                          className="field-sizing-content resize-none border-none bg-transparent p-2 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                        />

                        <div className="flex items-center gap-6 p-2 pt-2">
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
                </>
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
