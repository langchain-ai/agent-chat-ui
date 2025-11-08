import { Thread } from "@langchain/langgraph-sdk";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NewChatButton } from "./NewChatButton";
import { ThreadList } from "./ThreadList";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { BookOpen } from "lucide-react";
import { ICON_SIZE_SM } from "../constants";

interface MobileSidebarProps {
  threads: Thread[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNewChat: () => void;
  onThreadClick: () => void;
  onShowGuide?: () => void;
}

export function MobileSidebar({
  threads,
  isOpen,
  onOpenChange,
  onNewChat,
  onThreadClick,
  onShowGuide,
}: MobileSidebarProps) {
  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="flex flex-col gap-4 lg:hidden">
          <VisuallyHidden>
            <SheetTitle>Chat History</SheetTitle>
          </VisuallyHidden>

          {/* New Chat button */}
          <NewChatButton onClick={onNewChat} />

          {/* Guide button */}
          {onShowGuide && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => {
                onShowGuide();
                onOpenChange(false);
              }}
            >
              <BookOpen className={ICON_SIZE_SM} />
              <span>사용 가이드</span>
            </Button>
          )}

          {/* Separator */}
          <Separator />

          {/* Thread list */}
          <ThreadList threads={threads} onThreadClick={onThreadClick} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
