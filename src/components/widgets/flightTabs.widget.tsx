"use client";

import React from "react";
import { useStreamContext } from "@/providers/Stream";
import { FlightTabs } from "@/components/flight/FlightTabs";

export const FlightSearchTabsWidget = () => {
  const stream = useStreamContext();
  console.log("Stream data: ", stream.messages)

  // Check if flightSearchCriteria exists in the state
  const flightSearchCriteria = (stream as any)?.state?.flightSearchCriteria;

  // Only render if we have flight search criteria data
  if (!flightSearchCriteria) {
    return null;
  }

  // // Check if we have meaningful data (at least origin or destination)
  // const hasFlightData = flightSearchCriteria.originAirport ||
  //                      flightSearchCriteria.destinationAirport ||
  //                      flightSearchCriteria.departureDate;
  //
  // if (!hasFlightData) {
  //   return null;
  // }

  return (
    <div className="w-full">
      <FlightTabs flightSearchCriteria={flightSearchCriteria} />
    </div>
  );
};
