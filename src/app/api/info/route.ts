import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

/**
 * API route to proxy /info requests to the backend.
 * This allows the frontend to check LangGraph server status.
 */
export async function GET(req: NextRequest) {
  try {
    // Note: /info endpoint doesn't require auth (it's a health check)
    // But we'll try to get session for consistency
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (authError) {
      // Auth is optional for /info endpoint
      console.debug("[API] /info - No session available (this is OK for health checks)");
    }

    // In production/staging, LANGGRAPH_API_URL should be set
    // Fallback to staging URL if not set (better than localhost)
    let backendUrl = process.env.LANGGRAPH_API_URL;
    if (!backendUrl) {
        console.warn("[API] /info - LANGGRAPH_API_URL not set, using staging URL as fallback");
        backendUrl = "https://reflexion-staging.up.railway.app";
    }
    const cleanUrl = backendUrl.replace(/\/+$/, "");
    const targetUrl = `${cleanUrl}/info`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add auth if available (optional for /info)
    if (session?.user?.idToken) {
      headers["Authorization"] = `Bearer ${session.user.idToken}`;
    }

    // Add API key if available
    const apiKey = process.env.PROXY_API_KEY;
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }

    const resp = await fetch(targetUrl, { 
      headers,
      cache: 'no-store' // Don't cache health checks
    });

    if (!resp.ok) {
      // Clone response before reading to avoid issues
      const clonedResp = resp.clone();
      let errorText = "";
      try {
        // Check if response is JSON
        const contentType = resp.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorText = await clonedResp.json();
        } else {
          // If it's HTML (like 404 page), just get status
          const text = await resp.text();
          // Truncate HTML responses to avoid log spam
          errorText = text.length > 200 ? text.substring(0, 200) + "..." : text;
        }
      } catch (parseError) {
        errorText = `Backend returned ${resp.status} ${resp.statusText}`;
      }
      console.error(`[API] /info backend error: ${resp.status} - ${typeof errorText === 'string' ? errorText : JSON.stringify(errorText)}`);
      return NextResponse.json(
        { error: "Backend error", details: typeof errorText === 'string' ? errorText : JSON.stringify(errorText) },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API] /info proxy failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
