"use client";

import { useThreads } from "@/providers/Thread";
import { useEffect } from "react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { MobileSidebar } from "./components/MobileSidebar";

interface ThreadHistoryProps {
  onShowGuide?: () => void;
}

export default function ThreadHistory({ onShowGuide }: ThreadHistoryProps) {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [threadId, setThreadId] = useQueryState("threadId");

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  // Load threads on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, [getThreads, setThreads, setThreadsLoading]);

  const handleNewChat = () => {
    setThreadId(null);
  };

  const handleToggleChatHistory = () => {
    setChatHistoryOpen((p) => !p);
  };

  const handleMobileNewChat = () => {
    handleNewChat();
    setChatHistoryOpen(false);
  };

  const handleMobileThreadClick = () => {
    setChatHistoryOpen((o) => !o);
  };

  return (
    <>
      <DesktopSidebar
        threads={threads}
        threadsLoading={threadsLoading}
        chatHistoryOpen={chatHistoryOpen}
        onToggleChatHistory={handleToggleChatHistory}
        onNewChat={handleNewChat}
        onShowGuide={onShowGuide}
      />
      <MobileSidebar
        threads={threads}
        isOpen={!!chatHistoryOpen && !isLargeScreen}
        onOpenChange={(open) => {
          if (isLargeScreen) return;
          setChatHistoryOpen(open);
        }}
        onNewChat={handleMobileNewChat}
        onThreadClick={handleMobileThreadClick}
        onShowGuide={onShowGuide}
      />
    </>
  );
}
