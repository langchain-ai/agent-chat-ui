import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

import {
  buildResearchTelemetry,
  buildResearchTimeline,
} from "../src/lib/research-telemetry";

const researchHistory = JSON.parse(
  readFileSync(
    new URL("./fixtures/research-history.json", import.meta.url),
    "utf8",
  ),
) as { messages: never[] };

const evidenceId = "E-0123456789";
const evidenceText = `[${evidenceId}] Retrieval guide\nsource: file:///guide.md#char=0,20\nscore: 0.9000\nHybrid retrieval keeps source references.`;

test("replays a historical thread with evidence and retry telemetry", () => {
  const telemetry = buildResearchTelemetry(researchHistory.messages, false);

  expect(telemetry.evidence).toHaveLength(1);
  expect(telemetry.evidence[0].citationId).toBe("E-aabbccddee");
  expect(telemetry.evidence[0].cited).toBe(true);
  expect(telemetry.metrics.retries).toBe(2);
  expect(telemetry.metrics.failures).toBe(1);
  expect(telemetry.metrics.toolDurationMs).toBe(1231.2);
  expect(telemetry.metrics.totalTokens).toBe(182);
  expect(
    telemetry.timeline
      .filter((item) => item.kind === "tool")
      .map((item) => item.status),
  ).toEqual(["completed", "error"]);
});

test("parses telemetry envelope, stable citations, and tool duration", () => {
  const messages = [
    {
      type: "ai",
      id: "ai-1",
      content: `The answer cites [${evidenceId.toUpperCase()}].`,
      tool_calls: [
        { id: "call-1", name: "knowledge_search", args: { query: "RAG" } },
      ],
      usage_metadata: { input_tokens: 12, output_tokens: 8, total_tokens: 20 },
    },
    {
      type: "tool",
      name: "knowledge_search",
      tool_call_id: "call-1",
      content: JSON.stringify({
        schema_version: 1,
        ok: true,
        value: evidenceText,
        telemetry: { attempts: 2, duration_ms: 431.2, error_kind: null },
      }),
    },
  ] as never;

  const telemetry = buildResearchTelemetry(messages, false);

  expect(telemetry.evidence[0].citationId).toBe(evidenceId);
  expect(telemetry.evidence[0].cited).toBe(true);
  expect(telemetry.metrics.retries).toBe(1);
  expect(telemetry.metrics.toolDurationMs).toBe(431.2);
  expect(telemetry.metrics.totalTokens).toBe(20);
});

test("keeps structured failures and pending calls visible", () => {
  const failedMessages = [
    {
      type: "ai",
      id: "ai-2",
      content: "",
      tool_calls: [
        { id: "call-2", name: "knowledge_search", args: { query: "RAG" } },
      ],
    },
    {
      type: "tool",
      name: "knowledge_search",
      tool_call_id: "call-2",
      content: JSON.stringify({
        schema_version: 1,
        ok: false,
        error: { kind: "timeout", message: "timed out", attempts: 2 },
        telemetry: { attempts: 2, duration_ms: 1000, error_kind: "timeout" },
      }),
    },
  ] as never;
  const failed = buildResearchTimeline(failedMessages, false);
  expect(failed[0].status).toBe("error");
  expect(failed[0].errorKind).toBe("timeout");
  expect(failed[0].attempts).toBe(2);

  const pending = buildResearchTimeline(
    [
      {
        type: "ai",
        id: "ai-3",
        content: "",
        tool_calls: [{ id: "call-3", name: "knowledge_search", args: {} }],
      },
    ] as never,
    true,
  );
  expect(pending.find((item) => item.id === "call-3")?.status).toBe("pending");
});

test("bounds long structured error text without losing its classification", () => {
  const longMessage = `upstream unavailable: ${"详情 detail ".repeat(80)}`;
  const timeline = buildResearchTimeline(
    [
      {
        type: "ai",
        id: "ai-long-error",
        content: "",
        tool_calls: [
          { id: "call-long-error", name: "web_search", args: { query: "RAG" } },
        ],
      },
      {
        type: "tool",
        name: "web_search",
        tool_call_id: "call-long-error",
        content: JSON.stringify({
          schema_version: 1,
          ok: false,
          error: { kind: "unavailable", message: longMessage, attempts: 1 },
          telemetry: {
            attempts: 1,
            duration_ms: 800,
            error_kind: "unavailable",
          },
        }),
      },
    ] as never,
    false,
  );

  expect(timeline[0].errorKind).toBe("unavailable");
  expect(timeline[0].detail.length).toBeLessThanOrEqual(96);
  expect(timeline[0].detail.endsWith("...")).toBe(true);
});
