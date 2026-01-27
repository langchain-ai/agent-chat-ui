import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function getBackendUrl(): string {
    let backendUrl = process.env.LANGGRAPH_API_URL || "http://localhost:8080";
    if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);
    return backendUrl;
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;
        const body = await req.json();
        const targetUrl = `${getBackendUrl()}/auth/organizations/${orgId}`;

        const resp = await fetch(targetUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${session.user.idToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error (update org): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Organization update failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;
        const targetUrl = `${getBackendUrl()}/auth/organizations/${orgId}`;

        const resp = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${session.user.idToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error (delete org): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Organization deletion failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
