import { Client } from "@langchain/langgraph-sdk";

export function createLanggraphClient(accessToken?: string) {
  const headers: Record<string, string> = {};
  
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return new Client({
    apiUrl: import.meta.env.VITE_LANGCHAIN_API_URL,
    defaultHeaders: headers,
  });
} 