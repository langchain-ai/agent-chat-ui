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

interface FlightData {
  flightOfferId: string
  totalEmission?: number
  totalEmissionUnit?: string
  currency: string
  totalAmount: number
  tax?: number
  baseAmount?: number
  serviceFee?: number
  convenienceFee?: number
  journey: Array<{
    id: string
    duration: string
    departure: {
      date: string
      airportIata: string
      airportName: string
      cityCode?: string
      countryCode?: string
    }
    arrival: {
      date: string
      airportIata: string
      airportName: string
      cityCode?: string
      countryCode?: string
    }
    segments: Array<{
      id: string
      airlineIata: string
      flightNumber: string
      aircraftType?: string
      airlineName: string
      duration: string
      departure: {
        date: string
        airportIata: string
        airportName: string
        cityCode?: string
        countryCode?: string
      }
      arrival: {
        date: string
        airportIata: string
        airportName: string
        cityCode?: string
        countryCode?: string
      }
    }>
  }>
  offerRules?: {
    isRefundable: boolean
  }
  baggage?: {
    check_in_baggage?: {
      weight: number
      weightUnit: string
    }
    cabin_baggage?: {
      weight: number
      weightUnit: string
    }
  }
  rankingScore?: number
  pros?: string[]
  cons?: string[]
  tags?: string[]
}

interface AllFlightsSheetProps {
  children: React.ReactNode
  flightData?: FlightData[]
  onFlightSelect?: (flightOfferId: string) => void
}

export function AllFlightsSheet({ children, flightData = [], onFlightSelect }: AllFlightsSheetProps) {
  const [open, setOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest">("cheapest")
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string[]>([])
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate dynamic price range from flight data
  const priceStats = useMemo(() => {
    if (flightData.length === 0) return { min: 0, max: 100000, currency: 'USD' }

    const amounts = flightData.map(flight => flight.totalAmount)
    const min = Math.min(...amounts)
    const max = Math.max(...amounts)
    const currency = flightData[0]?.currency || 'USD'

    return { min: Math.floor(min), max: Math.ceil(max), currency }
  }, [flightData])

  const [priceRange, setPriceRange] = useState([priceStats.min, priceStats.max])

  // Update price range when flight data changes
  useEffect(() => {
    setPriceRange([priceStats.min, priceStats.max])
  }, [priceStats.min, priceStats.max])

  // Calculate maximum stops from actual flight data
  const maxAvailableStops = useMemo(() => {
    if (flightData.length === 0) return 2
    const stopCounts = flightData.map(flight => {
      if (flight.journey && flight.journey.length > 0) {
        return flight.journey[0].segments.length - 1
      }
      return 0
    })
    return Math.max(...stopCounts, 0)
  }, [flightData])

  const [maxStops, setMaxStops] = useState(maxAvailableStops)

  // Update maxStops when maxAvailableStops changes
  useEffect(() => {
    setMaxStops(maxAvailableStops)
  }, [maxAvailableStops])

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

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
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
      price: `${getCurrencySymbol(flight.currency)}${flight.totalAmount.toLocaleString()}`,
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

  // Extract unique airlines from actual flight data
  const airlines = useMemo(() => {
    const airlineSet = new Set<string>()
    flightData.forEach(flight => {
      if (flight.journey && flight.journey.length > 0) {
        const firstSegment = flight.journey[0].segments[0]
        if (firstSegment?.airlineName) {
          airlineSet.add(firstSegment.airlineName)
        }
      }
    })
    return Array.from(airlineSet).sort()
  }, [flightData])

  const departureTimeSlots = [
    { label: "Early Morning (00:00 - 06:00)", value: "early" },
    { label: "Morning (06:00 - 12:00)", value: "morning" },
    { label: "Afternoon (12:00 - 18:00)", value: "afternoon" },
    { label: "Evening (18:00 - 24:00)", value: "evening" },
  ]

  const filteredFlights = allFlights.filter((flight) => {
    if (!flight) return false

    // Price filter - use totalAmount from original data
    const originalFlight = flightData.find(f => f.flightOfferId === flight.flightOfferId)
    if (originalFlight) {
      const priceInRange = originalFlight.totalAmount >= priceRange[0] && originalFlight.totalAmount <= priceRange[1]
      if (!priceInRange) return false
    }

    // Airline filter
    const airlineMatch = selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline)
    if (!airlineMatch) return false

    // Stops filter - calculate from segments
    const stopsMatch = flight.stops <= maxStops
    if (!stopsMatch) return false

    // Departure time filter
    let timeMatch = true
    if (selectedDepartureTime.length > 0) {
      const hour = parseInt(flight.departureTime.split(":")[0])
      timeMatch = selectedDepartureTime.some((slot) => {
        switch (slot) {
          case "early":
            return hour >= 0 && hour < 6
          case "morning":
            return hour >= 6 && hour < 12
          case "afternoon":
            return hour >= 12 && hour < 18
          case "evening":
            return hour >= 18 && hour < 24
          default:
            return true
        }
      })
    }

    return timeMatch
  })

const sortedFlights = [...filteredFlights].sort((a, b) => {
  if (!a || !b) return 0; // if either is null, treat them as equal

  if (sortBy === "cheapest") {
    // Use totalAmount from the original flight data for accurate sorting
    const originalFlightA = flightData.find(f => f.flightOfferId === a.flightOfferId)
    const originalFlightB = flightData.find(f => f.flightOfferId === b.flightOfferId)
    const priceA = originalFlightA?.totalAmount || 0
    const priceB = originalFlightB?.totalAmount || 0
    return priceA - priceB;
  } else {
    // Parse ISO 8601 duration from original flight data for accurate sorting
    const parseISO8601Duration = (duration: string) => {
      // Parse PT2H30M format to total minutes
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        return hours * 60 + minutes;
      }
      return 0;
    };

    // Get original flight data to access ISO 8601 duration
    const originalFlightA = flightData.find(f => f.flightOfferId === a.flightOfferId)
    const originalFlightB = flightData.find(f => f.flightOfferId === b.flightOfferId)

    // Use journey duration from original data
    const durationA = originalFlightA?.journey?.[0]?.duration
      ? parseISO8601Duration(originalFlightA.journey[0].duration)
      : 0;
    const durationB = originalFlightB?.journey?.[0]?.duration
      ? parseISO8601Duration(originalFlightB.journey[0].duration)
      : 0;

    return durationA - durationB;
  }
});


  const toggleAirline = (airline: string) => {
    setSelectedAirlines((prev) => (prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline]))
  }

  const toggleDepartureTime = (timeSlot: string) => {
    setSelectedDepartureTime((prev) =>
      prev.includes(timeSlot) ? prev.filter((t) => t !== timeSlot) : [...prev, timeSlot],
    )
  }

  const clearAllFilters = () => {
    setPriceRange([priceStats.min, priceStats.max])
    setSelectedAirlines([])
    setMaxStops(maxAvailableStops)
    setSelectedDepartureTime([])
  }

  const activeFiltersCount =
    (selectedAirlines.length > 0 ? 1 : 0) +
    (maxStops < maxAvailableStops ? 1 : 0) +
    (selectedDepartureTime.length > 0 ? 1 : 0) +
    (priceRange[0] > priceStats.min || priceRange[1] < priceStats.max ? 1 : 0)

  return (
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
                  onClick={() => setShowFilters(!showFilters)}
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
                      Sort: {sortBy === "cheapest" ? "Cheapest" : "Fastest"}
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

            {showFilters && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-6 max-h-[40vh] overflow-y-auto">
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Price Range: {getCurrencySymbol(priceStats.currency)}{priceRange[0].toLocaleString()} - {getCurrencySymbol(priceStats.currency)}{priceRange[1].toLocaleString()}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={priceStats.max}
                    min={priceStats.min}
                    step={Math.max(1, Math.floor((priceStats.max - priceStats.min) / 100))}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Airlines</Label>
                  <div className="space-y-2">
                    {airlines.map((airline) => (
                      <div key={airline} className="flex items-center space-x-2">
                        <Checkbox
                          id={airline}
                          checked={selectedAirlines.includes(airline as string)}
                          onCheckedChange={() => toggleAirline(airline as string)}
                        />
                        <Label htmlFor={airline} className="text-sm">
                          {airline}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Max Stops: {maxStops === 0 ? "Non-stop" : `${maxStops} stop${maxStops > 1 ? "s" : ""}`}
                  </Label>
                  <Slider
                    value={[maxStops]}
                    onValueChange={(value) => setMaxStops(value[0])}
                    max={maxAvailableStops}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Departure Time</Label>
                  <div className="space-y-2">
                    {departureTimeSlots.map((slot) => (
                      <div key={slot.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={slot.value}
                          checked={selectedDepartureTime.includes(slot.value)}
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
            )}
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
  )
}
