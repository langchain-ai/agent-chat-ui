import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStreamContext } from "@/providers/Stream";
import { ClarifyingQuestionInterrupt } from "@/lib/clarifying-question-interrupt";
import { Interrupt } from "@langchain/langgraph-sdk";
import { toast } from "sonner";

interface ClarifyingQuestionViewProps {
  interrupt: Interrupt<ClarifyingQuestionInterrupt>;
  onDecision?: (interruptId: string, payload: unknown) => void;
  decided?: unknown;
}

type OptionValue = "1" | "2" | "3" | "4";

export function ClarifyingQuestionView({
  interrupt,
  onDecision,
  decided,
}: ClarifyingQuestionViewProps) {
  const thread = useStreamContext();
  const [selectedOption, setSelectedOption] = useState<OptionValue | null>(
    null
  );
  const [customText, setCustomText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if in multi-interrupt mode (onDecision provided)
  const isMultiMode = !!onDecision;

  // Extract the interrupt value (question data)
  const interruptValue = interrupt.value;

  // Get interrupt ID for multi-interrupt resume
  const interruptId = interrupt.id;

  const buildResumeValue = (value: unknown) => {
    return interruptId ? { [interruptId]: value } : value;
  };

  // Guard against missing interrupt value
  if (!interruptValue) {
    return null;
  }

  const options: { value: OptionValue; label: string }[] = [
    { value: "1", label: interruptValue.option_1 },
    { value: "2", label: interruptValue.option_2 },
    { value: "3", label: interruptValue.option_3 },
    { value: "4", label: interruptValue.option_4 },
  ];

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast.error("선택 필요", {
        description: "옵션을 선택해주세요.",
        duration: 3000,
      });
      return;
    }

    if (selectedOption === "4" && !customText.trim()) {
      toast.error("입력 필요", {
        description: "직접 입력 내용을 작성해주세요.",
        duration: 3000,
      });
      return;
    }

    // Build the response value based on selection
    let resumeValue: string;
    if (selectedOption === "4") {
      // For option 4, send "4: customText" format
      resumeValue = `4: ${customText.trim()}`;
    } else {
      // For options 1-3, send just the number
      resumeValue = selectedOption;
    }

    // Multi-interrupt mode: just pass decision to parent
    if (isMultiMode && onDecision && interruptId) {
      onDecision(interruptId, resumeValue);
      toast.success("응답 선택됨", {
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
            resume: buildResumeValue(resumeValue),
          },
        }
      );

      toast.success("제출 완료", {
        description: "응답이 성공적으로 전송되었습니다.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("제출 실패", {
        description: "응답 전송 중 오류가 발생했습니다.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Question Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-lg font-medium leading-relaxed text-gray-900">
          {interruptValue.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2 p-5">
        {options.map((option) => (
          <motion.label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
              selectedOption === option.value
                ? "border-gray-900 bg-gray-100 ring-1 ring-gray-900"
                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              type="radio"
              name="clarifying-option"
              value={option.value}
              checked={selectedOption === option.value}
              onChange={() => setSelectedOption(option.value)}
              className="mt-0.5 h-4 w-4 cursor-pointer border-gray-300 text-gray-900 focus:ring-gray-500 accent-gray-900"
            />
            <span
              className={`flex-1 text-sm ${
                selectedOption === option.value
                  ? "font-medium text-gray-900"
                  : "text-gray-700"
              }`}
            >
              {option.label}
            </span>
          </motion.label>
        ))}

        {/* Custom Text Input (shown when option 4 is selected) */}
        <AnimatePresence>
          {selectedOption === "4" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 pl-7">
                <Label
                  htmlFor="custom-input"
                  className="text-sm font-medium text-gray-700"
                >
                  직접 입력
                </Label>
                <Textarea
                  id="custom-input"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="원하는 내용을 자유롭게 작성해주세요..."
                  className="min-h-[100px] resize-none border-gray-300 bg-white focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-5 py-4">
        {decided ? (
          // Show decided state in multi-interrupt mode
          <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-white">
            <Check className="h-5 w-5" />
            <span className="font-medium">응답 완료됨</span>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedOption ||
              (selectedOption === "4" && !customText.trim())
            }
            className="min-w-[120px] bg-gray-900 hover:bg-gray-800"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                제출 중...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                제출하기
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
