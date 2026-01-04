"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgents } from "@/providers/Agent";
import { AgentItem } from "./agent-item";
import { useQueryState } from "nuqs";

export function AgentList() {
  const { agents, selectedAgent, setSelectedAgent, setShowSecrets } =
    useAgents();
  const [, setThreadId] = useQueryState("threadId");

  const handleNewChat = () => {
    setThreadId(null);
    setShowSecrets(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">My Agents</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleNewChat}
        >
          <Plus className="size-4 text-gray-600 dark:text-gray-400" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
        {agents.map((agent) => (
          <AgentItem
            key={agent.id}
            agent={agent}
            isSelected={selectedAgent?.id === agent.id}
            onClick={() => setSelectedAgent(agent)}
          />
        ))}
      </div>
    </div>
  );
}
