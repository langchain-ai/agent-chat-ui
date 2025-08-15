"use client";

import { useRouter } from "next/navigation";
import { LogoutButton } from "../auth";
import { logout } from "@/services/authService";
import { PanelRightClose, PanelRightOpen, SquarePen, LogOut } from "lucide-react";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { FlyoLogoSVG } from "@/components/icons/langgraph";
import { motion } from "framer-motion";
import { TabsLayout } from "../thread/TabsLayout";
import { useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { useStreamContext } from "@/providers/Stream";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useConfirmation } from "@/hooks/useConfirmation";

export const Navbar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stream = useStreamContext();

  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmation();

  // Debug logging for logout button visibility
  console.log("🔍 Navbar Debug - Component rendering");
  console.log("🔍 Navbar Debug - isLargeScreen:", isLargeScreen);
  console.log("🔍 Navbar Debug - chatHistoryOpen:", chatHistoryOpen);
  console.log("🔍 Navbar Debug - About to render navbar with logout button");

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-white p-1">
      <div className="sticky flex items-center justify-start gap-2">
        <div className="absolute left-0 z-10">
          {(!chatHistoryOpen || !isLargeScreen) && (
            <Button
              className="h-12 w-12 p-0 hover:bg-gray-100"
              variant="ghost"
              onClick={() => setChatHistoryOpen((p) => !p)}
            >
              {chatHistoryOpen ? (
                <PanelRightOpen className="size-6" />
              ) : (
                <PanelRightClose className="size-6" />
              )}
            </Button>
          )}
        </div>
        <motion.button
          className="flex cursor-pointer items-center gap-2"
          animate={{
            marginLeft: !chatHistoryOpen ? 48 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <FlyoLogoSVG
            width={50}
            height={50}
          />
        </motion.button>
      </div>

      <div className="flex items-center gap-4">
        <Button
          size="lg"
          className="p-2"
          variant="ghost"
          onClick={() => {
            // Clear threadId in URL and reset in-memory stream state
            try {
              stream?.stop?.();
              stream?.clearInMemoryValues?.();
            } catch {}
            const params = new URLSearchParams(
              searchParams?.toString?.() ?? "",
            );
            params.delete("threadId");
            router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
          }}
        >
          <SquarePen className="size-6" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400 flex items-center gap-2"
          onClick={async () => {
            console.log("🔍 Logout button clicked!");
            const confirmed = await confirm({
              title: "Confirm Logout",
              message: "Are you sure you want to logout? You will need to sign in again to access your account.",
              confirmText: "Yes, Logout",
              cancelText: "Cancel",
            });

            if (confirmed) {
              console.log("🔍 User confirmed logout, calling logout function");
              logout();
            } else {
              console.log("🔍 User cancelled logout");
            }
          }}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        confirmVariant={options.confirmVariant}
      />
    </div>
  );
};
