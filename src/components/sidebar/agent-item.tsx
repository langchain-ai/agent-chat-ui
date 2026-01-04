"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Agent } from "@/lib/types/agent";

interface AgentItemProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentItem({ agent, isSelected, onClick }: AgentItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start gap-3 px-3 py-2 text-left font-normal",
        isSelected && "bg-gray-100 dark:bg-gray-800"
      )}
      onClick={onClick}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <Bot className="size-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
          {agent.name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{agent.description}</p>
      </div>
    </Button>
  );
}
