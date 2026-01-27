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
        const threadId = searchParams.get("thread_id") || "default";

        // Build the backend URL
        let backendUrl = process.env.LANGGRAPH_API_URL || "https://reflexion-staging.up.railway.app";
        if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);

        const focus = searchParams.get("focus");
        let targetUrl = `${backendUrl}/kg/data?thread_id=${threadId}`;
        if (focus) targetUrl += `&focus=${focus}`;

        // Extract organization context from headers sent by the client
        // The client-side fetch should include the X-Organization-Context header
        const orgContext = req.headers.get("X-Organization-Context");

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${session.user.idToken}`,
            "Content-Type": "application/json",
        };

        if (orgContext) {
            headers["X-Organization-Context"] = orgContext;
        }

        console.log(`[PROXY] Fetching KG data from ${targetUrl} (Org Context: ${orgContext})`);

        const resp = await fetch(targetUrl, { headers });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error: ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        const inactiveCount = data.nodes?.filter((n: any) => n.is_active === false).length || 0;
        console.log(`[PROXY] Delivered ${data.nodes?.length} nodes to client (${inactiveCount} inactive)`);
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            }
        });

    } catch (error: any) {
        console.error("[PROXY] KG Data fetch failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
