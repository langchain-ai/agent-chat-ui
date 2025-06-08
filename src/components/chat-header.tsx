"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { FacetAITextLogoSVG } from "./icons/facetai";
import { LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ThemeToggle } from "./theme-toggle";

interface ChatHeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function ChatHeader({
  onToggleSidebar,
  showSidebarToggle = false,
}: ChatHeaderProps) {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-card flex items-center justify-between border-b px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <FacetAITextLogoSVG className="text-primary h-8" />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getUserInitials(session.user.name, session.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Signed in as {session.user.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Sign out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
