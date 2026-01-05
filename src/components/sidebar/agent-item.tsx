"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentSummary } from "@/lib/types/agent-builder";
import { useRouter } from "next/navigation";

interface AgentItemProps {
  agent: AgentSummary;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentItem({ agent, isSelected, onClick }: AgentItemProps) {
  const router = useRouter();

  const handleClick = () => {
    onClick();
    router.push(`/agent/${agent.agent_id}`);
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start gap-3 px-3 py-2 text-left font-normal",
        isSelected && "bg-gray-100 dark:bg-gray-800"
      )}
      onClick={handleClick}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <Bot className="size-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
          {agent.agent_name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {agent.agent_description}
        </p>
      </div>
    </Button>
  );
}
