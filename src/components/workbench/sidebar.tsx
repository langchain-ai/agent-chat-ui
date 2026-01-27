"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Settings,
    CheckSquare,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Project {
    id: string;
    name: string;
}

// Generate a more meaningful project name from thread ID
function formatProjectName(project: Project): string {
    // If name is already meaningful (not just a UUID), use it
    if (project.name && project.name !== project.id && !project.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return project.name;
    }
    
    // If name is a UUID or same as ID, generate a friendly name
    // Extract first 8 characters of UUID for readability
    const shortId = project.id.substring(0, 8);
    return `Project ${shortId}`;
}

// Removed static PROJECT_LINKS

const PRODUCT_LINKS = [
    { name: "Smart Backlog", href: "/workbench/backlog", icon: CheckSquare },
    { name: "Discovery", href: "/workbench/discovery", icon: Search },
    { name: "Settings", href: "/workbench/settings", icon: Settings },
];

export function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const userRole = session?.user?.role;

    const [threadId, setThreadId] = useQueryState("threadId");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    // Check if user is Reflexion Admin (keys are reflexion_admin or admin)
    const isAdmin = userRole === "reflexion_admin" || userRole === "admin";

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const orgContext = localStorage.getItem('reflexion_org_context');
            const headers: Record<string, string> = {};
            if (orgContext) {
                headers['X-Organization-Context'] = orgContext;
            }

            const res = await fetch('/api/projects', { headers });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
        window.addEventListener('focus', fetchProjects);
        return () => window.removeEventListener('focus', fetchProjects);
    }, [fetchProjects]);

    return (
        <aside className="w-64 border-r bg-muted/20 flex flex-col h-full overflow-y-auto transition-all duration-300">
            <div className="p-6">
                <Link href="/" className="inline-block transition-transform hover:scale-105">
                    <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-sm">R</span>
                        Reflexion
                    </h2>
                </Link>
            </div>

            <nav className="flex-1 space-y-6 px-4 py-2">
                {/* Project Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            Projects
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-muted"
                            onClick={() => setThreadId(null)}
                        >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">New Project</span>
                        </Button>
                    </div>

                    <div className="space-y-1">
                        {loading && projects.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground italic">Loading...</div>
                        ) : (
                            projects.map((project) => {
                                const isActive = threadId === project.id;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => setThreadId(project.id)}
                                        className={cn(
                                            "w-full text-left group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all truncate",
                                            isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                        )}
                                    >
                                        <FileText className={cn("mr-3 h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} />
                                        <span className="truncate" title={project.id}>{formatProjectName(project)}</span>
                                    </button>
                                );
                            })
                        )}
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-foreground px-3 py-2 h-auto font-normal"
                            onClick={() => setThreadId(null)}
                        >
                            <Plus className="mr-3 h-4 w-4" />
                            New Project
                        </Button>
                    </div>
                </div>

                {/* Product Section - Admin Only */}
                {isAdmin && (
                    <div className="space-y-3 pt-2">
                        <h3 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            Reflexion Product
                        </h3>
                        <div className="space-y-1">
                            {PRODUCT_LINKS.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all",
                                            isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn("mr-3 h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} />
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </nav>
        </aside>
    );
}
