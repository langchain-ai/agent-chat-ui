"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Calendar, User } from "lucide-react";

interface Issue {
    id: number;
    title: string;
    html_url: string;
    state: string;
    labels: { name: string; color: string }[];
    created_at: string;
    user: string;
}

export function BacklogView() {
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

    if (loading) {
        return (
            <div className="p-8 space-y-6 max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <div className="bg-red-500/10 p-4 rounded-full mb-4">
                    <RefreshCw className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Backlog Sync Failed</h3>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <Button onClick={fetchIssues} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-end mb-10 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Smart Backlog
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Reflexion Product Realm — Proposing and tracking system enhancements.
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={fetchIssues} className="gap-2 backdrop-blur-sm bg-white/5 hover:bg-white/10">
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Sync with GitHub
                </Button>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {issues.length === 0 ? (
                    <div className="text-center py-20 bg-muted/5 rounded-2xl border border-dashed border-white/10">
                        <p className="text-muted-foreground">No open issues found in the product backlog.</p>
                    </div>
                ) : (
                    issues.map((issue) => (
                        <Card key={issue.id} className="group overflow-hidden border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                            <CardHeader className="p-6 pb-2">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-primary/60 font-bold">#{issue.id}</span>
                                            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors cursor-default">
                                                {issue.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                                            {issue.state}
                                        </Badge>
                                        <a
                                            href={issue.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2">
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {issue.labels.map((label) => (
                                        <Badge
                                            key={label.name}
                                            variant="secondary"
                                            className="text-[10px] px-2 py-0 h-5"
                                            style={{
                                                backgroundColor: `#${label.color}15`,
                                                color: `#${label.color}`,
                                                border: `1px solid #${label.color}30`
                                            }}
                                        >
                                            {label.name}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5 text-[11px] text-muted-foreground font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-3 w-3" />
                                        {issue.user}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(issue.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

// Helper to use cn in this standalone file for now if needed or import
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
