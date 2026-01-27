import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useStreamContext } from "@/providers/Stream";
import { Button } from "@/components/ui/button";

import { isComplexValue, isUrl } from "./generic-interrupt-utils";

function renderInterruptStateItem(value: any): React.ReactNode {
  try {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (isComplexValue(value)) {
      return (
        <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm">
          {JSON.stringify(value, null, 2)}
        </code>
      );
    }

    if (isUrl(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-blue-600 underline hover:text-blue-800"
        >
          {value}
        </a>
      );
    }

    return String(value);
  } catch (error) {
    console.error("Error rendering interrupt item:", error, value);
    return <span className="text-red-500 text-xs">Error</span>;
  }
}


export function GenericInterruptView({
  interrupt,
}: {
  interrupt: Record<string, any> | Record<string, any>[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stream = useStreamContext();
  const [isResuming, setIsResuming] = useState(false);

  console.log("[GenericInterruptView] Rendering interrupt:", interrupt);

  const handleResume = async (decision: "approve" | "reject") => {
    try {
      setIsResuming(true);
      console.log(`[GenericInterruptView] User clicked ${decision.toUpperCase()}`);

      // In the LangGraph SDK, you resume a run by sending a command with the resume value.
      const payload = { action: decision };
      console.log("[GenericInterruptView] Submitting Resume Payload:", payload);

      await stream.submit({} as any, {
        command: {
          resume: payload
        }
      });
      console.log("[GenericInterruptView] Resume submitted successfully");
    } catch (error) {
      console.error("[GenericInterruptView] Error resuming graph:", error);
    } finally {
      setIsResuming(false);
    }
  };

  const contentStr = JSON.stringify(interrupt, null, 2);

  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;

  // Function to truncate long string values (but preserve URLs)
  const truncateValue = (value: any): any => {
    if (typeof value === "string" && value.length > 100) {
      // Don't truncate URLs so they remain clickable
      if (isUrl(value)) {
        return value;
      }
      return value.substring(0, 100) + "...";
    }

    if (Array.isArray(value) && !isExpanded) {
      return value.slice(0, 2).map(truncateValue);
    }

    if (isComplexValue(value) && !isExpanded) {
      const strValue = JSON.stringify(value, null, 2);
      if (strValue.length > 100) {
        // Return plain text for truncated content instead of a JSON object
        return `Truncated ${strValue.length} characters...`;
      }
    }

    return value;
  };

  // Process entries based on expanded state
  const processEntries = () => {
    if (Array.isArray(interrupt)) {
      return isExpanded ? interrupt : interrupt.slice(0, 5);
    } else {
      const entries = Object.entries(interrupt);
      if (!isExpanded && shouldTruncate) {
        // When collapsed, process each value to potentially truncate it
        return entries.map(([key, value]) => [key, truncateValue(value)]);
      }
      return entries;
    }
  };

  const displayEntries = processEntries();

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-gray-900">Human Interrupt</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              onClick={() => handleResume("approve")}
              disabled={isResuming}
            >
              <Check className="mr-1 h-3 w-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
              onClick={() => handleResume("reject")}
              disabled={isResuming}
            >
              <X className="mr-1 h-3 w-3" />
              Reject
            </Button>
          </div>
        </div>
      </div>
      <motion.div
        className="min-w-full bg-gray-100"
        initial={false}
        animate={{ height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-3">
          <AnimatePresence
            mode="wait"
            initial={false}
          >
            <motion.div
              key={isExpanded ? "expanded" : "collapsed"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              style={{
                maxHeight: isExpanded ? "none" : "500px",
                overflow: "auto",
              }}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {displayEntries.map((item, argIdx) => {
                    const [key, value] = Array.isArray(interrupt)
                      ? [argIdx.toString(), item]
                      : (item as [string, any]);
                    return (
                      <tr key={argIdx}>
                        <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {renderInterruptStateItem(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          </AnimatePresence>
        </div>
        {(shouldTruncate ||
          (Array.isArray(interrupt) && interrupt.length > 5)) && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 py-2 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-600"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </motion.button>
          )}
      </motion.div>
    </div>
  );
}
