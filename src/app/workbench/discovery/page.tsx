"use client";

import React from "react";
import { Search, Info } from "lucide-react";

export default function DiscoveryPage() {
    return (
        <div className="flex flex-col h-full bg-background p-8 overflow-auto">
            <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Search className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Discovery & Analysis</h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Deep dive into market trends, competitive landscapes, and technical requirements.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border border-border bg-muted/20 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            Knowledge Gaps
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Identify missing information in your current classification and request high-fidelity research threads.
                        </p>
                    </div>
                    <div className="p-6 rounded-xl border border-border bg-muted/20 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Search className="w-4 h-4 text-primary" />
                            Research Threads
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            View and manage automated research tasks performing deep-web analysis on domain-specific topics.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/5">
                    <div className="text-center space-y-2">
                        <p className="text-muted-foreground font-medium italic">Discovery engine is currently warming up...</p>
                        <p className="text-xs text-muted-foreground/60">Module integration pending final orientation completion.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
