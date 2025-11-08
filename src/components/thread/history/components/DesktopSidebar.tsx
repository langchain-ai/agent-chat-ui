import { Thread } from "@langchain/langgraph-sdk";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PanelRightOpen, PanelRightClose, BookOpen } from "lucide-react";
import { NewChatButton } from "./NewChatButton";
import { ThreadList } from "./ThreadList";
import { ThreadHistoryLoading } from "./ThreadHistoryLoading";
import { ICON_SIZE_SM } from "../constants";

interface DesktopSidebarProps {
  threads: Thread[];
  threadsLoading: boolean;
  chatHistoryOpen: boolean;
  onToggleChatHistory: () => void;
  onNewChat: () => void;
  onShowGuide?: () => void;
}

export function DesktopSidebar({
  threads,
  threadsLoading,
  chatHistoryOpen,
  onToggleChatHistory,
  onNewChat,
  onShowGuide,
}: DesktopSidebarProps) {
  return (
    <div className="shadow-inner-right hidden h-screen w-[300px] shrink-0 flex-col items-stretch justify-start border-r-[1px] border-border lg:flex">
      {/* Header with collapse button on right */}
      <div className="flex w-full items-center justify-end px-4 pt-1.5">
        <Button
          size="icon"
          className="hover:bg-accent"
          variant="ghost"
          onClick={onToggleChatHistory}
        >
          {chatHistoryOpen ? (
            <PanelRightOpen className="size-5" />
          ) : (
            <PanelRightClose className="size-5" />
          )}
        </Button>
      </div>

      {/* New Chat button */}
      <div className="pb-2">
        <NewChatButton onClick={onNewChat} />
      </div>

      {/* Guide button */}
      {onShowGuide && (
        <div className="pb-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={onShowGuide}
          >
            <BookOpen className={ICON_SIZE_SM} />
            <span>사용 가이드</span>
          </Button>
        </div>
      )}

      {/* Separator */}
      <Separator className="mb-2" />

      {/* Thread list */}
      <div className="flex-1 overflow-hidden">
        {threadsLoading ? (
          <ThreadHistoryLoading />
        ) : (
          <ThreadList threads={threads} />
        )}
      </div>
    </div>
  );
}
