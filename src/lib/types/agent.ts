// Re-export from agent-builder types for backward compatibility
export type { AgentSummary, AgentConfig } from "./agent-builder";

// Alias for backward compatibility
import type { AgentSummary } from "./agent-builder";

// Legacy Agent type - now aliases to AgentSummary
export type Agent = AgentSummary;

// Legacy form data type (still needed for some components)
export interface AgentFormData {
  agent_name: string;
  agent_description: string;
  system_prompt?: string;
}
