import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function getBackendUrl(): string {
    let backendUrl = process.env.LANGGRAPH_API_URL || "http://localhost:8080";
    if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);
    return backendUrl;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orgId } = await params;
        const targetUrl = `${getBackendUrl()}/auth/branding/${orgId}`;

        const resp = await fetch(targetUrl, {
            headers: {
                "Authorization": `Bearer ${session.user.idToken}`,
                "Content-Type": "application/json",
            }
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error (get branding): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Branding fetch failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
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
        const targetUrl = `${getBackendUrl()}/auth/branding/${orgId}`;

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
            console.error(`[PROXY] Backend error (create branding): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Branding creation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
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
        const targetUrl = `${getBackendUrl()}/auth/branding/${orgId}`;

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
            console.error(`[PROXY] Backend error (update branding): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Branding update failed:", error);
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
        const targetUrl = `${getBackendUrl()}/auth/branding/${orgId}`;

        const resp = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${session.user.idToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`[PROXY] Backend error (delete branding): ${resp.status} - ${errorText}`);
            return NextResponse.json({ error: errorText || "Backend error" }, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[PROXY] Branding deletion failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
