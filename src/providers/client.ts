import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined, userId?: string) {
  const headers: Record<string, string> = {};
  
  // Add user ID header if available
  if (userId) {
    headers["X-User-Id"] = userId;
  }
  
  return new Client({
    apiKey,
    apiUrl,
    defaultHeaders: Object.keys(headers).length > 0 ? headers : undefined,
  });
}
