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
import { useMemo, memo, useRef, useEffect } from "react";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import {
  isClarifyingQuestionInterrupt,
  getClarifyingQuestionInterrupt,
} from "@/lib/clarifying-question-interrupt";
import {
  isMiddlewareRecommendationInterrupt,
  getMiddlewareRecommendationInterrupt,
} from "@/lib/middleware-recommendation-interrupt";
import {
  isToolRecommendationInterrupt,
  getToolRecommendationInterrupt,
} from "@/lib/tool-recommendation-interrupt";
import { ThreadView } from "../agent-inbox";
import { GenericInterruptView } from "./generic-interrupt";
import { ClarifyingQuestionView } from "./clarifying-question-view";
import { MiddlewareRecommendationView } from "./middleware-recommendation-view";
import { ToolRecommendationView } from "./tool-recommendation-view";
import { MultiInterruptContainer } from "./multi-interrupt-container";
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
  const shouldRender = isLastMessage || hasNoAIOrToolMessages;

  // DEBUG: Track render count
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // DEBUG: Log every render with key info
  console.log('[Interrupt] render #', renderCountRef.current, {
    hasInterrupt: !!interrupt,
    isLoading: thread.isLoading,
    shouldRender,
    historyLength: thread.history?.length,
  });

  // Cache previous result to prevent unnecessary re-renders
  const prevInterruptsRef = useRef<unknown[]>([]);
  const prevInterruptIdRef = useRef<string | undefined>(undefined);

  // Collect ALL interrupts from ALL tasks in history
  // SDK's thread.interrupt only returns the last task's last interrupt,
  // but parallel subgraph agents create multiple tasks with separate interrupts
  const allInterrupts = useMemo(() => {
    console.log('[Interrupt] useMemo allInterrupts recalculating');

    // Early exit: SDK says no interrupt → return empty (prevents stale UI after resume)
    if (!interrupt) {
      if (prevInterruptsRef.current.length === 0) {
        return prevInterruptsRef.current; // Return same reference if already empty
      }
      prevInterruptsRef.current = [];
      prevInterruptIdRef.current = undefined;
      return prevInterruptsRef.current;
    }

    // Get current interrupt ID for comparison
    const currentInterruptId = (interrupt as { id?: string })?.id;

    // If interrupt is already an array (from __interrupt__), use it directly
    if (Array.isArray(interrupt) && interrupt.length > 0) {
      // Check if content changed by comparing IDs
      const firstId = (interrupt[0] as { id?: string })?.id;
      if (firstId === prevInterruptIdRef.current && prevInterruptsRef.current.length === interrupt.length) {
        return prevInterruptsRef.current; // Return cached reference if same
      }
      prevInterruptsRef.current = interrupt;
      prevInterruptIdRef.current = firstId;
      return interrupt;
    }

    // Try to collect from history (all tasks' interrupts)
    // Use stable reference check: only recalculate if history length changed
    const historyLength = thread.history?.length ?? 0;
    if (historyLength > 0) {
      const lastState = thread.history![historyLength - 1];
      if (lastState?.tasks?.length) {
        const collectedInterrupts = lastState.tasks.flatMap(
          (task) => task.interrupts ?? []
        );
        if (collectedInterrupts.length > 0) {
          // Check if content changed
          const firstId = (collectedInterrupts[0] as { id?: string })?.id;
          if (firstId === prevInterruptIdRef.current && prevInterruptsRef.current.length === collectedInterrupts.length) {
            return prevInterruptsRef.current; // Return cached reference if same
          }
          prevInterruptsRef.current = collectedInterrupts;
          prevInterruptIdRef.current = firstId;
          return collectedInterrupts;
        }
      }
    }

    // Fallback to single interrupt from SDK
    if (currentInterruptId === prevInterruptIdRef.current && prevInterruptsRef.current.length === 1) {
      return prevInterruptsRef.current; // Return cached reference if same
    }
    const result = [interrupt];
    prevInterruptsRef.current = result;
    prevInterruptIdRef.current = currentInterruptId;
    return result;
  }, [thread.history?.length, interrupt]); // Use history length instead of full history reference

  // DEBUG: Log when allInterrupts changes
  useEffect(() => {
    console.log('[Interrupt] allInterrupts changed, length:', allInterrupts.length);
  }, [allInterrupts]);

  // Don't show if: no interrupts, loading, or shouldn't render
  if (allInterrupts.length === 0 || thread.isLoading || !shouldRender) return null;

  // Use collected interrupts
  const interrupts = allInterrupts;

  // Multiple interrupts → use MultiInterruptContainer
  if (interrupts.length > 1) {
    return (
      <MultiInterruptContainer
        interrupts={interrupts}
        isLastMessage={isLastMessage}
        hasNoAIOrToolMessages={hasNoAIOrToolMessages}
      />
    );
  }

  // Single interrupt → render directly
  const singleInterrupt = interrupts[0];

  // Check for ClarifyingQuestion interrupt first
  if (isClarifyingQuestionInterrupt(singleInterrupt)) {
    const clarifyingInterrupt = getClarifyingQuestionInterrupt(singleInterrupt);
    if (clarifyingInterrupt) {
      return <ClarifyingQuestionView interrupt={clarifyingInterrupt} />;
    }
  }

  // Check for MiddlewareRecommendation interrupt
  if (isMiddlewareRecommendationInterrupt(singleInterrupt)) {
    const middlewareInterrupt = getMiddlewareRecommendationInterrupt(singleInterrupt);
    if (middlewareInterrupt) {
      return <MiddlewareRecommendationView interrupt={middlewareInterrupt} />;
    }
  }

  // Check for ToolRecommendation interrupt
  if (isToolRecommendationInterrupt(singleInterrupt)) {
    const toolInterrupt = getToolRecommendationInterrupt(singleInterrupt);
    if (toolInterrupt) {
      return <ToolRecommendationView interrupt={toolInterrupt} />;
    }
  }

  // AgentInbox (generic HITL)
  if (
    isAgentInboxInterruptSchema(singleInterrupt) &&
    !isMiddlewareRecommendationInterrupt(singleInterrupt) &&
    !isToolRecommendationInterrupt(singleInterrupt)
  ) {
    return <ThreadView interrupt={singleInterrupt} />;
  }

  // Generic fallback
  const fallbackValue = (singleInterrupt as { value?: unknown })?.value ?? singleInterrupt;
  return <GenericInterruptView interrupt={fallbackValue as Record<string, unknown>} />;
}

export const AssistantMessage = memo(function AssistantMessage({
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
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";

  return (
    <div className="group mr-auto flex w-full items-start gap-2">
      <div className="flex w-full flex-col gap-2">
        {isToolResult ? (
          <>
            <ToolResult message={message} />
            <Interrupt
              interrupt={threadInterrupt}
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

            {(hasToolCalls && toolCallsHaveContents && (
              <ToolCalls toolCalls={message.tool_calls} />
            )) ||
              (hasAnthropicToolCalls && (
                <ToolCalls toolCalls={anthropicStreamedToolCalls} />
              )) ||
              (hasToolCalls && (
                <ToolCalls toolCalls={message.tool_calls} />
              ))}

            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
            <Interrupt
              interrupt={threadInterrupt}
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
});

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
