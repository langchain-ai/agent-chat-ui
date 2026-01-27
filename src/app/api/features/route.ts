import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description, priority, category } = await req.json();

        if (!title || !description) {
            return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
        }

        const token = process.env.GITHUB_TOKEN;
        const repoUrl = process.env.GITHUB_REPO; // Expected format: owner/repo

        if (!token || !repoUrl) {
            console.error("Missing GITHUB_TOKEN or GITHUB_REPO env vars");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const [owner, repo] = repoUrl.split("/");

        const octokit = new Octokit({ auth: token });

        const body = `
## Feature Request
**Reporter:** ${session.user.email || session.user.name || "Anonymous"}
**Category:** ${category}
**Priority:** ${priority}

### Description
${description}

---
*Submitted via Agent Chat UI Panel*
`;

        const labels = ["enhancement", `priority-${priority}`, `category-${category}`];

        const { data } = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body,
            labels,
        });

        return NextResponse.json({
            success: true,
            url: data.html_url,
            id: data.number
        });

    } catch (error: any) {
        console.error("Error creating feature request:", error);
        return NextResponse.json({
            error: error.message || "Failed to create issue"
        }, { status: 500 });
    }
}
