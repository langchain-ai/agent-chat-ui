import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import React from "react";
import { MapView } from "@/components/flight/MapComponent";
import { ItineraryView } from "@/components/flight/ItineraryComponent";
import { Thread } from "@/components/thread/chat";
import { useQueryState } from "nuqs";
import { useTabContext } from "@/providers/TabContext";

const tabs = [
  {
    name: "Chat",
    component: <Thread />,
  },
  {
    name: "Map",
    component: <MapView />,
  },
  {
    name: "Itinerary",
    component: <ItineraryView />,
  },
];

export const TabsLayout = () => {
  const [threadId, _setThreadId] = useQueryState("threadId");
  const { activeTab, setActiveTab } = useTabContext();

  const handleTabChange = (value: string) => {
    setActiveTab(value as "Chat" | "Map" | "Itinerary");
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex h-full w-full flex-col"
    >
      <TabsList className="flex items-center justify-center gap-2">
        {threadId &&
          tabs.map((tab, index) => (
            <TabsTrigger
              key={index}
              value={tab.name}
              className="rounded-4xl px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white"
            >
              {tab.name}
            </TabsTrigger>
          ))}
      </TabsList>
      {/* Content area */}
      <div className="min-h-0 w-full flex-1">
        {tabs.map((tab, index) => (
          <TabsContent
            key={index}
            value={tab.name}
            className="h-full"
          >
            {tab.component}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};
