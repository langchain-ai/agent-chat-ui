"use client";

import React, { useState } from "react";
import { FlightCard } from "./flight-card";
import { AllFlightsSheet } from "./all-flights-sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlightOffer } from "../../types/flightOptionsV0";
import { submitInterruptResponse } from "./util";
import { useStreamContext } from "@/providers/Stream";

// Mock flight data based on the guide - updated to use tags array

const flightOffers: FlightOffer[] = [
    {
      flightOfferId: "flight-1",
      departure: {
        iata: "DEL",
        city: "new Delhi",
        date: "2024-07-20",
      },
      arrival: {
        iata: "HNL",
        city: "Honolulu",
        date: "2024-07-20",
      },
      tags: ["best", "recommended"],
      price: "$2,141.24",
      duration: "23h 35m",
      stops: 2,
      airline: "Cathay Pacific",
      airlineCode: "CX",
      departureTime: "01:15",
      arrivalTime: "01:50",
      nextDay: true,
      layovers: [
        { city: "Hong Kong", duration: "1h 20m layover", iataCode: "HKG" },
        { city: "Tokyo", duration: "4h 35m layover", iataCode: "NRT" },
      ],
      segments: [
        {
          from: "New Delhi (DEL)",
          to: "Hong Kong (HKG)",
          departure: "01:15",
          arrival: "08:30",
          flight: "CX 694",
          duration: "5h 45m",
          date: "Today",
        },
        {
          layover: "Hong Kong",
          duration: "1h 20m",
          details: "Terminal change required",
        },
        {
          from: "Hong Kong (HKG)",
          to: "Tokyo (NRT)",
          departure: "09:50",
          arrival: "15:25",
          flight: "CX 520",
          duration: "3h 35m",
          date: "Today",
        },
        {
          layover: "Tokyo",
          duration: "4h 35m",
          details: "International transit",
        },
        {
          from: "Tokyo (NRT)",
          to: "Honolulu (HNL)",
          departure: "20:00",
          arrival: "01:50",
          flight: "CX 278",
          duration: "7h 15m",
          date: "Tomorrow",
        },
      ],
    },
    {
      flightOfferId: "flight-2",
      departure: {
        iata: "DEL",
        city: "new Delhi",
        date: "2024-07-20",
      },
      arrival: {
        iata: "HNL",
        city: "Honolulu",
        date: "2024-07-20",
      },
      tags: ["cheapest"],
      price: "$1,892.50",
      duration: "28h 15m",
      stops: 2,
      airline: "Air India",
      airlineCode: "AI",
      departureTime: "14:30",
      arrivalTime: "06:45",
      nextDay: true,
      layovers: [
        { city: "Mumbai", duration: "3h 45m layover", iataCode: "BOM" },
        { city: "Los Angeles", duration: "2h 30m layover", iataCode: "LAX" },
      ],
      segments: [
        {
          from: "New Delhi (DEL)",
          to: "Hong Kong (HKG)",
          departure: "01:15",
          arrival: "08:30",
          flight: "CX 694",
          duration: "5h 45m",
          date: "Today",
        },
        {
          layover: "Hong Kong",
          duration: "1h 20m",
          details: "Terminal change required",
        },
        {
          from: "Hong Kong (HKG)",
          to: "Tokyo (NRT)",
          departure: "09:50",
          arrival: "15:25",
          flight: "CX 520",
          duration: "3h 35m",
          date: "Today",
        },
        {
          layover: "Tokyo",
          duration: "4h 35m",
          details: "International transit",
        },
        {
          from: "Tokyo (NRT)",
          to: "Honolulu (HNL)",
          departure: "20:00",
          arrival: "01:50",
          flight: "CX 278",
          duration: "7h 15m",
          date: "Tomorrow",
        },
      ],
    },
    {
      flightOfferId: "flight-3",
      departure: {
        iata: "DEL",
        city: "new Delhi",
        date: "2024-07-20",
      },
      arrival: {
        iata: "HNL",
        city: "Honolulu",
        date: "2024-07-20",
      },
      tags: ["fastest", "recommended"],
      price: "$3,245.80",
      duration: "18h 20m",
      stops: 1,
      airline: "United Airlines",
      airlineCode: "UA",
      departureTime: "22:45",
      arrivalTime: "11:05",
      nextDay: true,
      layovers: [
        { city: "San Francisco", duration: "2h 15m layover", iataCode: "SFO" },
      ],
      segments: [
        {
          from: "New Delhi (DEL)",
          to: "Hong Kong (HKG)",
          departure: "01:15",
          arrival: "08:30",
          flight: "CX 694",
          duration: "5h 45m",
          date: "Today",
        },
        {
          layover: "Hong Kong",
          duration: "1h 20m",
          details: "Terminal change required",
        },
        {
          from: "Hong Kong (HKG)",
          to: "Tokyo (NRT)",
          departure: "09:50",
          arrival: "15:25",
          flight: "CX 520",
          duration: "3h 35m",
          date: "Today",
        },
        {
          layover: "Tokyo",
          duration: "4h 35m",
          details: "International transit",
        },
        {
          from: "Tokyo (NRT)",
          to: "Honolulu (HNL)",
          departure: "20:00",
          arrival: "01:50",
          flight: "CX 278",
          duration: "7h 15m",
          date: "Tomorrow",
        },
      ],
    },
  ]


  interface FlightOptionsProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
}

export default function FlightOptionsV0Widget(args: FlightOptionsProps) {
  const thread = useStreamContext();
  const liveArgs = args.apiData?.value?.widget?.args ?? {};
  const frozenArgs = (liveArgs as any)?.submission;
  const effectiveArgs = args.readOnly && frozenArgs ? frozenArgs : liveArgs;
  const readOnly = !!args.readOnly;

  const flightOffers: FlightOffer[] =
    (effectiveArgs as any)?.flightOffers ?? args.flightOffers ?? {};
  
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [showAllFlights, setShowAllFlights] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFlight = async (flightOfferId: string) => {
// Prevent selection in read-only mode
    if (readOnly) return;

    setSelectedFlight(flightOfferId);
    setIsLoading(true);

   setShowAllFlights(false);
    const responseData = {
      selectedFlightId: flightOfferId,
    };


   try {
      const selectedFlightOffer = flightOffers.find(
        (offer: any) => offer.flightOfferId === flightOfferId,
      );
      const frozen = {
        widget: {
          type: "FlightOptionsWidget",
          args: { flightOffers: [selectedFlightOffer] },
        },
        value: {
          type: "widget",
          widget: {
            type: "FlightOptionsWidget",
            args: { flightOffers: [selectedFlightOffer] },
          },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
    } catch (error) {
      // Optional: already handled inside the utility
    } finally {
      setIsLoading(false);
    }
  }; 

  return (
    <div
      className="container mx-auto max-w-6xl p-4"
      style={{
        fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Flight Options
        </h2>
        <p className="text-gray-600">
          {flightOffers[0].departure.city} ({flightOffers[0].departure.iata}) → {flightOffers[0].arrival.city} ({flightOffers[0].arrival.iata})
        </p>
      </div>

      {/* Desktop Layout - Three cards side by side */}
      <div className="hidden md:block">
        <div className="mb-6 grid grid-cols-3 gap-4">
          {flightOffers.map((flight, index) => (
            <div
              key={index}
              className="rounded-lg border bg-white shadow-sm"
            >
              <FlightCard
                {...(flight)}
                onSelect={handleSelectFlight}
                isLoading={isLoading}
                selectedFlightId={selectedFlight}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Layout - Tabs */}
      <div className="mb-6 md:hidden">
        <Tabs
          defaultValue="best"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="best">Best</TabsTrigger>
            <TabsTrigger value="cheapest">Cheapest</TabsTrigger>
            <TabsTrigger value="fastest">Fastest</TabsTrigger>
          </TabsList>

          {flightOffers.map((flight, index) => {
            // Determine the primary tab value based on tags
            const primaryTag = flight.tags.includes("best")
              ? "best"
              : flight.tags.includes("cheapest")
                ? "cheapest"
                : flight.tags.includes("fastest")
                  ? "fastest"
                  : "best";

            return (
              <TabsContent
                key={index}
                value={primaryTag}
                className="mt-4"
              >
                <div className="rounded-lg border bg-white shadow-sm">
                  <FlightCard
                    {...flight}
                    onSelect={handleSelectFlight}
                    isLoading={isLoading}
                    selectedFlightId={selectedFlight}
                  />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Show All Flights Button */}
     { showAllFlights && (
        <div className="flex justify-center">
        <AllFlightsSheet flights={flightOffers}>
          <Button
            variant="outline"
            className="w-full md:w-auto"
          >
            Show all flights
          </Button>
        </AllFlightsSheet>
      </div> )}
    </div>
  );
}
