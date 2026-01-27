import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined, headers?: Record<string, string>) {
  // Normalize URL - remove trailing slash
  const cleanUrl = apiUrl.replace(/\/+$/, "");
  return new Client({
    apiKey,
    apiUrl: cleanUrl,
    defaultHeaders: headers,
  });
}
