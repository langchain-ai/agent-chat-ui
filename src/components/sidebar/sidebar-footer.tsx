"use client";

import { Key, Sun, Moon, Monitor, Settings } from "lucide-react";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SidebarFooter() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getThemeIcon = () => {
    if (!mounted) return <Sun className="size-5 text-gray-600 dark:text-gray-400" />;

    if (theme === "system") {
      return <Monitor className="size-5 text-gray-600 dark:text-gray-400" />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className="size-5 text-gray-600 dark:text-gray-400" />;
    }
    return <Sun className="size-5 text-gray-600 dark:text-gray-400" />;
  };

  return (
    <div className="flex items-center justify-around border-t border-gray-200 p-4 dark:border-gray-700">
      <TooltipIconButton
        tooltip="Secrets"
        variant="ghost"
        className="size-9 p-2"
        onClick={() => router.push("/secrets")}
      >
        <Key className="size-5 text-gray-600 dark:text-gray-400" />
      </TooltipIconButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex size-9 items-center justify-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            {getThemeIcon()}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 size-4" />
            System
            {theme === "system" && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 size-4" />
            Light
            {theme === "light" && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 size-4" />
            Dark
            {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipIconButton
        tooltip="Settings"
        variant="ghost"
        className="size-9 p-2"
        onClick={() => router.push("/settings")}
      >
        <Settings className="size-5 text-gray-600 dark:text-gray-400" />
      </TooltipIconButton>
    </div>
  );
}
