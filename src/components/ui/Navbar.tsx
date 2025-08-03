"use client";

import { useRouter } from "next/navigation";
import { LogoutButton } from "../auth";
import { PanelRightClose, PanelRightOpen, SquarePen } from "lucide-react";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { FlyoLogoSVG } from "@/components/icons/langgraph";
import { motion } from "framer-motion";

export const Navbar = () => {
  const router = useRouter();

  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-white p-2">
      <div className="sticky flex items-center justify-start gap-2">
        <div className="absolute left-0 z-10">
          {(!chatHistoryOpen || !isLargeScreen) && (
            <Button
              className="hover:bg-gray-100"
              variant="ghost"
              onClick={() => setChatHistoryOpen((p) => !p)}
            >
              {chatHistoryOpen ? (
                <PanelRightOpen className="size-5" />
              ) : (
                <PanelRightClose className="size-5" />
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
            width={70}
            height={70}
          />
        </motion.button>
      </div>

      <div className="flex items-center gap-4">
        <TooltipIconButton
          size="lg"
          className="p-4"
          tooltip="New thread"
          variant="ghost"
          onClick={() => router.push("/")}
        >
          <SquarePen className="size-5" />
        </TooltipIconButton>
        <LogoutButton
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
        />
      </div>
    </div>
  );
};
