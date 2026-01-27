"use client";

import React, { useEffect, useState } from "react";
import { MarkdownText } from "@/components/thread/markdown-text";

export function ReleaseNotesTab() {
    const [markdownContent, setMarkdownContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch the markdown file
        fetch("/data/release-notes.md")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Failed to load release notes: ${res.statusText}`);
                }
                return res.text();
            })
            .then((text) => {
                setMarkdownContent(text);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading release notes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-red-500">Error loading release notes: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="markdown-content">
                <MarkdownText>{markdownContent}</MarkdownText>
            </div>
        </div>
    );
}
