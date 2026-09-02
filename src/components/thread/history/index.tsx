import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";

import { getContentString } from "../utils";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PanelRightOpen,
  PanelRightClose,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { TooltipIconButton } from "../tooltip-icon-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ThreadItem({
  thread,
  isActive,
  onThreadClick,
  onDelete,
}: {
  thread: Thread;
  isActive: boolean;
  onThreadClick?: (threadId: string) => void;
  onDelete: (thread: Thread) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  let itemText = thread.thread_id;
  if (
    typeof thread.values === "object" &&
    thread.values &&
    "messages" in thread.values &&
    Array.isArray(thread.values.messages) &&
    thread.values.messages?.length > 0
  ) {
    const firstMessage = thread.values.messages[0];
    itemText = getContentString(firstMessage.content);
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleting(true);
    try {
      await onDelete(thread);
    } catch (error) {
      console.error("Failed to delete thread:", error);
      toast.error("Failed to delete thread");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="group relative flex w-full max-w-[280px] items-center justify-between gap-1 rounded-md px-1">
      <Button
        variant="ghost"
        className={cn(
          "w-full items-start justify-start pr-8 text-left font-normal",
          isActive && "bg-accent text-accent-foreground",
        )}
        onClick={(e) => {
          e.preventDefault();
          onThreadClick?.(thread.thread_id);
        }}
      >
        <p className="truncate text-ellipsis">{itemText}</p>
      </Button>

      {confirmDelete ? (
        <div className="bg-background/95 border-border absolute right-2 z-10 flex items-center gap-1 rounded-md border p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 size-6 p-0.5"
            disabled={isDeleting}
            onClick={handleDelete}
            title="Confirm deletion"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span className="sr-only">Confirm delete</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent size-6 p-0.5"
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setConfirmDelete(false);
            }}
            title="Cancel"
          >
            <X className="size-3.5" />
            <span className="sr-only">Cancel</span>
          </Button>
        </div>
      ) : (
        <div className="absolute right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <TooltipIconButton
            tooltip="Delete thread"
            side="right"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-6 p-1"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setConfirmDelete(true);
            }}
          >
            <Trash2 className="size-3.5" />
          </TooltipIconButton>
        </div>
      )}
    </div>
  );
}

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { deleteThread, hasMore, loadMoreThreads } = useThreads();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleDelete = async (targetThread: Thread) => {
    await deleteThread(targetThread);
    if (threadId === targetThread.thread_id) {
      setThreadId(null);
    }
    toast.success("Thread deleted");
  };

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => (
        <ThreadItem
          key={t.thread_id}
          thread={t}
          isActive={t.thread_id === threadId}
          onThreadClick={(id) => {
            onThreadClick?.(id);
            if (id === threadId) return;
            setThreadId(id);
          }}
          onDelete={handleDelete}
        />
      ))}
      {hasMore && (
        <div className="flex w-full justify-center px-1 py-2">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-[280px] text-xs"
            disabled={isLoadingMore}
            onClick={() => {
              setIsLoadingMore(true);
              loadMoreThreads().finally(() => setIsLoadingMore(false));
            }}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more conversations"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-10 w-[280px]"
        />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  const {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    setHasMore,
  } = useThreads();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then((fetched) => {
        setThreads(fetched);
        setHasMore(fetched.length >= 100);
      })
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, [getThreads, setHasMore, setThreads, setThreadsLoading]);

  return (
    <>
      <div className="shadow-inner-right hidden h-screen w-[300px] shrink-0 flex-col items-start justify-start gap-6 border-r-[1px] border-slate-300 lg:flex">
        <div className="flex w-full items-center justify-between px-4 pt-1.5">
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
          <SheetContent
            side="left"
            className="flex lg:hidden"
          >
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
