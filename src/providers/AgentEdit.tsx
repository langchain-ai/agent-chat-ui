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
import {
  getAgent,
  updateAgentConfig,
  updateAgentPrompt,
} from "@/lib/api/agent-builder";
import type { AgentConfig, AgentConfigUpdate } from "@/lib/types/agent-builder";
import { toast } from "sonner";

interface AgentEditContextType {
  config: AgentConfig | null;
  editedConfig: AgentConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
  updateField: <K extends keyof AgentConfig>(
    field: K,
    value: AgentConfig[K]
  ) => void;
  saveChanges: () => Promise<boolean>;
  resetChanges: () => void;
  refetch: () => Promise<void>;
}

const AgentEditContext = createContext<AgentEditContextType | undefined>(
  undefined
);

export function AgentEditProvider({
  agentId,
  children,
}: {
  agentId: string;
  children: ReactNode;
}) {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<AgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent config
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAgent(agentId);
      setConfig(data);
      setEditedConfig(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load agent config";
      setError(errorMessage);
      console.error("Failed to load agent config:", err);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!config || !editedConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(editedConfig);
  }, [config, editedConfig]);

  // Update a single field
  const updateField = useCallback(
    <K extends keyof AgentConfig>(field: K, value: AgentConfig[K]) => {
      setEditedConfig((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    []
  );

  // Save all changes
  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (!editedConfig || !config || !hasChanges) return true;

    setIsSaving(true);
    try {
      // Prepare update data (only changed fields, excluding read-only fields)
      const updateData: AgentConfigUpdate = {};

      if (editedConfig.agent_name !== config.agent_name) {
        updateData.agent_name = editedConfig.agent_name;
      }
      if (editedConfig.agent_description !== config.agent_description) {
        updateData.agent_description = editedConfig.agent_description;
      }
      if (editedConfig.model_name !== config.model_name) {
        updateData.model_name = editedConfig.model_name;
      }
      if (
        JSON.stringify(editedConfig.tool_list) !==
        JSON.stringify(config.tool_list)
      ) {
        updateData.tool_list = editedConfig.tool_list;
      }
      if (
        JSON.stringify(editedConfig.middleware_list) !==
        JSON.stringify(config.middleware_list)
      ) {
        updateData.middleware_list = editedConfig.middleware_list;
      }

      // Update config if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateAgentConfig(agentId, updateData);
      }

      // Update prompt if changed
      if (editedConfig.system_prompt !== config.system_prompt) {
        await updateAgentPrompt(agentId, editedConfig.system_prompt);
      }

      // Refresh from server
      await fetchConfig();

      toast.success("Changes saved successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save changes";
      toast.error("Failed to save changes", {
        description: errorMessage,
        richColors: true,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [agentId, config, editedConfig, hasChanges, fetchConfig]);

  // Reset to original config
  const resetChanges = useCallback(() => {
    setEditedConfig(config);
  }, [config]);

  const value = useMemo<AgentEditContextType>(
    () => ({
      config,
      editedConfig,
      isLoading,
      isSaving,
      error,
      hasChanges,
      updateField,
      saveChanges,
      resetChanges,
      refetch: fetchConfig,
    }),
    [config, editedConfig, isLoading, isSaving, error, hasChanges, updateField, saveChanges, resetChanges, fetchConfig]
  );

  return (
    <AgentEditContext.Provider value={value}>
      {children}
    </AgentEditContext.Provider>
  );
}

export function useAgentEdit() {
  const context = useContext(AgentEditContext);
  if (context === undefined) {
    throw new Error("useAgentEdit must be used within an AgentEditProvider");
  }
  return context;
}
