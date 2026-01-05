"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentSummary } from "@/lib/types/agent-builder";

interface ChatHeaderProps {
  agent: AgentSummary;
  onBack?: () => void;
}

export function ChatHeader({ agent, onBack }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="size-9 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
        )}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Bot className="size-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {agent.agent_name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {agent.model_name}
            </p>
          </div>
        </div>
      </div>

      <Link href={`/agent/${agent.agent_id}/edit`}>
        <Button className="gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          <Pencil className="size-4" />
          Edit Agent
        </Button>
      </Link>
    </div>
  );
}
