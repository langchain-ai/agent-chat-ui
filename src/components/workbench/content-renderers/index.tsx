"use client";

import { ReactNode } from "react";

/**
 * Content Renderer Interface
 * All content renderers must implement this interface
 */
export interface ContentRenderer {
  /**
   * Render the content
   * @param content - The content to render (string)
   * @param metadata - Optional metadata about the content
   */
  render(content: string, metadata?: Record<string, any>): ReactNode;
}

/**
 * Content Renderer Registry
 * Maps content types to their renderers
 */
class ContentRendererRegistry {
  private renderers: Map<string, ContentRenderer> = new Map();

  /**
   * Register a content renderer
   */
  register(contentType: string, renderer: ContentRenderer): void {
    this.renderers.set(contentType, renderer);
  }

  /**
   * Get a renderer for a content type
   */
  get(contentType: string): ContentRenderer | undefined {
    return this.renderers.get(contentType);
  }

  /**
   * Check if a content type has a renderer
   */
  has(contentType: string): boolean {
    return this.renderers.has(contentType);
  }

  /**
   * Get all registered content types
   */
  getContentTypes(): string[] {
    return Array.from(this.renderers.keys());
  }
}

// Singleton instance - create and export immediately
const _contentRendererRegistry = new ContentRendererRegistry();

// Export getter to ensure registry is always available
export const contentRendererRegistry = _contentRendererRegistry;

// Note: Renderers register themselves when imported
// They are imported by components that use them (e.g., node-detail-panel.tsx)
// This avoids circular dependency issues
