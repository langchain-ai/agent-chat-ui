"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { FlightCard } from "./flight-card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Filter, ArrowUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCurrencySymbol } from "@/utils/currency-storage"
import {
  FlightSearchFilters,
  FlightData,
  TransformedFlightData
} from "@/components/widgets/flight-filter-utils"
import { useFlightFilter } from "./flight-filter-context"

interface AllFlightsSheetProps {
  children: React.ReactNode
  flightData?: TransformedFlightData[]
  onFlightSelect?: (flightOfferId: string) => void
  flightSearchFilters?: FlightSearchFilters
}

export function AllFlightsSheet({ children, flightData = [], onFlightSelect, flightSearchFilters }: AllFlightsSheetProps) {
  const [open, setOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showExpandedAirlines, setShowExpandedAirlines] = useState(false)

  // Use filter context for state management
  const {
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
  } = useFlightFilter()



  // Initialize filter states from server data
  useEffect(() => {
    if (flightSearchFilters) {
      // Initialize stops filter from server data
      if (flightSearchFilters.stops !== null && flightSearchFilters.stops !== undefined) {
        setMaxStops(flightSearchFilters.stops)
      }

      // Initialize airlines filter from server data
      if (flightSearchFilters.airlines && flightSearchFilters.airlines.trim() !== '') {
        const serverAirlines = flightSearchFilters.airlines.split(',').map((a: string) => a.trim())

        // Match server airlines with available airlines (case-insensitive)
        const matchedAirlines = serverAirlines.filter((serverAirline: string) =>
          availableAirlines.some(availableAirline =>
            availableAirline.toLowerCase().includes(serverAirline.toLowerCase())
          )
        ).map((serverAirline: string) => {
          // Find the exact match from available airlines
          return availableAirlines.find(availableAirline =>
            availableAirline.toLowerCase().includes(serverAirline.toLowerCase())
          ) || serverAirline
        })

        setSelectedAirlines(matchedAirlines)
      }

      // Initialize departure time filter from server data
      if (flightSearchFilters.departureTime && flightSearchFilters.departureTime.trim() !== '') {
        const serverTimeSlot = flightSearchFilters.departureTime
        let localTimeSlot = ''

        // Convert server time slot to local time slot value
        switch (serverTimeSlot) {
          case 'EARLY_MORNING':
            localTimeSlot = 'early'
            break
          case 'MORNING':
            localTimeSlot = 'morning'
            break
          case 'AFTERNOON':
            localTimeSlot = 'afternoon'
            break
          case 'EVENING':
            localTimeSlot = 'evening'
            break
          case 'NIGHT':
            localTimeSlot = 'night'
            break
        }

        if (localTimeSlot) {
          setSelectedDepartureTime([localTimeSlot])
        }
      }
    }
  }, [flightSearchFilters, availableAirlines, setMaxStops, setSelectedAirlines, setSelectedDepartureTime])

  // const handleSelectFlight = async (flightOfferId: string) => {
  //   setSelectedFlight(flightOfferId);
  //   setIsLoading(true);

  //   // Simulate API call
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     console.log("Selected flight from sheet:", flightOfferId);
  //   }, 1000);
  // };

  const handleSelectFlight = (flightOfferId: string) => {
    // Call the parent's flight selection handler
    if (onFlightSelect) {
      onFlightSelect(flightOfferId);
    }
    // Close the sheet after selection
    setOpen(false);
  };

  // Helper functions to transform new data structure to legacy format for FlightCard
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (duration: string) => {
    // Convert PT1H45M to 1h 45m
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = match[1] ? `${match[1]}h` : '';
      const minutes = match[2] ? `${match[2]}m` : '';
      return `${hours} ${minutes}`.trim();
    }
    return duration;
  };

  const transformFlightData = (flight: FlightData) => {
    if (!flight.journey || flight.journey.length === 0) return null;

    const firstJourney = flight.journey[0];
    const firstSegment = firstJourney.segments[0];
    const stops = firstJourney.segments.length - 1;

    // Determine flight type based on tags or price
    let type: "best" | "cheapest" | "fastest" = "best";
    if (flight.tags?.includes('cheapest')) type = "cheapest";
    else if (flight.tags?.includes('fastest')) type = "fastest";

    // Create layovers array
    const layovers = firstJourney.segments.slice(0, -1).map(segment => ({
      city: segment.arrival.airportName.split(' ')[0], // Get city name
      duration: '', // We don't have layover duration in this structure
      iataCode: segment.arrival.airportIata
    }));

    return {
      flightOfferId: flight.flightOfferId,
      type,
      price: `${getCurrencySymbol(flight.currency)} ${flight.totalAmount.toLocaleString()}`,
      duration: formatDuration(firstJourney.duration),
      stops,
      airline: firstSegment.airlineName,
      airlineCode: firstSegment.airlineIata,
      departureTime: formatTime(firstJourney.departure.date),
      arrivalTime: formatTime(firstJourney.arrival.date),
      nextDay: false, // Calculate if needed
      layovers,
      // Pass through new data structure for FlightCard
      totalAmount: flight.totalAmount,
      currency: flight.currency,
      journey: flight.journey,
      offerRules: flight.offerRules,
      tags: flight.tags
    };
  };



  // Transform flight data or use mock data as fallback
  const allFlights = flightData.length > 0
    ? flightData.map(transformFlightData).filter(Boolean)
    : []

  const departureTimeSlots = [
    { label: "Early Morning (midnight - 08:00)", value: "early" },
    { label: "Morning (08:00 - 12:00)", value: "morning" },
    { label: "Afternoon (12:00 - 16:00)", value: "afternoon" },
    { label: "Evening (16:00 - 20:00)", value: "evening" },
    { label: "Night (20:00 - midnight)", value: "night" },
  ]

  // Since data is already filtered by the context, we just need to apply additional UI-level filtering
  // and use the context state for filter controls. For now, just use the pre-filtered data.
  const filteredFlights = allFlights.filter((flight) => {
    if (!flight) return false

    // Additional UI-level filtering can be added here if needed
    // For now, just use the data as-is since it's already filtered by the context

    // User-interactive Airline filter using context state
    const airlineMatch = filterState.selectedAirlines.length === 0 || filterState.selectedAirlines.includes(flight.airline)
    if (!airlineMatch) return false

    // User-interactive Stops filter using context state
    const stopsMatch = flight.stops <= filterState.maxStops
    if (!stopsMatch) return false

    // User-interactive Departure time filter using context state
    let timeMatch = true
    if (filterState.selectedDepartureTime.length > 0) {
      const hour = parseInt(flight.departureTime.split(":")[0])
      timeMatch = filterState.selectedDepartureTime.some((slot) => {
        switch (slot) {
          case "early":
            return hour >= 0 && hour < 8
          case "morning":
            return hour >= 8 && hour < 12
          case "afternoon":
            return hour >= 12 && hour < 16
          case "evening":
            return hour >= 16 && hour < 20
          case "night":
            return hour >= 20 && hour < 24
          default:
            return true
        }
      })
    }

    return timeMatch
  })

const sortedFlights = [...filteredFlights].sort((a, b) => {
  if (!a || !b) return 0; // if either is null, treat them as equal

  if (filterState.sortBy === "cheapest") {
    return a.totalAmount - b.totalAmount;
  } else {
    // For fastest, we'd need to parse duration - for now, sort by total amount as fallback
    return a.totalAmount - b.totalAmount;
  }
});




  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[80vh] flex flex-col"
          style={{
            fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
          }}
        >
        <div className="flex-shrink-0 border-b bg-background">
          <SheetHeader className="mb-2">
            <SheetTitle>{allFlights.length > 0 ? "Flights" : "No flights available"}</SheetTitle>
          </SheetHeader>

          <div className="mb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                      <ArrowUpDown className="w-4 h-4" />
                      Sort: {filterState.sortBy === "cheapest" ? "Cheapest" : "Fastest"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setSortBy("cheapest")}>Cheapest First</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("fastest")}>Fastest First</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}
            </div>


          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-2 pb-4">
            {allFlights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No flights available for the selected criteria.
              </div>
            ) : sortedFlights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No flights match your current filters. Try adjusting your criteria.
              </div>
            ) : (
              sortedFlights.map((flight, index) => (
                <div key={index} className="bg-white rounded-lg border shadow-sm">
                  <div className="px-2 py-1">
                    <FlightCard
                      {...flight}
                      compact
                      onSelect={handleSelectFlight}
                      isLoading={isLoading}
                      selectedFlightId={selectedFlight}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

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
                {departureTimeSlots.map((slot) => (
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
    </>
  )
}
