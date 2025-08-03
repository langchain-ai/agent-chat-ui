"use client";

import React, { useState } from "react";
import { useStreamContext } from "@/providers/Stream";
import { MapComponent } from "./MapComponent";
import { ItineraryComponent } from "./ItineraryComponent";
import { Map, Calendar, Plane } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const FloatingFlightTabs = () => {
  const stream = useStreamContext();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Check if we have any messages (show from first message)
  const hasMessages = stream.messages && stream.messages.length > 0;

  // Check if flightSearchCriteria exists in the state
  const flightSearchCriteria = (stream as any)?.state?.flightSearchCriteria;

  // Get full stream data to pass to components
  const streamData = (stream as any)?.state || {};

  // Only show if we have messages, even if no flight data yet
  if (!hasMessages) {
    return null;
  }

  const handleTabClick = (tabType: "map" | "itinerary") => {
    setActiveTab(tabType);
    setIsSheetOpen(true);
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <div className="flex border rounded-full p-2 gap-2">
            <button
              onClick={() => handleTabClick("map")}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors text-gray-600 hover:text-gray-800 hover:bg-blue-50 border"
            >
              <Map className="w-3 h-3" />
              Map
            </button>
            <button
              onClick={() => handleTabClick("itinerary")}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors text-gray-600 hover:text-gray-800 hover:bg-blue-50 border"
            >
              <Calendar className="w-3 h-3" />
              Itinerary
            </button>
          </div>


        <SheetContent side="bottom" className="h-[85vh] max-h-[700px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600" />
              Flight Information -{" "}
              {activeTab === "map" ? "Route Map" : "Travel Itinerary"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 h-full overflow-hidden">
            <div className="h-full overflow-y-auto">
              {activeTab === "map" ? (
                <MapComponent
                  flightSearchCriteria={flightSearchCriteria}
                  streamData={streamData}
                />
              ) : (
                <ItineraryComponent
                  flightSearchCriteria={flightSearchCriteria}
                  streamData={streamData}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
