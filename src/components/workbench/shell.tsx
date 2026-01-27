"use client";

import { Suspense, useState, useEffect, useLayoutEffect, useRef } from "react";
import { Sidebar } from "./sidebar";
import { useRouter } from "next/navigation";
import { UserMenu } from "@/components/thread/user-menu";
import { Breadcrumbs } from "./breadcrumbs";
import { OrgSwitcher } from "./org-switcher";
import { useStreamContext } from "@/providers/Stream";
import { Thread } from "@/components/thread";
import { MessageSquare, Map as MapIcon, Workflow, Activity, X, PanelRight, Sparkles, Circle, Download } from "lucide-react";
import { useRecording } from "@/providers/RecordingProvider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { useArtifactOpen, ArtifactContent, ArtifactTitle } from "@/components/thread/artifact";
import { PanelLeft, FileText, Layout, GitGraph, CheckSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProductPanel } from "@/components/product-panel/ProductPanel";
import { EnrichmentView } from "./enrichment-view";

export function WorkbenchShell({ children }: { children: React.ReactNode }) {
    const stream = useStreamContext();
    const { isRecording, startRecording, stopRecording, downloadRecording } = useRecording();

    // Robust Mode Derivation
    const values = (stream as any)?.values;
    const rawAgent = values?.active_agent;
    // Fallback: If active_agent is missing, infer from visualization content or default to supervisor
    const activeAgent = rawAgent ||
        (values?.visualization_html?.includes("active_node='hydrator'") || values?.visualization_html?.includes("Hydrator")
            ? "hydrator"
            : "supervisor");

    const [viewMode, setViewMode] = useQueryState("view", { defaultValue: "map" });
    const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true);
    const [agentPanelHeight, setAgentPanelHeight] = useState(300); // Default height in pixels
    const [isResizing, setIsResizing] = useState(false);
    const [isArtifactOpen, closeArtifact] = useArtifactOpen();
    const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const agentPanelRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Agent-Driven View Synchronization (Backend -> UI)
    const workbenchView = (stream as any)?.values?.workbench_view;
    const lastSyncedView = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!workbenchView) return;

        // Only sync if the backend specifically changed its requested view
        // effectively treating it as an event rather than a state enforcement
        if (workbenchView !== lastSyncedView.current) {
            console.log(`[WorkbenchShell] Backend synced view to: ${workbenchView}`);
            lastSyncedView.current = workbenchView;

            if (["map", "workflow", "artifacts", "enrichment"].includes(workbenchView)) {
                // Internal Sub-view Toggle
                setViewMode(workbenchView);
                closeArtifact();
                // Ensure we are on the map page if we switch to these sub-views
                if (!window.location.pathname.includes("/workbench/map")) {
                    router.push("/workbench/map");
                }
            } else if (workbenchView === "discovery") {
                router.push("/workbench/discovery");
            } else if (workbenchView === "settings") {
                router.push("/workbench/settings");
            } else if (workbenchView === "backlog") {
                router.push("/workbench/backlog");
            }
        }
    }, [workbenchView, setViewMode, closeArtifact, router]);

    // User-Driven View Synchronization (UI -> Backend)
    useEffect(() => {
        if (!viewMode) return;

        // Detect manual user-initiated view changes (including URL updates)
        if (viewMode !== lastSyncedView.current) {
            console.log(`[WorkbenchShell] User-initiated view change to: ${viewMode}`);
            lastSyncedView.current = viewMode;
            stream.setWorkbenchView(viewMode as any).catch(e => {
                console.warn("[WorkbenchShell] Failed to sync view to backend:", e);
            });
        }
    }, [viewMode, stream]);

    // Handle panel resizing
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            const container = document.querySelector('[data-workbench-container]') as HTMLElement;
            if (!container) return;
            
            const containerRect = container.getBoundingClientRect();
            const containerHeight = containerRect.height;
            const headerHeight = 56; // h-14 = 56px
            const availableHeight = containerHeight - headerHeight;
            
            // Calculate new agent panel height from bottom
            const mouseY = e.clientY;
            const relativeY = containerRect.bottom - mouseY;
            
            // Constrain between min and max heights
            const minHeight = 150; // Minimum 150px for agent panel
            const maxHeight = availableHeight - 200; // Leave at least 200px for workbench
            const newHeight = Math.max(minHeight, Math.min(maxHeight, relativeY));
            
            setAgentPanelHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    // Ensure layout is calculated synchronously before paint
    useLayoutEffect(() => {
        setIsMounted(true);
        // Force a layout recalculation
        if (agentPanelRef.current) {
            // Trigger a reflow to ensure height constraints are applied
            void agentPanelRef.current.offsetHeight;
        }
    }, []);

    // Recalculate when agent panel opens/closes
    useLayoutEffect(() => {
        if (isAgentPanelOpen && agentPanelRef.current) {
            // Force layout recalculation
            void agentPanelRef.current.offsetHeight;
        }
    }, [isAgentPanelOpen, agentPanelHeight]);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar - Collapsible */}
            <div className={cn(
                "relative transition-all duration-300 border-r bg-muted/20 flex flex-col h-full overflow-hidden",
                isSidebarCollapsed ? "w-0 border-0" : "w-64"
            )}>
                {!isSidebarCollapsed && <Sidebar />}
                {/* Collapse Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute top-4 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted transition-all",
                        isSidebarCollapsed ? "-right-3" : "-right-3"
                    )}
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                    <PanelLeft className={cn("h-3.5 w-3.5 transition-transform", isSidebarCollapsed && "rotate-180")} />
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0" data-workbench-container>
                {/* Level 1: Global Context Header */}
                <header className="h-14 border-b flex items-center justify-between px-6 bg-background z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <Suspense fallback={<div className="h-4 w-32 bg-muted animate-pulse rounded" />}>
                            <Breadcrumbs />
                        </Suspense>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Workflow Status */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border shadow-sm mr-2">
                            <Activity className={cn(
                                "w-3.5 h-3.5",
                                stream.isLoading ? "text-amber-500 animate-pulse" : "text-emerald-500"
                            )} />
                            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Mode:
                            </span>
                            <span className="text-xs font-semibold text-foreground capitalize">
                                {activeAgent}
                            </span>
                        </div>

                        <div className="h-6 w-[1px] bg-border mx-1" />

                        {/* What's New Trigger */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setReleaseNotesOpen(true)}
                                    className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>What's New</TooltipContent>
                        </Tooltip>

                        {/* Theme Toggle at Global Level */}
                        <ThemeToggle />

                        {/* Session Recording (Debug) */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (isRecording) {
                                            stopRecording();
                                            downloadRecording();
                                        } else {
                                            startRecording();
                                        }
                                    }}
                                    className={cn(
                                        "h-9 w-9 text-muted-foreground hover:text-foreground relative",
                                        isRecording && "text-red-500 hover:text-red-600 animate-pulse bg-red-500/10"
                                    )}
                                >
                                    {isRecording ? <Download className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isRecording ? "Stop & Download Session" : "Record Session (Debug)"}
                            </TooltipContent>
                        </Tooltip>

                        {/* Workbench Panel Trigger */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsWorkbenchOpen(!isWorkbenchOpen)}
                                    className={cn(
                                        "h-9 w-9 text-muted-foreground hover:text-foreground relative transition-all",
                                        isWorkbenchOpen && "bg-muted text-foreground"
                                    )}
                                >
                                    <Layout className="w-4 h-4" />
                                    {stream.isLoading && (
                                        <span className="absolute top-2 right-2 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                        </span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle Workbench</TooltipContent>
                        </Tooltip>

                        {/* Agent Panel Toggle */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
                                    className={cn(
                                        "h-9 w-9 text-muted-foreground hover:text-foreground relative transition-all",
                                        isAgentPanelOpen && "bg-muted text-foreground"
                                    )}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle Agent Chat</TooltipContent>
                        </Tooltip>

                        <UserMenu />
                    </div>
                </header>

                {/* Level 3: Content Stage - Workbench takes main area */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {/* Workbench Main Area */}
                    <div className="flex-1 flex overflow-hidden min-h-0" style={{ height: isAgentPanelOpen ? `calc(100% - ${agentPanelHeight}px)` : '100%', maxHeight: isAgentPanelOpen ? `calc(100% - ${agentPanelHeight}px)` : '100%' }}>
                        {isWorkbenchOpen && (
                            <aside className="flex-1 border-l bg-background flex flex-col shadow-xl z-30">
                            {/* Workbench Tabs - Now inside the Right Pane */}
                            <div className="h-12 border-b flex items-center px-6 bg-muted/10 shrink-0">
                                <div className="flex items-center space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 px-3 gap-2 text-xs font-medium transition-all",
                                            viewMode === "map" ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                        onClick={() => { setViewMode("map"); closeArtifact(); stream.setWorkbenchView("map"); }}
                                    >
                                        <MapIcon className="w-3.5 h-3.5" />
                                        Map
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 px-3 gap-2 text-xs font-medium transition-all",
                                            viewMode === "workflow" ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                        onClick={() => { setViewMode("workflow"); closeArtifact(); stream.setWorkbenchView("workflow"); }}
                                    >
                                        <Workflow className="w-3.5 h-3.5" />
                                        Workflow
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 px-3 gap-2 text-xs font-medium transition-all",
                                            viewMode === "artifacts" ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                        onClick={() => { setViewMode("artifacts"); closeArtifact(); stream.setWorkbenchView("artifacts"); }}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Artifacts
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 px-3 gap-2 text-xs font-medium transition-all",
                                            viewMode === "enrichment" ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                        onClick={() => { setViewMode("enrichment"); closeArtifact(); stream.setWorkbenchView("enrichment"); }}
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        Enrichment
                                    </Button>
                                </div>
                            </div>

                            {/* Workbench Content */}
                            {isArtifactOpen ? (
                                <div className="h-full w-full flex flex-col relative">
                                    <div className="flex items-center justify-between border-b px-6 py-3 bg-background/95 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">Artifact Viewer</span>
                                            <ArtifactTitle className="text-sm font-medium" />
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={closeArtifact} className="h-8 w-8 p-0">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-6 bg-muted/5">
                                        <ArtifactContent className="max-w-4xl mx-auto bg-background border rounded-lg shadow-sm min-h-[500px]" />
                                    </div>
                                </div>
                            ) : viewMode === "enrichment" ? (
                                <div className="h-full w-full overflow-hidden">
                                    <EnrichmentView />
                                </div>
                            ) : (
                                <div className="h-full w-full overflow-hidden">
                                    {children}
                                </div>
                            )}
                            </aside>
                        )}
                    </div>

                    {/* Resizable Divider */}
                    {isAgentPanelOpen && (
                        <div
                            className={cn(
                                "h-1 border-t border-b bg-border cursor-row-resize hover:bg-primary/20 transition-colors relative group",
                                isResizing && "bg-primary/30"
                            )}
                            onMouseDown={handleMouseDown}
                            style={{ minHeight: '4px' }}
                        >
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 flex items-center justify-center">
                                <div className="h-0.5 w-16 bg-muted-foreground/30 group-hover:bg-primary/50 rounded-full transition-colors" />
                            </div>
                        </div>
                    )}

                    {/* Agent Chat Panel - Bottom */}
                    <div 
                        ref={agentPanelRef}
                        className="relative shrink-0 overflow-hidden" 
                        style={{ 
                            height: isAgentPanelOpen ? `${agentPanelHeight}px` : '0px', 
                            maxHeight: isAgentPanelOpen ? `${agentPanelHeight}px` : '0px',
                            minHeight: isAgentPanelOpen ? `${agentPanelHeight}px` : '0px'
                        }}
                    >
                        {isAgentPanelOpen && isMounted ? (
                            <div 
                                className={cn(
                                    "bg-background transition-all duration-300 flex flex-col h-full overflow-hidden",
                                    !isResizing && "transition-all"
                                )}
                                style={{ height: '100%', maxHeight: '100%' }}
                            >
                                {/* Agent Panel Header */}
                                <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0" style={{ flexShrink: 0, height: '40px' }}>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-semibold text-foreground">Agent Chat</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setIsAgentPanelOpen(false)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                {/* Agent Chat Content */}
                                <div className="flex-1 min-h-0 overflow-hidden bg-background" style={{ 
                                    height: `calc(100% - 40px)`, 
                                    maxHeight: `calc(100% - 40px)`, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    flex: '1 1 auto'
                                }}>
                                    <div className="h-full w-full overflow-hidden" style={{ 
                                        maxHeight: '100%', 
                                        height: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column' 
                                    }}>
                                        <Thread embedded hideArtifacts />
                                    </div>
                                </div>
                            </div>
                        ) : isAgentPanelOpen && !isMounted ? (
                            <div className="bg-background flex flex-col h-full overflow-hidden">
                                <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-semibold text-foreground">Agent Chat</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 overflow-hidden bg-background flex items-center justify-center">
                                    <div className="text-xs text-muted-foreground">Loading...</div>
                                </div>
                            </div>
                        ) : (
                            /* Agent Panel Toggle - Show when collapsed */
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 h-8 px-3 bg-background border shadow-md hover:bg-muted z-50"
                                onClick={() => setIsAgentPanelOpen(true)}
                            >
                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                <span className="text-xs">Show Agent Chat</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ProductPanel open={releaseNotesOpen} onClose={() => setReleaseNotesOpen(false)} />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div >
    );
}
