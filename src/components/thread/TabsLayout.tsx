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
    <Tabs defaultValue="Chat" className="flex h-full w-full flex-col">
      {/* Sticky tab bar at top */}
      <div className="flex-shrink-0 bg-white p-1 rounded-4xl border-2 mt-2 mx-auto">
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
      </div>

      {/* Content area */}
      <div className="flex-1 w-full min-h-0">
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

