"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X, LoaderCircle, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { getApiKey } from "@/lib/api-key";
import { useQueryState } from "nuqs";
import { useStreamContext } from "@/providers/Stream";

// Available KG Artifact types (from backend)
const ARTIFACT_TYPES = [
  "PRD",
  "SOP",
  "Architecture",
  "Requirements",
  "Design",
  "Test Plan",
  "User Guide",
];

export interface EnrichmentProposal {
  artifact_id: string;
  cycle_id: string;
  enrichment: {
    extracted_category: string;
    extracted_title: string;
    artifact_types: string[];
    key_concepts: string[];
    relationships: string[];
    summary: string;
  };
  status: "pending" | "approved" | "rejected";
  filename?: string;
}

export function EnrichmentView() {
  const { data: session } = useSession();
  const stream = useStreamContext();
  const [pendingArtifactIds, setPendingArtifactIds] = useQueryState<string[]>("pendingArtifacts", {
    parse: (value) => value ? value.split(",").filter(Boolean) : [],
    serialize: (value) => value && value.length > 0 ? value.join(",") : "",
    defaultValue: []
  });
  
  const [proposals, setProposals] = useState<Map<string, EnrichmentProposal>>(
    new Map()
  );
  const [selectedTypes, setSelectedTypes] = useState<
    Map<string, string[]>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [threadId] = useQueryState("threadId");
  const rawApiUrl = (stream as any)?.apiUrl || "http://localhost:8080";
  
  // Helper function to get the direct backend URL, bypassing Next.js proxy
  // This ensures enrichment requests go directly to the backend, not through the proxy
  function getDirectBackendUrl(apiUrl: string): string {
    // If apiUrl is already an absolute URL and it's a backend URL, use it
    if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
      if (apiUrl.includes('reflexion-ui') || apiUrl.includes('/api')) {
        // Redirect to backend
        if (apiUrl.includes('railway.app')) {
          return "https://reflexion-staging.up.railway.app";
        }
        return apiUrl.replace('reflexion-ui', 'reflexion').replace(':3000', ':8080').replace('/api', '');
      }
      return apiUrl;
    }
    
    // If apiUrl is relative, construct direct backend URL
    if (apiUrl.startsWith("/") || apiUrl.startsWith("/api")) {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('railway.app') || hostname.includes('reflexion-ui') || hostname.includes('reflexion-staging')) {
          return "https://reflexion-staging.up.railway.app";
        }
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return "http://localhost:8080";
        }
        const origin = window.location.origin;
        return origin.replace('reflexion-ui', 'reflexion').replace(':3000', ':8080');
      }
      return process.env.NEXT_PUBLIC_API_URL || "https://reflexion-staging.up.railway.app";
    }
    
    return apiUrl;
  }
  
  const apiUrl = getDirectBackendUrl(rawApiUrl);
  
  // Debug logging
  useEffect(() => {
    if (pendingArtifactIds.length > 0) {
      console.log("[EnrichmentView] Fetching proposals for artifacts:", pendingArtifactIds, "with threadId:", threadId);
    }
  }, [pendingArtifactIds, threadId]);

  // Fetch enrichment proposals for all artifacts
  useEffect(() => {
    if (pendingArtifactIds.length === 0) return;

    const fetchProposals = async () => {
      setFetching(true);
      const newProposals = new Map<string, EnrichmentProposal>();
      const newSelectedTypes = new Map<string, string[]>();

      try {
        // Build authentication headers
        const headers: Record<string, string> = {};
        const token = session?.user?.idToken || getApiKey();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const orgContext =
          typeof window !== "undefined"
            ? localStorage.getItem("reflexion_org_context")
            : null;
        if (orgContext) {
          headers["X-Organization-Context"] = orgContext;
        }

        // Fetch proposals for each artifact
        for (const artifactId of pendingArtifactIds) {
          try {
            // Include thread_id as query parameter so backend can find the artifact
            const url = `${apiUrl}/artifacts/${artifactId}/enrichment${threadId ? `?thread_id=${threadId}` : ''}`;
            const res = await fetch(url, { headers });

            if (res.ok) {
              const data = await res.json();
              if (data.cycle_id && data.enrichment) {
                newProposals.set(artifactId, {
                  artifact_id: artifactId,
                  cycle_id: data.cycle_id,
                  enrichment: data.enrichment,
                  status: "pending",
                  filename: data.filename,
                });
                // Pre-select first artifact type if available
                if (data.enrichment.artifact_types?.length > 0) {
                  newSelectedTypes.set(artifactId, [data.enrichment.artifact_types[0]]);
                }
              }
            } else if (res.status === 404) {
              // No enrichment cycle yet - trigger creation
              const createRes = await fetch(`${apiUrl}/artifacts/${artifactId}/enrichment${threadId ? `?thread_id=${threadId}` : ''}`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ trigger: true, thread_id: threadId }),
              });
              if (createRes.ok) {
                const createData = await createRes.json();
                if (createData.cycle_id && createData.enrichment) {
                  newProposals.set(artifactId, {
                    artifact_id: artifactId,
                    cycle_id: createData.cycle_id,
                    enrichment: createData.enrichment,
                    status: "pending",
                    filename: createData.filename,
                  });
                  if (createData.enrichment.artifact_types?.length > 0) {
                    newSelectedTypes.set(artifactId, [createData.enrichment.artifact_types[0]]);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`[Enrichment] Failed to fetch proposal for ${artifactId}:`, error);
          }
        }

        setProposals(newProposals);
        setSelectedTypes(newSelectedTypes);
      } catch (error) {
        console.error("[Enrichment] Failed to fetch proposals:", error);
        toast.error("Failed to load enrichment proposals");
      } finally {
        setFetching(false);
      }
    };

    fetchProposals();
  }, [pendingArtifactIds, session, rawApiUrl, threadId]);

  const handleTypeToggle = (artifactId: string, type: string) => {
    setSelectedTypes((prev) => {
      const current = prev.get(artifactId) || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      const newMap = new Map(prev);
      newMap.set(artifactId, updated);
      return newMap;
    });
  };

  const handleApprove = async (artifactId: string) => {
    const proposal = proposals.get(artifactId);
    if (!proposal) return;

    const selected = selectedTypes.get(artifactId) || [];
    if (selected.length === 0) {
      toast.error("Please select at least one artifact type");
      return;
    }

    setProcessing((prev) => new Set(prev).add(artifactId));
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = session?.user?.idToken || getApiKey();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const orgContext =
        typeof window !== "undefined"
          ? localStorage.getItem("reflexion_org_context")
          : null;
      if (orgContext) {
        headers["X-Organization-Context"] = orgContext;
      }

      const url = `${apiUrl}/artifacts/${artifactId}/enrichment/${proposal.cycle_id}/approve`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          artifact_types: selected,
          thread_id: threadId,
        }),
      });

      if (res.ok) {
        setProposals((prev) => {
          const newMap = new Map(prev);
          const updated = { ...proposal, status: "approved" as const };
          newMap.set(artifactId, updated);
          return newMap;
        });
        toast.success(`Enrichment approved for ${proposal.enrichment.extracted_title || artifactId}`);
        
        // Remove from pending list
        setPendingArtifactIds((prev) => prev.filter(id => id !== artifactId));
      } else {
        const error = await res.text();
        throw new Error(error || "Approval failed");
      }
    } catch (error: any) {
      console.error("[Enrichment] Approval failed:", error);
      toast.error(`Failed to approve: ${error.message || "Unknown error"}`);
    } finally {
      setProcessing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(artifactId);
        return newSet;
      });
    }
  };

  const handleReject = async (artifactId: string) => {
    const proposal = proposals.get(artifactId);
    if (!proposal) return;

    setProcessing((prev) => new Set(prev).add(artifactId));
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = session?.user?.idToken || getApiKey();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const orgContext =
        typeof window !== "undefined"
          ? localStorage.getItem("reflexion_org_context")
          : null;
      if (orgContext) {
        headers["X-Organization-Context"] = orgContext;
      }

      const url = `${apiUrl}/artifacts/${artifactId}/enrichment/${proposal.cycle_id}/reject`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ thread_id: threadId }),
      });

      if (res.ok) {
        setProposals((prev) => {
          const newMap = new Map(prev);
          const updated = { ...proposal, status: "rejected" as const };
          newMap.set(artifactId, updated);
          return newMap;
        });
        toast.success(`Enrichment rejected for ${proposal.enrichment.extracted_title || artifactId}`);
        
        // Remove from pending list
        setPendingArtifactIds((prev) => prev.filter(id => id !== artifactId));
      } else {
        throw new Error("Rejection failed");
      }
    } catch (error: any) {
      console.error("[Enrichment] Rejection failed:", error);
      toast.error(`Failed to reject: ${error.message || "Unknown error"}`);
    } finally {
      setProcessing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(artifactId);
        return newSet;
      });
    }
  };

  const handleSkip = (artifactId: string) => {
    setProposals((prev) => {
      const newMap = new Map(prev);
      newMap.delete(artifactId);
      return newMap;
    });
    setPendingArtifactIds((prev) => prev.filter(id => id !== artifactId));
    toast.info("Enrichment skipped");
  };

  const proposalList = Array.from(proposals.values());

  if (pendingArtifactIds.length === 0 && proposalList.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <FileText className="w-16 h-16 opacity-20 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Pending Enrichments</h3>
        <p className="text-sm text-center max-w-md">
          Upload documents or artifacts to see enrichment proposals here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-muted/30 shrink-0">
        <div>
          <h2 className="text-lg font-semibold">Review Artifact Enrichments</h2>
          <p className="text-xs text-muted-foreground">
            {proposalList.length} {proposalList.length === 1 ? "artifact" : "artifacts"} pending review
          </p>
        </div>
        {fetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="w-4 h-4 animate-spin" />
            <span>Loading proposals...</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {proposalList.map((proposal) => {
            const selected = selectedTypes.get(proposal.artifact_id) || [];
            const isProcessing = processing.has(proposal.artifact_id);
            const isApproved = proposal.status === "approved";
            const isRejected = proposal.status === "rejected";

            return (
              <div
                key={proposal.artifact_id}
                className={cn(
                  "border rounded-lg p-6 bg-card shadow-sm transition-all",
                  isApproved && "border-green-500/50 bg-green-500/5",
                  isRejected && "border-red-500/50 bg-red-500/5"
                )}
              >
                {/* Artifact Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        {proposal.enrichment.extracted_title || proposal.filename || proposal.artifact_id}
                      </h3>
                      {isApproved && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {isRejected && (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {proposal.enrichment.extracted_category && (
                      <p className="text-sm text-muted-foreground">
                        Category: {proposal.enrichment.extracted_category}
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {proposal.enrichment.summary && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">{proposal.enrichment.summary}</p>
                  </div>
                )}

                {/* Artifact Type Selection */}
                <div className="mb-4">
                  <Label className="text-sm font-semibold mb-2 block">
                    Artifact Type <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ARTIFACT_TYPES.map((type) => {
                      const isSelected = selected.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTypeToggle(proposal.artifact_id, type)}
                          disabled={isProcessing || isApproved || isRejected}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted text-muted-foreground hover:bg-muted/80",
                            (isProcessing || isApproved || isRejected) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  {selected.length === 0 && !isApproved && !isRejected && (
                    <p className="text-xs text-destructive mt-1">
                      Please select at least one artifact type
                    </p>
                  )}
                </div>

                {/* Key Concepts */}
                {proposal.enrichment.key_concepts?.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm font-semibold mb-2 block">Key Concepts</Label>
                    <div className="flex flex-wrap gap-2">
                      {proposal.enrichment.key_concepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-muted rounded-md text-xs"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  {!isApproved && !isRejected && (
                    <>
                      <Button
                        onClick={() => handleApprove(proposal.artifact_id)}
                        disabled={selected.length === 0 || isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(proposal.artifact_id)}
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleSkip(proposal.artifact_id)}
                        disabled={isProcessing}
                      >
                        Skip
                      </Button>
                    </>
                  )}
                  {(isApproved || isRejected) && (
                    <div className="flex-1 text-sm text-muted-foreground">
                      {isApproved && "✓ Enrichment approved and linked to Knowledge Graph"}
                      {isRejected && "✗ Enrichment rejected"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
