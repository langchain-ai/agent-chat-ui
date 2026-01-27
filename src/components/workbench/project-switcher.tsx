"use client";

import * as React from "react";
import { Briefcase, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQueryState } from "nuqs";
import { useSession } from "next-auth/react";

interface Project {
    id: string;
    name: string;
}

export function ProjectSwitcher() {
    const { data: session } = useSession();
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [threadId, setThreadId] = useQueryState("threadId");
    const [loading, setLoading] = React.useState(false);

    const fetchProjects = React.useCallback(async () => {
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

    React.useEffect(() => {
        fetchProjects();

        // Refresh when org changes (using custom event or interval as a simple fallback)
        const handleFocus = () => fetchProjects();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchProjects]);

    return (
        <Select
            value={threadId || "new"}
            onValueChange={(val) => setThreadId(val === "new" ? null : val)}
        >
            <SelectTrigger className="w-[180px] bg-background border-border text-foreground h-9">
                <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border text-foreground">
                {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="focus:bg-muted focus:text-foreground italic">
                        {project.name}
                    </SelectItem>
                ))}
                <SelectItem value="new" className="focus:bg-muted focus:text-foreground font-medium border-t border-border mt-1">
                    <div className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" />
                        New Project
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
}
