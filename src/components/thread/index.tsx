import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UI } from "@/lib/constants";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { LangGraphLogoSVG } from "../icons/langgraph";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  SquarePen,
  XIcon,
  Paperclip,
  Wrench,
  ArrowUp,
  BookOpen,
} from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { GitHubSVG } from "../icons/github";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";
import { SettingsDialog } from "../settings/SettingsDialog";
import { useSettings } from "@/providers/Settings";
import { FullDescriptionModal } from "./FullDescriptionModal";

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

function OpenGitHubRepo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href="https://github.com/teddylee777/agent-chat-ui"
            target="_blank"
            className="flex items-center justify-center"
          >
            <GitHubSVG
              width="24"
              height="24"
            />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Open GitHub repo</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Thread() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();
  const { config, userSettings } = useSettings();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );
  const [input, setInput] = useState("");
  const [fullDescriptionOpen, setFullDescriptionOpen] = useState(false);
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks: _resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
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
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r border-border bg-sidebar"
          style={{ width: UI.CHAT_SIDEBAR_WIDTH }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -UI.CHAT_SIDEBAR_WIDTH }
              : { x: chatHistoryOpen ? 0 : -UI.CHAT_SIDEBAR_WIDTH }
          }
          initial={{ x: -UI.CHAT_SIDEBAR_WIDTH }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div
            className="relative h-full flex flex-col"
            style={{ width: UI.CHAT_SIDEBAR_WIDTH }}
          >
            <div className="flex-1 overflow-hidden">
              <ThreadHistory onShowGuide={() => setFullDescriptionOpen(true)} />
            </div>
            <div className="border-t border-border p-4">
              <SettingsDialog />
            </div>
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
            marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
            width: chatHistoryOpen
              ? isLargeScreen
                ? "calc(100% - 300px)"
                : "100%"
              : "100%",
          }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          {!chatStarted && (
            <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between gap-3 p-2 pl-4">
              <div>
                {(!chatHistoryOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-accent"
                    variant="ghost"
                    onClick={() => setChatHistoryOpen((p) => !p)}
                  >
                    {chatHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                )}
              </div>
              <div className="absolute top-2 right-4 flex items-center">
                <OpenGitHubRepo />
              </div>
            </div>
          )}
          {chatStarted && (
            <div className="relative z-10 flex items-center justify-between gap-3 p-2">
              <div className="relative flex items-center justify-start gap-2">
                <div className="absolute left-0 z-10">
                  {(!chatHistoryOpen || !isLargeScreen) && (
                    <Button
                      className="hover:bg-accent"
                      variant="ghost"
                      onClick={() => setChatHistoryOpen((p) => !p)}
                    >
                      {chatHistoryOpen ? (
                        <PanelRightOpen className="size-5" />
                      ) : (
                        <PanelRightClose className="size-5" />
                      )}
                    </Button>
                  )}
                </div>
                <motion.button
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => setThreadId(null)}
                  animate={{
                    marginLeft: !chatHistoryOpen ? 48 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <img
                    src={config.branding.logoPath}
                    alt="Logo"
                    width={config.branding.logoWidth}
                    height={config.branding.logoHeight}
                  />
                  <span className="text-xl font-semibold tracking-tight">
                    {config.branding.appName}
                  </span>
                </motion.button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <OpenGitHubRepo />
                </div>
              </div>

              <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
            </div>
          )}

          <StickToBottom className="relative flex-1 overflow-hidden">
            <StickyToBottomContent
              className={cn(
                "absolute inset-0 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent",
                !chatStarted && "mt-[25vh] flex flex-col items-stretch",
                chatStarted && "grid grid-rows-[1fr_auto]",
                userSettings.chatWidth === "default" ? "px-4" : "px-2",
              )}
              contentClassName={cn(
                "pt-8 pb-16 mx-auto flex flex-col gap-6 w-full",
                userSettings.chatWidth === "default" ? "max-w-3xl" : "max-w-5xl"
              )}
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
                  {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                  {hasNoAIOrToolMessages && !!stream.interrupt && (
                    <AssistantMessage
                      key="interrupt-msg"
                      message={undefined}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                    />
                  )}
                  {isLoading && !firstTokenReceived && (
                    <AssistantMessageLoading />
                  )}
                </>
              }
              footer={
                <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-background">
                  {!chatStarted && (
                    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto px-4">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={config.branding.logoPath}
                            alt="Logo"
                            width={config.branding.logoWidth * 1.5}
                            height={config.branding.logoHeight * 1.5}
                            className="flex-shrink-0"
                          />
                          <h1 className="text-2xl font-semibold tracking-tight">
                            {config.branding.appName}
                          </h1>
                        </div>
                        {config.branding.description && (
                          <p className="text-muted-foreground text-center text-sm">
                            {config.branding.description}
                          </p>
                        )}
                        {config.branding.fullDescription && (
                          <button
                            onClick={() => setFullDescriptionOpen(true)}
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>자세한 설명 보기</span>
                          </button>
                        )}
                      </div>
                      {config.branding.chatOpeners && config.branding.chatOpeners.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          {config.branding.chatOpeners.slice(0, 4).map((opener, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setInput(opener);
                                setTimeout(() => {
                                  const form = document.querySelector('form');
                                  form?.requestSubmit();
                                }, 0);
                              }}
                              className="group relative overflow-hidden rounded-xl border border-border bg-card hover:bg-accent hover:border-primary transition-all duration-200 p-4 text-left shadow-sm hover:shadow-md"
                            >
                              <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                {opener}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  <div
                    ref={dropRef}
                    className={cn(
                      "relative z-10 mx-auto mb-8 w-full rounded-3xl shadow-md transition-all border bg-card dark:bg-zinc-800",
                      userSettings.chatWidth === "default" ? "max-w-3xl" : "max-w-5xl",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border-border",
                    )}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className={cn(
                        "mx-auto grid grid-rows-[1fr_auto]",
                        userSettings.chatWidth === "default" ? "max-w-3xl" : "max-w-5xl"
                      )}
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
                        placeholder={config.buttons.chatInputPlaceholder}
                        rows={1}
                        style={{ maxHeight: `${UI.CHAT_TEXTAREA_MAX_HEIGHT}px` }}
                        className="field-sizing-content resize-none border-none bg-transparent px-4 pt-4 pb-2 text-base leading-relaxed shadow-none ring-0 outline-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
                      />

                      <div className="flex items-center justify-between gap-2 px-3 pb-3">
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Label
                                  htmlFor="file-input"
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-accent"
                                >
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                </Label>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Upload files</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <input
                            id="file-input"
                            type="file"
                            onChange={handleFileUpload}
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                            className="hidden"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => setHideToolCalls((prev) => !prev)}
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                                    hideToolCalls
                                      ? "bg-muted text-muted-foreground hover:bg-accent"
                                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                                  )}
                                >
                                  <Wrench className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{hideToolCalls ? "Show tool calls" : "Hide tool calls"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {stream.isLoading ? (
                          <Button
                            key="stop"
                            onClick={() => stream.stop()}
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                          >
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={
                              isLoading ||
                              (!input.trim() && contentBlocks.length === 0)
                            }
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
      <FullDescriptionModal
        open={fullDescriptionOpen}
        onOpenChange={setFullDescriptionOpen}
      />
    </div>
  );
}
