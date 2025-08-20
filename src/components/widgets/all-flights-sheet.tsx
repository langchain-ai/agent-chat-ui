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
import { FlightOffer } from "../../types/flightOptionsV0"

interface AllFlightsSheetProps {
  flights: FlightOffer[]
  children: React.ReactNode
  onFlightSelect?: (flightOfferId: string) => void
  selectedFlightId?: string | null
  isLoading?: boolean
}

export function AllFlightsSheet({flights, children, onFlightSelect, selectedFlightId, isLoading }: AllFlightsSheetProps) {
  // Helper function to parse price from string using regex
  const parsePrice = (priceString: string): number => {
    // Extract only numeric values (including decimals) from the price string
    const numericMatch = priceString.match(/[\d,]+\.?\d*/);
    if (numericMatch) {
      // Remove commas and convert to number
      return parseFloat(numericMatch[0].replace(/,/g, ''));
    }
    return 0;
  };

  // Calculate min and max prices from flights data
  const calculatePriceRange = () => {
    if (!flights || flights.length === 0) {
      return [0, 10000]; // Default range if no flights
    }

    const prices = flights.map(flight => parsePrice(flight.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    console.log("minPrice: ", minPrice, "maxPrice: ", maxPrice)
    console.log('allprices',JSON.stringify(prices))

    // Add some padding to ensure all flights are included
    const padding = (maxPrice - minPrice) * 0.1;
    return [Math.floor(minPrice), Math.ceil(maxPrice)];
  };

  const [open, setOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest">("cheapest")
  const [priceRange, setPriceRange] = useState(() => calculatePriceRange())
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [maxStops, setMaxStops] = useState(2)
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string[]>([])



  const handleSelectFlight = (flightOfferId: string) => {
    if (onFlightSelect) {
      onFlightSelect(flightOfferId);
    }
    // Close the sheet after selection
    setOpen(false);
  };

  const airlines = Array.from(new Set(flights.map((flight) => flight.airline)))
  const departureTimeSlots = [
    { label: "Early Morning (00:00 - 06:00)", value: "early" },
    { label: "Morning (06:00 - 12:00)", value: "morning" },
    { label: "Afternoon (12:00 - 18:00)", value: "afternoon" },
    { label: "Evening (18:00 - 24:00)", value: "evening" },
  ]

  const filteredFlights = flights.filter((flight) => {
    const price = parsePrice(flight.price)
    const priceInRange = price >= priceRange[0] && price <= priceRange[1]

    const airlineMatch = selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline)
    const stopsMatch = flight.stops <= maxStops

    let timeMatch = true
    if (selectedDepartureTime.length > 0) {
      const hour = Number.parseInt(flight.departureTime.split(":")[0])
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

    return priceInRange && airlineMatch && stopsMatch && timeMatch
  })

  const sortedFlights = [...filteredFlights].sort((a, b) => {
    if (sortBy === "cheapest") {
      const priceA = parsePrice(a.price)
      const priceB = parsePrice(b.price)
      return priceA - priceB
    } else {
      const durationA =
        Number.parseInt(a.duration.split("h")[0]) * 60 + Number.parseInt(a.duration.split("h")[1].split("m")[0])
      const durationB =
        Number.parseInt(b.duration.split("h")[0]) * 60 + Number.parseInt(b.duration.split("h")[1].split("m")[0])
      return durationA - durationB
    }
  })

  const toggleAirline = (airline: string) => {
    setSelectedAirlines((prev) => (prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline]))
  }

  const toggleDepartureTime = (timeSlot: string) => {
    setSelectedDepartureTime((prev) =>
      prev.includes(timeSlot) ? prev.filter((t) => t !== timeSlot) : [...prev, timeSlot],
    )
  }

  const clearAllFilters = () => {
    setPriceRange(calculatePriceRange())
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
          <SheetHeader className="mb-4">
            <SheetTitle>Flights</SheetTitle>
          </SheetHeader>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
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
              <div className="bg-muted/50 rounded-lg p-4 space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Price Range: {priceRange[0]} - {priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={calculatePriceRange()[1]}
                    min={calculatePriceRange()[0]}
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
                          checked={selectedAirlines.includes(airline)}
                          onCheckedChange={() => toggleAirline(airline)}
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
                    selectedFlightId={selectedFlightId}
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
