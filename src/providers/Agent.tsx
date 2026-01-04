"use client";

import { v4 as uuidv4 } from "uuid";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from "react";
import { Agent, AgentFormData } from "@/lib/types/agent";

const DUMMY_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Customer Support Agent",
    description: "Handles customer inquiries",
    instructions: "You are a helpful customer support agent...",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "agent-2",
    name: "Code Assistant",
    description: "Helps with coding tasks",
    instructions: "You are an expert programmer...",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "agent-3",
    name: "Research Assistant",
    description: "Analyzes and summarizes research",
    instructions: "You are a research assistant...",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface AgentContextType {
  agents: Agent[];
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;
  createAgent: (data: AgentFormData) => Agent;
  updateAgent: (id: string, data: Partial<AgentFormData>) => void;
  deleteAgent: (id: string) => void;
  showSecrets: boolean;
  setShowSecrets: (value: boolean) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(DUMMY_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const createAgent = useCallback((data: AgentFormData): Agent => {
    const newAgent: Agent = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAgents((prev) => [newAgent, ...prev]);
    setSelectedAgent(newAgent);

    return newAgent;
  }, []);

  const updateAgent = useCallback(
    (id: string, data: Partial<AgentFormData>) => {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === id
            ? {
                ...agent,
                ...data,
                updatedAt: new Date(),
              }
            : agent
        )
      );
    },
    []
  );

  const deleteAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== id));
    setSelectedAgent((prev) => (prev?.id === id ? null : prev));
  }, []);

  const value = {
    agents,
    selectedAgent,
    setSelectedAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    showSecrets,
    setShowSecrets,
  };

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
