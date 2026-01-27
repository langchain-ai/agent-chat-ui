"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center w-6 h-6">
                <div className="w-4 h-4" />
            </div>
        );
    }

    const isDark = theme === "dark";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        className="flex items-center justify-center transition-colors hover:text-foreground/80"
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <Sun className="h-6 w-6" />
                        ) : (
                            <Moon className="h-6 w-6" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Toggle {isDark ? "light" : "dark"} mode</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
