import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import React from "react";
import { MapView } from "@/components/flight/MapComponent";
import { ItineraryView } from "@/components/flight/ItineraryComponent";
import { Thread } from "@/components/thread/chat";
import { useQueryState } from "nuqs";

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

  return (
    <Tabs
      defaultValue="Chat"
      className="flex h-full w-full flex-col p-3"
    >
      <TabsList className="flex items-center gap-2 justify-center rounded-xl border border-gray-300 bg-white p-1 shadow-sm">
        {threadId &&
          tabs.map((tab, index) => (
            <TabsTrigger
              key={index}
              value={tab.name}
              className="rounded-lg px-4 py-2 text-sm transition-colors data-[state=active]:bg-black data-[state=active]:text-white"
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
