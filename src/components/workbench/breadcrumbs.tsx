"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { OrgSwitcher } from "./org-switcher";
import { ProjectSwitcher } from "./project-switcher";

export function Breadcrumbs() {
    return (
        <nav className="flex items-center text-sm font-medium text-muted-foreground gap-2">
            <Link href="/" className="hover:text-foreground transition-colors flex-shrink-0">
                <Home className="h-4 w-4" />
            </Link>

            <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />

            <OrgSwitcher />

            <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />

            <ProjectSwitcher />
        </nav>
    );
}
