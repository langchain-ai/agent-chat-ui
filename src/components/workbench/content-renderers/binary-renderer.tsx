"use client";

import { ContentRenderer } from "./index";

/**
 * Binary Content Renderer
 * Renders binary content with download option
 */
export class BinaryRenderer implements ContentRenderer {
  render(content: string, metadata?: Record<string, any>): React.ReactNode {
    console.log("[BinaryRenderer] ENTER render", { contentLength: content?.length || 0, hasMetadata: !!metadata });
    const filename = metadata?.filename || "file";
    const mimeType = metadata?.mime_type || "application/octet-stream";
    
    // If content is base64, we can create a download link
    const isBase64 = /^data:/.test(content) || /^[A-Za-z0-9+/=]+$/.test(content);
    console.log("[BinaryRenderer] [BRANCH] Binary file info", { filename, mimeType, isBase64 });
    
    const result = (
      <div className="binary-content-wrapper">
        <div className="flex flex-col items-center justify-center p-8 border border-border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground mb-4">
            Binary file: {filename}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Type: {mimeType}
          </p>
          {isBase64 && (
            <a
              href={`data:${mimeType};base64,${content}`}
              download={filename}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Download File
            </a>
          )}
        </div>
      </div>
    );
    console.log("[BinaryRenderer] EXIT render: SUCCESS");
    return result;
  }
}

// Register the renderer
import { contentRendererRegistry } from "./index";
if (contentRendererRegistry) {
  contentRendererRegistry.register("binary", new BinaryRenderer());
}
