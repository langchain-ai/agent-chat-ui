"use client";

import React, { useState } from "react";
import { ContentRenderer } from "./index";
import { MarkdownText } from "@/components/thread/markdown-text";
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

  React.useEffect(() => {
    console.log("[DiagramViewer] ENTER useEffect: fetchDiagram", { diagramType, title });
    const url = `/api/architecture/diagram/${diagramType}`;
    console.log("[DiagramViewer] [BRANCH] Fetching diagram from URL:", url);

    fetch(url)
      .then((res) => {
        console.log("[DiagramViewer] [BRANCH] Diagram fetch response:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`Failed to load ${title}: ${res.statusText}`);
        }
        return res.text();
      })
      .then((html) => {
        console.log("[DiagramViewer] [BRANCH] Diagram HTML received, length:", html?.length || 0);
        setHtmlContent(html);
        setLoading(false);
        console.log("[DiagramViewer] EXIT fetchDiagram: SUCCESS");
      })
      .catch((err) => {
        console.error("[DiagramViewer] EXIT fetchDiagram: ERROR", err);
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

/**
 * Architecture Content Component
 * Function component that manages diagram state
 */
function ArchitectureContent({ content }: { content: string }) {
  const [activeDiagram, setActiveDiagram] = useState<DiagramType | null>(null);

  const diagrams = [
    { id: "erd" as DiagramType, label: "Entity Relationship", description: "Key entities and relationships across systems" },
    { id: "c4" as DiagramType, label: "C4 Architecture", description: "System containers, components, and interactions" },
    { id: "dataflow" as DiagramType, label: "Data Flow", description: "Data flow and sequence of operations" },
  ];

  console.log("[ArchitectureRenderer] [BRANCH] Rendering architecture content", { activeDiagram });
  return (
    <div className="space-y-6">
      {/* Markdown Content */}
      <div className="markdown-content-wrapper">
        <MarkdownText>{content}</MarkdownText>
      </div>

      {/* Architecture Diagrams Section */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Architecture Diagrams</h3>
          <p className="text-sm text-muted-foreground">
            Interactive D3.js visualizations of the system architecture
          </p>
        </div>

        <div className="flex gap-2 border-b pb-2">
          {diagrams.map((diagram) => (
            <Button
              key={diagram.id}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log("[ArchitectureRenderer] [BRANCH] Diagram selected:", diagram.id);
                setActiveDiagram(diagram.id);
              }}
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

        {activeDiagram && (
          <div className="space-y-4">
            {diagrams.find(d => d.id === activeDiagram) && (
              <>
                <div>
                  <h4 className="text-md font-semibold">
                    {diagrams.find(d => d.id === activeDiagram)?.label}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {diagrams.find(d => d.id === activeDiagram)?.description}
                  </p>
                </div>
                <DiagramViewer 
                  diagramType={activeDiagram} 
                  title={diagrams.find(d => d.id === activeDiagram)?.label || ""} 
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Architecture Content Renderer
 * Renders architecture content with markdown and interactive diagrams
 */
export class ArchitectureRenderer implements ContentRenderer {
  render(content: string, metadata?: Record<string, any>): React.ReactNode {
    console.log("[ArchitectureRenderer] ENTER render", { contentLength: content?.length || 0, hasMetadata: !!metadata });
    console.log("[ArchitectureRenderer] EXIT render: SUCCESS");
    return <ArchitectureContent content={content} />;
  }
}

// Register the renderer
import { contentRendererRegistry } from "./index";
if (contentRendererRegistry) {
  contentRendererRegistry.register("architecture", new ArchitectureRenderer());
}
