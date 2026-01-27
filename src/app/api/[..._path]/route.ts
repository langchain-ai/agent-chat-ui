import { NextRequest, NextResponse } from "next/server";

// This file acts as a proxy for requests to your LangGraph server.
// We use a custom implementation to ensure the client's JWT token is forwarded correctly.

const BACKEND_URL = process.env.LANGGRAPH_API_URL ?? "https://reflexion-staging.up.railway.app";

async function proxyRequest(req: NextRequest, method: string) {
  try {
    // Get the path from the request (everything after /api/)
    const path = req.nextUrl.pathname.replace(/^\/api/, "");
    
    // Construct backend URL
    const backendUrl = `${BACKEND_URL}${path}${req.nextUrl.search}`;
    
    // Get client's auth header (JWT token from session)
    const clientApiKey = req.headers.get("X-Api-Key");
    const clientAuth = req.headers.get("Authorization");
    
    // Prepare headers - forward all headers from client, but prioritize client's auth
    const headers = new Headers();
    
    // Forward all headers from client request
    req.headers.forEach((value, key) => {
      // Skip host header (will be set by fetch)
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });
    
    // Ensure client's auth header is used (override any passthrough default)
    if (clientApiKey) {
      headers.set("X-Api-Key", clientApiKey);
    }
    if (clientAuth) {
      headers.set("Authorization", clientAuth);
    }
    
    // If no client auth, use fallback (shouldn't happen in production)
    if (!clientApiKey && !clientAuth) {
      const fallbackKey = process.env.LANGSMITH_API_KEY;
      if (fallbackKey && fallbackKey !== "remove-me") {
        headers.set("X-Api-Key", fallbackKey);
      }
    }
    
    // Get request body if present
    let body: BodyInit | undefined;
    if (method !== "GET" && method !== "HEAD") {
      try {
        body = await req.text();
      } catch {
        // No body
      }
    }
    
    // Make request to backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });
    
    // Create response with backend's response
    const responseBody = await response.text();
    
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        // Forward CORS headers if present
        ...(response.headers.get("Access-Control-Allow-Origin") && {
          "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin")!,
        }),
        ...(response.headers.get("Access-Control-Allow-Methods") && {
          "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods")!,
        }),
        ...(response.headers.get("Access-Control-Allow-Headers") && {
          "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")!,
        }),
      },
    });
  } catch (error) {
    console.error("[PROXY] Error proxying request:", error);
    return NextResponse.json(
      { error: "Failed to proxy request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, "POST");
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req, "PUT");
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req, "PATCH");
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req, "DELETE");
}

export async function OPTIONS(req: NextRequest) {
  return proxyRequest(req, "OPTIONS");
}

export const runtime = "edge";
