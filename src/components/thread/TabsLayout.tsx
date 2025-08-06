"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import React from "react";
import { MapView } from "@/components/flight/MapComponent";
import { ItineraryView } from "@/components/flight/ItineraryComponent";
import { Thread } from "@/components/thread/chat";
import { useQueryState } from "nuqs";
import { FlyoLogoSVG } from "../icons/langgraph";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation"; // Make sure this matches your Next.js version (see note below)

const tabs = [
  { name: "Map", component: <MapView /> },
  { name: "Chat", component: <Thread /> },
  { name: "Itinerary", component: <ItineraryView /> },
];

export const TabsLayout = () => {
  const [threadId] = useQueryState("threadId");
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col">
      <Tabs defaultValue="Chat" className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between p-2">
          <FlyoLogoSVG width={50} height={50} />

          <TabsList className="flex flex-grow justify-center rounded-md bg-muted p-1 mx-4 max-w-md">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.name}
                value={tab.name}
                className="flex-1 whitespace-nowrap rounded-sm px-4 py-1 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm"
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
    </div>
  );
};
