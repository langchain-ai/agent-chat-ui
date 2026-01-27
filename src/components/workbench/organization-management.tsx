"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Edit, Trash2, Palette, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Organization {
    id: string;
    name: string;
}

interface Branding {
    name: string;
    brand_title: string;
    colors: {
        primary: string;
        secondary: string;
        text_primary?: string;
        accent_green?: string;
    };
    style: {
        border_radius: string;
        font_family: string;
    };
}

export function OrganizationManagement() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [branding, setBranding] = useState<Record<string, Branding>>({});
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isBrandingDialogOpen, setIsBrandingDialogOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [editingBranding, setEditingBranding] = useState<{ orgId: string; branding: Branding | null } | null>(null);
    const [formData, setFormData] = useState({ id: "", name: "" });
    const [brandingFormData, setBrandingFormData] = useState<Branding>({
        name: "",
        brand_title: "",
        colors: { primary: "#000000", secondary: "#71717a", text_primary: "#000000" },
        style: { border_radius: "0.625rem", font_family: "Inter, sans-serif" },
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [orgsResp, brandingResp] = await Promise.all([
                fetch("/api/organizations"),
                fetch("/api/branding"),
            ]);

            if (orgsResp.ok) {
                const orgs = await orgsResp.json();
                setOrganizations(orgs);
            } else {
                const errorData = await orgsResp.json().catch(() => ({ error: `HTTP ${orgsResp.status}` }));
                console.error("[ORG_MGMT] Failed to load organizations:", errorData);
                toast.error(`Failed to load organizations: ${errorData.error || `HTTP ${orgsResp.status}`}`);
            }

            if (brandingResp.ok) {
                const brandingData = await brandingResp.json();
                setBranding(brandingData);
            } else {
                // Branding is optional, so we don't show an error for it
                console.warn("[ORG_MGMT] Failed to load branding:", brandingResp.status);
            }
        } catch (error) {
            console.error("[ORG_MGMT] Failed to load data:", error);
            toast.error(`Failed to load data: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.id || !formData.name) {
            toast.error("Organization ID and name are required");
            return;
        }

        try {
            setSubmitting(true);
            const resp = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (resp.ok) {
                toast.success("Organization created successfully");
                setIsCreateDialogOpen(false);
                setFormData({ id: "", name: "" });
                await loadData();
                // Notify org switcher to refresh
                window.dispatchEvent(new Event('organizationsUpdated'));
                localStorage.setItem('reflexion_orgs_updated', Date.now().toString());
            } else {
                const error = await resp.json();
                toast.error(error.error || "Failed to create organization");
            }
        } catch (error) {
            console.error("Failed to create organization:", error);
            toast.error("Failed to create organization");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!editingOrg || !formData.name) {
            toast.error("Organization name is required");
            return;
        }

        try {
            setSubmitting(true);
            const resp = await fetch(`/api/organizations/${editingOrg.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: formData.name }),
            });

            if (resp.ok) {
                toast.success("Organization updated successfully");
                setIsEditDialogOpen(false);
                setEditingOrg(null);
                setFormData({ id: "", name: "" });
                await loadData();
                // Notify org switcher to refresh
                window.dispatchEvent(new Event('organizationsUpdated'));
                localStorage.setItem('reflexion_orgs_updated', Date.now().toString());
            } else {
                const error = await resp.json();
                toast.error(error.error || "Failed to update organization");
            }
        } catch (error) {
            console.error("Failed to update organization:", error);
            toast.error("Failed to update organization");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (orgId: string) => {
        if (!confirm(`Are you sure you want to delete organization "${orgId}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const resp = await fetch(`/api/organizations/${orgId}`, {
                method: "DELETE",
            });

            if (resp.ok) {
                toast.success("Organization deleted successfully");
                await loadData();
                // Notify org switcher to refresh
                window.dispatchEvent(new Event('organizationsUpdated'));
                localStorage.setItem('reflexion_orgs_updated', Date.now().toString());
            } else {
                const error = await resp.json();
                toast.error(error.error || "Failed to delete organization");
            }
        } catch (error) {
            console.error("Failed to delete organization:", error);
            toast.error("Failed to delete organization");
        }
    };

    const handleOpenEdit = (org: Organization) => {
        setEditingOrg(org);
        setFormData({ id: org.id, name: org.name });
        setIsEditDialogOpen(true);
    };

    const handleOpenBranding = async (orgId: string) => {
        try {
            const resp = await fetch(`/api/branding/${orgId}`);
            if (resp.ok) {
                const brandingData = await resp.json();
                setEditingBranding({ orgId, branding: brandingData });
                setBrandingFormData(brandingData);
            } else {
                // Branding doesn't exist yet, create new
                const org = organizations.find((o) => o.id === orgId);
                setEditingBranding({ orgId, branding: null });
                setBrandingFormData({
                    name: org?.name || "",
                    brand_title: `Reflexion | ${org?.name || ""}`,
                    colors: { primary: "#000000", secondary: "#71717a", text_primary: "#000000" },
                    style: { border_radius: "0.625rem", font_family: "Inter, sans-serif" },
                });
            }
            setIsBrandingDialogOpen(true);
        } catch (error) {
            console.error("Failed to load branding:", error);
            toast.error("Failed to load branding");
        }
    };

    const handleSaveBranding = async () => {
        if (!editingBranding) return;

        try {
            setSubmitting(true);
            const method = editingBranding.branding ? "PUT" : "POST";
            const resp = await fetch(`/api/branding/${editingBranding.orgId}`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(brandingFormData),
            });

            if (resp.ok) {
                toast.success("Branding saved successfully");
                setIsBrandingDialogOpen(false);
                setEditingBranding(null);
                await loadData();
            } else {
                const error = await resp.json();
                toast.error(error.error || "Failed to save branding");
            }
        } catch (error) {
            console.error("Failed to save branding:", error);
            toast.error("Failed to save branding");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Organization Management</h2>
                    <p className="text-muted-foreground">Create and manage customer organizations</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                </Button>
            </div>

            <div className="grid gap-4">
                {organizations.map((org) => (
                    <Card key={org.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle>{org.name}</CardTitle>
                                        <CardDescription>ID: {org.id}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenBranding(org.id)}
                                    >
                                        <Palette className="h-4 w-4 mr-2" />
                                        Branding
                                    </Button>
                                    {org.id !== "reflexion-org" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenEdit(org)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(org.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        {branding[org.id] && (
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: branding[org.id].colors.primary }}
                                    />
                                    <span>Branding configured</span>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Organization</DialogTitle>
                        <DialogDescription>Add a new customer organization to the system.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="org-id">Organization ID</Label>
                            <Input
                                id="org-id"
                                placeholder="e.g., acme-corp"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique identifier (lowercase, no spaces, use hyphens)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="org-name">Organization Name</Label>
                            <Input
                                id="org-name"
                                placeholder="e.g., Acme Corporation"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                        <DialogDescription>Update organization details.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-org-id">Organization ID</Label>
                            <Input id="edit-org-id" value={formData.id} disabled />
                            <p className="text-xs text-muted-foreground">Organization ID cannot be changed</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-org-name">Organization Name</Label>
                            <Input
                                id="edit-org-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Branding Dialog */}
            <Dialog open={isBrandingDialogOpen} onOpenChange={setIsBrandingDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Branding Configuration</DialogTitle>
                        <DialogDescription>
                            Configure branding for {editingBranding?.orgId}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="branding-name">Name</Label>
                            <Input
                                id="branding-name"
                                value={brandingFormData.name}
                                onChange={(e) =>
                                    setBrandingFormData({ ...brandingFormData, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branding-title">Brand Title</Label>
                            <Input
                                id="branding-title"
                                value={brandingFormData.brand_title}
                                onChange={(e) =>
                                    setBrandingFormData({ ...brandingFormData, brand_title: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="color-primary">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color-primary"
                                        type="color"
                                        value={brandingFormData.colors.primary}
                                        onChange={(e) =>
                                            setBrandingFormData({
                                                ...brandingFormData,
                                                colors: { ...brandingFormData.colors, primary: e.target.value },
                                            })
                                        }
                                        className="w-20 h-9"
                                    />
                                    <Input
                                        value={brandingFormData.colors.primary}
                                        onChange={(e) =>
                                            setBrandingFormData({
                                                ...brandingFormData,
                                                colors: { ...brandingFormData.colors, primary: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color-secondary">Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color-secondary"
                                        type="color"
                                        value={brandingFormData.colors.secondary}
                                        onChange={(e) =>
                                            setBrandingFormData({
                                                ...brandingFormData,
                                                colors: { ...brandingFormData.colors, secondary: e.target.value },
                                            })
                                        }
                                        className="w-20 h-9"
                                    />
                                    <Input
                                        value={brandingFormData.colors.secondary}
                                        onChange={(e) =>
                                            setBrandingFormData({
                                                ...brandingFormData,
                                                colors: { ...brandingFormData.colors, secondary: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color-text">Text Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color-text"
                                        type="color"
                                        value={brandingFormData.colors.text_primary || "#000000"}
                                        onChange={(e) =>
                                            setBrandingFormData({
                                                ...brandingFormData,
                                                colors: { ...brandingFormData.colors, text_primary: e.target.value },
                                            })
                                        }
                                        className="w-20 h-9"
                                    />
                                    <Input
                                        value={brandingFormData.colors.text_primary || "#000000"}
                                        onChange={(e) =>
                                            setBrandingFormData({
                                                ...brandingFormData,
                                                colors: { ...brandingFormData.colors, text_primary: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="border-radius">Border Radius</Label>
                                <Input
                                    id="border-radius"
                                    value={brandingFormData.style.border_radius}
                                    onChange={(e) =>
                                        setBrandingFormData({
                                            ...brandingFormData,
                                            style: { ...brandingFormData.style, border_radius: e.target.value },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="font-family">Font Family</Label>
                                <Input
                                    id="font-family"
                                    value={brandingFormData.style.font_family}
                                    onChange={(e) =>
                                        setBrandingFormData({
                                            ...brandingFormData,
                                            style: { ...brandingFormData.style, font_family: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBrandingDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveBranding} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
