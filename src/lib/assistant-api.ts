import { createClient } from "@/providers/client";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

/**
 * Valid fields for assistant selection
 * Based on @langchain/langgraph-sdk's assistant schema
 */
type AssistantSelectField =
  | "assistant_id"
  | "graph_id"
  | "config"
  | "created_at"
  | "updated_at"
  | "metadata"
  | "name";

export interface AssistantConfig {
  configurable?: Record<string, any>;
  [key: string]: any;
}

export interface Assistant {
  assistant_id: string;
  graph_id: string;
  config: AssistantConfig;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  name?: string;
  description?: string;
  version?: number;
  context?: Record<string, any>;
}

export interface AssistantSchemas {
  graph_id: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  state_schema: Record<string, any>;
  config_schema: Record<string, any>;
  context_schema: Record<string, any>;
}

export interface SearchAssistantsRequest {
  graph_id?: string;
  limit?: number;
  offset?: number;
  metadata?: Record<string, unknown>;
  sort_by?: "assistant_id" | "created_at" | "updated_at" | "name" | "graph_id";
  sort_order?: "asc" | "desc";
  select?: AssistantSelectField[];
}

export async function getAssistant(
  apiUrl: string,
  assistantId: string,
  apiKey?: string
): Promise<Assistant | null> {
  // Validate UUID format
  if (!isValidUUID(assistantId)) {
    console.info(`Assistant ID "${assistantId}" is not a UUID, skipping assistant API call`);
    return null;
  }

  try {
    const client = createClient(apiUrl, apiKey);
    const assistant = await client.assistants.get(assistantId);
    return assistant as Assistant;
  } catch (error) {
    console.error("Failed to fetch assistant:", error);
    return null;
  }
}

export async function searchAssistants(
  apiUrl: string,
  request: SearchAssistantsRequest,
  apiKey?: string
): Promise<Assistant[]> {
  try {
    const client = createClient(apiUrl, apiKey);
    const response = await client.assistants.search(request as any);
    return response as Assistant[];
  } catch (error) {
    console.error("Failed to search assistants:", error);
    return [];
  }
}

export async function getAssistantSchemas(
  apiUrl: string,
  assistantId: string,
  apiKey?: string
): Promise<AssistantSchemas | null> {
  // Validate UUID format
  if (!isValidUUID(assistantId)) {
    console.info(`Assistant ID "${assistantId}" is not a UUID, skipping schemas API call`);
    return null;
  }

  try {
    const client = createClient(apiUrl, apiKey);
    const schemas = await client.assistants.getSchemas(assistantId);
    return schemas as AssistantSchemas;
  } catch (error) {
    console.error("Failed to fetch assistant schemas:", error);
    return null;
  }
}

export async function updateAssistantConfig(
  apiUrl: string,
  assistantId: string,
  config: AssistantConfig,
  apiKey?: string
): Promise<Assistant | null> {
  // Validate UUID format
  if (!isValidUUID(assistantId)) {
    console.error(`Cannot update assistant config: "${assistantId}" is not a valid UUID`);
    return null;
  }

  try {
    const client = createClient(apiUrl, apiKey);
    const assistant = await client.assistants.update(assistantId, {
      config,
    });
    return assistant as Assistant;
  } catch (error) {
    console.error("Failed to update assistant config:", error);
    return null;
  }
}
