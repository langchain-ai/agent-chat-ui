"use client"

import type React from "react"
import { useState } from "react"
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
  const [priceRange, setPriceRange] = useState([1800, 3300])
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [maxStops, setMaxStops] = useState(2)
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string[]>([])
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
    : [
    {
      flightOfferId: "sheet-flight-1",
      type: "best" as const,
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
    },
    {
      flightOfferId: "sheet-flight-2",
      type: "cheapest" as const,
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
    },
    {
      flightOfferId: "sheet-flight-3",
      type: "fastest" as const,
      price: "$3,245.80",
      duration: "18h 20m",
      stops: 1,
      airline: "United Airlines",
      airlineCode: "UA",
      departureTime: "22:45",
      arrivalTime: "11:05",
      nextDay: true,
      layovers: [{ city: "San Francisco", duration: "2h 15m layover", iataCode: "SFO" }],
    },
    {
      flightOfferId: "sheet-flight-4",
      type: "best" as const,
      price: "$2,567.90",
      duration: "25h 10m",
      stops: 2,
      airline: "Emirates",
      airlineCode: "EK",
      departureTime: "08:20",
      arrivalTime: "21:30",
      nextDay: true,
      layovers: [
        { city: "Dubai", duration: "2h 45m layover", iataCode: "DXB" },
        { city: "Los Angeles", duration: "3h 20m layover", iataCode: "LAX" },
      ],
    },
    {
      flightOfferId: "sheet-flight-5",
      type: "best" as const,
      price: "$2,890.15",
      duration: "26h 45m",
      stops: 2,
      airline: "Lufthansa",
      airlineCode: "LH",
      departureTime: "16:15",
      arrivalTime: "07:00",
      nextDay: true,
      layovers: [
        { city: "Frankfurt", duration: "4h 15m layover", iataCode: "FRA" },
        { city: "San Francisco", duration: "1h 50m layover", iataCode: "SFO" },
      ],
    },
    {
      flightOfferId: "sheet-flight-6",
      type: "best" as const,
      price: "$3,120.40",
      duration: "21h 30m",
      stops: 1,
      airline: "Singapore Airlines",
      airlineCode: "SQ",
      departureTime: "23:30",
      arrivalTime: "13:00",
      nextDay: true,
      layovers: [{ city: "Singapore", duration: "3h 10m layover", iataCode: "SIN" }],
    },
  ]

  const airlines = Array.from(new Set(allFlights.map((flight) => flight?.airline)))
  const departureTimeSlots = [
    { label: "Early Morning (00:00 - 06:00)", value: "early" },
    { label: "Morning (06:00 - 12:00)", value: "morning" },
    { label: "Afternoon (12:00 - 18:00)", value: "afternoon" },
    { label: "Evening (18:00 - 24:00)", value: "evening" },
  ]

  const filteredFlights = allFlights.filter((flight) => {
    return true
    // if(!flight) return false
    // const price = Number.parseFloat(flight.price.replace("$", "").replace(",", ""))
    // const priceInRange = price >= priceRange[0] && price <= priceRange[1]

    // const airlineMatch = selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline)
    // const stopsMatch = flight.stops <= maxStops

    // let timeMatch = true
    // if (selectedDepartureTime.length > 0) {
    //   const hour = Number.parseInt(flight.departureTime.split(":")[0])
    //   timeMatch = selectedDepartureTime.some((slot) => {
    //     switch (slot) {
    //       case "early":
    //         return hour >= 0 && hour < 6
    //       case "morning":
    //         return hour >= 6 && hour < 12
    //       case "afternoon":
    //         return hour >= 12 && hour < 18
    //       case "evening":
    //         return hour >= 18 && hour < 24
    //       default:
    //         return true
    //     }
    //   })
    // }

    // return priceInRange && airlineMatch && stopsMatch && timeMatch
  })

 const sortedFlights = [...filteredFlights].sort((a, b) => {
  if (!a || !b) return 0; // if either is null, treat them as equal

  if (sortBy === "cheapest") {
    const priceA = Number.parseFloat(a.price.replace("$", "").replace(",", ""));
    const priceB = Number.parseFloat(b.price.replace("$", "").replace(",", ""));
    return priceA - priceB;
  } else {
    const durationA =
      Number.parseInt(a.duration.split("h")[0]) * 60 +
      Number.parseInt(a.duration.split("h")[1].split("m")[0]);
    const durationB =
      Number.parseInt(b.duration.split("h")[0]) * 60 +
      Number.parseInt(b.duration.split("h")[1].split("m")[0]);
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
    setPriceRange([1800, 3300])
    setSelectedAirlines([])
    setMaxStops(2)
    setSelectedDepartureTime([])
  }

  const activeFiltersCount =
    (selectedAirlines.length > 0 ? 1 : 0) +
    (maxStops < 2 ? 1 : 0) +
    (selectedDepartureTime.length > 0 ? 1 : 0) +
    (priceRange[0] > 1800 || priceRange[1] < 3300 ? 1 : 0)

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
            <SheetTitle>Flights</SheetTitle>
          </SheetHeader>

          <div className="mb-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* <Button
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
                </Button> */}
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
              <div className="bg-muted/50 rounded-lg p-4 space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={3300}
                    min={1800}
                    step={50}
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
                    max={2}
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
            {sortedFlights.map((flight, index) => (
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
            ))}
            {filteredFlights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No flights match your current filters. Try adjusting your criteria.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
