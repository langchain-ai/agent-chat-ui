"use client"

import React, { useState } from "react"
import { FlightCard } from "./flight-card"
import { AllFlightsSheet } from "./all-flights-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Filter } from "lucide-react"
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { useEffect } from "react";
import { FlightFilterProvider, useFlightFilter } from "./flight-filter-context";
import { getCurrencySymbol } from "@/utils/currency-storage";



interface FlightOptionsProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
  allFlightOffers?: any[];
}

// Internal component that uses the filter context
function FlightOptionsContent(args: FlightOptionsProps) {
  const thread = useStreamContext();
  const {
    filteredFlights,
    filterState,
    priceStats,
    maxAvailableStops,
    availableAirlines,
    setPriceRange,
    setSelectedAirlines,
    setMaxStops,
    setSelectedDepartureTime,
    setSortBy,
    clearAllFilters,
    toggleAirline,
    toggleDepartureTime,
    activeFiltersCount
  } = useFlightFilter();

  const liveArgs = args.apiData?.value?.widget?.args ?? {};
  const frozenArgs = (liveArgs as any)?.submission;
  const readOnly = !!args.readOnly;
  const effectiveArgs = args.readOnly && frozenArgs ? frozenArgs : liveArgs;

  const flightSearchFilters = (effectiveArgs as any)?.flightFilters  ?? args.flightFilters ?? {};

  // // Check if there's no flight data available
  const allFlightOffers = args.allFlightOffers || [];
  const hasNoFlightData = !allFlightOffers || allFlightOffers.length === 0;

  // If no flight data available, show empty state
  if (hasNoFlightData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No flights available</div>
          <div className="text-gray-400 text-sm">Please try adjusting your search criteria</div>
        </div>
      </div>
    );
  }

  // Filter to show only 3 cards maximum with priority tags from filtered flights with custom tags
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

  // Use filtered flights with custom tags for display
  const flightOffers = getFilteredFlightOffers(filteredFlights);

  // Get flights by tag type for mobile tabs from filtered flights with custom tags
  const getFlightByTag = (tag: string) => {
    if (!Array.isArray(filteredFlights)) return null;
    return filteredFlights.find((offer: any) =>
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
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExpandedAirlines, setShowExpandedAirlines] = useState(false);

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
    console.log('selectedFlightOfferId', flightOfferId);
      const selectedFlightOffer = args.allFlightOffers?.find(
        (offer: any) => offer.flightOfferId === flightOfferId,
      );
      console.log('selectedFlightOffer', selectedFlightOffer);
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
        {/* {flightOffers.length > 0 ? (
          <p className="text-gray-600">{flightOffers[0]?.journey[0]?.departure?.airportName} ({flightOffers[0]?.journey[0]?.departure?.airportIata}) → {flightOffers[0]?.journey[0]?.arrival?.airportName} ({flightOffers[0]?.journey[0]?.arrival?.airportIata})</p>
        ) : (
          <p className="text-gray-600">No flights found for the selected criteria.</p>
        )} */}
      </div>

      {/* Filter Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(true)}
          className="mb-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
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
            <p>No flights match your current filters. Try adjusting your search criteria.</p>
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
          /* Empty state if no filtered flights available */
          <div className="mt-4 p-8 text-center text-gray-500">
            <p>No flights match your current filters. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Show All Flights Button */}
      { showAllFlights && <div className="flex justify-center">
        <AllFlightsSheet
          flightData={filteredFlights}
          onFlightSelect={handleSelectFlight}
          flightSearchFilters={flightSearchFilters}
        >
          <Button variant="outline" className="w-full md:w-auto">
            Show all flights
          </Button>
        </AllFlightsSheet>
      </div>}

      {/* Filter Bottom Sheet Modal */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent
          side="bottom"
          className="flex h-[85vh] flex-col overflow-hidden"
          style={{
            fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
          }}
        >
          <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-3">
            <SheetTitle className="text-lg font-semibold">
              Filter Flights
            </SheetTitle>
          </SheetHeader>

          {/* Filter Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-6">
              {/* Price Range Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Price Range: {getCurrencySymbol(priceStats.currency)} {filterState.priceRange[0].toLocaleString()} - {getCurrencySymbol(priceStats.currency)} {filterState.priceRange[1].toLocaleString()}
                </Label>
                <Slider
                  value={filterState.priceRange}
                  onValueChange={setPriceRange}
                  max={priceStats.max}
                  min={priceStats.min}
                  step={Math.max(1, Math.floor((priceStats.max - priceStats.min) / 100))}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Airlines Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Airlines</Label>
                <div className="space-y-2">
                  {availableAirlines.slice(0, showExpandedAirlines ? availableAirlines.length : 2).map((airline) => (
                    <div key={airline} className="flex items-center space-x-2">
                      <Checkbox
                        id={airline}
                        checked={filterState.selectedAirlines.includes(airline as string)}
                        onCheckedChange={() => toggleAirline(airline as string)}
                      />
                      <Label htmlFor={airline} className="text-sm">
                        {airline}
                      </Label>
                    </div>
                  ))}
                  {availableAirlines.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExpandedAirlines(!showExpandedAirlines)}
                      className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto"
                    >
                      {showExpandedAirlines ? 'Show less airlines' : `Show all airlines (${availableAirlines.length - 2} more)`}
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Max Stops Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Max Stops: {filterState.maxStops === 0 ? "Non-stop" : `${filterState.maxStops} stop${filterState.maxStops > 1 ? "s" : ""}`}
                </Label>
                <Slider
                  value={[filterState.maxStops]}
                  onValueChange={(value) => setMaxStops(value[0])}
                  max={maxAvailableStops}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Departure Time Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Departure Time</Label>
                <div className="space-y-2">
                  {[
                    { label: "Early Morning (midnight - 08:00)", value: "early" },
                    { label: "Morning (08:00 - 12:00)", value: "morning" },
                    { label: "Afternoon (12:00 - 16:00)", value: "afternoon" },
                    { label: "Evening (16:00 - 20:00)", value: "evening" },
                    { label: "Night (20:00 - midnight)", value: "night" },
                  ].map((slot) => (
                    <div key={slot.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={slot.value}
                        checked={filterState.selectedDepartureTime.includes(slot.value)}
                        onCheckedChange={() => toggleDepartureTime(slot.value)}
                      />
                      <Label htmlFor={slot.value} className="text-sm">
                        {slot.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                disabled={activeFiltersCount === 0}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear all
                {activeFiltersCount > 0 && (
                  <span className="ml-1">({activeFiltersCount})</span>
                )}
              </Button>
              <Button
                onClick={() => setShowFilters(false)}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Main wrapper component that provides filter context
export default function FlightOptionsV0Widget(args: FlightOptionsProps) {
  const liveArgs = args.apiData?.value?.widget?.args ?? {};
  const frozenArgs = (liveArgs as any)?.submission;
  const effectiveArgs = args.readOnly && frozenArgs ? frozenArgs : liveArgs;

  const allFlightOffers = (effectiveArgs as any)?.flightOffers ?? args.flightOffers ?? [];
  console.log('allFlightOffers', JSON.stringify(allFlightOffers, null, 2),'readonly', args.readOnly);

  return (
    <FlightFilterProvider flightData={allFlightOffers}>
      <FlightOptionsContent {...args} allFlightOffers={allFlightOffers} />
    </FlightFilterProvider>
  )
}
