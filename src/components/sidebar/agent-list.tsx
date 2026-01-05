"use client";

import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/providers/Agent";
import { AgentItem } from "./agent-item";
import { Skeleton } from "@/components/ui/skeleton";

export function AgentList() {
  const {
    agents,
    selectedAgent,
    setSelectedAgent,
    isLoading,
    error,
    refetchAgents,
  } = useAgents();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex items-center px-4 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            My Agents
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex items-center px-4 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            My Agents
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <AlertCircle className="size-8 text-red-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAgents()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (agents.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex items-center px-4 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            My Agents
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No agents yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Create your first agent to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-h-0">
      <div className="flex items-center px-4 py-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          My Agents
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
        {agents.map((agent) => (
          <AgentItem
            key={agent.agent_id}
            agent={agent}
            isSelected={selectedAgent?.agent_id === agent.agent_id}
            onClick={() => setSelectedAgent(agent)}
          />
        ))}
      </div>
    </div>
  );
}
