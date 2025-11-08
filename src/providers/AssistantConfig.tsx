import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import {
  getAssistant,
  searchAssistants,
  getAssistantSchemas,
  updateAssistantConfig,
  isValidUUID,
  type AssistantConfig as AssistantConfigType,
  type AssistantSchemas,
} from "@/lib/assistant-api";

interface AssistantConfigContextType {
  config: AssistantConfigType | null;
  schemas: AssistantSchemas | null;
  assistantId: string | null;
  isLoading: boolean;
  error: string | null;
  updateConfig: (newConfig: AssistantConfigType) => Promise<boolean>;
  refetchConfig: () => Promise<void>;
}

const AssistantConfigContext = createContext<
  AssistantConfigContextType | undefined
>(undefined);

export const AssistantConfigProvider: React.FC<{
  children: ReactNode;
  apiUrl: string;
  assistantId: string;
  apiKey: string | null;
}> = ({ children, apiUrl, assistantId: initialAssistantId, apiKey }) => {
  const [config, setConfig] = useState<AssistantConfigType | null>(null);
  const [schemas, setSchemas] = useState<AssistantSchemas | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let actualAssistantId = initialAssistantId;

      // If the initial ID is not a UUID, search for assistants by graph_id
      if (!isValidUUID(initialAssistantId)) {
        console.info(`Searching for assistant with graph_id: ${initialAssistantId}`);
        const assistants = await searchAssistants(
          apiUrl,
          {
            graph_id: initialAssistantId,
            limit: 1,
            sort_order: "asc",
            sort_by: "assistant_id",
            select: ["assistant_id"], // Only fetch assistant_id
          },
          apiKey || undefined
        );

        if (assistants.length > 0) {
          actualAssistantId = assistants[0].assistant_id;
          console.info(`Found assistant ID: ${actualAssistantId} for graph_id: ${initialAssistantId}`);
        } else {
          console.warn(`No assistant found for graph_id: ${initialAssistantId}`);
          setIsLoading(false);
          return;
        }
      }

      setAssistantId(actualAssistantId);

      // Fetch assistant config
      const assistant = await getAssistant(
        apiUrl,
        actualAssistantId,
        apiKey || undefined
      );

      if (assistant) {
        setConfig(assistant.config);
      }

      // Fetch assistant schemas
      const assistantSchemas = await getAssistantSchemas(
        apiUrl,
        actualAssistantId,
        apiKey || undefined
      );

      if (assistantSchemas) {
        setSchemas(assistantSchemas);
      }
    } catch (err) {
      console.error("Error fetching assistant config:", err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, initialAssistantId, apiKey]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(async (
    newConfig: AssistantConfigType
  ): Promise<boolean> => {
    if (!assistantId) {
      console.error("No assistant ID available for update");
      return false;
    }

    try {
      const assistant = await updateAssistantConfig(
        apiUrl,
        assistantId,
        newConfig,
        apiKey || undefined
      );
      if (assistant) {
        setConfig(assistant.config);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update config:", err);
      return false;
    }
  }, [apiUrl, assistantId, apiKey]);

  const contextValue = useMemo(
    () => ({
      config,
      schemas,
      assistantId,
      isLoading,
      error,
      updateConfig,
      refetchConfig: fetchConfig,
    }),
    [config, schemas, assistantId, isLoading, error, updateConfig, fetchConfig]
  );

  return (
    <AssistantConfigContext.Provider value={contextValue}>
      {children}
    </AssistantConfigContext.Provider>
  );
};

export const useAssistantConfig = (): AssistantConfigContextType => {
  const context = useContext(AssistantConfigContext);
  if (context === undefined) {
    throw new Error(
      "useAssistantConfig must be used within an AssistantConfigProvider"
    );
  }
  return context;
};
