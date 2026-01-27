"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Issue {
    id: number;
    title: string;
    html_url: string;
    state: string;
    labels: { name: string; color: string }[];
    created_at: string;
    user: string;
}

export function BacklogTab() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIssues = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/issues");
            if (!res.ok) throw new Error("Failed to fetch backlog");
            const data = await res.json();
            setIssues(data.issues || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    if (error) {
        return (
            <div className="text-center p-4">
                <p className="text-red-500 mb-2">Error: {error}</p>
                <Button onClick={fetchIssues} variant="outline">Retry</Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="p-4">
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Skeleton className="h-4 w-1/4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (issues.length === 0) {
        return <div className="text-center p-4 text-muted-foreground">No open issues found.</div>;
    }

    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Planned Features & Tasks</h2>
                <Button variant="ghost" size="sm" onClick={fetchIssues}>Refresh</Button>
            </div>

            {issues.map((issue) => (
                <Card key={issue.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                            <a
                                href={issue.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold hover:underline text-sm"
                            >
                                #{issue.id} {issue.title}
                            </a>
                            <Badge variant="outline" className="shrink-0">{issue.state}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap gap-2 mt-2">
                            {issue.labels.map((label) => (
                                <Badge
                                    key={label.name}
                                    variant="secondary"
                                    className="text-xs"
                                    style={{
                                        backgroundColor: `#${label.color}20`,
                                        color: `#${label.color}`,
                                        borderColor: `#${label.color}40`
                                    }}
                                >
                                    {label.name}
                                </Badge>
                            ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Opened by {issue.user} on {new Date(issue.created_at).toLocaleDateString()}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
