import { Thread } from "@langchain/langgraph-sdk";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NewChatButton } from "./NewChatButton";
import { ThreadList } from "./ThreadList";

interface MobileSidebarProps {
  threads: Thread[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNewChat: () => void;
  onThreadClick: () => void;
}

export function MobileSidebar({
  threads,
  isOpen,
  onOpenChange,
  onNewChat,
  onThreadClick,
}: MobileSidebarProps) {
  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="flex flex-col gap-4 lg:hidden">
          {/* New Chat button */}
          <NewChatButton onClick={onNewChat} />

          {/* Separator */}
          <Separator />

          {/* Thread list */}
          <ThreadList threads={threads} onThreadClick={onThreadClick} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
