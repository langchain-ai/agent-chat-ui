import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStreamContext } from "@/providers/Stream";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function GenericInterruptView({ interrupt }: { interrupt: unknown }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentStr = JSON.stringify(interrupt, null, 2);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;

  // Function to truncate long string values
  const truncateValue = (value: any): any => {
    if (typeof value === "string" && value.length > 100) {
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
  const processEntries = (): unknown[] | string => {
    if (Array.isArray(interrupt)) {
      return isExpanded ? interrupt : interrupt.slice(0, 5);
    } else if (typeof interrupt === "object" && interrupt !== null) {
      const entries = Object.entries(interrupt);
      if (!isExpanded && shouldTruncate) {
        // When collapsed, process each value to potentially truncate it
        return entries.map(([key, value]) => [key, truncateValue(value)]);
      }
      return entries;
    } else {
      return interrupt?.toString() ?? "";
    }
  };

  const displayEntries = processEntries();

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden max-w-sm sm:max-w-xl md:max-w-3xl">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-medium text-gray-900">Human Interrupt</h3>
        </div>
      </div>
      <motion.div
        className="min-w-full bg-gray-100"
        initial={false}
        animate={{ height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-3">
          <AnimatePresence mode="wait" initial={false}>
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
                  {Array.isArray(displayEntries) ? (
                    displayEntries.map((item, argIdx) => {
                      const [key, value] = Array.isArray(interrupt)
                        ? [argIdx.toString(), item]
                        : (item as [string, any]);
                      return (
                        <tr key={argIdx}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {key}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {isComplexValue(value) ? (
                              <code className="bg-gray-50 rounded px-2 py-1 font-mono text-sm">
                                {JSON.stringify(value, null, 2)}
                              </code>
                            ) : (
                              String(value)
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {displayEntries}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          </AnimatePresence>
        </div>
        {(shouldTruncate ||
          (Array.isArray(interrupt) && interrupt.length > 5)) && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 flex items-center justify-center border-t-[1px] border-gray-200 text-gray-500 hover:text-gray-600 hover:bg-gray-50 transition-all ease-in-out duration-200 cursor-pointer"
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

const QuestionCircle = () => (
  <div className="flex w-4 h-4 items-center justify-center rounded-full border-[1px] border-gray-300">
    <p className="text-xs text-gray-500">?</p>
  </div>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="text-orange-600 bg-gray-300 rounded px-1">{children}</code>
);

export function ResumeGenericInterrupt() {
  const [resumeValue, setResumeValue] = useState("");
  const stream = useStreamContext();

  const handleResume = (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    stream.submit(null, {
      command: {
        resume: resumeValue,
      },
    });
  };

  return (
    <div className="flex flex-col items-start justify-start gap-2 mt-3 max-w-sm sm:max-w-xl md:max-w-3xl">
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger className="flex items-center justify-center gap-1">
            <p className="text-xs text-gray-500">What&apos;s this</p>
            <QuestionCircle />
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-2 py-3">
            <p>
              This input offers a way to resume your graph from the point of the
              interrupt.
            </p>
            <p>
              The graph will be resumed using the <Code>Command</Code> API, with
              the input you provide passed as a string value to the{" "}
              <Code>resume</Code> key.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <form
        className="flex items-center gap-2 h-16 bg-muted rounded-2xl border w-full"
        onSubmit={handleResume}
      >
        <Input
          placeholder="Resume input"
          value={resumeValue}
          onChange={(e) => setResumeValue(e.target.value)}
          className="bg-inherit border-none shadow-none"
        />
        <Button size="sm" variant="brand" className="mr-3" type="submit">
          Resume
        </Button>
      </form>
    </div>
  );
}
