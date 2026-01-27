import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact";
import { ReflexionGraph } from "../reflexion-graph";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";

// Expose the local useArtifact hook to the generative UI context
// ensuring the external component finds it when requiring "@local/artifact"
import { experimental_loadShare } from "@langchain/langgraph-sdk/react-ui";
experimental_loadShare("@local/artifact", {
  useArtifact,
});

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
    (ui) =>
      (ui.metadata?.message_id && ui.metadata?.message_id === message.id) ||
      (ui.metadata?.tool_call_id && (message as any).tool_call_id && ui.metadata?.tool_call_id === (message as any).tool_call_id)
  );

  if (!customComponents?.length) return null;

  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => {
        // Local Override for ReflexionGraph
        if (customComponent.name === "ReflexionGraph" || customComponent.name === "ReflexionArtifact") {
          return (
            <ReflexionGraph
              key={customComponent.id}
              html={customComponent.props?.html as any}
              artifactInstance={artifact}
            />
          );
        }

        return null;
      })}
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
  interrupt?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interrupt,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  const thread = useStreamContext();
  const fallbackValue = Array.isArray(interrupt)
    ? (interrupt as Record<string, any>[])
    : (((interrupt as { value?: unknown } | undefined)?.value ??
      interrupt) as Record<string, any>);

  if (interrupt) {
    const lastMsgId = thread.messages?.length ? thread.messages[thread.messages.length - 1]?.id : "none";

    console.log(`[Interrupt] Status: ${isLastMessage ? 'LAST' : 'NOT-LAST'} | threadLast: ${lastMsgId}`, {
      type: isAgentInboxInterruptSchema(interrupt) ? "InBox" : "Generic",
      content: fallbackValue
    });
  }

  return (
    <>
      {isAgentInboxInterruptSchema(interrupt) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ThreadView interrupt={interrupt} />
        )}
      {interrupt &&
        !isAgentInboxInterruptSchema(interrupt) &&
        (isLastMessage || hasNoAIOrToolMessages) ? (
        <GenericInterruptView interrupt={fallbackValue} />
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
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );

  const thread = useStreamContext();
  const threadMessages = thread.messages ?? [];

  // Determine if this is the last VISIBLE message (ignoring filtered tool messages and truly empty AI messages)
  const visibleMessages = threadMessages.filter((m) => {
    // For AI messages, check if they have any content at all
    const hasAnyContent = m.type === "ai" ? (
      (typeof m.content === 'string' && m.content.trim().length > 0) ||
      (Array.isArray(m.content) && m.content.length > 0) ||
      ("tool_calls" in m && Array.isArray(m.tool_calls) && (m.tool_calls as any[]).length > 0)
    ) : true;

    const isVisible = (
      m?.id && !m.id.startsWith(DO_NOT_RENDER_ID_PREFIX) &&
      (m as any).type !== "ui" &&
      m.type !== "tool" &&
      hasAnyContent
    );

    return isVisible;
  });

  const isLastVisibleMessage =
    visibleMessages.length > 0 &&
    visibleMessages[visibleMessages.length - 1]?.id === message?.id;

  const isLastMessage =
    threadMessages.length > 0 &&
    threadMessages[threadMessages.length - 1]?.id === message?.id;

  const hasNoAIOrToolMessages = !threadMessages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  if (message && (isLastMessage || isLastVisibleMessage)) {
    const hasTools = "tool_calls" in message && (message.tool_calls as any[])?.length > 0;
    const contentLen = typeof message.content === "string" ? message.content.length : Array.isArray(message.content) ? message.content.length : 0;

    console.log("[AssistantMessage] Rendering latest visible message:", {
      id: message.id,
      type: message.type,
      isLastRaw: isLastMessage,
      isLastVisible: isLastVisibleMessage,
      hasInterrupt: !!threadInterrupt,
      toolCalls: hasTools ? (message.tool_calls as any[]).length : 0,
      contentLen
    });
  }

  if (threadInterrupt && isLastVisibleMessage && message?.id) {
    console.log("[AssistantMessage] HITL Active on message:", message.id, {
      interrupt: threadInterrupt
    });
  }

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";

  if (isToolResult && hideToolCalls) {
    return null;
  }

  return (
    <div className="group mr-auto flex w-full items-start gap-2">
      <div className="flex w-full flex-col gap-2">
        {isToolResult ? (
          <>
            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastVisibleMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            <ToolResult message={message} />
            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
          </>
        ) : (
          <>
            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastVisibleMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            {contentString.length > 0 && (
              <div className="py-1">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {!hideToolCalls && (
              <>
                {(hasToolCalls && toolCallsHaveContents && (
                  <ToolCalls toolCalls={message.tool_calls} />
                )) ||
                  (hasAnthropicToolCalls && (
                    <ToolCalls toolCalls={anthropicStreamedToolCalls} />
                  )) ||
                  (hasToolCalls && (
                    <ToolCalls toolCalls={message.tool_calls} />
                  ))}
              </>
            )}

            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
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
