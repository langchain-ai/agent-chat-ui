"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import type { AgentSummary } from "@/lib/types/agent-builder";
import { getAgents } from "@/lib/api/agent-builder";

interface AgentContextType {
  agents: AgentSummary[];
  selectedAgent: AgentSummary | null;
  setSelectedAgent: (agent: AgentSummary | null) => void;
  isLoading: boolean;
  error: string | null;
  refetchAgents: () => Promise<void>;
  showSecrets: boolean;
  setShowSecrets: (value: boolean) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAgents();
      setAgents(response.agents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch agents";
      setError(errorMessage);
      console.error("Failed to fetch agents:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const value = useMemo(
    () => ({
      agents,
      selectedAgent,
      setSelectedAgent,
      isLoading,
      error,
      refetchAgents: fetchAgents,
      showSecrets,
      setShowSecrets,
    }),
    [agents, selectedAgent, isLoading, error, fetchAgents, showSecrets]
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgents must be used within an AgentProvider");
  }
  return context;
}
