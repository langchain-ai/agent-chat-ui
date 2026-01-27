"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, X, LoaderCircle, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { getApiKey } from "@/lib/api-key";

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

interface EnrichmentApprovalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifactIds: string[];
  threadId?: string | null;
  apiUrl?: string;
  onComplete?: (approved: string[]) => void;
}

export function EnrichmentApproval({
  open,
  onOpenChange,
  artifactIds,
  threadId,
  apiUrl: rawApiUrl = "http://localhost:8080",
  onComplete,
}: EnrichmentApprovalProps) {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<Map<string, EnrichmentProposal>>(
    new Map()
  );
  const [selectedTypes, setSelectedTypes] = useState<
    Map<string, string[]>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  // Helper function to get the direct backend URL, bypassing Next.js proxy
  function getDirectBackendUrl(apiUrl: string): string {
    if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
      if (apiUrl.includes('reflexion-ui') || apiUrl.includes('/api')) {
        if (apiUrl.includes('railway.app')) {
          return "https://reflexion-staging.up.railway.app";
        }
        return apiUrl.replace('reflexion-ui', 'reflexion').replace(':3000', ':8080').replace('/api', '');
      }
      return apiUrl;
    }
    
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

  // Fetch enrichment proposals for all artifacts
  useEffect(() => {
    if (!open || artifactIds.length === 0) return;

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
        for (const artifactId of artifactIds) {
          try {
            const url = new URL(
              `${apiUrl}/artifacts/${artifactId}/enrichment/preview`
            );
            if (threadId) {
              url.searchParams.set("thread_id", threadId);
            }

            const response = await fetch(url.toString(), { headers });

            if (response.ok) {
              const data = await response.json();
              if (data.status === "pending") {
                newProposals.set(artifactId, {
                  artifact_id: artifactId,
                  cycle_id: data.cycle_id,
                  enrichment: data.enrichment,
                  status: data.status,
                  filename: data.enrichment.extracted_title,
                });
                // Pre-select suggested artifact types
                newSelectedTypes.set(
                  artifactId,
                  data.enrichment.artifact_types || []
                );
              }
            } else if (response.status === 404) {
              // No enrichment yet - trigger it
              await triggerEnrichment(artifactId, headers);
            }
          } catch (error) {
            console.error(
              `[Enrichment] Failed to fetch proposal for ${artifactId}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error("[Enrichment] Error fetching proposals:", error);
        toast.error("Failed to load enrichment proposals");
      } finally {
        setFetching(false);
        setProposals(newProposals);
        setSelectedTypes(newSelectedTypes);
      }
    };

    fetchProposals();
  }, [open, artifactIds, threadId, apiUrl, session]);

  const triggerEnrichment = async (
    artifactId: string,
    headers: Record<string, string>
  ) => {
    try {
      // Use JSON endpoint instead of FormData to avoid Next.js proxy issues
      // The /enrichment endpoint accepts JSON and works through the proxy
      const body = threadId ? { thread_id: threadId, trigger: true } : { trigger: true };
      
      const response = await fetch(`${apiUrl}/artifacts/${artifactId}/enrichment${threadId ? `?thread_id=${threadId}` : ''}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "pending") {
          setProposals((prev) => {
            const updated = new Map(prev);
            updated.set(artifactId, {
              artifact_id: artifactId,
              cycle_id: data.cycle_id,
              enrichment: data.enrichment,
              status: data.status,
              filename: data.enrichment.extracted_title,
            });
            return updated;
          });
          setSelectedTypes((prev) => {
            const updated = new Map(prev);
            updated.set(artifactId, data.enrichment.artifact_types || []);
            return updated;
          });
        }
      }
    } catch (error) {
      console.error(`[Enrichment] Failed to trigger enrichment:`, error);
    }
  };

  const handleApprove = async (artifactId: string) => {
    const proposal = proposals.get(artifactId);
    const types = selectedTypes.get(artifactId) || [];

    if (!proposal) {
      toast.error("No enrichment proposal found");
      return;
    }

    if (types.length === 0) {
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

      const response = await fetch(
        `${apiUrl}/artifacts/${artifactId}/enrichment/approve`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            cycle_id: proposal.cycle_id,
            artifact_types: types,
            thread_id: threadId,
            project_id: threadId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: "Approval failed",
        }));
        throw new Error(error.error || `Approval failed: ${response.statusText}`);
      }

      const result = await response.json();
      toast.success(`Approved enrichment for ${proposal.filename || artifactId}`);

      // Update proposal status
      setProposals((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(artifactId);
        if (existing) {
          updated.set(artifactId, { ...existing, status: "approved" });
        }
        return updated;
      });

      // Check if all are approved
      const allApproved = Array.from(proposals.values()).every(
        (p) => p.artifact_id === artifactId || p.status === "approved"
      );
      if (allApproved && onComplete) {
        onComplete([artifactId]);
      }
    } catch (error) {
      console.error("[Enrichment] Approval failed:", error);
      toast.error(
        `Failed to approve enrichment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setProcessing((prev) => {
        const updated = new Set(prev);
        updated.delete(artifactId);
        return updated;
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

      const response = await fetch(
        `${apiUrl}/artifacts/${artifactId}/enrichment/reject`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            cycle_id: proposal.cycle_id,
            project_id: threadId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Rejection failed: ${response.statusText}`);
      }

      toast.success(`Rejected enrichment for ${proposal.filename || artifactId}`);

      // Remove from proposals
      setProposals((prev) => {
        const updated = new Map(prev);
        updated.delete(artifactId);
        return updated;
      });
    } catch (error) {
      console.error("[Enrichment] Rejection failed:", error);
      toast.error(
        `Failed to reject enrichment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setProcessing((prev) => {
        const updated = new Set(prev);
        updated.delete(artifactId);
        return updated;
      });
    }
  };

  const handleSkip = (artifactId: string) => {
    setProposals((prev) => {
      const updated = new Map(prev);
      updated.delete(artifactId);
      return updated;
    });
  };

  const handleTypeChange = (artifactId: string, types: string[]) => {
    setSelectedTypes((prev) => {
      const updated = new Map(prev);
      updated.set(artifactId, types);
      return updated;
    });
  };

  const proposalList = Array.from(proposals.values());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Artifact Enrichments</DialogTitle>
          <DialogDescription>
            Review and approve enrichment proposals for uploaded artifacts.
            Select at least one artifact type for each artifact.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading enrichment proposals...</span>
          </div>
        ) : proposalList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No enrichment proposals available. Enrichments will be processed
              automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposalList.map((proposal) => {
              const isProcessing = processing.has(proposal.artifact_id);
              const selected = selectedTypes.get(proposal.artifact_id) || [];
              const canApprove = selected.length > 0 && !isProcessing;

              return (
                <div
                  key={proposal.artifact_id}
                  className={cn(
                    "border rounded-lg p-4 space-y-4",
                    proposal.status === "approved" && "bg-green-50 border-green-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {proposal.filename || proposal.artifact_id}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {proposal.enrichment.extracted_category} •{" "}
                        {proposal.enrichment.summary}
                      </p>
                    </div>
                    {proposal.status === "approved" && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-medium">Approved</span>
                      </div>
                    )}
                  </div>

                  {proposal.status !== "approved" && (
                    <>
                      <div className="space-y-2">
                        <Label>
                          Artifact Types <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-2 p-2 border rounded-md">
                          {ARTIFACT_TYPES.map((type) => {
                            const isSelected = selected.includes(type);
                            return (
                              <label
                                key={type}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted transition-colors",
                                  isSelected && "bg-primary/10"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newTypes = e.target.checked
                                      ? [...selected, type]
                                      : selected.filter((t) => t !== type);
                                    handleTypeChange(proposal.artifact_id, newTypes);
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm">{type}</span>
                              </label>
                            );
                          })}
                        </div>
                        {selected.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selected.map((type) => (
                              <div
                                key={type}
                                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                              >
                                {type}
                                <button
                                  onClick={() => {
                                    handleTypeChange(
                                      proposal.artifact_id,
                                      selected.filter((t) => t !== type)
                                    );
                                  }}
                                  className="ml-1 hover:text-primary/70"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {selected.length === 0 && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            At least one artifact type is required
                          </p>
                        )}
                      </div>

                      {proposal.enrichment.key_concepts.length > 0 && (
                        <div>
                          <Label>Key Concepts</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {proposal.enrichment.key_concepts.map(
                              (concept, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-muted rounded text-sm"
                                >
                                  {concept}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      <DialogFooter className="gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSkip(proposal.artifact_id)}
                          disabled={isProcessing}
                        >
                          Skip
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(proposal.artifact_id)}
                          disabled={isProcessing}
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleApprove(proposal.artifact_id)}
                          disabled={!canApprove}
                        >
                          {isProcessing ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            "Approve"
                          )}
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {proposalList.length > 0 && proposalList.every((p) => p.status === "approved") && (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
