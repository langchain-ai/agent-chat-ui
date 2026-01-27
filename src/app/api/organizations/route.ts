import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function getBackendUrl(): string {
    let backendUrl = process.env.LANGGRAPH_API_URL;
    
    // In production/staging, LANGGRAPH_API_URL should be set
    // Fallback to staging URL if not set (better than localhost)
    if (!backendUrl) {
        console.warn("[PROXY] LANGGRAPH_API_URL not set, using staging URL as fallback");
        backendUrl = "https://reflexion-staging.up.railway.app";
    }
    
    if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);
    return backendUrl;
}

export async function GET(req: Request) {
    try {
        // In Next.js 15, getServerSession needs headers from the request
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            console.error("[PROXY] No session found for organizations request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!session.user.idToken) {
            console.error("[PROXY] No idToken in session for organizations request");
            return NextResponse.json({ error: "Missing authentication token" }, { status: 401 });
        }

        const targetUrl = `${getBackendUrl()}/auth/organizations`;
        console.log(`[PROXY] Fetching organizations from ${targetUrl}`);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.user.idToken}`,
        };

        const resp = await fetch(targetUrl, { headers });

        if (!resp.ok) {
            // Clone response before reading to avoid "Body is unusable" error
            const clonedResp = resp.clone();
            let errorText = "";
            try {
                const errorData = await clonedResp.json();
                errorText = errorData.detail || errorData.error || JSON.stringify(errorData);
            } catch {
                // If JSON parsing fails, try text
                try {
                    errorText = await resp.text();
                } catch (textError) {
                    errorText = `Backend returned ${resp.status} ${resp.statusText}`;
                }
            }
            console.error(`[PROXY] Backend error (orgs): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Organizations fetch failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const targetUrl = `${getBackendUrl()}/auth/organizations`;

        const resp = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session.user.idToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error (create org): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Organization creation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
