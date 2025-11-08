import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSettings } from "@/providers/Settings";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
  isLoading,
}: {
  toolCalls: AIMessage["tool_calls"];
  isLoading?: boolean;
}) {
  const { userSettings } = useSettings();
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className={`mx-auto grid ${userSettings.chatWidth === "default" ? "max-w-3xl" : "max-w-5xl"} grid-rows-[1fr_auto] gap-3`}>
      {toolCalls.map((tc, idx) => {
        return <ToolCallItem key={idx} toolCall={tc} isLoading={isLoading} />;
      })}
    </div>
  );
}

function ToolCallItem({
  toolCall,
  isLoading
}: {
  toolCall: AIMessage["tool_calls"][0];
  isLoading?: boolean;
}) {
  const { userSettings } = useSettings();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (userSettings.autoCollapseToolCalls && isLoading === false) {
      setIsExpanded(false);
    }
  }, [isLoading, userSettings.autoCollapseToolCalls]);

  const args = toolCall.args as Record<string, any>;
  const hasArgs = Object.keys(args).length > 0;
  const argEntries = Object.entries(args);
  const shouldShowExpander = argEntries.length > 3;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full border-b border-border bg-black/5 px-4 py-3 text-left transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 dark:bg-foreground/15">
              <svg
                className="h-3.5 w-3.5 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">
              {toolCall.name}
              {toolCall.id && (
                <code className="ml-2 rounded-md bg-muted px-2 py-1 text-xs font-mono text-muted-foreground shadow-sm">
                  {toolCall.id.slice(0, 8)}...
                </code>
              )}
            </h3>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {hasArgs ? (
              <div className="bg-card">
                <table className="min-w-full">
                  <tbody className="divide-y divide-border">
                    {argEntries.map(([key, value], argIdx) => (
                      <tr
                        key={argIdx}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap text-foreground bg-black/5 dark:bg-white/5">
                          {key}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/80">
                          {isComplexValue(value) ? (
                            <code className="block rounded-md bg-muted px-3 py-2 font-mono text-xs break-all border border-border">
                              {JSON.stringify(value, null, 2)}
                            </code>
                          ) : (
                            <span className="font-medium">{String(value)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-card px-4 py-3">
                <code className="text-sm text-muted-foreground italic">
                  No arguments
                </code>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ToolResult({
  message,
  isLoading
}: {
  message: ToolMessage;
  isLoading?: boolean;
}) {
  const { userSettings } = useSettings();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (userSettings.autoCollapseToolCalls && isLoading === false) {
      setIsExpanded(false);
    }
  }, [isLoading, userSettings.autoCollapseToolCalls]);

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;
  const displayedContent =
    shouldTruncate && !isExpanded
      ? contentStr.length > 500
        ? contentStr.slice(0, 500) + "..."
        : contentLines.slice(0, 4).join("\n") + "\n..."
      : contentStr;

  return (
    <div className={`mx-auto grid ${userSettings.chatWidth === "default" ? "max-w-3xl" : "max-w-5xl"} grid-rows-[1fr_auto] gap-3`}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full border-b border-border bg-black/5 px-4 py-3 text-left transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 dark:bg-foreground/15">
                <svg
                  className="h-3.5 w-3.5 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {message.name ? (
                <h3 className="font-semibold text-foreground">
                  Tool Result:{" "}
                  <code className="rounded-md bg-muted px-2 py-1 text-sm font-mono text-muted-foreground shadow-sm">
                    {message.name}
                  </code>
                </h3>
              ) : (
                <h3 className="font-semibold text-foreground">
                  Tool Result
                </h3>
              )}
            </div>
            <div className="flex items-center gap-2">
              {message.tool_call_id && (
                <code className="rounded-md bg-muted px-2 py-1 text-xs font-mono text-muted-foreground shadow-sm">
                  {message.tool_call_id.slice(0, 8)}...
                </code>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              className="min-w-full bg-card overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
                  >
                    {isJsonContent ? (
                      <table className="min-w-full">
                        <tbody className="divide-y divide-border">
                          {(Array.isArray(parsedContent)
                            ? isExpanded
                              ? parsedContent
                              : parsedContent.slice(0, 5)
                            : Object.entries(parsedContent)
                          ).map((item, argIdx) => {
                            const [key, value] = Array.isArray(parsedContent)
                              ? [argIdx, item]
                              : [item[0], item[1]];
                            return (
                              <tr
                                key={argIdx}
                                className="transition-colors hover:bg-muted/50"
                              >
                                <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap text-foreground bg-black/5 dark:bg-white/5">
                                  {key}
                                </td>
                                <td className="px-4 py-3 text-sm text-foreground/80">
                                  {isComplexValue(value) ? (
                                    <code className="block rounded-md bg-muted px-3 py-2 font-mono text-xs break-all border border-border">
                                      {JSON.stringify(value, null, 2)}
                                    </code>
                                  ) : (
                                    <span className="font-medium">{String(value)}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <code className="block rounded-md bg-muted px-3 py-2 text-sm font-mono border border-border">
                        {displayedContent}
                      </code>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              {((shouldTruncate && !isJsonContent) ||
                (isJsonContent &&
                  Array.isArray(parsedContent) &&
                  parsedContent.length > 5)) && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-border bg-black/5 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-in-out hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Show more</span>
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
