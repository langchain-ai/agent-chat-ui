"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DiagramType = "erd" | "c4" | "dataflow";

interface DiagramViewerProps {
    diagramType: DiagramType;
    title: string;
}

function DiagramViewer({ diagramType, title }: DiagramViewerProps) {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const url = `/api/architecture/diagram/${diagramType}`;

        fetch(url)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Failed to load ${title}: ${res.statusText}`);
                }
                return res.text();
            })
            .then((html) => {
                setHtmlContent(html);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [diagramType, title]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading {title}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-red-500">Error loading {title}: {error}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[500px] border border-border rounded-lg overflow-hidden bg-background">
            <iframe
                srcDoc={`
                    <html>
                        <head>
                            <style>
                                body { margin: 0; background: transparent; }
                            </style>
                        </head>
                        <body>
                            ${htmlContent}
                        </body>
                    </html>
                `}
                className="w-full h-full border-none"
                title={title}
            />
        </div>
    );
}

export function ArchitectureTab() {
    const [activeDiagram, setActiveDiagram] = useState<DiagramType>("erd");

    const diagrams = [
        { id: "erd" as DiagramType, label: "Entity Relationship", description: "Key entities and relationships across systems" },
        { id: "c4" as DiagramType, label: "C4 Architecture", description: "System containers, components, and interactions" },
        { id: "dataflow" as DiagramType, label: "Data Flow", description: "Data flow and sequence of operations" },
    ];

    const activeDiagramInfo = diagrams.find(d => d.id === activeDiagram);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Reflexion Architecture</h2>
                <p className="text-muted-foreground text-sm">
                    Interactive D3.js visualizations of the Reflexion system architecture
                </p>
            </div>

            <div className="flex gap-2 border-b pb-2">
                {diagrams.map((diagram) => (
                    <Button
                        key={diagram.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveDiagram(diagram.id)}
                        className={cn(
                            "rounded-none border-b-2 border-transparent -mb-[2px]",
                            activeDiagram === diagram.id
                                ? "border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {diagram.label}
                    </Button>
                ))}
            </div>

            <div className="space-y-4">
                {activeDiagramInfo && (
                    <>
                        <div>
                            <h3 className="text-lg font-semibold">{activeDiagramInfo.label}</h3>
                            <p className="text-sm text-muted-foreground">{activeDiagramInfo.description}</p>
                        </div>
                        <DiagramViewer diagramType={activeDiagram} title={activeDiagramInfo.label} />
                    </>
                )}
            </div>
        </div>
    );
}
