export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentFormData {
  name: string;
  description: string;
  instructions: string;
}
