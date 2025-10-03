import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolCallDrawer } from "./tool-call-drawer";

type ToolCallStatus = "running" | "success" | "failed";

type ToolCall = NonNullable<AIMessage["tool_calls"]>[number];

interface ToolCallCardProps {
  toolCall: ToolCall;
  toolResult?: ToolMessage;
}

function getToolCallStatus(
  toolCall: ToolCall,
  toolResult?: ToolMessage,
): ToolCallStatus {
  if (!toolResult) {
    return "running";
  }

  // Check if the result indicates an error
  // This is a heuristic - adjust based on your actual error patterns
  const content =
    typeof toolResult.content === "string"
      ? toolResult.content
      : JSON.stringify(toolResult.content);

  if (
    content.toLowerCase().includes("error") ||
    content.toLowerCase().includes("failed")
  ) {
    return "failed";
  }

  return "success";
}

function StatusIndicator({ status }: { status: ToolCallStatus }) {
  switch (status) {
    case "running":
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Running</span>
        </div>
      );
    case "success":
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Success</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Failed</span>
        </div>
      );
  }
}

export function ToolCallCard({ toolCall, toolResult }: ToolCallCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const status = getToolCallStatus(toolCall, toolResult);

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-gray-50",
          status === "running" && "border-blue-200 bg-blue-50/50",
          status === "success" && "border-green-200 bg-green-50/50",
          status === "failed" && "border-red-200 bg-red-50/50",
        )}
      >
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} />
          <span className="text-sm text-gray-700">
            Calling <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm">{toolCall.name}</code>
          </span>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          View details
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ToolCallDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        toolCall={toolCall}
        toolResult={toolResult}
        status={status}
      />
    </>
  );
}

export interface ToolCallWithResult {
  toolCall: ToolCall;
  toolResult?: ToolMessage;
}

export function ToolCallCards({ items }: { items: ToolCallWithResult[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {items.map((item, idx) => (
        <ToolCallCard
          key={item.toolCall.id || idx}
          toolCall={item.toolCall}
          toolResult={item.toolResult}
        />
      ))}
    </div>
  );
}
