"use client";

import React, { useEffect, useState } from "react";
import { ZoomOut, Activity, Loader2 } from "lucide-react";
import { Button as UIButton } from "@/components/ui/button";
import { contentRendererRegistry } from "./content-renderers";
// Import renderers to ensure they register themselves
import "./content-renderers/markdown-renderer";
import "./content-renderers/architecture-renderer";
import "./content-renderers/text-renderer";
import "./content-renderers/binary-renderer";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, any>;
}

interface NodeDetailPanelProps {
  node: Node | null;
  onClose: () => void;
  position?: "left" | "right";
  threadId?: string | null;
}

interface ArtifactContent {
  content: string;
  content_type: string;
  metadata?: Record<string, any>;
  version?: string;
}

export function NodeDetailPanel({ 
  node, 
  onClose, 
  position = "right",
  threadId 
}: NodeDetailPanelProps) {
  const [content, setContent] = useState<ArtifactContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artifactHistory, setArtifactHistory] = useState<any[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historicalContent, setHistoricalContent] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Fetch artifact content when node changes
  useEffect(() => {
    console.log("[NodeDetailPanel] ENTER useEffect: fetchContent", { nodeId: node?.id, threadId, selectedVersion });
    if (!node) {
      console.log("[NodeDetailPanel] [BRANCH] No node provided, clearing content");
      setContent(null);
      setError(null);
      return;
    }

    const fetchContent = async () => {
      console.log("[NodeDetailPanel] [BRANCH] Starting fetchContent", { nodeId: node.id, threadId, selectedVersion });
      setLoading(true);
      setError(null);
      try {
        const orgContext = localStorage.getItem('reflexion_org_context');
        const headers: Record<string, string> = {};
        if (orgContext) headers['X-Organization-Context'] = orgContext;

        let url = `/api/artifact/content?node_id=${node.id}`;
        if (threadId) url += `&thread_id=${threadId}`;
        if (selectedVersion) url += `&version=${selectedVersion}`;

        console.log("[NodeDetailPanel] [BRANCH] Fetching content from URL:", url);
        const res = await fetch(url, { headers });
        if (!res.ok) {
          console.error("[NodeDetailPanel] [BRANCH] Fetch failed:", res.status, res.statusText);
          throw new Error(`Failed to fetch content: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("[NodeDetailPanel] [BRANCH] Content received:", { 
          contentType: data.content_type, 
          contentLength: data.content?.length || 0,
          hasMetadata: !!data.metadata 
        });
        setContent(data);
        console.log("[NodeDetailPanel] EXIT fetchContent: SUCCESS");
      } catch (err: any) {
        console.error("[NodeDetailPanel] EXIT fetchContent: ERROR", err);
        setError(err.message || "Failed to load content");
        console.error("[NodeDetailPanel] Error fetching content:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [node, threadId, selectedVersion]);

  // Fetch artifact history for ARTIFACT nodes
  useEffect(() => {
    console.log("[NodeDetailPanel] ENTER useEffect: fetchHistory", { nodeId: node?.id, nodeType: node?.type });
    if (!node || node.type !== 'ARTIFACT') {
      console.log("[NodeDetailPanel] [BRANCH] Not an ARTIFACT node, skipping history fetch");
      setArtifactHistory(null);
      return;
    }

    const fetchHistory = async () => {
      console.log("[NodeDetailPanel] [BRANCH] Starting fetchHistory", { nodeId: node.id });
      setLoadingHistory(true);
      try {
        const orgContext = localStorage.getItem('reflexion_org_context');
        const headers: Record<string, string> = {};
        if (orgContext) headers['X-Organization-Context'] = orgContext;

        let url = `/api/artifact/history?node_id=${node.id}`;
        if (threadId) url += `&thread_id=${threadId}`;

        console.log("[NodeDetailPanel] [BRANCH] Fetching history from URL:", url);
        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          const versions = json.versions || [];
          console.log("[NodeDetailPanel] [BRANCH] History received:", { versionCount: versions.length });
          setArtifactHistory(versions);
          console.log("[NodeDetailPanel] EXIT fetchHistory: SUCCESS");
        } else {
          console.warn("[NodeDetailPanel] [BRANCH] History fetch failed:", res.status, res.statusText);
        }
      } catch (err) {
        console.error("[NodeDetailPanel] EXIT fetchHistory: ERROR", err);
        console.error("[NodeDetailPanel] Error fetching history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [node, threadId]);

  if (!node) return null;

  const typeConfig: Record<string, { label: string }> = {
    DOMAIN: { label: 'Domain' },
    REQ: { label: 'Trigger' },
    ARTIFACT: { label: 'Artifact' },
    MECH: { label: 'Mechanism' },
    CRIT: { label: 'Risk' },
  };

  const typeLabel = typeConfig[node.type]?.label || node.type;

  // Get renderer for content type
  const contentType = content?.content_type || "text";
  console.log("[NodeDetailPanel] [BRANCH] Selecting renderer", { contentType, availableRenderers: contentRendererRegistry.getContentTypes() });
  const renderer = contentRendererRegistry.get(contentType) || contentRendererRegistry.get("text");
  console.log("[NodeDetailPanel] [BRANCH] Renderer selected", { contentType, hasRenderer: !!renderer });

  return (
    <div 
      className={cn(
        "h-full w-full flex flex-col bg-background border-l border-border",
        position === "left" ? "border-l-0 border-r" : ""
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex justify-between items-start p-5 pb-4 border-b border-border bg-background z-10">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            {typeLabel}
          </span>
          <h3 className="text-lg font-bold text-foreground leading-tight truncate">{node.name}</h3>
        </div>
        <UIButton variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onClose}>
          <ZoomOut className="h-3.5 w-3.5" />
        </UIButton>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 pt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : historicalContent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-500 uppercase">Historical Preview</span>
              <UIButton 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[9px]" 
                onClick={() => {
                  setHistoricalContent(null);
                  setSelectedVersion(null);
                }}
              >
                Back to Current
              </UIButton>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="prose prose-invert prose-xs max-h-[40vh] overflow-y-auto whitespace-pre-wrap text-[11px] font-mono leading-relaxed">
                {historicalContent}
              </div>
            </div>
          </div>
        ) : content ? (
          <>
            {/* Render content using appropriate renderer */}
            <div className="content-renderer-wrapper min-h-0">
              {renderer?.render(content.content, content.metadata)}
            </div>

            {/* Properties */}
            {node.properties && Object.keys(node.properties).length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Technical Specs</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(node.properties).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="bg-muted rounded p-2">
                      <div className="text-[9px] text-muted-foreground uppercase">{k}</div>
                      <div className="text-[10px] text-foreground truncate">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Version History */}
            {node.type === 'ARTIFACT' && artifactHistory && artifactHistory.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Version History</span>
                </div>
                <div className="space-y-1.5">
                  {artifactHistory.map((v: any) => (
                    <div
                      key={v.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted transition-colors cursor-pointer group",
                        selectedVersion === v.id && "bg-muted border border-primary"
                      )}
                      onClick={async () => {
                        setSelectedVersion(v.id);
                        // Fetch historical version content
                        try {
                          const orgContext = localStorage.getItem('reflexion_org_context');
                          const headers: Record<string, string> = {};
                          if (orgContext) headers['X-Organization-Context'] = orgContext;

                          let url = `/api/artifact/content?node_id=${node.id}&version=${v.id}`;
                          if (threadId) url += `&thread_id=${threadId}`;

                          const res = await fetch(url, { headers });
                          if (res.ok) {
                            const data = await res.json();
                            setHistoricalContent(data.content);
                          }
                        } catch (err) {
                          console.error("[NodeDetailPanel] Error fetching historical version:", err);
                        }
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-foreground">{v.id}</span>
                        <span className="text-[9px] text-muted-foreground">{v.timestamp}</span>
                      </div>
                      <UIButton variant="ghost" size="sm" className="h-6 px-2 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </UIButton>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {node.description || "No detailed description available for this node."}
          </p>
        )}
      </div>
    </div>
  );
}
