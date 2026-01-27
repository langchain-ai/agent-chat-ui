"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { FileText, Upload, CheckCircle2, Circle, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, PanelRightClose, PanelRightOpen, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NodeDetailPanel } from "./node-detail-panel";

interface Node {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface ArtifactsListViewProps {
  artifacts: Node[];
  threadId?: string | null;
  onNodeSelect?: (node: Node | null) => void;
  selectedNode?: Node | null;
}

type ArtifactStatus = "base" | "enriched" | "uploaded";
type SortField = "name" | "section" | "type" | "status";
type SortDirection = "asc" | "desc";

interface ArtifactWithStatus extends Node {
  status: ArtifactStatus;
  hasDetails: boolean;
  section?: string;
  artifactTypes?: string[];
  filename?: string;
  versionCount?: number;
}

/**
 * Determine artifact status based on node ID and metadata
 */
function determineArtifactStatus(node: Node): { status: ArtifactStatus; hasDetails: boolean } {
  const nodeId = node.id;
  const metadata = node.metadata || {};
  const artifactId = metadata.artifact_id;
  
  // Check if it's a base artifact (ART-{number})
  const isBaseArtifact = /^ART-\d+$/.test(nodeId);
  
  // Check if it's a custom uploaded artifact (ART-{non-numeric} or UUID)
  const isCustomArtifact = nodeId.startsWith("ART-") && !/^ART-\d+$/.test(nodeId);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nodeId);
  
  // Has details if artifact_id exists (linked to uploaded content)
  const hasDetails = !!artifactId;
  
  if (isBaseArtifact) {
    return {
      status: hasDetails ? "enriched" : "base",
      hasDetails
    };
  } else if (isCustomArtifact || isUuid || hasDetails) {
    return {
      status: "uploaded",
      hasDetails: true
    };
  }
  
  // Default to base if we can't determine
  return {
    status: "base",
    hasDetails: false
  };
}

/**
 * Get section number from properties
 */
function getSection(properties?: Record<string, any>): string | undefined {
  if (!properties) return undefined;
  const section = properties.section || properties.section_number;
  return section ? `Section ${section}` : undefined;
}

/**
 * Get artifact types from metadata or properties
 */
function getArtifactTypes(node: Node): string[] {
  const metadata = node.metadata || {};
  const types = metadata.artifact_types || metadata.artifact_type;
  if (Array.isArray(types)) return types;
  if (typeof types === "string") return [types];
  return [];
}

export function ArtifactsListView({ artifacts, threadId, onNodeSelect, selectedNode }: ArtifactsListViewProps) {
  console.log("[ArtifactsListView] RENDER", { 
    artifactsCount: artifacts.length, 
    hasOnNodeSelect: !!onNodeSelect, 
    selectedNodeId: selectedNode?.id 
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArtifactStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Layout state
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [listWidth, setListWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // Smart default: Auto-open detail panel for rich content
  useEffect(() => {
    if (selectedNode) {
      // Check if content is likely rich (has diagrams, long text, etc.)
      // For now, auto-open if node is selected (user can close if they want)
      setDetailPanelOpen(true);
    }
  }, [selectedNode]);
  
  // Resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      
      const container = resizeRef.current.parentElement;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const newListWidth = (e.clientX / containerWidth) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newListWidth));
      setListWidth(constrainedWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Enrich artifacts with status and metadata
  const enrichedArtifacts = useMemo<ArtifactWithStatus[]>(() => {
    return artifacts.map(artifact => {
      const { status, hasDetails } = determineArtifactStatus(artifact);
      return {
        ...artifact,
        status,
        hasDetails,
        section: getSection(artifact.properties),
        artifactTypes: getArtifactTypes(artifact),
        filename: artifact.metadata?.filename,
        versionCount: artifact.properties?.versions || 0
      };
    });
  }, [artifacts]);

  // Filter and sort artifacts
  const filteredAndSorted = useMemo(() => {
    let filtered = enrichedArtifacts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(artifact =>
        artifact.name.toLowerCase().includes(query) ||
        artifact.description?.toLowerCase().includes(query) ||
        artifact.artifactTypes?.some(t => t.toLowerCase().includes(query)) ||
        artifact.section?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(artifact => artifact.status === statusFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "section":
          aVal = a.section || "";
          bVal = b.section || "";
          break;
        case "type":
          aVal = (a.artifactTypes?.[0] || "").toLowerCase();
          bVal = (b.artifactTypes?.[0] || "").toLowerCase();
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [enrichedArtifacts, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (artifact: ArtifactWithStatus) => {
    const baseClass = "text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1";
    
    switch (artifact.status) {
      case "base":
        return (
          <span className={cn(baseClass, "bg-blue-500/10 text-blue-500 border border-blue-500/20")}>
            <Circle className="w-2.5 h-2.5" />
            Base
          </span>
        );
      case "enriched":
        return (
          <span className={cn(baseClass, "bg-green-500/10 text-green-500 border border-green-500/20")}>
            <CheckCircle2 className="w-2.5 h-2.5" />
            Enriched
          </span>
        );
      case "uploaded":
        return (
          <span className={cn(baseClass, "bg-purple-500/10 text-purple-500 border border-purple-500/20")}>
            <Upload className="w-2.5 h-2.5" />
            Uploaded
          </span>
        );
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden relative">
      <div ref={resizeRef} className="flex-1 flex relative overflow-hidden">
        {/* List - Resizable width */}
        <div 
          className="flex flex-col overflow-hidden border-r border-border"
          style={{ width: detailPanelOpen && selectedNode ? `${listWidth}%` : '100%' }}
        >
            {/* Header with filters */}
            <div className="border-b border-border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search artifacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "base" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter("base")}
                >
                  Base
                </Button>
                <Button
                  variant={statusFilter === "enriched" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter("enriched")}
                >
                  Enriched
                </Button>
                <Button
                  variant={statusFilter === "uploaded" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter("uploaded")}
                >
                  Uploaded
                </Button>
              </div>
            </div>

            {/* List - Single scroll context */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {filteredAndSorted.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-background border-b border-border z-10 pointer-events-none">
                    <tr className="text-left">
                      <th className="p-3 text-xs font-semibold text-muted-foreground uppercase pointer-events-auto">
                        <SortButton field="status">Status</SortButton>
                      </th>
                      <th className="p-3 text-xs font-semibold text-muted-foreground uppercase pointer-events-auto">
                        <SortButton field="name">Name</SortButton>
                      </th>
                      <th className="p-3 text-xs font-semibold text-muted-foreground uppercase pointer-events-auto">
                        <SortButton field="type">Type</SortButton>
                      </th>
                      <th className="p-3 text-xs font-semibold text-muted-foreground uppercase pointer-events-auto">
                        <SortButton field="section">Section</SortButton>
                      </th>
                      <th className="p-3 text-xs font-semibold text-muted-foreground uppercase pointer-events-auto">
                        Versions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.map((artifact) => (
                      <tr
                        key={artifact.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("[ArtifactsListView] Row clicked", { artifactId: artifact.id, artifactName: artifact.name, hasOnNodeSelect: !!onNodeSelect });
                          onNodeSelect?.(artifact);
                        }}
                        className={cn(
                          "border-b border-border hover:bg-muted/50 transition-colors cursor-pointer",
                          selectedNode?.id === artifact.id && "bg-primary/5"
                        )}
                      >
                        <td 
                          className="p-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeSelect?.(artifact);
                          }}
                        >
                          {getStatusBadge(artifact)}
                        </td>
                        <td 
                          className="p-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeSelect?.(artifact);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{artifact.name}</div>
                              {artifact.filename && (
                                <div className="text-xs text-muted-foreground truncate">{artifact.filename}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td 
                          className="p-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeSelect?.(artifact);
                          }}
                        >
                          <div className="text-xs">
                            {artifact.artifactTypes && artifact.artifactTypes.length > 0 ? (
                              <span className="text-foreground">{artifact.artifactTypes.join(", ")}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td 
                          className="p-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeSelect?.(artifact);
                          }}
                        >
                          <div className="text-xs text-muted-foreground">
                            {artifact.section || "—"}
                          </div>
                        </td>
                        <td 
                          className="p-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeSelect?.(artifact);
                          }}
                        >
                          {artifact.versionCount && artifact.versionCount > 0 ? (
                            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-medium">
                              v{artifact.versionCount + 1}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-12 h-full">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 opacity-20" />
                  </div>
                  <p className="text-sm">No artifacts found</p>
                  {searchQuery && <p className="text-xs mt-1">Try adjusting your search or filters</p>}
                </div>
              )}
            </div>

            {/* Footer with count */}
            <div className="border-t border-border p-2 bg-muted/30">
              <div className="text-xs text-muted-foreground text-center">
                Showing {filteredAndSorted.length} of {artifacts.length} artifacts
              </div>
            </div>
          </div>

        {/* Resizable Divider */}
        {detailPanelOpen && selectedNode && (
          <div
            className={cn(
              "w-1 border-l border-r bg-border cursor-col-resize hover:bg-primary/20 transition-colors relative group flex-shrink-0",
              isResizing && "bg-primary/30"
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 flex items-center justify-center">
              <div className="w-0.5 h-16 bg-muted-foreground/30 group-hover:bg-primary/50 rounded-full transition-colors" />
            </div>
          </div>
        )}

        {/* Detail Panel - Resizable width */}
        {detailPanelOpen && selectedNode && (
          <div 
            className="flex-shrink-0 relative overflow-hidden flex flex-col"
            style={{ width: `${100 - listWidth}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => {
                onNodeSelect?.(null);
                setDetailPanelOpen(false);
              }}
              position="right"
              threadId={threadId}
            />
          </div>
        )}
      </div>

      {/* Toggle Detail Panel Button - Only show when node is selected */}
      {selectedNode && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-4 right-4 z-30 h-8 w-8 rounded-md border bg-background/90 backdrop-blur-sm shadow-md hover:bg-muted transition-all",
            detailPanelOpen && "right-auto"
          )}
          style={detailPanelOpen ? { right: `${100 - listWidth}%`, transform: 'translateX(-100%)' } : {}}
          onClick={() => setDetailPanelOpen(!detailPanelOpen)}
          title={detailPanelOpen ? "Hide detail panel" : "Show detail panel"}
        >
          {detailPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      )}


      {/* Mode indicator */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Artifacts View</span>
        </div>
      </div>
    </div>
  );
}
