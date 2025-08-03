import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import React from "react";
import { MapComponent } from "@/components/flight/MapComponent";
import { ItineraryComponent } from "@/components/flight/ItineraryComponent";
import { Thread } from "@/components/thread/chat";
import { useQueryState } from "nuqs";

const tabs = [
  {
    name: "Chat",
    component: <Thread />,
  },
  {
    name: "Map",
    component: <MapComponent />,
  },
  {
    name: "Itinerary",
    component: <ItineraryComponent />,
  },
];

export const TabsLayout = () => {

  const [threadId, _setThreadId] = useQueryState("threadId")

  return (
    <Tabs defaultValue="Chat" className="flex h-screen w-full flex-col items-center">
      <TabsList className="flex items-center justify-center gap-2 bg-white px-4 py-2">
        {threadId && tabs.map((tab, index) => (
          <TabsTrigger
            key={index}
            value={tab.name}
            className="rounded-4xl border px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white"
          >
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Content container should grow and allow overflow control to TabsContent */}
      <div className="flex w-full max-w-3xl flex-1 flex-col min-h-0">
        {tabs.map((tab, index) => (
          <TabsContent
            key={index}
            value={tab.name}
            className="flex-1 min-h-0"
          >
            <div className="h-full"> {/* ensures Chat gets full height */}
              {tab.component}
            </div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

