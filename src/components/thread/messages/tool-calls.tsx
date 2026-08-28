import { AIMessage, Message, ToolMessage } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  FileCode2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { useArtifact } from "../artifact";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function inferMimeType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return "text/markdown";
  }
  return "text/plain";
}

type PreviewableArtifact = {
  path: string;
  content: string;
  mimeType: string;
};

function getArtifactPath(args: Record<string, unknown> | undefined): string {
  const candidates = [args?.file_path, args?.path, args?.filename, args?.name];
  const value = candidates.find((v) => typeof v === "string" && v.length > 0);
  return typeof value === "string" ? value : "";
}

export function findPreviewableArtifact(
  toolMessage: ToolMessage,
  messages: Message[],
): PreviewableArtifact | null {
  if (!toolMessage.tool_call_id) return null;

  for (const message of messages) {
    if (message.type !== "ai" || !("tool_calls" in message)) continue;
    const toolCalls = (message as AIMessage).tool_calls ?? [];
    const call = toolCalls.find((tc) => tc.id === toolMessage.tool_call_id);
    if (!call) continue;

    const args = call.args as Record<string, unknown> | undefined;
    const filePath = getArtifactPath(args);
    const content = args?.content;
    const mimeType = inferMimeType(filePath);
    const isPreviewable = [
      "text/html",
      "image/svg+xml",
      "text/markdown",
    ].includes(mimeType);
    if (!filePath || typeof content !== "string" || !isPreviewable) {
      return null;
    }

    return { path: filePath, content, mimeType };
  }

  return null;
}

function ArtifactPreviewCard({ artifact }: { artifact: PreviewableArtifact }) {
  const [ArtifactContent, artifactControls] = useArtifact();
  const { setOpen } = artifactControls;

  useEffect(() => {
    setOpen(true);
  }, [artifact.path, setOpen]);

  const copyAccess = async () => {
    const lines = [
      `Artifact path: ${artifact.path}`,
      `MIME type: ${artifact.mimeType}`,
      "UI: click Preview to open the rendered artifact panel, or Open tab to view it in a new browser tab.",
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Artifact access instructions copied");
  };

  const openBlob = () => {
    const blob = new Blob([artifact.content], { type: artifact.mimeType });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="rounded-lg bg-slate-900 p-2 text-white">
          <FileCode2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-950">Previewable artifact</div>
          <div className="truncate font-mono text-xs text-slate-500">
            {artifact.path}
          </div>
          <div className="mt-1 truncate font-mono text-xs text-slate-500">
            {artifact.mimeType}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <Button
          type="button"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Eye className="size-4" />
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={openBlob}
        >
          <ExternalLink className="size-4" />
          Open tab
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copyAccess}
        >
          <Copy className="size-4" />
          Copy access
        </Button>
      </div>
      <ArtifactContent
        title={
          <div className="min-w-0">
            <div className="truncate font-medium">{artifact.path}</div>
            <div className="truncate font-mono text-xs text-slate-500">
              {artifact.mimeType}
            </div>
          </div>
        }
      >
        <iframe
          title={artifact.path}
          srcDoc={artifact.content}
          sandbox="allow-scripts allow-forms allow-popups allow-downloads"
          className="h-full w-full border-0 bg-white"
        />
      </ArtifactContent>
    </div>
  );
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <h3 className="font-medium text-gray-900">
                {tc.name}
                {tc.id && (
                  <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                    {tc.id}
                  </code>
                )}
              </h3>
            </div>
            {hasArgs ? (
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(args).map(([key, value], argIdx) => (
                    <tr key={argIdx}>
                      <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                        {key}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {isComplexValue(value) ? (
                          <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                            {JSON.stringify(value, null, 2)}
                          </code>
                        ) : (
                          String(value)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <code className="block p-3 text-sm">{"{}"}</code>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stream = useStreamContext();
  const writtenArtifact = findPreviewableArtifact(message, stream.messages);

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
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {message.name ? (
              <h3 className="font-medium text-gray-900">
                Tool Result:{" "}
                <code className="rounded bg-gray-100 px-2 py-1">
                  {message.name}
                </code>
              </h3>
            ) : (
              <h3 className="font-medium text-gray-900">Tool Result</h3>
            )}
            {message.tool_call_id && (
              <code className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
                {message.tool_call_id}
              </code>
            )}
          </div>
        </div>
        <motion.div
          className="min-w-full bg-gray-100"
          initial={false}
          animate={{ height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3">
            {writtenArtifact && (
              <ArtifactPreviewCard artifact={writtenArtifact} />
            )}
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
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
                          <tr key={argIdx}>
                            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {isComplexValue(value) ? (
                                <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
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
                ) : (
                  <code className="block text-sm">{displayedContent}</code>
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
    </div>
  );
}
