import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Build the backend URL
        let backendUrl = process.env.LANGGRAPH_API_URL || "https://reflexion-staging.up.railway.app";
        if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);

        const targetUrl = `${backendUrl}/kg/projects`;

        // Extract organization context from headers sent by the client
        const orgContext = req.headers.get("X-Organization-Context");

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${session.user.idToken}`,
            "Content-Type": "application/json",
        };

        if (orgContext) {
            headers["X-Organization-Context"] = orgContext;
        }

        console.log(`[PROXY] Fetching projects from ${targetUrl} (Org Context: ${orgContext})`);

        const resp = await fetch(targetUrl, { headers });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error (projects): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Projects fetch failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
