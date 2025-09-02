"use client"

import React, { useState } from "react"
import { FlightCard } from "./flight-card"
import { AllFlightsSheet } from "./all-flights-sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { useEffect } from "react";



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

  const flightSearchFilters = (effectiveArgs as any)?.flightFilters  ?? args.flightFilters ?? {};
  const allFlightOffers =
    (effectiveArgs as any)?.flightOffers ?? args.flightOffers ?? {};

  // Filter to show only 3 cards maximum with priority tags
  const getFilteredFlightOffers = (offers: any[]) => {
    if (!Array.isArray(offers)) return [];

    const filteredOffers: any[] = [];
    const seenTags = new Set();

    // Priority order: best, cheapest, fastest (as per requirements)
    const priorityTags = ['best', 'cheapest', 'fastest'];

    for (const tag of priorityTags) {
      const offer = offers.find(offer => {
        const hasTag = offer.type === tag || (offer.tags && offer.tags.includes(tag));
        const offerAlreadyUsed = filteredOffers.some(existing => existing.flightOfferId === offer.flightOfferId);
        return hasTag && !offerAlreadyUsed;
      });
      if (offer) {
        filteredOffers.push(offer);
        seenTags.add(tag);
      }
    }

    return filteredOffers;
  };

  const flightOffers = getFilteredFlightOffers(allFlightOffers);

  // Get flights by tag type for mobile tabs
  const getFlightByTag = (tag: string) => {
    if (!Array.isArray(allFlightOffers)) return null;
    return allFlightOffers.find((offer: any) =>
      offer.type === tag || (offer.tags && offer.tags.includes(tag))
    );
  };

  const bestFlight = getFlightByTag('best');
  const cheapestFlight = getFlightByTag('cheapest');
  const fastestFlight = getFlightByTag('fastest');

  // Determine the default tab based on available flights
  const getDefaultTab = () => {
    if (bestFlight) return 'best';
    if (cheapestFlight) return 'cheapest';
    if (fastestFlight) return 'fastest';
    return 'best'; // fallback
  };

  const readOnly = !!args.readOnly;
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // const handleSelectFlight = async (flightOfferId: string) => {
  //   setSelectedFlight(flightOfferId);
  //   setIsLoading(true);

  //   // Simulate API call
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     console.log("Selected flight:", flightOfferId);
  //   }, 1000);
  // };

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

  useEffect(() => {
    if (!readOnly) {
      setShowAllFlights(true);
    }
    if (readOnly) {
      setShowAllFlights(false);
    }
  }, [readOnly]);

  return (
    <div
      className="container mx-auto p-4 max-w-6xl"
      style={{
        fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {flightOffers.length > 0 ? "Flight Options" : "No flights available"}
        </h2>
        {flightOffers.length > 0 ? (
          <p className="text-gray-600">{flightOffers[0]?.journey[0]?.departure?.airportName} ({flightOffers[0]?.journey[0]?.departure?.airportIata}) → {flightOffers[0]?.journey[0]?.arrival?.airportName} ({flightOffers[0]?.journey[0]?.arrival?.airportIata})</p>
        ) : (
          <p className="text-gray-600">No flights found for the selected criteria.</p>
        )}
      </div>

      {/* Desktop Layout - Show 2-3 cards based on available tag types */}
      <div className="hidden md:block">
        {flightOffers.length > 0 ? (
          <div className={`grid gap-4 mb-6 ${
            flightOffers.length === 3 ? 'grid-cols-3' :
            flightOffers.length === 2 ? 'grid-cols-2' :
            'grid-cols-1'
          }`}>
            {flightOffers.map((flight: any, index: number) => (
              <div key={index} className="bg-white rounded-lg border shadow-sm">
                <FlightCard
                  {...flight}
                  onSelect={handleSelectFlight}
                  isLoading={isLoading}
                  selectedFlightId={selectedFlight}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 p-8 text-center text-gray-500">
            <p>No flights available for the selected criteria.</p>
          </div>
        )}
      </div>

      {/* Mobile Layout - Tabs */}
      <div className="md:hidden mb-6">
        {(bestFlight || cheapestFlight || fastestFlight) ? (
          <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList className={`grid w-full ${
              [bestFlight, cheapestFlight, fastestFlight].filter(Boolean).length === 3 ? 'grid-cols-3' :
              [bestFlight, cheapestFlight, fastestFlight].filter(Boolean).length === 2 ? 'grid-cols-2' :
              'grid-cols-1'
            }`}>
              {bestFlight && (
                <TabsTrigger value="best">
                  Best
                </TabsTrigger>
              )}
              {cheapestFlight && (
                <TabsTrigger value="cheapest">
                  Cheapest
                </TabsTrigger>
              )}
              {fastestFlight && (
                <TabsTrigger value="fastest">
                  Fastest
                </TabsTrigger>
              )}
            </TabsList>

          {bestFlight && (
            <TabsContent value="best" className="mt-4">
              <div className="bg-white rounded-lg border shadow-sm">
                <FlightCard
                  {...bestFlight}
                  onSelect={handleSelectFlight}
                  isLoading={isLoading}
                  selectedFlightId={selectedFlight}
                />
              </div>
            </TabsContent>
          )}

          {cheapestFlight && (
            <TabsContent value="cheapest" className="mt-4">
              <div className="bg-white rounded-lg border shadow-sm">
                <FlightCard
                  {...cheapestFlight}
                  onSelect={handleSelectFlight}
                  isLoading={isLoading}
                  selectedFlightId={selectedFlight}
                />
              </div>
            </TabsContent>
          )}

          {fastestFlight && (
            <TabsContent value="fastest" className="mt-4">
              <div className="bg-white rounded-lg border shadow-sm">
                <FlightCard
                  {...fastestFlight}
                  onSelect={handleSelectFlight}
                  isLoading={isLoading}
                  selectedFlightId={selectedFlight}
                />
              </div>
            </TabsContent>
          )}

          </Tabs>
        ) : (
          /* Empty state if no flights available */
          <div className="mt-4 p-8 text-center text-gray-500">
            <p>No flights available for the selected criteria.</p>
          </div>
        )}
      </div>

      {/* Show All Flights Button */}
      {flightOffers?.length > 0  && showAllFlights && <div className="flex justify-center">
        <AllFlightsSheet
          flightData={allFlightOffers}
          onFlightSelect={handleSelectFlight}
          flightSearchFilters={flightSearchFilters}
        >
          <Button variant="outline" className="w-full md:w-auto">
            Show all flights
          </Button>
        </AllFlightsSheet>
      </div>}
    </div>
  )
}
