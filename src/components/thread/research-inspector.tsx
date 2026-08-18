"use client";

import type { Message } from "@langchain/langgraph-sdk";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Check,
  CircleDashed,
  Clock3,
  Database,
  Gauge,
  Link2,
  Search,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  buildResearchTelemetry,
  type EvidenceItem,
  type ResearchMetrics,
  type TimelineItem,
} from "@/lib/research-telemetry";
import { cn } from "@/lib/utils";

type ResearchInspectorProps = {
  messages: Message[];
  isLoading: boolean;
  activeSkill: string | null;
  memoryEnabled: boolean;
  runDurationMs: number | null;
  firstTokenLatencyMs: number | null;
  desktopOpen: boolean;
  mobileOpen: boolean;
  onDesktopOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean) => void;
};

type InspectorTab = "trace" | "evidence" | "runtime";

const statusStyle = {
  completed: "bg-emerald-600 text-white",
  pending: "bg-amber-400 text-stone-950",
  error: "bg-rose-600 text-white",
} as const;

function StatusIcon({ item }: { item: TimelineItem }) {
  if (item.status === "error") return <AlertTriangle className="size-3.5" />;
  if (item.status === "pending") {
    return <CircleDashed className="size-3.5 animate-spin" />;
  }
  if (item.kind === "request") return <UserRound className="size-3.5" />;
  if (item.kind === "tool") return <Search className="size-3.5" />;
  return <Check className="size-3.5" />;
}

function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return (
      <div className="flex min-h-44 flex-col items-center justify-center gap-3 border-y border-dashed border-stone-300 px-6 text-center">
        <Bot className="size-5 text-stone-400" />
        <p className="text-sm leading-5 text-stone-500">
          Run events will appear when research starts.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="relative grid grid-cols-[28px_1fr] gap-3 pb-5 last:pb-0"
        >
          {index < items.length - 1 && (
            <span className="absolute top-7 bottom-0 left-[13px] w-px bg-stone-200" />
          )}
          <span
            className={cn(
              "relative z-10 flex size-7 items-center justify-center rounded-full",
              statusStyle[item.status],
            )}
          >
            <StatusIcon item={item} />
          </span>
          <div className="min-w-0 pt-0.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-stone-800">
                {item.label}
              </p>
              {item.status === "pending" && (
                <span className="text-[11px] font-medium text-amber-700">
                  RUNNING
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-5 break-words text-stone-500">
              {item.detail}
            </p>
            {(item.attempts ?? 0) > 1 && (
              <p className="mt-1.5 text-[11px] font-medium text-rose-700">
                {item.errorKind ?? "error"} · {item.attempts} attempts
              </p>
            )}
            {item.durationMs !== undefined && (
              <p className="mt-1.5 font-mono text-[11px] text-stone-500 tabular-nums">
                {formatDuration(item.durationMs)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({
  icon: Icon,
  children,
}: {
  icon: typeof Database;
  children: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 border-y border-dashed border-stone-300 px-6 text-center">
      <Icon className="size-5 text-stone-400" />
      <p className="text-sm leading-5 text-stone-500">{children}</p>
    </div>
  );
}

function EvidenceList({ evidence }: { evidence: EvidenceItem[] }) {
  if (!evidence.length) {
    return (
      <EmptyState icon={Database}>
        Retrieved evidence and citation coverage will appear here.
      </EmptyState>
    );
  }

  return (
    <ol className="divide-y divide-stone-200 border-y border-stone-200">
      {evidence.map((item) => (
        <li
          key={item.key}
          className="bg-white px-3 py-4"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex h-6 min-w-9 items-center justify-center rounded px-1.5 font-mono text-[11px] font-semibold",
                item.cited
                  ? "bg-emerald-700 text-white"
                  : "bg-stone-200 text-stone-600",
              )}
            >
              {item.citationId}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-5 font-semibold text-stone-800">
                  {item.title}
                </p>
                {item.score !== undefined && (
                  <span className="shrink-0 font-mono text-[11px] text-stone-500">
                    {item.score.toFixed(3)}
                  </span>
                )}
              </div>
              {item.section && (
                <p className="mt-0.5 text-[11px] font-medium text-emerald-700">
                  {item.section}
                </p>
              )}
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {item.excerpt}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                <Link2 className="size-3 shrink-0" />
                <span className="truncate font-mono">{item.source}</span>
              </div>
              <p
                className={cn(
                  "mt-2 text-[11px] font-semibold uppercase",
                  item.cited ? "text-emerald-700" : "text-amber-700",
                )}
              >
                {item.cited ? "Used in answer" : "Retrieved, not cited"}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "—";
  if (durationMs < 1000) return `${Math.round(durationMs)} ms`;
  return `${(durationMs / 1000).toFixed(1)} s`;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-stone-200 py-3 last:border-0">
      <p className="text-[11px] text-stone-500">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold text-stone-800 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function RuntimeView({
  metrics,
  activeSkill,
  memoryEnabled,
  memoryToolsUsed,
  runDurationMs,
  firstTokenLatencyMs,
}: {
  metrics: ResearchMetrics;
  activeSkill: string | null;
  memoryEnabled: boolean;
  memoryToolsUsed: string[];
  runDurationMs: number | null;
  firstTokenLatencyMs: number | null;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-xs font-semibold text-stone-500 uppercase">
          Agent profile
        </h3>
        <div className="divide-y divide-stone-200 border-y border-stone-200 bg-white">
          <div className="flex items-center gap-3 px-3 py-3">
            <BrainCircuit className="size-4 text-emerald-700" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-stone-500">Active Skill</p>
              <p className="truncate text-sm font-semibold">
                {activeSkill ?? "Not configured"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-3">
            <Database className="size-4 text-sky-700" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-stone-500">Long-term memory</p>
              <p className="truncate text-sm font-semibold">
                {memoryEnabled ? "Enabled" : "Disabled"}
                {memoryToolsUsed.length > 0 &&
                  ` · ${memoryToolsUsed.length} tool${memoryToolsUsed.length > 1 ? "s" : ""} used`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase">
          <Gauge className="size-3.5" /> Performance
        </h3>
        <div className="grid grid-cols-2 gap-x-4 border-y border-stone-200 bg-white px-3">
          <Metric
            label="Total latency"
            value={formatDuration(runDurationMs)}
          />
          <Metric
            label="First token"
            value={formatDuration(firstTokenLatencyMs)}
          />
          <Metric
            label="Input tokens"
            value={metrics.inputTokens}
          />
          <Metric
            label="Output tokens"
            value={metrics.outputTokens}
          />
          <Metric
            label="Total tokens"
            value={metrics.totalTokens}
          />
          <Metric
            label="Cache read"
            value={metrics.cacheReadTokens}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase">
          <Wrench className="size-3.5" /> Tools
        </h3>
        <div className="grid grid-cols-3 border-y border-stone-200 bg-white px-3">
          <Metric
            label="Calls"
            value={metrics.toolCalls}
          />
          <Metric
            label="Retries"
            value={metrics.retries}
          />
          <Metric
            label="Tool execution"
            value={formatDuration(metrics.toolDurationMs)}
          />
          <Metric
            label="Failures"
            value={metrics.failures}
          />
        </div>
      </section>
    </div>
  );
}

function InspectorContent({
  messages,
  isLoading,
  activeSkill,
  memoryEnabled,
  runDurationMs,
  firstTokenLatencyMs,
  onClose,
}: Pick<
  ResearchInspectorProps,
  | "messages"
  | "isLoading"
  | "activeSkill"
  | "memoryEnabled"
  | "runDurationMs"
  | "firstTokenLatencyMs"
> & {
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("trace");
  const telemetry = buildResearchTelemetry(messages, isLoading);
  const timeline = telemetry.timeline;
  const completed = timeline.filter(
    (item) => item.status === "completed",
  ).length;
  const failures = timeline.filter((item) => item.status === "error").length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f7f7f4] text-stone-900">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 px-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">
            Live trace
          </p>
          <h2 className="truncate text-sm font-semibold">Research run</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close research inspector"
          className="size-8"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid h-10 shrink-0 grid-cols-3 border-b border-stone-200 bg-white px-2">
        {(
          [
            ["trace", Clock3, "Trace"],
            ["evidence", Database, "Evidence"],
            ["runtime", Gauge, "Runtime"],
          ] as const
        ).map(([tab, Icon, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 transition-colors",
              activeTab === tab && "text-stone-900",
            )}
          >
            <Icon className="size-3.5" />
            {label}
            {activeTab === tab && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 bg-emerald-700" />
            )}
          </button>
        ))}
      </div>

      <div className="grid shrink-0 grid-cols-3 border-b border-stone-200 bg-white">
        <div className="border-r border-stone-200 px-3 py-3">
          <p className="text-lg font-semibold tabular-nums">
            {timeline.length}
          </p>
          <p className="text-[11px] text-stone-500">Events</p>
        </div>
        <div className="border-r border-stone-200 px-3 py-3">
          <p className="text-lg font-semibold text-emerald-700 tabular-nums">
            {completed}
          </p>
          <p className="text-[11px] text-stone-500">Complete</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-lg font-semibold text-rose-700 tabular-nums">
            {failures}
          </p>
          <p className="text-[11px] text-stone-500">Failed</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {activeTab === "trace" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-500 uppercase">
                Execution timeline
              </h3>
              <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isLoading ? "animate-pulse bg-amber-500" : "bg-emerald-600",
                  )}
                />
                {isLoading ? "Streaming" : "Synced"}
              </span>
            </div>
            <Timeline items={timeline} />
          </>
        )}
        {activeTab === "evidence" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-500 uppercase">
                Source ledger
              </h3>
              <span className="text-[11px] text-stone-500">
                {telemetry.metrics.citations} cited
              </span>
            </div>
            <EvidenceList evidence={telemetry.evidence} />
          </>
        )}
        {activeTab === "runtime" && (
          <RuntimeView
            metrics={telemetry.metrics}
            activeSkill={activeSkill}
            memoryEnabled={memoryEnabled}
            memoryToolsUsed={telemetry.memoryToolsUsed}
            runDurationMs={runDurationMs}
            firstTokenLatencyMs={firstTokenLatencyMs}
          />
        )}
      </div>
    </div>
  );
}

export function ResearchInspector(props: ResearchInspectorProps) {
  return (
    <>
      {props.desktopOpen && (
        <aside className="hidden h-screen w-[360px] shrink-0 border-l border-stone-200 xl:block">
          <InspectorContent
            messages={props.messages}
            isLoading={props.isLoading}
            activeSkill={props.activeSkill}
            memoryEnabled={props.memoryEnabled}
            runDurationMs={props.runDurationMs}
            firstTokenLatencyMs={props.firstTokenLatencyMs}
            onClose={() => props.onDesktopOpenChange(false)}
          />
        </aside>
      )}

      <Sheet
        open={props.mobileOpen}
        onOpenChange={props.onMobileOpenChange}
      >
        <SheetContent
          side="right"
          className="w-[min(92vw,380px)] gap-0 border-stone-200 p-0 xl:hidden [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Research run</SheetTitle>
          </SheetHeader>
          <InspectorContent
            messages={props.messages}
            isLoading={props.isLoading}
            activeSkill={props.activeSkill}
            memoryEnabled={props.memoryEnabled}
            runDurationMs={props.runDurationMs}
            firstTokenLatencyMs={props.firstTokenLatencyMs}
            onClose={() => props.onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
