// Agent Builder API Types
// Based on backend models from agent-builder/core/

// Agent Summary (for list view)
export interface AgentSummary {
  agent_id: string;
  agent_name: string;
  agent_description: string;
  model_name: string;
}

// Full Agent Configuration
export interface AgentConfig {
  agent_id: string;
  agent_name: string;
  agent_description: string;
  model_name: string;
  tool_list: string[];
  middleware_list: string[];
  system_prompt: string;
  project_path: string;
}

// Agent Config Update Request (all fields optional)
export interface AgentConfigUpdate {
  agent_name?: string;
  agent_description?: string;
  model_name?: string;
  tool_list?: string[];
  middleware_list?: string[];
}

// Agent Prompt
export interface AgentPrompt {
  agent_id: string;
  system_prompt: string;
  length: number;
}

// Invoke/Stream Request
export interface AgentInvokeRequest {
  message: string;
  thread_id?: string;
}

// Invoke Response
export interface AgentInvokeResponse {
  agent_id: string;
  thread_id: string;
  response: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

// Stream Events
export type StreamEventType =
  | "token"
  | "end"
  | "tool_call"
  | "tool_result";

// Content block in token events
export interface StreamContentBlock {
  text: string;
  type: string;
  index: number;
}

// Tool call chunk in tool_call events (simplified)
export interface StreamToolCallChunk {
  name: string | null;
  args: string;
}

// Token event data
export interface StreamTokenData {
  content: StreamContentBlock[];
  node: string;
}

// Tool result event data
export interface StreamToolResultData {
  name: string;
  result: string;
}

// End event data
export interface StreamEndData {
  thread_id: string;
}

export interface StreamEvent {
  event: StreamEventType;
  data: StreamToolCallChunk[] | StreamTokenData | StreamToolResultData | StreamEndData;
}

// Tool Types
export interface ToolSummary {
  tool_name: string;
  tool_description: string;
  tool_type: "built-in" | "custom" | "mcp-stdio" | "mcp-http";
}

export interface McpConfig {
  server_command?: string;
  server_args: string[];
  url?: string;
  headers: Record<string, string>;
  transport: "stdio" | "http";
  env: Record<string, string>;
}

export interface ToolInfo extends ToolSummary {
  tool_path: string;
  import_path?: string;
  init_params: Record<string, unknown>;
  mcp_config?: McpConfig;
  required_env: string[];
}

// Agent Tool Entry
export interface AgentToolEntry {
  tool_name: string;
  tool_path: string;
}

// Middleware Types
export interface MiddlewareSummary {
  middleware_name: string;
  middleware_description: string;
  middleware_type: "built-in" | "custom" | "provider";
  provider?: string;
}

export interface MiddlewareInfo extends MiddlewareSummary {
  middleware_path: string;
  import_path: string;
  default_config: Record<string, unknown>;
  use_cases: string[];
  required_env: string[];
}

// Agent Middleware Entry
export interface AgentMiddlewareEntry {
  middleware_name: string;
  middleware_path: string;
}

// Secret Types
export interface SecretEntry {
  key: string;
  masked_value: string;
  has_value: boolean;
}

export interface SecretSetRequest {
  key: string;
  value: string;
}

// API Response Wrappers
export interface AgentsListResponse {
  agents: AgentSummary[];
  total: number;
}

export interface ToolsListResponse {
  tools: ToolSummary[];
  total: number;
}

export interface AgentToolsResponse {
  agent_id: string;
  tools: AgentToolEntry[];
  total: number;
}

export interface MiddlewaresListResponse {
  middlewares: MiddlewareSummary[];
  total: number;
}

export interface AgentMiddlewaresResponse {
  agent_id: string;
  middlewares: AgentMiddlewareEntry[];
  total: number;
}

export interface SecretsListResponse {
  secrets: SecretEntry[];
  total: number;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

// Chat Message for UI
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
