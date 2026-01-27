"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReleaseNotesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReleaseNotesModal({ open, onOpenChange }: ReleaseNotesModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center gap-3 space-y-0 pb-4 border-b">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold">What's New in Reflexion</DialogTitle>
                        <DialogDescription>Latest updates and feature releases.</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">January 20, 2026</h3>
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Latest</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Artifact & Knowledge Graph Versioning
                                </h4>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                    <li><strong>Version History Explorer</strong>: View historical versions of any Markdown artifact directly in the sidebar.</li>
                                    <li><strong>Historical Previews</strong>: Click "View" on any past version to see its content in a read-only preview mode.</li>
                                    <li><strong>KG Versioning</strong>: The Knowledge Graph now tracks its version (e.g., "KG v4").</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Advanced Diff Review (HITL)
                                </h4>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                    <li><strong>Semantic Summaries</strong>: Changes to large artifacts are now summarized by AI for quick review.</li>
                                    <li><strong>Visual Graph Diffs</strong>: New nodes are highlighted in Green, modified in Amber, and removed in Red.</li>
                                    <li><strong>Unified Text Diffs</strong>: See exact character-level changes in artifacts during the approval workflow.</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Strategic Tools & Stability
                                </h4>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                    <li><strong>GitHub Integration</strong>: Create feature requests and comments directly from the chat.</li>
                                    <li><strong>LLM Fallback</strong>: Automatic fallback to OpenAI models if Anthropic services are unavailable.</li>
                                    <li><strong>Network Fixes</strong>: Improved Railway deployment stability with IPv4 enforcement.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="pt-6 border-t flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>Got it!</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
