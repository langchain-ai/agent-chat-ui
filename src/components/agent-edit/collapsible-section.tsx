"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  headerActions,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 px-4 py-3 text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown className="size-4 text-gray-400" />
          ) : (
            <ChevronRight className="size-4 text-gray-400" />
          )}
          <span className="text-xs font-medium leading-tight tracking-snug">
            {title}
          </span>
        </button>
        {headerActions && (
          <div className="flex items-center gap-1 pr-4">{headerActions}</div>
        )}
      </div>
      {isOpen && (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
}
