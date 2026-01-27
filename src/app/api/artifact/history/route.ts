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
        const nodeId = searchParams.get("node_id");
        const threadId = searchParams.get("thread_id") || "default";

        if (!nodeId) {
            return NextResponse.json({ error: "Missing node_id" }, { status: 400 });
        }

        let backendUrl = process.env.LANGGRAPH_API_URL || "http://localhost:8080";
        if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);

        const targetUrl = `${backendUrl}/artifact/history?node_id=${nodeId}&thread_id=${threadId}`;

        const orgContext = req.headers.get("X-Organization-Context");

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${session.user.idToken}`,
            "Content-Type": "application/json",
        };

        if (orgContext) {
            headers["X-Organization-Context"] = orgContext;
        }

        const resp = await fetch(targetUrl, { headers });

        if (!resp.ok) {
            const _errorText = await resp.text();
            return NextResponse.json({ error: "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Artifact history failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
