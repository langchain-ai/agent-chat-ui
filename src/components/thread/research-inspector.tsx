"use client";

import type { Message } from "@langchain/langgraph-sdk";
import {
  AlertTriangle,
  Bot,
  Check,
  CircleDashed,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  buildResearchTimeline,
  type TimelineItem,
} from "@/lib/research-telemetry";
import { cn } from "@/lib/utils";

type ResearchInspectorProps = {
  messages: Message[];
  isLoading: boolean;
  desktopOpen: boolean;
  mobileOpen: boolean;
  onDesktopOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean) => void;
};

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
          </div>
        </li>
      ))}
    </ol>
  );
}

function InspectorContent({
  messages,
  isLoading,
  onClose,
}: Pick<ResearchInspectorProps, "messages" | "isLoading"> & {
  onClose: () => void;
}) {
  const timeline = buildResearchTimeline(messages, isLoading);
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
            onClose={() => props.onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
