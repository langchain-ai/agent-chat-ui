import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
  Plus,
  CircleX,
  Mic,
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
import VoiceChat from "../voice-chat";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import { useCallback } from "react";

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
            href="https://github.com/langchain-ai/agent-chat-ui"
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
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
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
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  // Dictation state
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [showWaveform, setShowWaveform] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Scrolling waveform buffer ---
  const barWidth = 2;
  const barSpacing = 2;
  const barColor = 'rgb(77, 74, 74)';
  const idleDotHeight = 4;
  const idleDotRadius = 1.2;
  const waveformLength = 100;

  const waveformBufferRef = useRef<number[]>([]); // stores bar heights

  // Helper: get amplitude from dataArray
  function getAmplitude(dataArray: Uint8Array) {
    // Use peak (max absolute deviation from 128) for a more responsive bar
    let peak = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const deviation = Math.abs(dataArray[i] - 128);
      if (deviation > peak) peak = deviation;
    }
    return peak / 128; // 0..1
  }

  // Overwrite drawWaveform for scrolling effect
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Get amplitude (0..1)
    const amplitude = getAmplitude(dataArray);
    // Decide if we are idle (no voice) or active (voice)
    const isActive = amplitude > 0.05; // threshold for voice
    // Compute new bar height
    let newBarHeight;
    if (isActive) {
      newBarHeight = Math.max(8, amplitude * canvas.height * 0.9);
    } else {
      newBarHeight = idleDotHeight;
    }
    // Update buffer: shift left, push new value
    let buffer = waveformBufferRef.current;
    if (buffer.length < waveformLength) {
      // Fill with idle dots initially
      buffer = Array(waveformLength - buffer.length).fill(idleDotHeight).concat(buffer);
    }
    buffer.push(newBarHeight);
    if (buffer.length > waveformLength) buffer.shift();
    waveformBufferRef.current = buffer;

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < buffer.length; i++) {
      const x = i * (barWidth + barSpacing);
      const h = buffer[i];
      const y = (canvas.height - h) / 2;
      ctx.fillStyle = barColor;
      if (h === idleDotHeight) {
        // Draw dot
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, canvas.height / 2, idleDotRadius, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Draw bar
        ctx.fillRect(x, y, barWidth, h);
      }
    }
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Start waveform
  const startWaveform = useCallback(async () => {
    try {
      console.log('Requesting microphone for waveform...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);
      setShowWaveform(true);
      console.log('Microphone stream and analyser set up, ready for waveform');
      // drawWaveform(); // REMOVE this direct call
    } catch (err) {
      console.error('Could not access microphone for waveform.', err);
      toast.error('Could not access microphone for waveform.');
    }
  }, [drawWaveform]);

  // Start drawing waveform only when both canvas and analyser are available
  useEffect(() => {
    if (showWaveform && canvasRef.current && analyserRef.current) {
      console.log('Starting waveform animation');
      drawWaveform();
    }
  }, [showWaveform, drawWaveform]);

  // On stopWaveform, clear buffer
  const stopWaveform = useCallback(() => {
    setShowWaveform(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    sourceRef.current = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    waveformBufferRef.current = [];
  }, []);

  // Dictation handler using Web Speech API
  const handleDictateClick = async () => {
    if (!isDictating) {
      setIsDictating(true);
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        toast.error('Speech recognition is not supported in this browser.');
        setIsDictating(false);
        return;
      }
      await startWaveform();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      };
      recognition.onerror = (event: any) => {
        toast.error('Dictation error: ' + event.error);
        setIsDictating(false);
        stopWaveform();
      };
      recognition.onend = () => {
        setIsDictating(false);
        stopWaveform();
      };
      recognition.start();
    } else {
      setIsDictating(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopWaveform();
    }
  };

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
          className="absolute z-20 h-full overflow-hidden border-r bg-white"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { 
                  x: chatHistoryOpen ? 0 : -300,
                  opacity: voiceModeActive ? 0.3 : 1,
                  filter: voiceModeActive ? "blur(4px)" : "blur(0px)"
                }
              : { 
                  x: chatHistoryOpen ? 0 : -300,
                  opacity: voiceModeActive ? 0.3 : 1,
                  filter: voiceModeActive ? "blur(4px)" : "blur(0px)"
                }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0.5, ease: "easeInOut" }
          }
        >
          <div
            className="relative h-full"
            style={{ width: 300 }}
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
            marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
            width: chatHistoryOpen
              ? isLargeScreen
                ? "calc(100% - 300px)"
                : "100%"
              : "100%",
            opacity: voiceModeActive ? 0.4 : 1,
            y: voiceModeActive ? 8 : 0,
            filter: voiceModeActive ? "blur(2px)" : "blur(0px)"
          }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0.5, ease: "easeInOut" }
          }
        >
          {!chatStarted && (
            <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between gap-3 p-2 pl-4">
              <div>
                {(!chatHistoryOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-gray-100"
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
                      className="hover:bg-gray-100"
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
                  {/* <LangGraphLogoSVG
                    width={32}
                    height={32}
                  /> */}
                  <span className="text-xl font-semibold tracking-tight">
                    EchOS Chat
                  </span>
                </motion.button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <OpenGitHubRepo />
                </div>
                <TooltipIconButton
                  size="lg"
                  className="p-4"
                  tooltip="New thread"
                  variant="ghost"
                  onClick={() => setThreadId(null)}
                >
                  <SquarePen className="size-5" />
                </TooltipIconButton>
              </div>

              <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
            </div>
          )}

          <StickToBottom className="relative flex-1 overflow-hidden">
            <StickyToBottomContent
              className={cn(
                "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                !chatStarted && "mt-[25vh] flex flex-col items-stretch",
                chatStarted && "grid grid-rows-[1fr_auto]",
              )}
              contentClassName="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full"
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
                <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-white">
                  {!chatStarted && (
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold tracking-tight">
                        EchOS Chat
                      </h1>
                    </div>
                  )}

                  <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  <div
                    ref={dropRef}
                    className={cn(
                      "bg-muted relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl shadow-xs transition-all",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border border-solid",
                    )}
                  >
                    {showWaveform && (
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                        <canvas
                          ref={canvasRef}
                          width={waveformLength * (barWidth + barSpacing)}
                          height={32}
                          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, width: waveformLength * (barWidth + barSpacing), height: 32 }}
                        />
                      </div>
                    )}
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
                        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                      />

                      <div className="flex items-center gap-6 p-2 pt-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="render-tool-calls"
                              checked={hideToolCalls ?? false}
                              onCheckedChange={setHideToolCalls}
                            />
                            <Label
                              htmlFor="render-tool-calls"
                              className="text-sm text-gray-600"
                            >
                              Hide Tool Calls
                            </Label>
                          </div>
                        </div>
                        <Label
                          htmlFor="file-input"
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Plus className="size-5 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            Upload PDF or Image
                          </span>
                        </Label>
                        <input
                          id="file-input"
                          type="file"
                          onChange={handleFileUpload}
                          multiple
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => setVoiceChatOpen(true)}
                          style={{ background: 'rgba(130, 125, 125,1)', borderRadius: '50%', width: 35, height: 35, minWidth: 35, minHeight: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(85, 84, 84, 1)' }}
                          className="p-0 border-0 shadow-none"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="10" y="4" width="3" height="22" rx="1" fill="#fff" /> {/* Central line */}
                            <rect x="2" y="8" width="3" height="12" rx="1" fill="#fff" />  {/* Left shorter line */}
                            <rect x="18" y="8" width="3" height="12" rx="1" fill="#fff" /> {/* Right shorter line */}
                          </svg>
                        </Button>
                        <Button
                          type="button"
                          aria-label="Dictate message"
                          onClick={handleDictateClick}
                          style={{ background: 'rgba(130,125,125,1)', borderRadius: '50%', width: 35, height: 35, minWidth: 35, minHeight: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(85, 84, 84, 1)', border: isDictating ? '2px solid white' : undefined }}
                          className="p-0 border-0 shadow-none"
                        >
                          <Mic className="w-5 h-5 text-white" />
                        </Button>
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
      
      {/* Voice Chat Modal */}
      {voiceChatOpen && (
        <VoiceChat 
          onClose={() => setVoiceChatOpen(false)} 
          onVoiceModeChange={setVoiceModeActive}
          onTranscriptComplete={(transcript) => {
            // Convert transcript entries to messages
            const transcriptMessages: Message[] = transcript.map((entry) => ({
              id: uuidv4(),
              type: entry.speaker === 'user' ? 'human' : 'ai',
              content: [{ 
                type: 'text', 
                text: `🎤 ${entry.text}` // Add voice indicator
              }],
            }));
            
            // Add all transcript messages at once
            if (transcriptMessages.length > 0) {
              stream.submit(
                { messages: [...stream.messages, ...transcriptMessages] },
                {
                  streamMode: ["values"],
                  optimisticValues: (prev) => ({
                    ...prev,
                    messages: [...(prev.messages ?? []), ...transcriptMessages],
                  }),
                }
              );
            }
          }}
        />
      )}
    </div>
  );
}
