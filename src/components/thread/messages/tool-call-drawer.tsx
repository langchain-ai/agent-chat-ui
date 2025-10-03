import { CheckCircle2, XCircle, Loader2, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolCallDetail } from "./tool-call-context";

interface ToolCallDrawerProps {
  open: boolean;
  onClose: () => void;
  toolCallDetail: ToolCallDetail | null;
}

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCallDrawer({
  open,
  onClose,
  toolCallDetail,
}: ToolCallDrawerProps) {
  if (!open || !toolCallDetail) return null;

  const { toolCall, toolResult, status } = toolCallDetail;
  const args = toolCall.args as Record<string, any>;
  const hasArgs = Object.keys(args).length > 0;

  let parsedContent: any;
  let isJsonContent = false;

  if (toolResult) {
    try {
      if (typeof toolResult.content === "string") {
        parsedContent = JSON.parse(toolResult.content);
        isJsonContent = isComplexValue(parsedContent);
      }
    } catch {
      parsedContent = toolResult.content;
    }
  }

  return (
    <div className="relative flex flex-col border-l bg-white">
      <div className="absolute inset-0 flex min-w-[30vw] flex-col">
        <div className="grid grid-cols-[1fr_auto] border-b p-4">
          <div className="flex items-center gap-2">
            {status === "running" && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {status === "failed" && (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <h2 className="text-lg font-semibold text-gray-900 truncate overflow-hidden">
              Tool Call Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
          >
            <XIcon className="size-5" />
          </button>
        </div>
        
        <div className="relative flex-grow overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-gray-600">
            View detailed information about this tool call and its result.
          </p>

          {/* Tool Call Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Tool Call</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {toolCall.name}
                  </h4>
                  {toolCall.id && (
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                      {toolCall.id}
                    </code>
                  )}
                </div>
              </div>
              {hasArgs ? (
                <div className="bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Parameter
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {Object.entries(args).map(([key, value], argIdx) => (
                        <tr key={argIdx}>
                          <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                            {key}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {isComplexValue(value) ? (
                              <pre className="max-h-40 overflow-auto rounded bg-gray-50 p-2 font-mono text-xs">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <span className="break-all">{String(value)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-3">
                  <code className="text-sm text-gray-500">{"{}"}</code>
                </div>
              )}
            </div>
          </div>

          {/* Tool Result Section */}
          {toolResult && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Tool Result
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {toolResult.name || "Result"}
                    </h4>
                    {toolResult.tool_call_id && (
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {toolResult.tool_call_id}
                      </code>
                    )}
                  </div>
                </div>
                <div className="bg-gray-100 p-4">
                  {isJsonContent ? (
                    <div className="overflow-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {(Array.isArray(parsedContent)
                            ? parsedContent
                            : Object.entries(parsedContent)
                          ).map((item, argIdx) => {
                            const [key, value] = Array.isArray(parsedContent)
                              ? [argIdx, item]
                              : [item[0], item[1]];
                            return (
                              <tr key={argIdx}>
                                <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                                  {key}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {isComplexValue(value) ? (
                                    <pre className="max-h-40 overflow-auto rounded bg-gray-50 p-2 font-mono text-xs">
                                      {JSON.stringify(value, null, 2)}
                                    </pre>
                                  ) : (
                                    <span className="break-all">
                                      {String(value)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <pre className="overflow-auto whitespace-pre-wrap font-mono text-sm text-gray-700">
                      {typeof toolResult.content === "string"
                        ? toolResult.content
                        : JSON.stringify(toolResult.content, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  status === "running" &&
                    "bg-blue-100 text-blue-800",
                  status === "success" &&
                    "bg-green-100 text-green-800",
                  status === "failed" &&
                    "bg-red-100 text-red-800",
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
