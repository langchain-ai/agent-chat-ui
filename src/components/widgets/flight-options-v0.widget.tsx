"use client";

import React, { useState } from "react";
import { FlightCard } from "./flight-card";
import { AllFlightsSheet } from "./all-flights-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter } from "lucide-react";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { useEffect } from "react";
import { FlightFilterProvider, useFlightFilter } from "./flight-filter-context";
import { getCurrencySymbol } from "@/utils/currency-storage";
import { useTranslations } from "@/hooks/useTranslations";
import { useFlightOptionsRTL } from "@/hooks/useRTLMirror";
import { cn } from "@/lib/utils";
import "@/styles/rtl-mirror.css";

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
    activeFiltersCount,
    hasAvailableFilters,
  } = useFlightFilter();

  // Initialize translations and RTL mirror detection
  const { t } = useTranslations("flightOptionsWidget");
  const {
    isRTLMirrorRequired,
    isLoading: isRTLLoading,
    mirrorClasses,
    mirrorStyles,
    isWidgetSupported,
  } = useFlightOptionsRTL();

  // All hooks must be called before any conditional logic or early returns
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExpandedAirlines, setShowExpandedAirlines] = useState(false);

  const liveArgs = args.apiData?.value?.widget?.args ?? {};
  const frozenArgs = (liveArgs as any)?.submission;
  const readOnly = !!args.readOnly;
  const effectiveArgs = args.readOnly && frozenArgs ? frozenArgs : liveArgs;

  const flightSearchFilters =
    (effectiveArgs as any)?.flightFilters ?? args.flightFilters ?? {};

  // // Check if there's no flight data available
  const allFlightOffers = args.allFlightOffers || [];
  const hasNoFlightData = !allFlightOffers || allFlightOffers.length === 0;

  useEffect(() => {
    if (!readOnly) {
      setShowAllFlights(true);
    }
    if (readOnly) {
      setShowAllFlights(false);
    }
  }, [readOnly]);

  // If no flight data available, show empty state
  if (hasNoFlightData) {
    return (
      <div className="space-y-6">
        <div className="py-12 text-center">
          <div className="mb-2 text-lg text-gray-500">
            {t("messages.noFlightsAvailable", "No flights available")}
          </div>
          <div className="text-sm text-gray-400">
            {t(
              "messages.adjustSearchCriteria",
              "Please try adjusting your search criteria",
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter to show only 3 cards maximum with priority tags from filtered flights with custom tags
  const getFilteredFlightOffers = (offers: any[]) => {
    if (!Array.isArray(offers)) return [];
    // In read-only mode, we should show exactly what was selected (usually a single offer)
    if (readOnly) {
      return offers;
    }

    const filteredOffers: any[] = [];
    const seenTags = new Set();

    // Priority order: best, cheapest, fastest (as per requirements)
    const priorityTags = ["best", "cheapest", "fastest"];

    for (const tag of priorityTags) {
      const offer = offers.find((offer) => {
        const hasTag =
          offer.type === tag || (offer.tags && offer.tags.includes(tag));
        const offerAlreadyUsed = filteredOffers.some(
          (existing) => existing.flightOfferId === offer.flightOfferId,
        );
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
    return filteredFlights.find(
      (offer: any) =>
        offer.type === tag || (offer.tags && offer.tags.includes(tag)),
    );
  };

  const bestFlight = getFlightByTag("best");
  const cheapestFlight = getFlightByTag("cheapest");
  const fastestFlight = getFlightByTag("fastest");

  // Determine the default tab based on available flights
  const getDefaultTab = () => {
    if (bestFlight) return "best";
    if (cheapestFlight) return "cheapest";
    if (fastestFlight) return "fastest";
    return "best"; // fallback
  };

  // Helper function to extract and format departure date from flight data
  const getDepartureDate = (flights: any[]): string | null => {
    if (!flights || flights.length === 0) return null;

    const firstFlight = flights[0];
    let departureDate: string | null = null;

    // Try to get departure date from journey structure first
    if (firstFlight.journey && firstFlight.journey.length > 0) {
      departureDate = firstFlight.journey[0].departure?.date;
    }
    // Fallback to legacy structure
    else if (firstFlight.departure?.date) {
      departureDate = firstFlight.departure.date;
    }

    if (!departureDate) return null;

    try {
      const date = new Date(departureDate);
      if (isNaN(date.getTime())) return null;

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting departure date:", error);
      return null;
    }
  };

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
      const selectedFlightOffer = args.allFlightOffers?.find(
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

  // Show loading state briefly to prevent FOUC
  if (isRTLLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      </div>
    );
  }

  // Show warning if widget doesn't support RTL mirroring
  if (!isWidgetSupported) {
    console.warn(
      "FlightOptionsWidget: RTL mirroring is not supported for this widget",
    );
  }

  return (
    <div
      className={cn(
        "flight-options-widget container mx-auto max-w-6xl p-4",
        // Container-level RTL transformation using the new system
        mirrorClasses.container,
      )}
      style={{
        fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
        // Apply CSS transform for complete RTL mirroring using the new system
        ...mirrorStyles.container,
      }}
    >
      {/* Inner container to reverse the transform for text readability */}
      <div
        className={cn(
          "w-full",
          // Reverse the transform for text content using the new system
          mirrorClasses.content,
        )}
        style={mirrorStyles.content}
      >
        {/* Header removed; keep only departure date */}
        <div className="mb-6">
          {/* Departure Date Display */}
          {allFlightOffers.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700">
                {t("title.departure", "Departure:")}{" "}
                {getDepartureDate(allFlightOffers) || "Date not available"}
              </p>
            </div>
          )}
          {/* {flightOffers.length > 0 ? (
          <p className="text-gray-600">{flightOffers[0]?.journey[0]?.departure?.airportName} ({flightOffers[0]?.journey[0]?.departure?.airportIata}) → {flightOffers[0]?.journey[0]?.arrival?.airportName} ({flightOffers[0]?.journey[0]?.arrival?.airportIata})</p>
        ) : (
          <p className="text-gray-600">No flights found for the selected criteria.</p>
        )} */}
        </div>

        {/* Show Filters button only when some filters are active */}
        {!readOnly && activeFiltersCount > 0 && (
          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="mb-2"
            >
              <Filter className="mr-2 h-4 w-4" />
              {t("buttons.filters", "Filters")}
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0.5 text-xs"
              >
                {activeFiltersCount}
              </Badge>
            </Button>
          </div>
        )}

        {/* Desktop Layout - Show 2-3 cards based on available tag types */}
        <div className="hidden md:block">
          {flightOffers.length > 0 ? (
            <div
              className={`mb-6 grid gap-4 ${
                flightOffers.length === 3
                  ? "grid-cols-3"
                  : flightOffers.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1"
              }`}
            >
              {flightOffers.map((flight: any, index: number) => (
                <div
                  key={index}
                  className="rounded-lg border bg-white shadow-sm"
                >
                  <FlightCard
                    {...flight}
                    onSelect={handleSelectFlight}
                    isLoading={isLoading}
                    selectedFlightId={selectedFlight}
                    readOnly={readOnly}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 p-8 text-center text-gray-500">
              <p>
                {t(
                  "messages.noMatchingFlights",
                  "No flights match your current filters. Try adjusting your search criteria.",
                )}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Layout - Tabs */}
        <div className="mb-6 md:hidden">
          {bestFlight || cheapestFlight || fastestFlight ? (
            <Tabs
              defaultValue={getDefaultTab()}
              className="w-full"
            >
              <TabsList className="w-full gap-1 overflow-hidden rounded-lg">
                {bestFlight && (
                  <TabsTrigger
                    className="h-[calc(100%-0.5rem)] min-w-0 flex-1 basis-0 truncate rounded-lg py-0 text-center leading-none"
                    value="best"
                  >
                    {t("tabs.best", "Best")}
                  </TabsTrigger>
                )}
                {cheapestFlight && (
                  <TabsTrigger
                    className="h-[calc(100%-0.5rem)] min-w-0 flex-1 basis-0 truncate rounded-lg py-0 text-center leading-none"
                    value="cheapest"
                  >
                    {t("tabs.cheapest", "Cheapest")}
                  </TabsTrigger>
                )}
                {fastestFlight && (
                  <TabsTrigger
                    className="h-[calc(100%-0.5rem)] min-w-0 flex-1 basis-0 truncate rounded-lg py-0 text-center leading-none"
                    value="fastest"
                  >
                    {t("tabs.fastest", "Fastest")}
                  </TabsTrigger>
                )}
              </TabsList>

              {bestFlight && (
                <TabsContent
                  value="best"
                  className="mt-4"
                >
                  <div className="rounded-lg border bg-white shadow-sm">
                    <FlightCard
                      {...bestFlight}
                      onSelect={handleSelectFlight}
                      isLoading={isLoading}
                      selectedFlightId={selectedFlight}
                      readOnly={readOnly}
                    />
                  </div>
                </TabsContent>
              )}

              {cheapestFlight && (
                <TabsContent
                  value="cheapest"
                  className="mt-4"
                >
                  <div className="rounded-lg border bg-white shadow-sm">
                    <FlightCard
                      {...cheapestFlight}
                      onSelect={handleSelectFlight}
                      isLoading={isLoading}
                      selectedFlightId={selectedFlight}
                      readOnly={readOnly}
                    />
                  </div>
                </TabsContent>
              )}

              {fastestFlight && (
                <TabsContent
                  value="fastest"
                  className="mt-4"
                >
                  <div className="rounded-lg border bg-white shadow-sm">
                    <FlightCard
                      {...fastestFlight}
                      onSelect={handleSelectFlight}
                      isLoading={isLoading}
                      selectedFlightId={selectedFlight}
                      readOnly={readOnly}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            /* Empty state if no filtered flights available */
            <div className="mt-4 p-8 text-center text-gray-500">
              <p>
                {t(
                  "messages.noMatchingFlights",
                  "No flights match your current filters. Try adjusting your search criteria.",
                )}
              </p>
            </div>
          )}
        </div>

        {/* Show All Flights Button */}
        {showAllFlights && (
          <div className="flex justify-center">
            <AllFlightsSheet
              flightData={filteredFlights}
              onFlightSelect={handleSelectFlight}
              flightSearchFilters={flightSearchFilters}
            >
              <Button
                variant="outline"
                className="w-full md:w-auto"
              >
                {t("buttons.showAllFlights", "Show all flights")}
              </Button>
            </AllFlightsSheet>
          </div>
        )}

        {/* Filter Bottom Sheet Modal */}
        <Sheet
          open={showFilters}
          onOpenChange={setShowFilters}
        >
          <SheetContent
            side="bottom"
            className="flex h-[85vh] flex-col overflow-hidden"
            style={{
              fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
            }}
          >
            <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-3">
              <SheetTitle className="text-lg font-semibold">
                {t("title.filterFlights", "Filter Flights")}
              </SheetTitle>
            </SheetHeader>

            {/* Filter Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-6">
                {/* Price Range Filter */}
                <div>
                  <Label className="mb-3 block text-sm font-medium">
                    {t("filters.priceRange", "Price Range")}:{" "}
                    {getCurrencySymbol(priceStats.currency)}{" "}
                    {filterState.priceRange[0].toLocaleString()} -{" "}
                    {getCurrencySymbol(priceStats.currency)}{" "}
                    {filterState.priceRange[1].toLocaleString()}
                  </Label>
                  <Slider
                    value={filterState.priceRange}
                    onValueChange={setPriceRange}
                    max={priceStats.max}
                    min={priceStats.min}
                    step={Math.max(
                      1,
                      Math.floor((priceStats.max - priceStats.min) / 100),
                    )}
                    className="w-full"
                  />
                </div>

                <Separator />

                {/* Airlines Filter */}
                <div>
                  <Label className="mb-3 block text-sm font-medium">
                    {t("filters.airlines", "Airlines")}
                  </Label>
                  <div className="space-y-2">
                    {availableAirlines
                      .slice(
                        0,
                        showExpandedAirlines ? availableAirlines.length : 2,
                      )
                      .map((airline) => (
                        <div
                          key={airline}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={airline}
                            checked={filterState.selectedAirlines.includes(
                              airline as string,
                            )}
                            onCheckedChange={() =>
                              toggleAirline(airline as string)
                            }
                          />
                          <Label
                            htmlFor={airline}
                            className="text-sm"
                          >
                            {airline}
                          </Label>
                        </div>
                      ))}
                    {availableAirlines.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowExpandedAirlines(!showExpandedAirlines)
                        }
                        className="h-auto p-0 text-sm text-gray-600 hover:text-gray-800"
                      >
                        {showExpandedAirlines
                          ? t("buttons.showLessAirlines", "Show less airlines")
                          : `${t("buttons.showAllAirlines", "Show all airlines")} (${availableAirlines.length - 2} ${t("messages.moreAirlines", "more")})`}
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Max Stops Filter */}
                <div>
                  <Label className="mb-3 block text-sm font-medium">
                    {t("filters.maxStops", "Max Stops")}:{" "}
                    {filterState.maxStops === 0
                      ? t("filters.nonStop", "Non-stop")
                      : `${filterState.maxStops} ${filterState.maxStops > 1 ? t("filters.stops", "stops") : t("filters.stop", "stop")}`}
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
                  <Label className="mb-3 block text-sm font-medium">
                    {t("filters.departureTime", "Departure Time")}
                  </Label>
                  <div className="space-y-2">
                    {[
                      {
                        label: t(
                          "departureTimeSlots.early",
                          "Early Morning (midnight - 08:00)",
                        ),
                        value: "early",
                      },
                      {
                        label: t(
                          "departureTimeSlots.morning",
                          "Morning (08:00 - 12:00)",
                        ),
                        value: "morning",
                      },
                      {
                        label: t(
                          "departureTimeSlots.afternoon",
                          "Afternoon (12:00 - 16:00)",
                        ),
                        value: "afternoon",
                      },
                      {
                        label: t(
                          "departureTimeSlots.evening",
                          "Evening (16:00 - 20:00)",
                        ),
                        value: "evening",
                      },
                      {
                        label: t(
                          "departureTimeSlots.night",
                          "Night (20:00 - midnight)",
                        ),
                        value: "night",
                      },
                    ].map((slot) => (
                      <div
                        key={slot.value}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={slot.value}
                          checked={filterState.selectedDepartureTime.includes(
                            slot.value,
                          )}
                          onCheckedChange={() =>
                            toggleDepartureTime(slot.value)
                          }
                        />
                        <Label
                          htmlFor={slot.value}
                          className="text-sm"
                        >
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
                  {t("buttons.clearAll", "Clear all")}
                  {activeFiltersCount > 0 && (
                    <span className="ml-1">({activeFiltersCount})</span>
                  )}
                </Button>
                <Button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                >
                  {t("buttons.applyFilters", "Apply Filters")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

// Main wrapper component that provides filter context
export default function FlightOptionsV0Widget(args: FlightOptionsProps) {
  const liveArgs = args.apiData?.value?.widget?.args ?? {};
  const frozenArgs = (liveArgs as any)?.submission;
  const effectiveArgs = args.readOnly && frozenArgs ? frozenArgs : liveArgs;

  const allFlightOffers =
    (effectiveArgs as any)?.flightOffers ?? args.flightOffers ?? [];

  return (
    <FlightFilterProvider flightData={allFlightOffers}>
      <FlightOptionsContent
        {...args}
        allFlightOffers={allFlightOffers}
      />
    </FlightFilterProvider>
  );
}
