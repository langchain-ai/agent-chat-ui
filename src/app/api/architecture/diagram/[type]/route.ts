import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type: diagramType } = await params;

        // Build the backend URL
        let backendUrl = process.env.LANGGRAPH_API_URL || "http://localhost:8080";
        if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);

        const targetUrl = `${backendUrl}/architecture/diagram/${diagramType}`;

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${session.user.idToken}`,
            "Content-Type": "text/html",
        };

        const resp = await fetch(targetUrl, { headers });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Architecture diagram error: ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: "Backend error" }, { status: resp.status });
        }

        const html = await resp.text();
        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            }
        });

    } catch (error: any) {
        console.error("[PROXY] Architecture diagram fetch failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
