import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";

import { getContentString } from "../utils";
import { useQueryParam, StringParam, BooleanParam } from "use-query-params";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);

  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        return (
          <div key={t.thread_id} className="w-full px-1">
            <Button
              variant="ghost"
              className="text-left items-start justify-start font-normal w-[280px]"
              onClick={(e) => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (t.thread_id === threadId) return;
                setThreadId(t.thread_id);
              }}
            >
              <p className="truncate text-ellipsis">{itemText}</p>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="w-[280px] h-10" />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryParam(
    "chatHistoryOpen",
    BooleanParam,
  );

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  useEffect(() => {
    if (typeof window === "undefined") return;
    console.log("[ThreadHistory] Starting initial thread load");
    setThreadsLoading(true);
    getThreads()
      .then(threads => {
        console.log("[ThreadHistory] Initial thread load completed", {
          threadCount: threads.length,
          threadIds: threads.map(t => t.thread_id)
        });
        setThreads(threads);
      })
      .catch(error => {
        console.error("[ThreadHistory] Error during initial thread load:", error);
      })
      .finally(() => {
        console.log("[ThreadHistory] Finished loading threads");
        setThreadsLoading(false);
      });
  }, []);

  console.log("[ThreadHistory] Rendering with state:", {
    threadsLoading,
    threadCount: threads.length,
    isLargeScreen,
    chatHistoryOpen
  });

  return (
    <>
      <div className="hidden lg:flex flex-col border-r-[1px] border-slate-300 items-start justify-start gap-6 h-screen w-[300px] shrink-0 shadow-inner-right">
        <div className="flex items-center justify-between w-full pt-1.5 px-4">
          <Button
            className="hover:bg-gray-100"
            variant="ghost"
            onClick={() => setChatHistoryOpen((p) => !p)}
          >
            {chatHistoryOpen ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelRightClose className="size-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            Thread History
          </h1>
        </div>
        {threadsLoading ? (
          <ThreadHistoryLoading />
        ) : (
          <ThreadList threads={threads} />
        )}
      </div>
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent side="left" className="lg:hidden flex">
            <SheetHeader>
              <SheetTitle>Thread History</SheetTitle>
            </SheetHeader>
            <ThreadList
              threads={threads}
              onThreadClick={() => setChatHistoryOpen((o) => !o)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
