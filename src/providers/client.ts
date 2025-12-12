import { Client } from "@langchain/langgraph-sdk";

export const DEFAULT_HEADERS = { "x-auth-scheme": "langsmith-api-key" };

export function createClient(apiUrl: string, apiKey: string | undefined) {
  return new Client({
    apiKey,
    apiUrl,
    defaultHeaders: DEFAULT_HEADERS,
  });
}
