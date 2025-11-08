import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SCROLLBAR_STYLES } from "../constants";

interface ThreadListContainerProps {
  children: ReactNode;
}

export function ThreadListContainer({ children }: ThreadListContainerProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-stretch justify-start overflow-y-scroll",
        SCROLLBAR_STYLES
      )}
    >
      {children}
    </div>
  );
}
