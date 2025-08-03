"use client";

import React, { useState } from "react";
import { FlightSearchCriteria } from "@/types/flightSearchCriteria";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapView } from "./MapView";
import { ItineraryView } from "./ItineraryView";
import { Map, Calendar } from "lucide-react";

interface FlightTabsProps {
  flightSearchCriteria: FlightSearchCriteria;
  activeTab?: "map" | "itinerary";
  showTabNavigation?: boolean;
}

export const FlightTabs: React.FC<FlightTabsProps> = ({
  flightSearchCriteria,
  activeTab = "map",
  showTabNavigation = true
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab);

  // If showTabNavigation is false, render only the content without tabs
  if (!showTabNavigation) {
    return (
      <div className="w-full max-w-4xl mx-auto my-4">
        {activeTab === "map" ? (
          <MapView flightSearchCriteria={flightSearchCriteria} />
        ) : (
          <ItineraryView flightSearchCriteria={flightSearchCriteria} />
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-4">
      <Tabs value={internalActiveTab} onValueChange={setInternalActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Map
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Itinerary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <MapView flightSearchCriteria={flightSearchCriteria} />
        </TabsContent>

        <TabsContent value="itinerary" className="mt-4">
          <ItineraryView flightSearchCriteria={flightSearchCriteria} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
