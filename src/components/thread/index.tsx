import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { motion } from "framer-motion";
import {
  ArrowDown,
  CircleX,
  CloudUpload,
  FileSpreadsheet,
  LoaderCircle,
  PanelRightClose,
  PanelRightOpen,
  SquarePen
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../ui/button";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import { TooltipIconButton } from "./tooltip-icon-button";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Callout, Button as RadixButton, Spinner } from "@radix-ui/themes";
import { toast } from "sonner";
import { BooleanParam, StringParam, useQueryParam } from "use-query-params";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import ThreadHistory from "./history";

const GITHUB_API_URL = "https://api.github.com";
const REPO_OWNER = "datagenie-ai";
const REPO_NAME = "dg-onboarding-ui";
const GITHUB_TOKEN = "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";

interface FileLinkResponse {
  content: {
    download_url: string;
  };
}

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
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function Thread() {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryParam(
    "chatHistoryOpen",
    BooleanParam,
  );
  const [hideToolCalls, setHideToolCalls] = useQueryParam(
    "hideToolCalls",
    BooleanParam,
  );
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  const [file, setFile] = useState<File | null>(null);
  const [fileLink, setFileLink] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
    if (!input.trim() || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      {
        messages: [...toolMessages, newHumanMessage],
        sample_data_location: fileLink ?? "",
      },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
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
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    console.log(event);
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      startUpload(selectedFile);
    } else {
      alert("Please select a CSV file.");
    }

    event.target.value = "";
  };

  const startUpload = async (file: File) => {
    setIsUploading(true);
    const fileContent = await file.text();

    try {
      const response = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `Upload ${file.name}`,
          public: true,
          files: {
            [file.name]: {
              content: fileContent,
            },
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to upload file to GitHub Gist");
      }

      const data = await response.json();
      const fileUrl = data.files[file.name].raw_url; // URL to the raw file
      setFileLink(fileUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileLink(null);
  };

  const chatStarted = !!threadId || !!messages.length;
  const handleClick = () => {
    const fileInput = document.getElementById(
      "file-input",
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.click();
    }
  };
  return (
    <div className="flex w-full h-screen overflow-hidden">
      <div className="relative lg:flex hidden">
        <motion.div
          className="absolute h-full border-r bg-white overflow-hidden z-20"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -300 }
              : { x: chatHistoryOpen ? 0 : -300 }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div className="relative h-full" style={{ width: 300 }}>
            <ThreadHistory />
          </div>
        </motion.div>
      </div>
      <motion.div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden relative",
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
          <div className="absolute top-0 left-0 w-full flex items-center justify-between gap-3 p-2 pl-4 z-10">
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
        )}
        {chatStarted && (
          <div className="flex items-center justify-between gap-3 p-2 pl-4 z-10 relative">
            <div className="flex items-center justify-start gap-2 relative">
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
                className="flex gap-2 items-center cursor-pointer"
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
                  src="src/components/icons/logo192.png"
                  className="h-10 rounded-full"
                />
                <span className="text-xl font-semibold tracking-tight">
                  Guided Onboarding
                </span>
              </motion.button>
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

            <div className="absolute inset-x-0 top-full h-5 bg-gradient-to-b from-background to-background/0" />
          </div>
        )}

        <StickToBottom className="relative flex-1 overflow-hidden">
          <StickyToBottomContent
            className={cn(
              "absolute inset-0 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
              !chatStarted && "flex flex-col items-stretch mt-[5vh]",
              chatStarted && "grid grid-rows-[1fr_auto]",
            )}
            contentClassName="pt-8 pb-16 mx-auto flex flex-col gap-4 w-[80%]"
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
                {isLoading && !firstTokenReceived && (
                  <AssistantMessageLoading />
                )}
              </>
            }
            footer={
              <div className="sticky flex flex-col items-center gap-8 bottom-0 pb-12 pt-4 bg-white">
                {!chatStarted && (
                  <div className="flex gap-3 items-center">
                    <img
                      src="src/components/icons/logo192.png"
                      className="h-10 rounded-full"
                    />
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Guided Onboarding
                    </h1>
                  </div>
                )}

                <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 animate-in fade-in-0 zoom-in-95" />

                <div className="bg-muted rounded-2xl border shadow-xs mx-auto mb-8 w-full max-w-3xl relative z-10">
                  <form
                    onSubmit={handleSubmit}
                    className="grid grid-rows-[1fr_auto] gap-2 max-w-3xl mx-auto"
                  >
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.metaKey) {
                          e.preventDefault();
                          const el = e.target as HTMLElement | undefined;
                          const form = el?.closest("form");
                          form?.requestSubmit();
                        }
                      }}
                      placeholder="Type your message..."
                      className="p-3.5 pb-0 border-none bg-transparent field-sizing-content shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none max-h-[400px]"
                    />
                    {/* #0878e8 */}
                    <div className="flex items-center justify-between p-2 pt-4">
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id="file-input"
                            accept=".csv"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                          />
                          {file ? (
                            <Callout.Root className="relative p-2!">
                              <Callout.Icon>
                                {isUploading ? (
                                  <Spinner />
                                ) : (
                                  <FileSpreadsheet />
                                )}
                              </Callout.Icon>
                              <Callout.Text>
                                {`${file.name.slice(0, 10)}...`}
                              </Callout.Text>
                              <CircleX
                                className="absolute top-0 right-0 h-3 w-3 mt-[-5px] mr-[-5px] fill-[#002bb7c5] text-white"
                                onClick={handleRemoveFile}
                              />
                            </Callout.Root>
                          ) : (
                            <RadixButton className="cursor-pointer" onClick={handleClick}>
                              Upload CSV <CloudUpload className="w-4" />
                            </RadixButton>
                          )}
                        </div>
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
                      {stream.isLoading ? (
                        <Button key="stop" onClick={() => stream.stop()}>
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="transition-all shadow-md"
                          disabled={isLoading || !input.trim() || isUploading}
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
    </div>
  );
}
