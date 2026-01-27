"use client";

import { ContentRenderer } from "./index";

/**
 * Text Content Renderer
 * Renders plain text content with basic formatting
 */
export class TextRenderer implements ContentRenderer {
  render(content: string, metadata?: Record<string, any>): React.ReactNode {
    console.log("[TextRenderer] ENTER render", { contentLength: content?.length || 0, hasMetadata: !!metadata });
    const result = (
      <div className="text-content-wrapper">
        <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded-lg border border-border overflow-auto max-h-[600px]">
          {content}
        </pre>
      </div>
    );
    console.log("[TextRenderer] EXIT render: SUCCESS");
    return result;
  }
}

// Register the renderer
import { contentRendererRegistry } from "./index";
if (contentRendererRegistry) {
  contentRendererRegistry.register("text", new TextRenderer());
}
