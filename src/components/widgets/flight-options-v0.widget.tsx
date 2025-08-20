"use client"

import React, { useState } from "react"
import { FlightCard } from "./flight-card"
import { AllFlightsSheet } from "./all-flights-sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface FlightOptionsV0Props {
  taggedFlights?: FlightData[]
}

// Mock flight data based on the guide
const mockFlights = [
  {
    flightOfferId: "flight-1",
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
    flightOfferId: "flight-2",
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
    flightOfferId: "flight-3",
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
]

export default function FlightOptionsV0Widget({ taggedFlights = [] }: FlightOptionsV0Props) {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Function to select 3 flights based on tags
  const selectThreeFlights = (flights: FlightData[]) => {
    if (flights.length === 0) return [];

    const transformedFlights = flights.map(transformFlightData).filter((f): f is NonNullable<typeof f> => f !== null);

    if (transformedFlights.length <= 3) {
      return transformedFlights;
    }

    // Find flights with specific tags
    const cheapestFlights = transformedFlights.filter(f => f.tags?.includes('cheapest'));
    const fastestFlights = transformedFlights.filter(f => f.tags?.includes('fastest'));
    const recommendedFlights = transformedFlights.filter(f => f.tags?.includes('recommended'));
    const bestFlights = transformedFlights.filter(f => f.tags?.includes('best'));

    const selectedFlights: typeof transformedFlights = [];
    const usedIds = new Set<string>();

    // Priority 1: Get the cheapest flight
    if (cheapestFlights.length > 0) {
      const cheapest = cheapestFlights[0];
      selectedFlights.push(cheapest);
      usedIds.add(cheapest.flightOfferId);
    }

    // Priority 2: Get fastest flight (if different from cheapest)
    if (selectedFlights.length < 3 && fastestFlights.length > 0) {
      const fastest = fastestFlights.find(f => !usedIds.has(f.flightOfferId));
      if (fastest) {
        selectedFlights.push(fastest);
        usedIds.add(fastest.flightOfferId);
      }
    }

    // Priority 3: Get recommended flight (if different from above)
    if (selectedFlights.length < 3 && recommendedFlights.length > 0) {
      const recommended = recommendedFlights.find(f => !usedIds.has(f.flightOfferId));
      if (recommended) {
        selectedFlights.push(recommended);
        usedIds.add(recommended.flightOfferId);
      }
    }

    // Priority 4: Get best flight (if different from above)
    if (selectedFlights.length < 3 && bestFlights.length > 0) {
      const best = bestFlights.find(f => !usedIds.has(f.flightOfferId));
      if (best) {
        selectedFlights.push(best);
        usedIds.add(best.flightOfferId);
      }
    }

    // Fill remaining slots with any other flights
    if (selectedFlights.length < 3) {
      const remainingFlights = transformedFlights.filter(f => !usedIds.has(f.flightOfferId));
      const needed = 3 - selectedFlights.length;
      selectedFlights.push(...remainingFlights.slice(0, needed));
    }

    return selectedFlights.slice(0, 3); // Ensure exactly 3 flights
  };

  // Use new data structure if provided, otherwise fallback to mock data
  const displayFlights = taggedFlights.length > 0
    ? selectThreeFlights(taggedFlights)
    : mockFlights.slice(0, 3);

  const handleSelectFlight = async (flightOfferId: string) => {
    setSelectedFlight(flightOfferId);
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log("Selected flight:", flightOfferId);
    }, 1000);
  };

  return (
    <div
      className="container mx-auto p-4 max-w-6xl"
      style={{
        fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Flight Options</h2>
        <p className="text-gray-600">New Delhi (DEL) → Honolulu (HNL)</p>
      </div>

      {/* Desktop Layout - Three cards side by side */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {displayFlights.map((flight, index) => (
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
      </div>

      {/* Mobile Layout - Tabs */}
      <div className="md:hidden mb-6">
        <Tabs defaultValue="best" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="best">Best</TabsTrigger>
            <TabsTrigger value="cheapest">Cheapest</TabsTrigger>
            <TabsTrigger value="fastest">Fastest</TabsTrigger>
          </TabsList>

          {displayFlights.map((flight, index) =>
            flight ? (
              <TabsContent key={index} value={flight.type} className="mt-4">
                <div className="bg-white rounded-lg border shadow-sm">
                  <FlightCard
                    {...flight}
                    onSelect={handleSelectFlight}
                    isLoading={isLoading}
                    selectedFlightId={selectedFlight}
                  />
                </div>
              </TabsContent>
            ) : null
          )}
        </Tabs>
      </div>

      {/* Show All Flights Button */}
      <div className="flex justify-center">
        <AllFlightsSheet flightData={taggedFlights}>
          <Button variant="outline" className="w-full md:w-auto">
            Show all flights
          </Button>
        </AllFlightsSheet>
      </div>
    </div>
  )
}
