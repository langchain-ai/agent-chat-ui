"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AgentThread } from "@/components/thread/agent-thread";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents } from "@/providers/Agent";
import { getAgent } from "@/lib/api/agent-builder";
import type { AgentSummary } from "@/lib/types/agent-builder";
import { toast } from "sonner";

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const { setSelectedAgent } = useAgents();
  const [agent, setAgent] = useState<AgentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent details
  useEffect(() => {
    async function fetchAgent() {
      setIsLoading(true);
      setError(null);
      try {
        const config = await getAgent(agentId);
        // Convert AgentConfig to AgentSummary for display
        const agentSummary: AgentSummary = {
          agent_id: config.agent_id,
          agent_name: config.agent_name,
          agent_description: config.agent_description,
          model_name: config.model_name,
        };
        setAgent(agentSummary);
        setSelectedAgent(agentSummary);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load agent";
        setError(errorMessage);
        toast.error("Failed to load agent", {
          description: errorMessage,
          richColors: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (agentId) {
      fetchAgent();
    }
  }, [agentId, setSelectedAgent]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !agent) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white dark:bg-black">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {error || "Agent not found"}
        </p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  return <AgentThread agent={agent} />;
}
