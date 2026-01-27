'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Search, RefreshCw, ZoomIn, ZoomOut, Maximize, Activity, Globe, GitGraph, FileText, GitCompare } from 'lucide-react';
import { Button as UIButton } from '@/components/ui/button';
import { useStreamContext } from '@/providers/Stream';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { NodeDetailPanel } from './node-detail-panel';
import { ArtifactsListView } from './artifacts-list-view';

interface Node extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    type: string;
    is_active?: boolean;
    description?: string;
    properties?: any;
    metadata?: Record<string, any>;
    diff_status?: 'added' | 'modified' | 'removed';
}

interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
    is_active?: boolean;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
    metadata: {
        active_trigger?: string;
        customer_id: string;
        thread_id: string;
    };
}

const typeConfig: Record<string, { color: string; label: string }> = {
    DOMAIN: { color: '#64748b', label: 'Domain' },
    REQ: { color: '#fbbf24', label: 'Trigger' },
    ARTIFACT: { color: '#0ea5e9', label: 'Artifact' },
    MECH: { color: '#a855f7', label: 'Mechanism' },
    CRIT: { color: '#f43f5e', label: 'Risk' },
};

export function WorldMapView() {
    const stream = useStreamContext();
    const [viewMode, setViewMode] = useQueryState("view", { defaultValue: "map" });
    const visualizationHtml = (stream as any)?.values?.visualization_html;

    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [threadId] = useQueryState("threadId");

    const [kgHistory, setKgHistory] = useState<{ versions: any[], total: number } | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);

    const [showHistory, setShowHistory] = useState(false);
    const [activeVersion, setActiveVersion] = useState<string | null>(null);
    const [inactiveOpacity, setInactiveOpacity] = useState(0.15); // Transparency for inactive nodes (0-1)
    const [compareMode, setCompareMode] = useState(false);
    const [compareVersion1, setCompareVersion1] = useState<string | null>(null);
    const [compareVersion2, setCompareVersion2] = useState<string | null>(null);
    const [diffData, setDiffData] = useState<any>(null);
    const [loadingDiff, setLoadingDiff] = useState(false);

    // Auto-toggle to workflow when a new visualization arrives
    useEffect(() => {
        if (visualizationHtml && viewMode !== 'workflow') {
            const timer = setTimeout(() => setViewMode('workflow'), 500);
            return () => clearTimeout(timer);
        }
    }, [visualizationHtml]);

    // Note: Artifact history and content fetching is now handled by NodeDetailPanel

    const fetchKgHistory = async () => {
        try {
            const orgContext = localStorage.getItem('reflexion_org_context');
            const headers: Record<string, string> = {};
            if (orgContext) headers['X-Organization-Context'] = orgContext;
            const url = threadId ? `/api/project/history?thread_id=${threadId}` : '/api/project/history';
            const res = await fetch(url, { headers });
            if (res.ok) setKgHistory(await res.json());
        } catch (e) { console.error('History fetch error:', e); }
    };

    const fetchDiff = async (v1: string, v2: string) => {
        if (!v1 || !v2 || !threadId) return;
        try {
            setLoadingDiff(true);
            const orgContext = localStorage.getItem('reflexion_org_context');
            const headers: Record<string, string> = {};
            if (orgContext) headers['X-Organization-Context'] = orgContext;
            const url = `/api/project/diff?thread_id=${threadId}&version1=${v1}&version2=${v2}`;
            const res = await fetch(url, { headers });
            if (res.ok) {
                const diff = await res.json();
                console.log('[WorldMapView] Fetched diff data:', {
                    version1: v1,
                    version2: v2,
                    diff: diff,
                    diffNodes: diff.diff?.nodes?.length || 0,
                    summary: diff.summary
                });
                setDiffData(diff);
            } else {
                console.error('Diff fetch failed:', await res.text());
            }
        } catch (e) {
            console.error('Diff fetch error:', e);
        } finally {
            setLoadingDiff(false);
        }
    };

    const fetchData = async (version?: string, preserveDiff: boolean = false) => {
        try {
            setLoading(true);
            setError(null);
            const orgContext = localStorage.getItem('reflexion_org_context');
            const headers: Record<string, string> = {};
            if (orgContext) headers['X-Organization-Context'] = orgContext;

            let url = threadId ? `/api/kg-data?thread_id=${threadId}` : '/api/kg-data';
            // When viewing with diff, disable focus mode to show all nodes (including newly added ones)
            const useFocus = isFocusMode && !preserveDiff;
            if (useFocus) {
                url += threadId ? `&focus=true` : `?focus=true`;
            }
            if (version) {
                url += `&version=${version}`;
                setActiveVersion(version);
            } else {
                setActiveVersion(null);
            }

            console.log('[WorldMapView] Fetching data:', { url, preserveDiff, useFocus, version });
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error('Failed to fetch graph data');
            const json = await res.json();
            console.log('[WorldMapView] Fetched data:', {
                thread_id: json.metadata?.thread_id,
                node_count: json.nodes?.length,
                inactive_count: json.nodes?.filter((n: any) => n.is_active === false).length,
                active_count: json.nodes?.filter((n: any) => n.is_active === true).length,
                null_is_active: json.nodes?.filter((n: any) => n.is_active === undefined).length
            });
            setData(json);
            // Only update history list if we are loading the latest version, 
            // otherwise we might get a stale list if we time travel back
            if (!version) fetchKgHistory();
            // Clear diff data unless we're preserving it (e.g., when viewing version 2 with diff)
            if (!preserveDiff && !compareMode) {
                setDiffData(null);
            }
        } catch (err: any) {
            console.error('[WorldMapView] Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [threadId, isFocusMode]);

    useEffect(() => {
        if (!data || !svgRef.current || !containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const g = svg.append('g');

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Arrow marker
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#888');

        // Filter out nodes and links that should be completely hidden (if any)
        // With current transparency model, we might still want to show all but ghosted
        const nodes = data.nodes.map(d => ({ ...d }));
        const links = data.links.map(d => ({ ...d }));
        
        // If we have diff data, merge it into nodes for visualization
        // Note: We only show nodes that exist in the current version (version 2)
        // Removed nodes are filtered out since they don't exist in version 2
        if (diffData && diffData.diff && diffData.diff.nodes) {
            console.log('[WorldMapView] Applying diff visualization:', {
                diffDataStructure: {
                    hasDiff: !!diffData.diff,
                    hasNodes: !!diffData.diff.nodes,
                    nodesLength: diffData.diff.nodes?.length,
                    summary: diffData.summary
                },
                diffNodes: diffData.diff.nodes.length,
                currentNodes: nodes.length,
                sampleDiffNode: diffData.diff.nodes[0],
                sampleCurrentNode: nodes[0]
            });
            
            // Create maps for both ID and name matching (fallback)
            const diffNodesById = new Map(diffData.diff.nodes.map((n: any) => [n.id, n]));
            const diffNodesByName = new Map(diffData.diff.nodes.map((n: any) => [n.name || (n as any).label, n]));
            
            // Log detailed structure
            const sampleDiffNode = diffData.diff.nodes[0];
            const sampleCurrentNode = nodes[0];
            console.log('[WorldMapView] Sample diff node structure:', {
                id: sampleDiffNode?.id,
                name: sampleDiffNode?.name,
                diff_status: sampleDiffNode?.diff_status,
                keys: sampleDiffNode ? Object.keys(sampleDiffNode) : []
            });
            console.log('[WorldMapView] Sample current node structure:', {
                id: sampleCurrentNode?.id,
                name: sampleCurrentNode?.name,
                keys: sampleCurrentNode ? Object.keys(sampleCurrentNode) : []
            });
            
            console.log('[WorldMapView] Diff node IDs (first 10):', Array.from(diffNodesById.keys()).slice(0, 10));
            console.log('[WorldMapView] Diff node names (first 10):', Array.from(diffNodesByName.keys()).slice(0, 10));
            console.log('[WorldMapView] Current node IDs (first 10):', nodes.map(n => n.id).slice(0, 10));
            console.log('[WorldMapView] Current node names (first 10):', nodes.map(n => n.name).slice(0, 10));
            
            // Check for ID matches
            const matchingIds = nodes.filter(n => diffNodesById.has(n.id)).map(n => n.id);
            const matchingNames = nodes.filter(n => n.name && diffNodesByName.has(n.name)).map(n => n.name);
            console.log('[WorldMapView] Matching IDs:', matchingIds.slice(0, 10));
            console.log('[WorldMapView] Matching names:', matchingNames.slice(0, 10));
            
            // Check all diff nodes with their status
            const diffNodesWithStatus = diffData.diff.nodes.filter((n: any) => n.diff_status).map((n: any) => ({
                id: n.id,
                name: n.name || (n as any).label,
                status: n.diff_status,
                fullNode: n
            }));
            console.log('[WorldMapView] Diff nodes with status:', diffNodesWithStatus);
            console.log('[WorldMapView] Total diff nodes with status:', diffNodesWithStatus.length);
            
            // Check if these nodes exist in current nodes
            diffNodesWithStatus.forEach((diffNode: any) => {
                const existsInCurrent = nodes.find(n => n.id === diffNode.id);
                console.log(`[WorldMapView] Diff node "${diffNode.id}" (${diffNode.status}):`, {
                    existsInCurrent: !!existsInCurrent,
                    currentNodeId: existsInCurrent?.id,
                    willBeApplied: existsInCurrent && diffNode.status !== 'removed'
                });
            });
            
            let matchedCount = 0;
            nodes.forEach(node => {
                // Try to match by ID first, then by name as fallback
                let diffNode = diffNodesById.get(node.id) as Node | undefined;
                if (!diffNode && node.name) {
                    diffNode = diffNodesByName.get(node.name) as Node | undefined;
                }
                
                if (diffNode) {
                    // Log what we found
                    if (diffNode.diff_status) {
                        console.log(`[WorldMapView] Found diff node for "${node.id}":`, {
                            hasDiffStatus: !!diffNode.diff_status,
                            diffStatus: diffNode.diff_status,
                            willApply: diffNode.diff_status !== 'removed'
                        });
                    }
                    
                    // Only apply diff_status for nodes that exist in current version
                    // Skip "removed" status since those nodes aren't in the current data
                    if (diffNode.diff_status && diffNode.diff_status !== 'removed') {
                        node.diff_status = diffNode.diff_status;
                        matchedCount++;
                        console.log(`[WorldMapView] ✓ Applied diff_status "${diffNode.diff_status}" to node "${node.id}" (${node.name})`);
                    } else if (diffNode.diff_status === 'removed') {
                        console.log(`[WorldMapView] ✗ Skipped removed node "${node.id}" (should not be in current data)`);
                    } else {
                        console.log(`[WorldMapView] ⚠ Diff node found for "${node.id}" but no diff_status property`);
                    }
                }
            });
            
            // Log for debugging
            const addedNodes = nodes.filter(n => (n as any).diff_status === 'added');
            const modifiedNodes = nodes.filter(n => (n as any).diff_status === 'modified');
            console.log('[WorldMapView] Diff visualization applied:', {
                total_nodes: nodes.length,
                matched_nodes: matchedCount,
                added: addedNodes.length,
                modified: modifiedNodes.length,
                added_ids: addedNodes.map(n => `${n.id} (${n.name})`),
                modified_ids: modifiedNodes.map(n => `${n.id} (${n.name})`)
            });
        } else {
            console.log('[WorldMapView] No diff data available:', { 
                diffData: diffData, 
                hasDiff: !!diffData?.diff,
                hasDiffNodes: !!diffData?.diff?.nodes,
                diffNodesLength: diffData?.diff?.nodes?.length
            });
        }

        console.log('[WorldMapView] Initializing Simulation with:', {
            node_count: nodes.length,
            inactive_nodes: nodes.filter(n => n.is_active === false).map(n => n.id)
        });

        // Create a Set of valid node IDs for fast lookup
        const validNodeIds = new Set(nodes.map(n => n.id));
        
        // Filter links to only include those where both source and target nodes exist
        const validLinks = links.filter(link => {
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as Node)?.id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as Node)?.id;
            const sourceExists = sourceId && validNodeIds.has(sourceId);
            const targetExists = targetId && validNodeIds.has(targetId);
            
            if (!sourceExists || !targetExists) {
                console.warn(`[WorldMapView] Filtering out link: ${sourceId} -> ${targetId} (missing nodes)`);
                return false;
            }
            return true;
        });
        
        console.log(`[WorldMapView] Filtered links: ${links.length} -> ${validLinks.length} (removed ${links.length - validLinks.length} invalid links)`);

        const simulation = d3.forceSimulation<Node>(nodes)
            .force('link', d3.forceLink<Node, Link>(validLinks).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-800))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(60));

        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(validLinks)
            .enter().append('line')
            .attr('stroke', '#888')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrowhead)')
            .style('opacity', d => d.is_active === false ? inactiveOpacity : 0.5);

        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'node')
            .style('opacity', d => d.is_active === false ? inactiveOpacity : 1)
            .style('filter', d => d.is_active === false ? 'grayscale(1) blur(1px)' : 'none')
            .on('click', (event, d) => {
                setSelectedNode(d);
                event.stopPropagation();
            })
            .call(d3.drag<SVGGElement, Node>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }) as any);

        // Add selection highlighting circle (outer glow)
        node.append('circle')
            .attr('class', 'selection-glow')
            .attr('r', d => {
                if (selectedNode && d.id === selectedNode.id) return 24;
                return 0;
            })
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 3)
            .attr('opacity', 0.6)
            .style('pointer-events', 'none')
            .style('filter', 'drop-shadow(0 0 8px #3b82f6)')
            .style('animation', d => selectedNode && d.id === selectedNode.id ? 'node-pulse 2s ease-in-out infinite' : 'none');

        node.append('circle')
            .attr('r', d => {
                if (selectedNode && d.id === selectedNode.id) return 20;
                return d.id === data.metadata.active_trigger ? 18 : 12;
            })
            .attr('fill', d => {
                // Selected node gets special color
                if (selectedNode && d.id === selectedNode.id) return '#3b82f6';
                // Color by diff status if available
                if ((d as any).diff_status === 'added') return '#10b981'; // green
                if ((d as any).diff_status === 'modified') return '#f59e0b'; // yellow
                if ((d as any).diff_status === 'removed') return '#ef4444'; // red
                return typeConfig[d.type]?.color || '#444';
            })
            .attr('stroke', d => {
                if (selectedNode && d.id === selectedNode.id) return '#fff';
                if ((d as any).diff_status) return '#fff';
                return d.id === data.metadata.active_trigger ? '#fff' : '#000';
            })
            .attr('stroke-width', d => {
                if (selectedNode && d.id === selectedNode.id) return 4;
                if ((d as any).diff_status) return 2;
                return d.id === data.metadata.active_trigger ? 3 : 1;
            })
            .style('filter', d => {
                if (selectedNode && d.id === selectedNode.id) return 'drop-shadow(0 0 12px #3b82f6)';
                if ((d as any).diff_status === 'added') return 'drop-shadow(0 0 6px #10b981)';
                if ((d as any).diff_status === 'modified') return 'drop-shadow(0 0 6px #f59e0b)';
                if ((d as any).diff_status === 'removed') return 'drop-shadow(0 0 6px #ef4444)';
                return d.id === data.metadata.active_trigger ? 'drop-shadow(0 0 8px #fbbf24)' : 'none';
            });

        node.append('text')
            .attr('dx', 16)
            .attr('dy', 4)
            .text(d => {
                let label = d.name;
                if ((d as any).diff_status === 'added') label += ' [+]';
                if ((d as any).diff_status === 'modified') label += ' [~]';
                if ((d as any).diff_status === 'removed') label += ' [-]';
                if (d.is_active === false && !(d as any).diff_status) label += ' (inactive)';
                return label;
            })
            .attr('fill', d => {
                if ((d as any).diff_status === 'added') return '#10b981';
                if ((d as any).diff_status === 'modified') return '#f59e0b';
                if ((d as any).diff_status === 'removed') return '#ef4444';
                return d.is_active === false ? '#94a3b8' : 'gray';
            })
            .style('font-size', '10px')
            .style('font-weight', d => (d as any).diff_status ? '600' : '500')
            .style('pointer-events', 'none');

        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as Node).x!)
                .attr('y1', d => (d.source as Node).y!)
                .attr('x2', d => (d.target as Node).x!)
                .attr('y2', d => (d.target as Node).y!)
                .style('opacity', d => {
                    // Highlight links connected to selected node
                    if (selectedNode) {
                        const sourceId = typeof d.source === 'string' ? d.source : (d.source as Node)?.id;
                        const targetId = typeof d.target === 'string' ? d.target : (d.target as Node)?.id;
                        if (sourceId === selectedNode.id || targetId === selectedNode.id) {
                            return d.is_active === false ? inactiveOpacity : 1;
                        }
                    }
                    return d.is_active === false ? inactiveOpacity : 0.5;
                })
                .style('stroke-width', d => {
                    if (selectedNode) {
                        const sourceId = typeof d.source === 'string' ? d.source : (d.source as Node)?.id;
                        const targetId = typeof d.target === 'string' ? d.target : (d.target as Node)?.id;
                        if (sourceId === selectedNode.id || targetId === selectedNode.id) {
                            return 2.5;
                        }
                    }
                    return 1.5;
                })
                .style('stroke', d => {
                    if (selectedNode) {
                        const sourceId = typeof d.source === 'string' ? d.source : (d.source as Node)?.id;
                        const targetId = typeof d.target === 'string' ? d.target : (d.target as Node)?.id;
                        if (sourceId === selectedNode.id || targetId === selectedNode.id) {
                            return '#3b82f6';
                        }
                    }
                    return '#888';
                });

            node
                .attr('transform', d => `translate(${d.x},${d.y})`)
                .style('opacity', d => {
                    // Dim non-selected nodes when a node is selected
                    if (selectedNode && d.id !== selectedNode.id) {
                        return d.is_active === false ? inactiveOpacity * 0.3 : 0.4;
                    }
                    return d.is_active === false ? inactiveOpacity : 1;
                });
            
            // Update selection glow position
            node.select('.selection-glow')
                .attr('r', d => {
                    if (selectedNode && d.id === selectedNode.id) return 24;
                    return 0;
                });
        });

        // Initial zoom to fit
        setTimeout(() => {
            const bounds = (g.node() as SVGGElement).getBBox();
            const fullWidth = width;
            const fullHeight = height;
            const midX = bounds.x + bounds.width / 2;
            const midY = bounds.y + bounds.height / 2;
            if (bounds.width === 0 || bounds.height === 0) return;

            const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(fullWidth / 2, fullHeight / 2).scale(scale).translate(-midX, -midY)
            );
        }, 500);

    }, [data, viewMode, inactiveOpacity, diffData, selectedNode]);

    // Center map on selected node when it changes
    useEffect(() => {
        if (!selectedNode || !svgRef.current || !data) return;
        
        const svg = d3.select(svgRef.current);
        const g = svg.select<SVGGElement>('g');
        if (!g.node()) return;
        
        // Wait for simulation to settle and DOM to update
        const timeoutId = setTimeout(() => {
            // Find the selected node in the simulation
            const nodeElement = g.selectAll<SVGGElement, Node>('.node')
                .filter((d: Node) => d.id === selectedNode.id);
            
            if (nodeElement.empty()) return;
            
            const node = nodeElement.datum() as Node;
            if (!node.x || !node.y) return;
            
            // Get current zoom transform
            if (!svgRef.current) return;
            const zoom = d3.zoom<SVGSVGElement, unknown>();
            const currentTransform = d3.zoomTransform(svgRef.current);
            
            // Calculate center position in viewport coordinates
            const container = svgRef.current.parentElement;
            if (!container) return;
            
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Center the selected node in the viewport
            const scale = currentTransform.k || 1;
            const translateX = containerWidth / 2 - node.x * scale;
            const translateY = containerHeight / 2 - node.y * scale;
            
            // Smooth transition to center on selected node
            svg.transition()
                .duration(750)
                .ease(d3.easeCubicOut)
                .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(translateX, translateY).scale(scale)
                );
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [selectedNode, data]);

    // Artifacts View Component
    const ArtifactsView = () => {
        const artifacts = data?.nodes.filter(n => n.type === 'ARTIFACT') || [];
        
        // Enrich artifacts with metadata from KG nodes
        const enrichedArtifacts = artifacts.map(artifact => {
            // Find the node in data to get full metadata
            const fullNode = data?.nodes.find(n => n.id === artifact.id);
            return {
                ...artifact,
                metadata: fullNode?.metadata || artifact.metadata || {}
            };
        });

        return (
            <ArtifactsListView
                artifacts={enrichedArtifacts}
                threadId={threadId}
                onNodeSelect={setSelectedNode}
                selectedNode={selectedNode}
            />
        );
    };

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden relative">
            {/* Toolbar */}
            <div className="h-12 border-b border-border bg-muted/30 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                        <UIButton
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 text-xs px-3 transition-all",
                                !isFocusMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setIsFocusMode(false)}
                        >
                            Full Map
                        </UIButton>
                        <UIButton
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 text-xs px-3 transition-all",
                                isFocusMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setIsFocusMode(true)}
                        >
                            Focus
                        </UIButton>
                    </div>
                    {kgHistory && (
                        <>
                            <UIButton
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "flex items-center gap-2 px-2.5 py-1 border rounded-md transition-colors",
                                    showHistory ? "bg-blue-500/20 border-blue-500/40" : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20"
                                )}
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                <span className="text-[10px] font-bold text-blue-500 tracking-wider">KG v{kgHistory.total}</span>
                            </UIButton>
                            <UIButton
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "flex items-center gap-2 px-2.5 py-1 border rounded-md transition-colors",
                                    compareMode ? "bg-purple-500/20 border-purple-500/40" : "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20"
                                )}
                                onClick={() => {
                                    setCompareMode(!compareMode);
                                    if (!compareMode) {
                                        setShowHistory(true);
                                    } else {
                                        setCompareVersion1(null);
                                        setCompareVersion2(null);
                                        setDiffData(null);
                                    }
                                }}
                            >
                                <GitCompare className="h-3 w-3 text-purple-500" />
                                <span className="text-[10px] font-bold text-purple-500 tracking-wider">Compare</span>
                            </UIButton>
                        </>
                    )}
                    <div className="h-4 w-px bg-border ml-2" />
                    <div className="flex items-center gap-2 px-2">
                        <label className="text-[10px] text-muted-foreground whitespace-nowrap">Inactive Opacity:</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={inactiveOpacity}
                            onChange={(e) => setInactiveOpacity(parseFloat(e.target.value))}
                            className="w-20 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            title={`Inactive node opacity: ${Math.round(inactiveOpacity * 100)}%`}
                        />
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round(inactiveOpacity * 100)}%</span>
                    </div>
                    <UIButton variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => fetchData()}>
                        <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                        <span className="text-xs">Refresh</span>
                    </UIButton>
                </div>
                <div className="flex items-center gap-2">
                    {data?.metadata.active_trigger && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Active Trigger: {data.metadata.active_trigger}</span>
                        </div>
                    )}
                    {activeVersion && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Historical: {activeVersion}</span>
                            <UIButton variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-purple-500/20 rounded-full" onClick={() => fetchData()}>
                                <RefreshCw className="h-2.5 w-2.5 text-purple-500" />
                            </UIButton>
                        </div>
                    )}
                    <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            placeholder="Search nodes..."
                            className="bg-muted border border-border rounded-md py-1 pl-8 pr-3 text-xs focus:outline-none focus:border-primary/50 transition-all w-48 text-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* History Panel - Slide In */}
            {showHistory && kgHistory && (
                <div className="absolute top-12 left-0 bottom-0 w-80 bg-background/95 backdrop-blur-sm border-r border-border z-30 flex flex-col animate-in slide-in-from-left-4 duration-200">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                {compareMode ? "Compare Versions" : "Timeline"}
                            </h3>
                            <p className="text-[10px] text-muted-foreground">
                                {compareMode ? "Select two versions to compare" : `${kgHistory.total} snapshots available`}
                            </p>
                        </div>
                        <UIButton variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                            setShowHistory(false);
                            setCompareMode(false);
                        }}>
                            <ZoomOut className="h-3 w-3" />
                        </UIButton>
                    </div>
                    {compareMode ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Version 1 (Base)</label>
                                <div className="space-y-1">
                                    <div
                                        className={cn(
                                            "p-2 rounded-md cursor-pointer transition-colors border",
                                            compareVersion1 === "current" ? "bg-blue-500/20 border-blue-500/40" : "border-border hover:bg-muted"
                                        )}
                                        onClick={() => {
                                            setCompareVersion1("current");
                                            if (compareVersion2) fetchDiff("current", compareVersion2);
                                        }}
                                    >
                                        <span className="text-xs font-medium text-foreground">Current State</span>
                                    </div>
                                    {kgHistory.versions.map((v: any) => (
                                        <div
                                            key={v.id}
                                            className={cn(
                                                "p-2 rounded-md cursor-pointer transition-colors border",
                                                compareVersion1 === v.id ? "bg-blue-500/20 border-blue-500/40" : "border-border hover:bg-muted"
                                            )}
                                            onClick={() => {
                                                setCompareVersion1(v.id);
                                                if (compareVersion2) fetchDiff(v.id, compareVersion2);
                                            }}
                                        >
                                            <span className="text-xs font-medium text-foreground">
                                                {v.message || v.id}
                                            </span>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-[10px] text-muted-foreground">{v.timestamp}</span>
                                                {v.sha && (
                                                    <span className="text-[9px] text-muted-foreground/60 font-mono">{v.sha}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Version 2 (Compare)</label>
                                <div className="space-y-1">
                                    <div
                                        className={cn(
                                            "p-2 rounded-md cursor-pointer transition-colors border",
                                            compareVersion2 === "current" ? "bg-green-500/20 border-green-500/40" : "border-border hover:bg-muted"
                                        )}
                                        onClick={() => {
                                            setCompareVersion2("current");
                                            if (compareVersion1) fetchDiff(compareVersion1, "current");
                                        }}
                                    >
                                        <span className="text-xs font-medium text-foreground">Current State</span>
                                    </div>
                                    {kgHistory.versions.map((v: any) => (
                                        <div
                                            key={v.id}
                                            className={cn(
                                                "p-2 rounded-md cursor-pointer transition-colors border",
                                                compareVersion2 === v.id ? "bg-green-500/20 border-green-500/40" : "border-border hover:bg-muted"
                                            )}
                                            onClick={() => {
                                                setCompareVersion2(v.id);
                                                if (compareVersion1) fetchDiff(compareVersion1, v.id);
                                            }}
                                        >
                                            <span className="text-xs font-medium text-foreground">
                                                {v.message || v.id}
                                            </span>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-[10px] text-muted-foreground">{v.timestamp}</span>
                                                {v.sha && (
                                                    <span className="text-[9px] text-muted-foreground/60 font-mono">{v.sha}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {loadingDiff && (
                                <div className="flex items-center justify-center py-4">
                                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {diffData && diffData.summary && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Diff Summary</div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-green-500">Added:</span>
                                            <span className="font-medium">{diffData.summary.added}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-yellow-500">Modified:</span>
                                            <span className="font-medium">{diffData.summary.modified}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-red-500">Removed:</span>
                                            <span className="font-medium">{diffData.summary.removed}</span>
                                        </div>
                                        <div className="pt-2 border-t border-border mt-2">
                                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                                <span>Nodes: {diffData.summary.total_nodes_v1} → {diffData.summary.total_nodes_v2}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                                <span>Links: {diffData.summary.total_links_v1} → {diffData.summary.total_links_v2}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <UIButton
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 text-[10px] h-7 border-border"
                                        onClick={async () => {
                                            // Load version2 with diff visualization
                                            const version = compareVersion2 === "current" ? undefined : (compareVersion2 || undefined);
                                            // Ensure diff data is preserved by setting compareMode
                                            setCompareMode(true);
                                            // Fetch the diff again to ensure it's fresh
                                            if (compareVersion1 && compareVersion2) {
                                                await fetchDiff(compareVersion1, compareVersion2);
                                            }
                                            // Then load version 2 with diff preserved
                                            fetchData(version, true);
                                            setActiveVersion(compareVersion2 === "current" ? null : compareVersion2);
                                        }}
                                    >
                                        View Version 2 with Diff
                                    </UIButton>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            <div
                                className={cn(
                                    "p-3 rounded-md cursor-pointer transition-colors flex flex-col gap-1",
                                    !activeVersion ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                                )}
                                onClick={() => fetchData()}
                            >
                                <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    Current State
                                    {!activeVersion && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                </span>
                                <span className="text-[10px] text-muted-foreground">Live Active Graph</span>
                            </div>

                            {kgHistory.versions.map((v: any) => (
                                <div
                                    key={v.id}
                                    className={cn(
                                        "p-3 rounded-md cursor-pointer transition-colors flex flex-col gap-1 border border-transparent",
                                        activeVersion === v.id ? "bg-purple-500/10 border-purple-500/20" : "hover:bg-muted"
                                    )}
                                    onClick={() => fetchData(v.id)}
                                >
                                    <span className="text-xs font-medium text-foreground">
                                        {v.message || v.id}
                                    </span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground">{v.timestamp}</span>
                                        {v.sha && (
                                            <span className="text-[9px] text-muted-foreground/60 font-mono">{v.sha}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Canvas Area - Split layout when node is selected (but not in artifacts view) */}
            {selectedNode && viewMode !== 'artifacts' ? (
                <div className="flex-1 flex relative overflow-hidden">
                    {/* Map - 50% width */}
                    <div ref={containerRef} className="w-1/2 relative overflow-hidden border-r border-border min-w-0" onClick={(e) => {
                        // Only close if clicking directly on the map background, not on nodes
                        if (e.target === e.currentTarget || (e.target as Element).closest('svg')) {
                            setSelectedNode(null);
                        }
                    }}>
                        {viewMode === 'workflow' ? (
                    <div className="absolute inset-0 flex flex-col bg-background">
                        {!visualizationHtml ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                                <Activity className="w-12 h-12 opacity-20" />
                                <div className="text-center">
                                    <h3 className="text-sm font-medium text-foreground">No active orientation</h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Ask the agent to "show orientation" to see the project workflow here.</p>
                                </div>
                                <UIButton
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 border-border text-xs"
                                    onClick={() => setViewMode('map')}
                                >
                                    Switch to Map View
                                </UIButton>
                            </div>
                        ) : (
                            <iframe
                                srcDoc={`
                                    <html>
                                        <head>
                                            <style>
                                                body { margin: 0; background: transparent; color: inherit; font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                                            </style>
                                        </head>
                                        <body>
                                            ${visualizationHtml}
                                        </body>
                                    </html>
                                `}
                                className="w-full h-full border-none"
                                title="Workflow Orientation"
                            />
                        )}
                        <div className="absolute bottom-6 left-6 z-20">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg">
                                <GitGraph className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Workflow State Mode</span>
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'artifacts' ? (
                    <ArtifactsView />
                ) : (
                    <>
                        {loading && !data && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background z-30">
                                <div className="text-center">
                                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-xs text-muted-foreground">Initializing Knowledge Graph...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background z-30 p-6 text-center">
                                <div>
                                    <p className="text-destructive mb-4 font-mono text-sm leading-relaxed max-w-md mx-auto">Error: {error}</p>
                                    <UIButton onClick={() => fetchData()} variant="outline" className="border-border">Retry Connection</UIButton>
                                </div>
                            </div>
                        )}

                        <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

                        <div className="absolute bottom-6 left-6 z-20">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg">
                                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Knowledge Graph Mode</span>
                            </div>
                        </div>
                    </>
                )}

                        {/* Floating Controls */}
                        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                            <UIButton variant="outline" size="icon" className="w-9 h-9 bg-background/50 border-border text-muted-foreground hover:text-foreground rounded-lg backdrop-blur-md">
                                <ZoomIn className="h-4 w-4" />
                            </UIButton>
                            <UIButton variant="outline" size="icon" className="w-9 h-9 bg-background/50 border-border text-muted-foreground hover:text-foreground rounded-lg backdrop-blur-md">
                                <ZoomOut className="h-4 w-4" />
                            </UIButton>
                            <UIButton variant="outline" size="icon" className="w-9 h-9 bg-background/50 border-border text-muted-foreground hover:text-foreground rounded-lg backdrop-blur-md">
                                <Maximize className="h-4 w-4" />
                            </UIButton>
                        </div>
                    </div>

                    {/* Detail Panel - 50% width */}
                    <div className="w-1/2 relative overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <NodeDetailPanel
                            node={selectedNode}
                            onClose={() => setSelectedNode(null)}
                            position="right"
                            threadId={threadId}
                        />
                    </div>
                </div>
            ) : (
                <div ref={containerRef} className="flex-1 relative overflow-hidden" onClick={() => setSelectedNode(null)}>
                    {viewMode === 'workflow' ? (
                        <div className="absolute inset-0 flex flex-col bg-background">
                            {!visualizationHtml ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                                    <Activity className="w-12 h-12 opacity-20" />
                                    <div className="text-center">
                                        <h3 className="text-sm font-medium text-foreground">No active orientation</h3>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Ask the agent to "show orientation" to see the project workflow here.</p>
                                    </div>
                                    <UIButton
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 border-border text-xs"
                                        onClick={() => setViewMode('map')}
                                    >
                                        Switch to Map View
                                    </UIButton>
                                </div>
                            ) : (
                                <iframe
                                    srcDoc={`
                                        <html>
                                            <head>
                                                <style>
                                                    body { margin: 0; background: transparent; color: inherit; font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                                                </style>
                                            </head>
                                            <body>
                                                ${visualizationHtml}
                                            </body>
                                        </html>
                                    `}
                                    className="w-full h-full border-none"
                                    title="Workflow Orientation"
                                />
                            )}
                            <div className="absolute bottom-6 left-6 z-20">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg">
                                    <GitGraph className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Workflow State Mode</span>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'artifacts' ? (
                        <ArtifactsView />
                    ) : (
                        <>
                            {loading && !data && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background z-30">
                                    <div className="text-center">
                                        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-xs text-muted-foreground">Initializing Knowledge Graph...</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background z-30 p-6 text-center">
                                    <div>
                                        <p className="text-destructive mb-4 font-mono text-sm leading-relaxed max-w-md mx-auto">Error: {error}</p>
                                        <UIButton onClick={() => fetchData()} variant="outline" className="border-border">Retry Connection</UIButton>
                                    </div>
                                </div>
                            )}

                            <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

                            <div className="absolute bottom-6 left-6 z-20">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg">
                                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Knowledge Graph Mode</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Floating Controls */}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                        <UIButton variant="outline" size="icon" className="w-9 h-9 bg-background/50 border-border text-muted-foreground hover:text-foreground rounded-lg backdrop-blur-md">
                            <ZoomIn className="h-4 w-4" />
                        </UIButton>
                        <UIButton variant="outline" size="icon" className="w-9 h-9 bg-background/50 border-border text-muted-foreground hover:text-foreground rounded-lg backdrop-blur-md">
                            <ZoomOut className="h-4 w-4" />
                        </UIButton>
                        <UIButton variant="outline" size="icon" className="w-9 h-9 bg-background/50 border-border text-muted-foreground hover:text-foreground rounded-lg backdrop-blur-md">
                            <Maximize className="h-4 w-4" />
                        </UIButton>
                    </div>
                </div>
            )}
        </div>
    );
}

