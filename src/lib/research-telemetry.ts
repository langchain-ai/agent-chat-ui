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
  durationMs?: number;
};

export type EvidenceItem = {
  key: string;
  citationId: string;
  title: string;
  section?: string;
  source: string;
  score?: number;
  excerpt: string;
  cited: boolean;
};

export type ResearchMetrics = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadTokens: number;
  reasoningTokens: number;
  toolCalls: number;
  retries: number;
  failures: number;
  citations: number;
  toolDurationMs: number;
};

export type ResearchTelemetry = {
  timeline: TimelineItem[];
  evidence: EvidenceItem[];
  metrics: ResearchMetrics;
  memoryToolsUsed: string[];
};

type StructuredToolError = {
  schema_version?: number;
  ok?: boolean;
  value?: unknown;
  error?: {
    kind?: string;
    message?: string;
    attempts?: number;
  };
  telemetry?: {
    attempts?: number;
    duration_ms?: number;
    error_kind?: string | null;
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
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function normalizeCitationId(value: string): string {
  return value.toLowerCase().startsWith("e-")
    ? `E-${value.slice(2).toLowerCase()}`
    : value.toUpperCase();
}

export function parseToolError(
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

export function parseToolResult(
  content: Message["content"],
): StructuredToolError | null {
  const text = contentToText(content);
  if (!text.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(text) as StructuredToolError;
    return parsed.schema_version === 1 && typeof parsed.ok === "boolean"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function toolValueToText(content: Message["content"]): string {
  const parsed = parseToolResult(content);
  if (!parsed || parsed.ok !== true) return contentToText(content);
  if (typeof parsed.value === "string") return parsed.value;
  return JSON.stringify(parsed.value ?? "");
}

export function extractEvidence(
  content: Message["content"],
  callId: string,
  citedIds: Set<string>,
): EvidenceItem[] {
  const text = toolValueToText(content);
  const pattern =
    /^\[(E(?:-[0-9a-f]{10}|\d+))] ([^\n|]+?)(?: \| section: ([^\n]+))?\nsource: ([^\n]+)\nscore: ([\d.]+)\n([\s\S]*?)(?=\n\n\[E(?:-[0-9a-f]{10}|\d+)]|$)/gim;
  const evidence: EvidenceItem[] = [];

  for (const match of text.matchAll(pattern)) {
    const [, citationId, title, section, source, score, excerpt] = match;
    evidence.push({
      key: `${callId}-${citationId}`,
      citationId: normalizeCitationId(citationId),
      title: title.trim(),
      section: section?.trim(),
      source: source.trim(),
      score: Number.parseFloat(score),
      excerpt: compact(excerpt, 180),
      cited: citedIds.has(normalizeCitationId(citationId)),
    });
  }

  return evidence;
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
      const structuredResult = result ? parseToolResult(result.content) : null;
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
        attempts:
          structuredResult?.telemetry?.attempts ??
          structuredError?.error?.attempts,
        errorKind:
          structuredResult?.telemetry?.error_kind ??
          structuredError?.error?.kind,
        durationMs: structuredResult?.telemetry?.duration_ms,
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

export function buildResearchTelemetry(
  messages: Message[],
  isLoading: boolean,
): ResearchTelemetry {
  const timeline = buildResearchTimeline(messages, isLoading);
  const citedIds = new Set<string>();
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let cacheReadTokens = 0;
  let reasoningTokens = 0;

  messages.forEach((message) => {
    if (message.type !== "ai") return;
    for (const match of contentToText(message.content).matchAll(
      /\[(E(?:-[0-9a-f]{10}|\d+))]/gi,
    )) {
      citedIds.add(normalizeCitationId(match[1]));
    }
    if (!message.usage_metadata) return;
    inputTokens += message.usage_metadata.input_tokens;
    outputTokens += message.usage_metadata.output_tokens;
    totalTokens += message.usage_metadata.total_tokens;
    cacheReadTokens +=
      message.usage_metadata.input_token_details?.cache_read ?? 0;
    reasoningTokens +=
      message.usage_metadata.output_token_details?.reasoning ?? 0;
  });

  const toolNamesByCallId = new Map<string, string>();
  messages.forEach((message, messageIndex) => {
    if (message.type !== "ai") return;
    message.tool_calls?.forEach((call, callIndex) => {
      toolNamesByCallId.set(
        call.id ?? `${message.id ?? `ai-${messageIndex}`}-tool-${callIndex}`,
        call.name,
      );
    });
  });

  const evidence: EvidenceItem[] = [];
  const memoryToolsUsed = new Set<string>();
  messages.forEach((message) => {
    if (message.type !== "tool") return;
    const toolName =
      message.name ?? toolNamesByCallId.get(message.tool_call_id) ?? "";
    if (toolName === "knowledge_search") {
      evidence.push(
        ...extractEvidence(message.content, message.tool_call_id, citedIds),
      );
    }
    if (toolName.startsWith("memory_")) memoryToolsUsed.add(toolName);
  });

  const toolItems = timeline.filter((item) => item.kind === "tool");
  return {
    timeline,
    evidence,
    metrics: {
      inputTokens,
      outputTokens,
      totalTokens,
      cacheReadTokens,
      reasoningTokens,
      toolCalls: toolItems.length,
      retries: toolItems.reduce(
        (total, item) => total + Math.max((item.attempts ?? 1) - 1, 0),
        0,
      ),
      failures: toolItems.filter((item) => item.status === "error").length,
      citations: citedIds.size,
      toolDurationMs: toolItems.reduce(
        (total, item) => total + (item.durationMs ?? 0),
        0,
      ),
    },
    memoryToolsUsed: [...memoryToolsUsed],
  };
}
