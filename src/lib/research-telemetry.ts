import type { Message } from "@langchain/langgraph-sdk";

export type TimelineStatus = "pending" | "completed" | "error";

export type TimelineItem = {
  id: string;
  kind: "request" | "response" | "tool";
  label: string;
  detail: string;
  status: TimelineStatus;
  attempts?: number;
  errorKind?: string;
};

type StructuredToolError = {
  ok?: boolean;
  error?: {
    kind?: string;
    message?: string;
    attempts?: number;
  };
};

function contentToText(content: Message["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter(
      (block): block is { type: "text"; text: string } => block.type === "text",
    )
    .map((block) => block.text)
    .join(" ")
    .trim();
}

function compact(text: string, maxLength = 96): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function parseToolError(
  content: Message["content"],
): StructuredToolError | null {
  const text = contentToText(content);
  if (!text.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(text) as StructuredToolError;
    return parsed.ok === false && parsed.error ? parsed : null;
  } catch {
    return null;
  }
}

export function buildResearchTimeline(
  messages: Message[],
  isLoading: boolean,
): TimelineItem[] {
  const resultsByCallId = new Map(
    messages
      .filter((message) => message.type === "tool")
      .map((message) => [message.tool_call_id, message]),
  );
  const timeline: TimelineItem[] = [];

  messages.forEach((message, messageIndex) => {
    const fallbackId = `${message.type}-${messageIndex}`;
    const id = message.id ?? fallbackId;
    const text = contentToText(message.content);

    if (message.type === "human") {
      timeline.push({
        id,
        kind: "request",
        label: "Research request",
        detail: compact(text) || "Multimodal request",
        status: "completed",
      });
      return;
    }

    if (message.type !== "ai") return;

    if (text) {
      timeline.push({
        id: `${id}-response`,
        kind: "response",
        label: "Agent response",
        detail: compact(text),
        status: "completed",
      });
    }

    message.tool_calls?.forEach((call, callIndex) => {
      const callId = call.id ?? `${id}-tool-${callIndex}`;
      const result = resultsByCallId.get(callId);
      const structuredError = result ? parseToolError(result.content) : null;
      const failed = result?.status === "error" || structuredError !== null;
      const query =
        typeof call.args?.query === "string"
          ? call.args.query
          : JSON.stringify(call.args ?? {});

      timeline.push({
        id: callId,
        kind: "tool",
        label: call.name || "Unnamed tool",
        detail: failed
          ? compact(structuredError?.error?.message ?? "Tool execution failed")
          : compact(query) || "No arguments",
        status: result ? (failed ? "error" : "completed") : "pending",
        attempts: structuredError?.error?.attempts,
        errorKind: structuredError?.error?.kind,
      });
    });
  });

  if (isLoading && timeline.every((item) => item.status !== "pending")) {
    timeline.push({
      id: "active-run",
      kind: "response",
      label: "Agent working",
      detail: "Waiting for the next streamed event",
      status: "pending",
    });
  }

  return timeline;
}
