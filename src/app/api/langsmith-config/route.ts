import { NextRequest, NextResponse } from "next/server";

/**
 * API route to provide LangSmith configuration to the client.
 * 
 * This avoids the need for NEXT_PUBLIC_ build-time environment variables,
 * which are difficult to manage with Docker and Railway builds.
 * 
 * Similar pattern to how Google auth tokens are provided via NextAuth session.
 */
export async function GET(request: NextRequest) {
  try {
    // Server-side only - has access to all environment variables
    const apiKey = process.env.LANGSMITH_API_KEY;
    const endpoint = process.env.LANGSMITH_ENDPOINT || process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
    const project = process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || process.env.NEXT_PUBLIC_LANGSMITH_PROJECT || 'Reflexion';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'LangSmith API key not configured' },
        { status: 503 }
      );
    }

    // Return configuration (API key is safe to expose to client for OpenTelemetry)
    return NextResponse.json({
      apiKey,
      endpoint,
      project,
    });
  } catch (error: any) {
    console.error('[API] Error fetching LangSmith config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LangSmith configuration' },
      { status: 500 }
    );
  }
}
