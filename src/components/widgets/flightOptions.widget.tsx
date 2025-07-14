"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/common/ui/button";
import {
  Plane,
  Clock,
  Star,
  DollarSign,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface FlightOption {
  flightId: string;
  airline?: string;
  flightNumber?: string;
  departure: {
    time: string;
    airport: string;
    city: string;
  };
  arrival: {
    time: string;
    airport: string;
    city: string;
  };
  duration: string;
  totalAmount: number;
  totalCurrency: string;
  stops: number;
  badge?: "recommended" | "cheapest" | "fastest";
  whyChoose?: string[];
  cancellable?: boolean;
  pros?: string[];
  cons?: string[];
  rankingScore?: number;
  segments?: {
    departureDate: string;
    arrivalDate: string;
    departure: { airportIata: string; city: string };
    arrival: { airportIata: string; city: string };
    flightNumber: string;
    airlineIata: string;
  }[];
}

const getBadgeConfig = (badge: string) => {
  switch (badge) {
    case "recommended":
      return {
        icon: Star,
        text: "Recommended",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "cheapest":
      return {
        icon: DollarSign,
        text: "Cheapest",
        color: "bg-green-100 text-green-800 border-green-200",
      };
    case "fastest":
      return {
        icon: Zap,
        text: "Fastest",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      };
    default:
      return null;
  }
};

const FlightCard = ({
  flight,
  onSelect,
  isLoading,
}: {
  flight: FlightOption;
  onSelect: (flightId: string) => void;
  isLoading?: boolean;
}) => {
  const badgeConfig = flight.badge ? getBadgeConfig(flight.badge) : null;
  const [isWhyChooseExpanded, setIsWhyChooseExpanded] = useState(false);

  // Format time from ISO string
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Format duration from ISO duration string
  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(\d+)?M?/);
    if (match) {
      const hours = match[1];
      const minutes = match[2] || "0";
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  // Get airline from segments
  const getAirline = () => {
    if (flight.segments && flight.segments.length > 0) {
      return flight.segments[0].airlineIata || "Unknown";
    }
    return flight.airline || "Unknown";
  };

  // Get flight number from segments
  const getFlightNumber = () => {
    if (flight.segments && flight.segments.length > 0) {
      return flight.segments[0].flightNumber || "Unknown";
    }
    return flight.flightNumber || "Unknown";
  };

  // Get departure info
  const getDepartureInfo = () => {
    if (flight.segments && flight.segments.length > 0) {
      const segment = flight.segments[0];
      return {
        time: formatTime(segment.departureDate),
        airport: segment.departure.airportIata,
        city: segment.departure.city,
      };
    }
    return flight.departure;
  };

  // Get arrival info
  const getArrivalInfo = () => {
    if (flight.segments && flight.segments.length > 0) {
      const segment = flight.segments[0];
      return {
        time: formatTime(segment.arrivalDate),
        airport: segment.arrival.airportIata,
        city: segment.arrival.city,
      };
    }
    return flight.arrival;
  };

  const departureInfo = getDepartureInfo();
  const arrivalInfo = getArrivalInfo();
  const duration = flight.duration
    ? formatDuration(flight.duration)
    : "Unknown";
  const price = flight.totalAmount || 0;
  const currency = flight.totalCurrency || "USD";

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Badge */}
      {badgeConfig && (
        <div
          className={cn(
            "mb-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
            badgeConfig.color,
          )}
        >
          <badgeConfig.icon className="h-3 w-3" />
          {badgeConfig.text}
        </div>
      )}

      {/* Airline and Flight Number */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Plane className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate">{getAirline()}</span>
          <span className="text-sm text-gray-500 truncate">{getFlightNumber()}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-gray-900">
            ₹{price.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">per person</div>
        </div>
      </div>

      {/* Flight Route */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-xl font-bold text-gray-900">
            {departureInfo.time}
          </div>
          <div className="text-sm text-gray-600">{departureInfo.airport}</div>
          <div className="text-xs text-gray-500">{departureInfo.city}</div>
        </div>

        <div className="mx-4 flex-1 text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-500">{duration}</span>
          </div>
          <div className="relative border-t border-gray-300">
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-300"></div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {flight.stops === 0
              ? "Non-stop"
              : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="text-center flex-1">
          <div className="text-xl font-bold text-gray-900">
            {arrivalInfo.time}
          </div>
          <div className="text-sm text-gray-600">{arrivalInfo.airport}</div>
          <div className="text-xs text-gray-500">{arrivalInfo.city}</div>
        </div>
      </div>

      {/* Cancellation Info */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            flight.cancellable
              ? "border border-green-200 bg-green-100 text-green-800"
              : "border border-red-200 bg-red-100 text-red-800",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              flight.cancellable ? "bg-green-500" : "bg-red-500",
            )}
          />
          {flight.cancellable ? "Free Cancellation" : "Non-Refundable"}
        </div>
      </div>

      {/* Why Choose This - Expandable for all flights with reasons */}
      {flight.pros && flight.pros.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsWhyChooseExpanded(!isWhyChooseExpanded)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors duration-200 hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Why choose this?
              </span>
            </div>
            {isWhyChooseExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {isWhyChooseExpanded && (
            <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <ul className="space-y-2">
                {flight.pros.map((reason, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-blue-800"
                  >
                    <span className="mt-1 text-xs text-blue-400">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Select Button with Price */}
      <Button
        onClick={() => onSelect(flight.flightId)}
        disabled={isLoading}
        className="w-full bg-black py-3 text-white transition-colors duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center justify-center gap-2">
          <span>{isLoading ? "Selecting..." : "Select Flight"}</span>
          <span className="font-bold">₹{price.toLocaleString()}</span>
        </span>
      </Button>
    </div>
  );
};

const FlightOptionsWidget = (args: Record<string, any>) => {
  console.log("args", args);
  const thread = useStreamContext();
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllFlights, setShowAllFlights] = useState(false);

  const preferredFlightTuples = args.preferredFlightTuples || [];
  const allFlightTuples = args.allFlightTuples || [];

  const handleSelectFlight = async (flightId: string) => {
    setSelectedFlight(flightId);
    setIsLoading(true);

    const responseData = {
      selectedFlightId: flightId,
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error) {
      // Optional: already handled inside the utility
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowAllFlights = () => {
    setShowAllFlights(true);
  };

  const handleCloseAllFlights = () => {
    setShowAllFlights(false);
  };

  // Get initial flights for display (responsive: 1 on mobile, 2 on tablet, 3 on desktop)
  // We'll show 3 initially and let CSS grid handle the responsive layout
  const initialFlights = preferredFlightTuples.slice(0, 3);
  const remainingFlightsCount = allFlightTuples.length - initialFlights.length;

  return (
    <>
      <div
        className="mx-auto mt-4 max-w-6xl rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:mt-8 sm:p-6 overflow-x-hidden"
        style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
      >
        <div className="mb-4 sm:mb-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
            Available Flights
          </h2>
          <p className="text-sm text-gray-600">Choose from the best options</p>
        </div>

        {/* Responsive Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {initialFlights.map((flight: any, index: number) => (
            <FlightCard
              key={flight.flightId || `flight-${index}`}
              flight={flight}
              onSelect={handleSelectFlight}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Show All Flights Button */}
        {remainingFlightsCount > 0 && (
          <div className="text-center">
            <Button
              onClick={handleShowAllFlights}
              variant="outline"
              className="border-gray-300 px-8 py-2 text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100"
            >
              Show all flights ({remainingFlightsCount} more)
            </Button>
          </div>
        )}

        {/* Selection Feedback */}
        {selectedFlight && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-800">
              Flight{" "}
              {allFlightTuples.find((f: any) => f.flightId === selectedFlight)
                ?.segments?.[0]?.flightNumber || "Unknown"}{" "}
              selected!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal for All Flights */}
      <Sheet open={showAllFlights} onOpenChange={setShowAllFlights}>
        <SheetContent
          side="bottom"
          className="h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 pb-4">
            <SheetTitle className="text-xl font-semibold">
              All Available Flights ({allFlightTuples.length} flights)
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {allFlightTuples.map((flight: any, index: number) => (
                <FlightCard
                  key={flight.flightId || `flight-${index}`}
                  flight={flight}
                  onSelect={handleSelectFlight}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FlightOptionsWidget;
