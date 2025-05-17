import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function GenericInterruptView({
  interrupt,
}: {
  interrupt: Record<string, any> | Record<string, any>[];
}) {
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
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Human Interrupt</h3>
        </div>
      </div>
      <motion.div
        className="min-w-full bg-card"
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
              <table className="min-w-full divide-y divide-neutral-200">
                <tbody className="divide-y divide-neutral-200">
                  {displayEntries.map((item, argIdx) => {
                    const [key, value] = Array.isArray(interrupt)
                      ? [argIdx.toString(), item]
                      : (item as [string, any]);
                    return (
                      <tr key={argIdx}>
                        <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {key}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {isComplexValue(value) ? (
                            <code className="rounded bg-neutral-50 dark:bg-neutral-800 px-2 py-1 font-mono text-sm dark:text-neutral-200">
                              {JSON.stringify(value, null, 2)}
                            </code>
                          ) : (
                            String(value)
                          )}
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
            className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-neutral-200 dark:border-neutral-700 py-2 text-neutral-500 transition-all duration-200 ease-in-out hover:bg-neutral-50 hover:text-neutral-600"
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
