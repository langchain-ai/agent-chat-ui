"use client"

import React, { useState } from "react"
import { FlightCard } from "./flight-card"
import { AllFlightsSheet } from "./all-flights-sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function FlightOptionsV0Widget() {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          {mockFlights.map((flight, index) => (
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
          
          {mockFlights.map((flight, index) => (
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
          ))}
        </Tabs>
      </div>

      {/* Show All Flights Button */}
      <div className="flex justify-center">
        <AllFlightsSheet>
          <Button variant="outline" className="w-full md:w-auto">
            Show all flights
          </Button>
        </AllFlightsSheet>
      </div>
    </div>
  )
}
