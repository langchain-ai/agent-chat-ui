import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get("thread_id");
        const version1 = searchParams.get("version1");
        const version2 = searchParams.get("version2");

        if (!threadId || !version1 || !version2) {
            return NextResponse.json(
                { error: "thread_id, version1, and version2 are required" },
                { status: 400 }
            );
        }

        // Build the backend URL
        let backendUrl = process.env.LANGGRAPH_API_URL || "https://reflexion-staging.up.railway.app";
        if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);

        const targetUrl = `${backendUrl}/project/diff?thread_id=${threadId}&version1=${version1}&version2=${version2}`;

        // Extract organization context from headers
        const orgContext = req.headers.get("X-Organization-Context");

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${session.user.idToken}`,
            "Content-Type": "application/json",
        };

        if (orgContext) {
            headers["X-Organization-Context"] = orgContext;
        }

        console.log(`[PROXY] Fetching KG diff from ${targetUrl}`);

        const resp = await fetch(targetUrl, { headers });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error: ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            }
        });

    } catch (error: any) {
        console.error("[PROXY] KG Diff fetch failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
