"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
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
    <div className="w-full rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-md overflow-hidden">
      {/* Badge */}
      {badgeConfig && (
        <div
          className={cn(
            "mb-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium max-w-full",
            badgeConfig.color,
          )}
        >
          <badgeConfig.icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{badgeConfig.text}</span>
        </div>
      )}

      {/* Airline and Flight Number */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <Plane className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate text-sm sm:text-base">{getAirline()}</span>
          <span className="text-xs sm:text-sm text-gray-500 truncate">{getFlightNumber()}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-base sm:text-lg font-bold text-gray-900">
            ₹{price.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">per person</div>
        </div>
      </div>

      {/* Flight Route */}
      <div className="mb-3 flex items-center justify-between overflow-hidden">
        <div className="text-center flex-1 min-w-0 max-w-[30%]">
          <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {departureInfo.time}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 truncate">{departureInfo.airport}</div>
          <div className="text-xs text-gray-500 truncate">{departureInfo.city}</div>
        </div>

        <div className="mx-1 sm:mx-2 flex-1 text-center min-w-0 max-w-[40%]">
          <div className="mb-1 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{duration}</span>
          </div>
          <div className="relative border-t border-gray-300 mx-2">
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-300"></div>
          </div>
          <div className="mt-1 text-xs text-gray-500 truncate">
            {flight.stops === 0
              ? "Non-stop"
              : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="text-center flex-1 min-w-0 max-w-[30%]">
          <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {arrivalInfo.time}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 truncate">{arrivalInfo.airport}</div>
          <div className="text-xs text-gray-500 truncate">{arrivalInfo.city}</div>
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

// Responsive Carousel Component
const ResponsiveCarousel = ({
  flights,
  onSelect,
  isLoading,
}: {
  flights: FlightOption[];
  onSelect: (flightId: string) => void;
  isLoading: boolean;
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Get cards per view based on screen size - more conservative to prevent overflow
  const getCardsPerView = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width >= 1200) return 3; // Large desktop: 3 full cards
    if (width >= 1024) return 2.8; // Desktop: 2 full + partial third
    if (width >= 768) return 2; // Tablet: 2 full cards
    if (width >= 640) return 1.8; // Small tablet: 1 full + partial second
    if (width >= 480) return 1.3; // Large phone: 1 full + partial second
    if (width >= 360) return 1.1; // Phone: 1 full + small glimpse of second
    return 1; // Very small phone: 1 card only
  };

  const [cardsPerView, setCardsPerView] = useState(getCardsPerView());

  useEffect(() => {
    const handleResize = () => {
      setCardsPerView(getCardsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateScrollButtons = () => {
    if (!carouselRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [flights, cardsPerView]);

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;

    const cardWidth = carouselRef.current.clientWidth / cardsPerView;
    const scrollPosition = index * cardWidth;

    carouselRef.current.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });

    setCurrentIndex(index);
  };

  const scrollLeft = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  };

  const scrollRight = () => {
    const maxIndex = Math.max(0, flights.length - Math.floor(cardsPerView));
    const newIndex = Math.min(maxIndex, currentIndex + 1);
    scrollToIndex(newIndex);
  };

  const shouldShowNavigation = flights.length > Math.floor(cardsPerView);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Navigation Buttons - Only show on larger screens and positioned inside container */}
      {shouldShowNavigation && cardsPerView >= 2 && (
        <>
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={cn(
              "absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 shadow-lg transition-all duration-200 hidden sm:block",
              canScrollLeft
                ? "text-gray-700 hover:bg-gray-50 hover:shadow-xl"
                : "cursor-not-allowed text-gray-300"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={cn(
              "absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 shadow-lg transition-all duration-200 hidden sm:block",
              canScrollRight
                ? "text-gray-700 hover:bg-gray-50 hover:shadow-xl"
                : "cursor-not-allowed text-gray-300"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          gap: cardsPerView >= 2 ? '16px' : '12px', // Smaller gap on mobile
          paddingLeft: shouldShowNavigation && cardsPerView >= 2 ? '40px' : '0px', // Space for nav buttons
          paddingRight: shouldShowNavigation && cardsPerView >= 2 ? '40px' : '0px',
        }}
        onScroll={updateScrollButtons}
      >
        {flights.map((flight, index) => {
          // Calculate card width more conservatively to prevent overflow
          const gapSize = cardsPerView >= 2 ? 16 : 12;
          const totalGaps = (cardsPerView - 1) * gapSize;
          const availableWidth = 100; // percentage
          const cardWidth = (availableWidth / cardsPerView) - (totalGaps / cardsPerView);

          return (
            <div
              key={flight.flightId || `flight-${index}`}
              className="flex-shrink-0"
              style={{
                width: `${Math.max(cardWidth, 20)}%`, // Ensure minimum width and use percentage
                scrollSnapAlign: 'start',
                minWidth: '280px', // Minimum card width for readability
                maxWidth: cardsPerView === 1 ? '100%' : `${cardWidth}%`,
              }}
            >
              <FlightCard
                flight={flight}
                onSelect={onSelect}
                isLoading={isLoading}
              />
            </div>
          );
        })}
      </div>
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

  // Get initial flights for display
  const initialFlights = preferredFlightTuples.slice(0, 6); // Show more for carousel
  const remainingFlightsCount = allFlightTuples.length - initialFlights.length;

  return (
    <>
      <div
        className="mx-auto mt-4 w-full max-w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:mt-8 sm:p-6 overflow-hidden flight-carousel-container"
        style={{
          fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
          maxWidth: "min(100vw - 2rem, 1536px)" // Ensure it never exceeds viewport width minus padding
        }}
      >
        <div className="mb-4 sm:mb-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
            Available Flights
          </h2>
          <p className="text-sm text-gray-600">Choose from the best options</p>
        </div>

        {/* Responsive Carousel */}
        <div className="mb-6 overflow-hidden">
          <ResponsiveCarousel
            flights={initialFlights}
            onSelect={handleSelectFlight}
            isLoading={isLoading}
          />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 px-4 sm:px-0">
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
