"use client";

import React from "react";
import { Settings, Shield, User, Globe, Activity, Building2 } from "lucide-react";
import { OrganizationManagement } from "@/components/workbench/organization-management";

export default function SettingsPage() {
    return (
        <div className="flex flex-col h-full bg-background p-8 overflow-auto">
            <div className="max-w-4xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Manage your organization, user preferences, and API integrations.
                    </p>
                </div>

                <div className="space-y-6">
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5" />
                            Organization Management
                        </h3>
                        <div className="p-6 rounded-xl border border-border bg-muted/10">
                            <OrganizationManagement />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            Account Configuration
                        </h3>
                        <div className="p-6 rounded-xl border border-border bg-muted/10 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-medium">User Profile</p>
                                <p className="text-xs text-muted-foreground text-balance max-w-[400px]">Update your personal information and security credentials.</p>
                            </div>
                            <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors">Edit Profile</button>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" />
                            Organization Context
                        </h3>
                        <div className="p-6 rounded-xl border border-border bg-muted/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium">Multi-Tenancy Mode</p>
                                    <p className="text-xs text-muted-foreground">Configured for active organization switching and RBAC enforcement.</p>
                                </div>
                                <Activity className="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" />
                            Security & API
                        </h3>
                        <div className="p-6 rounded-xl border border-border bg-muted/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground mb-1">JWT Context</p>
                                <p className="text-[10px] font-mono truncate">Active session signature verified</p>
                            </div>
                            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                                <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground mb-1">Proxy Endpoints</p>
                                <p className="text-[10px] font-mono truncate">http://localhost:8080</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
