import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact";

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
  isLastAIOrToolMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interruptValue,
  isLastMessage,
  isLastAIOrToolMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  // Get the interrupt ID to use as a stable key for forcing remount
  const interruptId = interruptValue && typeof interruptValue === 'object' && 'id' in interruptValue 
    ? String(interruptValue.id) 
    : undefined;

  // Render interrupt if this is the last AI/tool message OR if there are no AI/tool messages at all
  const shouldRender = isLastAIOrToolMessage || hasNoAIOrToolMessages;

  console.log('[Interrupt Component]', {
    interruptId,
    hasInterruptValue: !!interruptValue,
    isLastMessage,
    isLastAIOrToolMessage,
    hasNoAIOrToolMessages,
    isAgentInbox: isAgentInboxInterruptSchema(interruptValue),
    shouldRender,
    willRender: (isAgentInboxInterruptSchema(interruptValue) && shouldRender) ||
                (interruptValue && !isAgentInboxInterruptSchema(interruptValue) && shouldRender)
  });

  return (
    <>
      {isAgentInboxInterruptSchema(interruptValue) && shouldRender && (
        <ThreadView key={interruptId} interrupt={interruptValue} />
      )}
      {interruptValue && !isAgentInboxInterruptSchema(interruptValue) && shouldRender ? (
        <GenericInterruptView key={interruptId} interrupt={interruptValue} />
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
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  
  // Check if this is the last AI or tool message in the visible messages
  const aiAndToolMessages = thread.messages.filter(
    (m) => m.type === "ai" || m.type === "tool"
  );
  const isLastAIOrToolMessage = 
    aiAndToolMessages.length > 0 && 
    aiAndToolMessages[aiAndToolMessages.length - 1].id === message?.id;
  
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  console.log('[AssistantMessage]', {
    messageId: message?.id,
    messageType: message?.type,
    isLastMessage,
    isLastAIOrToolMessage,
    lastMessageInThread: thread.messages[thread.messages.length - 1]?.id,
    lastMessageType: thread.messages[thread.messages.length - 1]?.type,
    hasNoAIOrToolMessages,
    threadInterruptId: threadInterrupt?.id,
    hasThreadInterrupt: !!threadInterrupt,
    totalMessages: thread.messages.length,
    allUIComponents: thread.values.ui?.map(ui => ({
      id: ui.id,
      name: ui.name,
      message_id: ui.metadata?.message_id
    }))
  });

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
    <div className="group mr-auto flex items-start gap-2">
      <div className="flex flex-col gap-2">
        {isToolResult ? (
          <>
            <ToolResult message={message} />
            <Interrupt
              key={threadInterrupt?.id || 'no-interrupt-tool'}
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              isLastAIOrToolMessage={isLastAIOrToolMessage}
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
            <Interrupt
              key={threadInterrupt?.id || 'no-interrupt-ai'}
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              isLastAIOrToolMessage={isLastAIOrToolMessage}
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
