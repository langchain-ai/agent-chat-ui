import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  defaultExpanded?: boolean;
  enabled?: boolean;
}

const UPDATE_IDLE_MS = 1000;

const Reasoning = React.memo(function Reasoning({
  content,
  defaultExpanded = false,
  enabled = true,
}: Props) {
  const contentId = useId();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isUpdating, setIsUpdating] = useState(false);

  // Skip the first render so we don't show "updating" for an initial fully-ready value.
  const didMountRef = useRef(false);
  // `true` means the user pinned the panel open (it won't auto-collapse when updates stop).
  const userPinnedOpenRef = useRef(false);

  // Detect whether the content is still streaming in.
  useEffect(() => {
    if (!enabled) return;
    if (!content || content.trim() === "") return;

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    setIsUpdating(true);
    setIsExpanded(true);

    const t = setTimeout(() => {
      setIsUpdating(false);
    }, UPDATE_IDLE_MS);

    return () => clearTimeout(t);
  }, [content, enabled]);

  // When updates stop, auto-collapse unless the user pinned it open.
  useEffect(() => {
    if (isUpdating) return;

    if (userPinnedOpenRef.current) {
      setIsExpanded(true);
      return;
    }

    setIsExpanded(defaultExpanded);
  }, [isUpdating, defaultExpanded]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      userPinnedOpenRef.current = next; // User open => pin; user close => unpin.
      return next;
    });
  }, []);

  if (!enabled || !content || content.trim() === "") return null;

  return (
    <div className="border-border/50 bg-muted/10 mt-2 mb-3 overflow-hidden rounded-lg border shadow-xs">
      <button
        type="button"
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left",
          "hover:bg-muted/15 transition-colors",
          "focus-visible:ring-ring/20 outline-none focus-visible:ring-[3px]",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <ChevronRight
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform",
              isExpanded ? "rotate-90" : "rotate-0",
            )}
          />
          {isUpdating ? (
            <span
              className={cn(
                "truncate text-sm font-medium",
                "from-muted-foreground/25 via-muted-foreground to-muted-foreground/25 bg-linear-to-r",
                "bg-size-[200%_100%] bg-clip-text text-transparent",
                "animate-reasoning-shimmer",
              )}
            >
              Reasoning...
            </span>
          ) : (
            <span className="text-muted-foreground truncate text-sm font-medium">
              Reasoning
            </span>
          )}
        </div>

        {isUpdating ? (
          <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
        ) : (
          <span className="text-muted-foreground text-xs">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
        )}
      </button>

      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="border-border/50 bg-background/20 overflow-hidden border-t">
          <div className="max-h-[320px] overflow-y-auto px-3 py-3">
            <pre className="text-muted-foreground/85 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap">
              {content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Reasoning;