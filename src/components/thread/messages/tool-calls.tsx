import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-3">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                  <svg
                    className="h-3.5 w-3.5 text-white"
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
                <h3 className="font-semibold text-gray-900">
                  {tc.name}
                  {tc.id && (
                    <code className="ml-2 rounded-md bg-white px-2 py-1 text-xs font-mono text-gray-600 shadow-sm">
                      {tc.id.slice(0, 8)}...
                    </code>
                  )}
                </h3>
              </div>
            </div>
            {hasArgs ? (
              <div className="bg-white">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(args).map(([key, value], argIdx) => (
                      <tr
                        key={argIdx}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap text-blue-900 bg-blue-50/50">
                          {key}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {isComplexValue(value) ? (
                            <code className="block rounded-md bg-gray-100 px-3 py-2 font-mono text-xs break-all border border-gray-200">
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
              <div className="bg-white px-4 py-3">
                <code className="text-sm text-gray-500 italic">No arguments</code>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-3">
      <div className="overflow-hidden rounded-xl border border-green-200 bg-gradient-to-b from-green-50 to-white shadow-sm transition-shadow hover:shadow-md">
        <div className="border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                <svg
                  className="h-3.5 w-3.5 text-white"
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
                <h3 className="font-semibold text-gray-900">
                  Tool Result:{" "}
                  <code className="rounded-md bg-white px-2 py-1 text-sm font-mono text-gray-700 shadow-sm">
                    {message.name}
                  </code>
                </h3>
              ) : (
                <h3 className="font-semibold text-gray-900">Tool Result</h3>
              )}
            </div>
            {message.tool_call_id && (
              <code className="rounded-md bg-white px-2 py-1 text-xs font-mono text-gray-600 shadow-sm">
                {message.tool_call_id.slice(0, 8)}...
              </code>
            )}
          </div>
        </div>
        <motion.div
          className="min-w-full bg-white"
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
              >
                {isJsonContent ? (
                  <table className="min-w-full">
                    <tbody className="divide-y divide-gray-100">
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
                            className="transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap text-green-900 bg-green-50/50">
                              {key}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {isComplexValue(value) ? (
                                <code className="block rounded-md bg-gray-100 px-3 py-2 font-mono text-xs break-all border border-gray-200">
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
                  <code className="block rounded-md bg-gray-100 px-3 py-2 text-sm font-mono text-gray-800 border border-gray-200">
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
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-green-200 bg-green-50 py-2 text-sm font-medium text-green-700 transition-all duration-200 ease-in-out hover:bg-green-100"
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
      </div>
    </div>
  );
}
