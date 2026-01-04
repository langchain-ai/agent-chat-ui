import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import {
  isMiddlewareRecommendationInterrupt,
  getMiddlewareRecommendationInterrupt,
} from "@/lib/middleware-recommendation-interrupt";
import {
  isToolRecommendationInterrupt,
  getToolRecommendationInterrupt,
} from "@/lib/tool-recommendation-interrupt";
import {
  isClarifyingQuestionInterrupt,
  getClarifyingQuestionInterrupt,
} from "@/lib/clarifying-question-interrupt";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { MiddlewareRecommendationView } from "./middleware-recommendation-view";
import { ToolRecommendationView } from "./tool-recommendation-view";
import { ClarifyingQuestionView } from "./clarifying-question-view";
import { ThreadView } from "../agent-inbox";
import { GenericInterruptView } from "./generic-interrupt";

interface MultiInterruptContainerProps {
  interrupts: unknown[];
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

export function MultiInterruptContainer({
  interrupts,
  isLastMessage,
  hasNoAIOrToolMessages,
}: MultiInterruptContainerProps) {
  const thread = useStreamContext();
  const [decisions, setDecisions] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shouldRender = isLastMessage || hasNoAIOrToolMessages;
  if (!shouldRender) return null;

  const handleDecision = (interruptId: string, payload: unknown) => {
    setDecisions((prev) => ({ ...prev, [interruptId]: payload }));
  };

  const handleSubmitAll = async () => {
    if (Object.keys(decisions).length !== interrupts.length) {
      toast.error("모든 항목에 대해 결정해주세요", {
        description: `${Object.keys(decisions).length}/${interrupts.length}개 결정됨`,
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      thread.submit(
        {},
        {
          command: { resume: decisions },
        }
      );
      toast.success("제출 완료", {
        description: "모든 결정이 제출되었습니다.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error submitting all decisions:", error);
      toast.error("제출 실패", {
        description: "결정 제출 중 오류가 발생했습니다.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allDecided = Object.keys(decisions).length === interrupts.length;

  const renderInterrupt = (interrupt: unknown, index: number) => {
    const interruptId = (interrupt as { id?: string })?.id;
    const decided = interruptId ? decisions[interruptId] : undefined;

    // MiddlewareRecommendation
    if (isMiddlewareRecommendationInterrupt(interrupt)) {
      const middlewareInterrupt = getMiddlewareRecommendationInterrupt(interrupt);
      if (middlewareInterrupt) {
        return (
          <MiddlewareRecommendationView
            key={interruptId || index}
            interrupt={middlewareInterrupt}
            onDecision={handleDecision}
            decided={decided}
          />
        );
      }
    }

    // ToolRecommendation
    if (isToolRecommendationInterrupt(interrupt)) {
      const toolInterrupt = getToolRecommendationInterrupt(interrupt);
      if (toolInterrupt) {
        return (
          <ToolRecommendationView
            key={interruptId || index}
            interrupt={toolInterrupt}
            onDecision={handleDecision}
            decided={decided}
          />
        );
      }
    }

    // ClarifyingQuestion
    if (isClarifyingQuestionInterrupt(interrupt)) {
      const clarifyingInterrupt = getClarifyingQuestionInterrupt(interrupt);
      if (clarifyingInterrupt) {
        return (
          <ClarifyingQuestionView
            key={interruptId || index}
            interrupt={clarifyingInterrupt}
            onDecision={handleDecision}
            decided={decided}
          />
        );
      }
    }

    // AgentInbox (generic HITL)
    if (
      isAgentInboxInterruptSchema(interrupt) &&
      !isMiddlewareRecommendationInterrupt(interrupt) &&
      !isToolRecommendationInterrupt(interrupt)
    ) {
      return <ThreadView key={interruptId || index} interrupt={interrupt} />;
    }

    // Generic fallback
    const fallbackValue = (interrupt as { value?: unknown })?.value ?? interrupt;
    return (
      <GenericInterruptView
        key={interruptId || index}
        interrupt={fallbackValue as Record<string, unknown>}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {interrupts.length}개의 확인이 필요합니다
        </p>
      </div>

      {/* Interrupt Views */}
      {interrupts.map((interrupt, index) => renderInterrupt(interrupt, index))}

      {/* Submit All Button */}
      <Button
        onClick={handleSubmitAll}
        disabled={!allDecided || isSubmitting}
        className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            제출 중...
          </>
        ) : (
          `전체 제출 (${Object.keys(decisions).length}/${interrupts.length})`
        )}
      </Button>
    </div>
  );
}
