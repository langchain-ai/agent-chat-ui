"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import React from "react";
import { MapView } from "@/components/flight/MapComponent";
import { ItineraryView } from "@/components/flight/ItineraryComponent";
import { Thread } from "@/components/thread/chat";
import { useQueryState } from "nuqs";
import { FlyoLogoSVG } from "../icons/langgraph";
import { Button } from "@/components/ui/button";
import { SquarePen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { parseAsBoolean } from "nuqs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ThreadHistory from "./history";
import { useTabContext } from "@/providers/TabContext";

const tabs = [
  // { name: "Map", component: <MapView /> }, // Commented out - can be easily restored later
  { name: "Chat", component: <Thread /> },
  { name: "Review", component: <ItineraryView /> },
];

export const TabsLayout = () => {
  const [threadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const router = useRouter();
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const { activeTab, setActiveTab } = useTabContext();

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar - moved to top level */}
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r border-gray-200 bg-white"
          style={{ width: 260 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -260 }
              : { x: chatHistoryOpen ? 0 : -260 }
          }
          initial={{ x: -260 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div
            className="relative h-full"
            style={{ width: 260 }}
          >
            <ThreadHistory />
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        layout={isLargeScreen}
        animate={{
          marginLeft: chatHistoryOpen ? (isLargeScreen ? 260 : 0) : 0,
          width: chatHistoryOpen
            ? isLargeScreen
              ? "calc(100% - 260px)"
              : "100%"
            : "100%",
        }}
        transition={
          isLargeScreen
            ? { type: "spring", stiffness: 300, damping: 30 }
            : { duration: 0 }
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "Chat" | "Review")
          }
          className="flex h-full w-full flex-col"
        >
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              {/* Sidebar Toggle Button */}
              <Button
                className="h-8 w-8 p-0 hover:bg-gray-100"
                variant="ghost"
                onClick={() => setChatHistoryOpen((p) => !p)}
              >
                {chatHistoryOpen ? (
                  <PanelRightOpen className="size-4" />
                ) : (
                  <PanelRightClose className="size-4" />
                )}
              </Button>
            </div>

            <TabsList className="bg-muted mx-4 flex max-w-[300px] flex-grow justify-center rounded-md p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.name}
                  value={tab.name}
                  className="text-muted-foreground flex-1 rounded-sm px-4 py-1 text-sm font-medium whitespace-nowrap transition-colors data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <Button
              size="lg"
              className="p-2"
              variant="ghost"
              onClick={() => router.push("/")}
            >
              <SquarePen className="size-6" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.name}
                value={tab.name}
                className="flex flex-1 flex-col overflow-y-auto"
              >
                {tab.component}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
};
