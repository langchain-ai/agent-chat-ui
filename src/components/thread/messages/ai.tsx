import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolExecutionAnimation } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact";

// BrokerState interface to match the provided structure
interface BrokerState {
  messages?: any[];
  image_prompt?: string;
  image_url?: string;
  base64_image?: string;
  video_url?: string;
  prompt?: string;
  interaction_count?: number;
  is_complete?: boolean;
  validation_score?: number;
  features?: Record<string, any>;
}

function BrokerStateMedia({ values }: { values: any }) {
  const brokerState = values as BrokerState;

  if (!brokerState) return null;

  const imageUrl = brokerState.image_url;
  const base64Image = brokerState.base64_image;
  const videoUrl = brokerState.video_url;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* Render image from URL */}
      {imageUrl && (
        <div className="max-w-md">
          <img
            src={imageUrl}
            alt={brokerState.image_prompt || "Generated image"}
            className="w-full rounded-lg border border-gray-200 shadow-sm"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          {brokerState.image_prompt && (
            <p className="mt-1 text-sm text-gray-600 italic">
              {brokerState.image_prompt}
            </p>
          )}
        </div>
      )}

      {/* Render base64 image */}
      {base64Image && !imageUrl && (
        <div className="max-w-md">
          <img
            src={
              base64Image.startsWith("data:")
                ? base64Image
                : `data:image/png;base64,${base64Image}`
            }
            alt={brokerState.image_prompt || "Generated image"}
            className="w-full rounded-lg border border-gray-200 shadow-sm"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          {brokerState.image_prompt && (
            <p className="mt-1 text-sm text-gray-600 italic">
              {brokerState.image_prompt}
            </p>
          )}
        </div>
      )}

      {/* Render video */}
      {videoUrl && (
        <div className="max-w-md">
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg border border-gray-200 shadow-sm"
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.style.display = "none";
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent, artifact }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

interface InterruptProps {
  interruptValue?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interruptValue,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  return (
    <>
      {isAgentInboxInterruptSchema(interruptValue) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ThreadView interrupt={interruptValue} />
        )}
      {interruptValue &&
      !isAgentInboxInterruptSchema(interruptValue) &&
      isLastMessage ? (
        <GenericInterruptView interrupt={interruptValue} />
      ) : null}
    </>
  );
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";

  return (
    <div className="group mr-auto flex items-start gap-2">
      <div className="flex flex-col gap-2">
        {isToolResult ? (
          <>
            <Interrupt
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
          </>
        ) : (
          <>
            {contentString.length > 0 && (
              <div className="py-1">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {/* Show tool execution animation for executing tools */}
            {isLoading &&
              isLastMessage &&
              (hasToolCalls || hasAnthropicToolCalls) && (
                <div className="space-y-2">
                  {hasToolCalls &&
                    message.tool_calls?.map((tc, idx) => (
                      <ToolExecutionAnimation
                        key={`tool-${idx}`}
                        toolName={tc.name}
                      />
                    ))}
                  {hasAnthropicToolCalls &&
                    !hasToolCalls &&
                    anthropicStreamedToolCalls?.map((tc, idx) => (
                      <ToolExecutionAnimation
                        key={`anthropic-${idx}`}
                        toolName={tc.name}
                      />
                    ))}
                </div>
              )}

            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}

            {/* Render BrokerState media content only for the last message */}
            {isLastMessage && <BrokerStateMedia values={thread.values} />}
            <Interrupt
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            <div
              className={cn(
                "mr-auto flex items-center gap-2 transition-opacity",
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={(branch) => thread.setBranch(branch)}
                isLoading={isLoading}
              />
              <CommandBar
                content={contentString}
                isLoading={isLoading}
                isAiMessage={true}
                handleRegenerate={() => handleRegenerate(parentCheckpoint)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
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
