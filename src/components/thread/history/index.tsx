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
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { SquarePen, Grid3X3, X, MoreVertical } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getJwtToken, decodeJwtPayload } from "@/services/authService";
import { FlyoLogoSVG } from "@/components/icons/langgraph";
import { useStreamContext } from "@/providers/Stream";

// Logo component
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black">
        <div className="h-4 w-4 rounded-sm bg-white"></div>
      </div>
    </div>
  );
}

// User Profile Component
function UserProfile() {
  const token = getJwtToken();
  const userData = token ? decodeJwtPayload(token) : null;
  const userName = userData?.name || userData?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-blue-500 text-sm font-medium text-white">
          {userInitial}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{userName}</span>
        <span className="text-xs text-gray-500">Free</span>
      </div>
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

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
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
        const isActive = t.thread_id === threadId;

        return (
          <div
            key={t.thread_id}
            className={`group w-full cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-100 ${
              isActive ? "bg-gray-100" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              onThreadClick?.(t.thread_id);
              if (t.thread_id === threadId) return;
              setThreadId(t.thread_id);
            }}
          >
            <div className="flex items-center justify-between">
              <p className="flex-1 truncate text-sm text-ellipsis text-gray-700">
                {itemText}
              </p>
              <MoreVertical className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="mx-3 h-10 w-full"
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const stream = useStreamContext();

  const { getThreads, threads, threadsLoading } = useThreads();
  useEffect(() => {
    if (!threads.length) getThreads();
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-3">
          <Logo />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setChatHistoryOpen((p) => !p)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-1 p-2">
          <Button
            variant="ghost"
            className="h-10 justify-start gap-3 px-3 text-sm font-normal hover:bg-gray-100"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("threadId");
              router.replace(
                `${window.location.pathname}?${params.toString()}`,
              );
              setChatHistoryOpen(false);
              // Stop any in-flight stream and clear in-memory snapshot
              try {
                stream?.stop?.();
                stream?.clearInMemoryValues?.();
              } catch {}
              _setThreadId(null);
            }}
          >
            <SquarePen className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Chats Section */}
        <div className="flex-1 overflow-hidden">
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
              Chats
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            {threadsLoading ? (
              <ThreadHistoryLoading />
            ) : (
              <ThreadList threads={threads} />
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-3">
          <UserProfile />
        </div>
      </div>

      {/* Mobile Sidebar */}
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
            className="flex w-[260px] flex-col p-0"
          >
            <VisuallyHidden>
              <SheetTitle>Chat History</SheetTitle>
            </VisuallyHidden>
            {/* Header */}
            <div className="flex items-center justify-center border-b border-gray-200 p-1">
              <FlyoLogoSVG
                width={50}
                height={50}
                className="sm:h-[50px] sm:w-[50px]"
              />
              <div className="flex items-center gap-2"></div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-1 p-2">
              <div className="rounded-md border border-gray-300 p-1 shadow-sm">
                <Button
                  variant="ghost"
                  className="h-10 w-full justify-start gap-3 px-3 text-sm font-normal hover:bg-gray-100"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("threadId");
                    router.replace(
                      `${window.location.pathname}?${params.toString()}`,
                    );
                    setChatHistoryOpen(false);
                    _setThreadId(null);
                  }}
                >
                  <SquarePen className="h-4 w-4" />
                  New chat
                </Button>
              </div>
            </div>

            {/* Chats Section */}
            <div className="flex-1 overflow-hidden">
              <div className="px-3 py-2">
                <h3 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Chats
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <ThreadList
                  threads={threads}
                  onThreadClick={() => setChatHistoryOpen(false)}
                />
              </div>
            </div>

            {/* User Profile */}
            <div className="border-t border-gray-200 p-3">
              <UserProfile />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
