import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";

import { getContentString } from "../utils";
import { parseAsBoolean, useQueryState } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightClose, PanelRightOpen, SquarePen } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import LogoutButton from "@/components/auth/LogoutButton";
import { useRouter, useSearchParams } from "next/navigation";

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
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
          <div
            key={t.thread_id}
            className="w-full px-1"
          >
            <Button
              variant="ghost"
              className="w-[280px] items-start justify-start text-left font-normal"
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

  const [threadId, _setThreadId] = useQueryState("threadId");

  const router = useRouter();

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, [getThreads, setThreads, setThreadsLoading]);

  const searchParams = useSearchParams();

  return (
    <>
      <div className="shadow-inner-right hidden h-screen w-[300px] shrink-0 flex-col items-start justify-start gap-6 border-r-[1px] border-slate-300 lg:flex">
        <div className="flex w-full items-center justify-between px-4 pt-6">
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
          <h1 className="text-xl font-semibold tracking-tight">Chat History</h1>
        </div>

        <div className="w-full px-4">
          <Button
            onClick={() => {
              // Clone the current params and remove threadId
              const params = new URLSearchParams(searchParams.toString());
              params.delete('threadId');

              // Update URL without reloading
              router.replace(`${window.location.pathname}?${params.toString()}`);
              // Close history panel
              setChatHistoryOpen(false);
              _setThreadId(null);
            }}
            className="text-foreground h-11 w-full justify-start gap-3 font-medium"
            variant="outline"
          >
            New Chat
          </Button>
        </div>

        {/* Thread List - Now takes remaining space */}
        <div className="flex-1 overflow-hidden">
          {threadsLoading ? (
            <ThreadHistoryLoading />
          ) : (
            <ThreadList threads={threads} />
          )}
        </div>

        {/* Logout Button at Bottom */}
        <div className="w-full border-t border-slate-200 px-4 pt-4 pb-6">
          <LogoutButton
            variant="ghost"
            size="sm"
            className="h-10 w-full justify-start gap-3 text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
          />
        </div>
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
            className="flex flex-col p-0 lg:hidden"
          >
            <SheetHeader className="flex">
              <SheetTitle>Chats</SheetTitle>
            </SheetHeader>

            {/* New Chat Button */}
            <div
              className="flex gap-2 px-6 cursor-pointer"
              onClick={() => {
                // Clone the current params and remove threadId
                const params = new URLSearchParams(searchParams.toString());
                params.delete('threadId');

                // Update URL without reloading
                router.replace(`${window.location.pathname}?${params.toString()}`);
                // Close history panel
                setChatHistoryOpen(false);
                _setThreadId(null);

              }}
            >
              <SquarePen className="size-5" />
              <span className={""}>New chat</span>
            </div>

            {/* Thread List - Takes remaining space */}
            <div className="flex-1 overflow-hidden px-4">
              <ThreadList
                threads={threads}
                onThreadClick={() => setChatHistoryOpen((o) => !o)}
              />
            </div>

            {/* Logout Button at Bottom */}
            <SheetFooter className="border-slate-200 px-6 pt-4 pb-2">
              <LogoutButton
                variant="ghost"
                size="sm"
                className="w-full"
              />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
