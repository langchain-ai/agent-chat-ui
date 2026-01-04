"use client";

import { Button } from "@/components/ui/button";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { TemplatesButton } from "./templates-button";
import { AgentList } from "./agent-list";
import { SidebarFooter } from "./sidebar-footer";
import { UserProfile } from "./user-profile";

export default function Sidebar() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [sidebarOpen, setSidebarOpen] = useQueryState(
    "sidebarOpen",
    parseAsBoolean.withDefault(false)
  );

  // On desktop (lg+), render the full sidebar content
  // On mobile, render only the Sheet component
  if (isLargeScreen) {
    return (
      <div className="flex h-screen w-[280px] shrink-0 flex-col bg-white">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Button
            className="hover:bg-gray-50"
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((p) => !p)}
          >
            {sidebarOpen ? (
              <PanelRightOpen className="size-5 text-gray-600" />
            ) : (
              <PanelRightClose className="size-5 text-gray-600" />
            )}
          </Button>
          <span className="flex-1 text-lg font-semibold tracking-tight text-gray-900">
            Deep Agent Builder
          </span>
        </div>

        {/* Templates Button */}
        <div className="px-2 py-1">
          <TemplatesButton />
        </div>

        {/* Agent List */}
        <AgentList />

        {/* Footer */}
        <SidebarFooter />

        {/* User Profile */}
        <UserProfile />
      </div>
    );
  }

  // Mobile: render Sheet overlay
  return (
    <Sheet
      open={!!sidebarOpen}
      onOpenChange={(open) => setSidebarOpen(open)}
    >
      <SheetContent side="left" className="flex w-[280px] flex-col p-0">
        <SheetHeader className="border-b border-gray-200 px-4 py-3">
          <SheetTitle className="text-lg font-semibold tracking-tight text-gray-900">
            Deep Agent Builder
          </SheetTitle>
        </SheetHeader>

        {/* Templates Button */}
        <div className="px-2 py-1">
          <TemplatesButton />
        </div>

        {/* Agent List */}
        <AgentList />

        {/* Footer */}
        <SidebarFooter />

        {/* User Profile */}
        <UserProfile />
      </SheetContent>
    </Sheet>
  );
}
