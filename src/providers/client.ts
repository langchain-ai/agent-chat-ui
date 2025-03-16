import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, accessToken?: string) {
  const headers: Record<string, string> = {};
  
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    console.warn("No access token provided to client");
  }
  
  console.log("Client headers:", headers);
  console.log("API URL:", apiUrl);

  return new Client({
    apiUrl,
    defaultHeaders: headers,
  });
}
