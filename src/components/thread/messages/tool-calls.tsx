import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSettings } from "@/providers/Settings";

function isComplexValue(value: unknown): boolean {
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
    <div className={`mx-auto grid ${userSettings.chatWidth === "default" ? "max-w-3xl" : "max-w-5xl"} grid-rows-[1fr_auto] gap-4`}>
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
  toolCall: NonNullable<AIMessage["tool_calls"]>[number];
  isLoading?: boolean;
}) {
  const { userSettings } = useSettings();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (userSettings.autoCollapseToolCalls && isLoading === false) {
      setIsExpanded(false);
    }
  }, [isLoading, userSettings.autoCollapseToolCalls]);

  const args = toolCall.args as Record<string, unknown>;
  const hasArgs = Object.keys(args).length > 0;
  const argEntries = Object.entries(args);
  const shouldShowExpander = argEntries.length > 3;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 dark:border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-border dark:hover:border-border/80">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full border-b border-border/50 dark:border-border bg-muted/30 dark:bg-muted/50 px-5 py-3.5 text-left transition-all duration-200 hover:bg-muted/50 dark:hover:bg-muted/70"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/8 ring-1 ring-foreground/5">
              <svg
                className="h-3.5 w-3.5 text-foreground/70"
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
            <h3 className="font-medium text-foreground text-sm">
              {toolCall.name}
              {toolCall.id && (
                <code className="ml-2 rounded-md bg-muted/70 px-2 py-0.5 text-xs font-mono text-muted-foreground/80 border border-border/30">
                  {toolCall.id.slice(0, 8)}...
                </code>
              )}
            </h3>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {hasArgs ? (
              <div className="bg-card">
                <table className="min-w-full">
                  <tbody className="divide-y divide-border/40">
                    {argEntries.map(([key, value], argIdx) => (
                      <tr
                        key={argIdx}
                        className="transition-colors duration-150 hover:bg-muted/30"
                      >
                        <td className="px-5 py-3 text-xs font-semibold whitespace-nowrap text-foreground/70 bg-muted/20 w-1/4">
                          {key}
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground/85">
                          {isComplexValue(value) ? (
                            <code className="block rounded-lg bg-muted/40 px-3 py-2 font-mono text-xs break-all border border-border/30">
                              {JSON.stringify(value, null, 2)}
                            </code>
                          ) : (
                            <span className="font-normal">{String(value)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-card px-5 py-4">
                <code className="text-xs text-muted-foreground/60 italic">
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
    <div className={`mx-auto grid ${userSettings.chatWidth === "default" ? "max-w-3xl" : "max-w-5xl"} grid-rows-[1fr_auto] gap-4`}>
      <div className="overflow-hidden rounded-xl border border-border/50 dark:border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-border dark:hover:border-border/80">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full border-b border-border/50 dark:border-border bg-muted/30 dark:bg-muted/50 px-5 py-3.5 text-left transition-all duration-200 hover:bg-muted/50 dark:hover:bg-muted/70"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/8 ring-1 ring-foreground/5">
                <svg
                  className="h-3.5 w-3.5 text-foreground/70"
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
                <h3 className="font-medium text-foreground text-sm">
                  Tool Result:{" "}
                  <code className="rounded-md bg-muted/70 px-2 py-0.5 text-xs font-mono text-muted-foreground/80 border border-border/30">
                    {message.name}
                  </code>
                </h3>
              ) : (
                <h3 className="font-medium text-foreground text-sm">
                  Tool Result
                </h3>
              )}
            </div>
            <div className="flex items-center gap-2">
              {message.tool_call_id && (
                <code className="rounded-md bg-muted/70 px-2 py-0.5 text-xs font-mono text-muted-foreground/80 border border-border/30">
                  {message.tool_call_id.slice(0, 8)}...
                </code>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
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
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="p-3">
                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  <motion.div
                    key={isExpanded ? "expanded" : "collapsed"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {isJsonContent ? (
                      <table className="min-w-full">
                        <tbody className="divide-y divide-border/40">
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
                                className="transition-colors duration-150 hover:bg-muted/30"
                              >
                                <td className="px-5 py-3 text-xs font-semibold whitespace-nowrap text-foreground/70 bg-muted/20 w-1/4">
                                  {key}
                                </td>
                                <td className="px-5 py-3 text-sm text-foreground/85">
                                  {isComplexValue(value) ? (
                                    <code className="block rounded-lg bg-muted/40 px-3 py-2 font-mono text-xs break-all border border-border/30">
                                      {JSON.stringify(value, null, 2)}
                                    </code>
                                  ) : (
                                    <span className="font-normal">{String(value)}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <code className="block rounded-lg bg-muted/40 px-3 py-2.5 text-sm font-mono border border-border/30 leading-relaxed">
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
                  className="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-border/40 bg-muted/20 py-2.5 text-xs font-medium text-foreground/70 transition-all duration-150 ease-in-out hover:bg-muted/40"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.002 }}
                  whileTap={{ scale: 0.998 }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
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
