import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function getBackendUrl(): string {
    let backendUrl = process.env.LANGGRAPH_API_URL || "http://localhost:8080";
    if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);
    return backendUrl;
}

export async function GET(req: Request) {
    try {
        // In Next.js 15, getServerSession needs headers from the request
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const targetUrl = `${getBackendUrl()}/auth/branding`;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // Add authorization if idToken is available
        if (session.user.idToken) {
            headers["Authorization"] = `Bearer ${session.user.idToken}`;
        }

        const resp = await fetch(targetUrl, { headers });

        if (!resp.ok) {
            let errorText = "";
            try {
                const errorData = await resp.json();
                errorText = errorData.detail || errorData.error || JSON.stringify(errorData);
            } catch {
                errorText = await resp.text();
            }
            console.error(`[PROXY] Backend error (branding): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Branding fetch failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
