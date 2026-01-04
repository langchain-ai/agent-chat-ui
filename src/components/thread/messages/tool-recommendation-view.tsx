import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Wrench, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStreamContext } from "@/providers/Stream";
import { ToolRecommendation } from "@/lib/tool-recommendation-interrupt";
import { HITLRequest } from "@/components/thread/agent-inbox/types";
import { Interrupt } from "@langchain/langgraph-sdk";
import { toast } from "sonner";

interface ToolRecommendationViewProps {
  interrupt: Interrupt<HITLRequest>;
  onDecision?: (interruptId: string, payload: unknown) => void;
  decided?: unknown;
}

function RecommendationItem({
  recommendation,
}: {
  recommendation: ToolRecommendation;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <Wrench className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-50">
            {recommendation.tool_name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">경로:</span>{" "}
            <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
              {recommendation.tool_path}
            </code>
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <span className="font-medium">사유:</span> {recommendation.reason}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ToolRecommendationView({
  interrupt,
  onDecision,
  decided,
}: ToolRecommendationViewProps) {
  const thread = useStreamContext();
  const [rejectMessage, setRejectMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if in multi-interrupt mode (onDecision provided)
  const isMultiMode = !!onDecision;

  // Extract args from interrupt value
  const hitlValue = interrupt.value;
  const actionRequest = hitlValue?.action_requests?.[0];
  const args = actionRequest?.args as {
    recommendations: ToolRecommendation[];
    summary: string;
  };

  // Get interrupt ID for multi-interrupt resume
  const interruptId = interrupt.id;

  const buildResumeValue = (value: unknown) => {
    return interruptId ? { [interruptId]: value } : value;
  };

  const handleApprove = async () => {
    const resumePayload = { decisions: [{ type: "approve" }] };

    // Multi-interrupt mode: just pass decision to parent
    if (isMultiMode && onDecision && interruptId) {
      onDecision(interruptId, resumePayload);
      toast.success("승인 선택됨", {
        description: "전체 제출 버튼을 눌러 완료하세요.",
        duration: 2000,
      });
      return;
    }

    // Single interrupt mode: submit immediately
    setIsSubmitting(true);
    try {
      thread.submit(
        {},
        {
          command: {
            resume: buildResumeValue(resumePayload),
          },
        }
      );

      toast.success("승인 완료", {
        description: "도구 추천이 승인되었습니다.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error approving recommendation:", error);
      toast.error("승인 실패", {
        description: "승인 중 오류가 발생했습니다.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectMessage.trim()) {
      toast.error("입력 필요", {
        description: "수정 의견을 입력해주세요.",
        duration: 3000,
      });
      return;
    }

    const resumePayload = { decisions: [{ type: "reject", message: rejectMessage.trim() }] };

    // Multi-interrupt mode: just pass decision to parent
    if (isMultiMode && onDecision && interruptId) {
      onDecision(interruptId, resumePayload);
      toast.success("수정요청 선택됨", {
        description: "전체 제출 버튼을 눌러 완료하세요.",
        duration: 2000,
      });
      return;
    }

    // Single interrupt mode: submit immediately
    setIsSubmitting(true);
    try {
      thread.submit(
        {},
        {
          command: {
            resume: buildResumeValue(resumePayload),
          },
        }
      );

      toast.success("수정요청 완료", {
        description: "수정 의견이 전송되었습니다.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error rejecting recommendation:", error);
      toast.error("수정요청 실패", {
        description: "수정요청 중 오류가 발생했습니다.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard against missing args
  if (!args?.recommendations || !args?.summary) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">도구 추천</h3>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3 p-5">
        {args.recommendations.map((recommendation, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <RecommendationItem recommendation={recommendation} />
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {args.summary}
        </p>
      </div>

      {/* Action Section */}
      <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        {decided ? (
          // Show decided state in multi-interrupt mode
          <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-white dark:bg-gray-50 dark:text-gray-900">
            <Check className="h-5 w-5" />
            <span className="font-medium">
              {(decided as { decisions?: { type?: string }[] })?.decisions?.[0]?.type === "approve"
                ? "승인됨"
                : "수정요청됨"}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reject Input */}
            <div className="space-y-2">
              <Textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder="수정 의견을 입력하세요..."
                className="min-h-[80px] resize-none border-gray-300 bg-white focus:border-gray-500 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
                disabled={isSubmitting}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleReject}
                disabled={isSubmitting || !rejectMessage.trim()}
                variant="outline"
                className="min-w-[100px] border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                수정요청
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="min-w-[100px] bg-gray-900 hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                승인
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
