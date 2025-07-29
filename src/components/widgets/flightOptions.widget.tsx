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
  Loader2,
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
import { Skeleton } from "@/components/ui/skeleton";

interface FlightOption {
  flightId: string;
  totalEmission: number;
  totalEmissionUnit: string;
  currency: string;
  totalAmount: number;
  duration: string;
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  segments: FlightSegment[];
  offerRules: FlightOfferRules;
  rankingScore: number;
  pros: string[];
  cons: string[];
  tags: string[];
}

interface FlightEndpoint {
  date: string;
  airportIata: string;
  airportName: string;
  cityCode: string;
  countryCode: string;
}

interface FlightSegment {
  id: string;
  airlineIata: string;
  flightNumber: string;
  aircraftType: string;
  airlineName: string;
  duration: string;
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
}

interface FlightOfferRules {
  isRefundable: boolean
}

const getCurrencySymbol = (currencyCode: string): string => {
  const currencyMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NOK': 'kr',
    'MXN': '$',
    'NZD': 'NZ$',
    'SGD': 'S$',
    'HKD': 'HK$',
    'ZAR': 'R',
    'THB': '฿',
    'AED': 'د.إ',
    'SAR': '﷼',
    'KRW': '₩',
    'BRL': 'R$',
    'RUB': '₽',
    'TRY': '₺',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'ILS': '₪',
    'CLP': '$',
    'COP': '$',
    'PEN': 'S/',
    'ARS': '$',
    'UYU': '$U',
    'BOB': 'Bs',
    'PYG': '₲',
    'VES': 'Bs.S',
    'DKK': 'kr',
    'ISK': 'kr',
    'RON': 'lei',
    'BGN': 'лв',
    'HRK': 'kn',
    'RSD': 'дин',
    'UAH': '₴',
    'BYN': 'Br',
    'MDL': 'L',
    'GEL': '₾',
    'AMD': '֏',
    'AZN': '₼',
    'KZT': '₸',
    'UZS': 'soʻm',
    'KGS': 'с',
    'TJS': 'ЅМ',
    'TMT': 'T',
    'MNT': '₮',
    'LAK': '₭',
    'KHR': '៛',
    'MMK': 'K',
    'VND': '₫',
    'IDR': 'Rp',
    'MYR': 'RM',
    'PHP': '₱',
    'TWD': 'NT$',
    'PKR': '₨',
    'LKR': '₨',
    'BDT': '৳',
    'NPR': '₨',
    'BTN': 'Nu.',
    'MVR': '.ރ',
    'AFN': '؋',
    'IRR': '﷼',
    'IQD': 'ع.د',
    'JOD': 'د.ا',
    'KWD': 'د.ك',
    'LBP': 'ل.ل',
    'OMR': 'ر.ع.',
    'QAR': 'ر.ق',
    'SYP': '£',
    'YER': '﷼',
    'BHD': '.د.ب',
    'EGP': '£',
    'LYD': 'ل.د',
    'MAD': 'د.م.',
    'TND': 'د.ت',
    'DZD': 'د.ج',
    'AOA': 'Kz',
    'BWP': 'P',
    'BIF': 'Fr',
    'XOF': 'Fr',
    'XAF': 'Fr',
    'KMF': 'Fr',
    'DJF': 'Fr',
    'ERN': 'Nfk',
    'ETB': 'Br',
    'GMD': 'D',
    'GHS': '₵',
    'GNF': 'Fr',
    'KES': 'Sh',
    'LSL': 'L',
    'LRD': '$',
    'MGA': 'Ar',
    'MWK': 'MK',
    'MUR': '₨',
    'MZN': 'MT',
    'NAD': '$',
    'NGN': '₦',
    'RWF': 'Fr',
    'SCR': '₨',
    'SLL': 'Le',
    'SOS': 'Sh',
    'STN': 'Db',
    'SZL': 'L',
    'TZS': 'Sh',
    'UGX': 'Sh',
    'XPF': 'Fr',
    'ZMW': 'ZK',
    'ZWL': '$',
  };

  return currencyMap[currencyCode.toUpperCase()] || currencyCode;
};

const getBadgeConfigs = (tags: string[]) => {
  const badges = [];

  if (tags.includes("recommended")) {
    badges.push({
      icon: Star,
      text: "Recommended",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    });
  }
  if (tags.includes("cheapest")) {
    badges.push({
      icon: DollarSign,
      text: "Cheapest",
      color: "bg-green-100 text-green-800 border-green-200",
    });
  }
  if (tags.includes("fastest")) {
    badges.push({
      icon: Zap,
      text: "Fastest",
      color: "bg-orange-100 text-orange-800 border-orange-200",
    });
  }

  return badges;
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
  const badgeConfigs = flight.tags && flight.tags.length > 0 ? getBadgeConfigs(flight.tags) : [];
  const [isWhyChooseExpanded, setIsWhyChooseExpanded] = useState(false);

  //Todo: @Khalid, this is very critical and hacky, please verify the actual flight timings with what we are showing.
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
  const getAirlineIataFromFlightOption = (flight: FlightOption) => {
    if (flight.segments && flight.segments.length > 0) {
      return flight.segments
          .map((segment) => segment.airlineIata)
          .join(", ") || "Unknown";
    }
    return "Unknown";
  };

  const getAirlineIataFromSegment = (segment: FlightSegment) => {
    return segment.airlineIata || "Unknown";
  };

  // Get flight number from segments
  const getFlightNumberFromFlightOption = (flight: FlightOption) => {
    if (flight.segments && flight.segments.length > 0) {
      return flight.segments
          .map(segment => segment.flightNumber)
          .join(", ") || "Unknown";
    }
    return "Unknown";
  };

  const getFlightNumberFromSegment = (segment: FlightSegment) => {
    return segment.flightNumber || "Unknown";
  };

  const departureInfo = flight.departure;
  const arrivalInfo = flight.arrival;
  const duration = flight.duration
    ? formatDuration(flight.duration)
    : "Unknown";
  const price = flight.totalAmount || 0;
  const currency = flight.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-md overflow-hidden">
      {/* Badges */}
      {badgeConfigs.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {badgeConfigs.map((badgeConfig, index) => (
            <div
              key={index}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                badgeConfig.color,
              )}
            >
              <badgeConfig.icon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{badgeConfig.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Airline and Flight Number */}
      <div className="mb-3 flex items-center gap-1 sm:gap-2 min-w-0">
        <Plane className="h-4 w-4 text-gray-600 flex-shrink-0" />
        <span className="font-medium text-gray-900 truncate text-sm sm:text-base">{getAirlineIataFromFlightOption(flight)}</span>
        <span className="text-xs sm:text-sm text-gray-500 truncate">{getFlightNumberFromFlightOption(flight)}</span>
      </div>

      {/* Flight Route */}
      <div className="mb-3 flex items-center justify-between overflow-hidden">
        <div className="text-center flex-1 min-w-0 max-w-[30%]">
          <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {formatTime(departureInfo.date)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 truncate">{departureInfo.airportIata}</div>
          <div className="text-xs text-gray-500 truncate">{departureInfo.countryCode}</div>
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
            {flight.segments.length == 1
              ? "Non-stop"
              : `${flight.segments.length - 1} stop${flight.segments.length - 1 > 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="text-center flex-1 min-w-0 max-w-[30%]">
          <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {formatTime(arrivalInfo.date)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 truncate">{arrivalInfo.airportIata}</div>
          <div className="text-xs text-gray-500 truncate">{arrivalInfo.countryCode}</div>
        </div>
      </div>

      {/* Cancellation Info */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            flight.offerRules?.isRefundable
              ? "border border-green-200 bg-green-100 text-green-800"
              : "border border-red-200 bg-red-100 text-red-800",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              flight.offerRules?.isRefundable ? "bg-green-500" : "bg-red-500",
            )}
          />
          {flight.offerRules?.isRefundable ? "Free Cancellation" : "Non-Refundable"}
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
          <span className="font-bold">{currencySymbol}{price.toLocaleString()}</span>
        </span>
      </Button>
    </div>
  );
};

// Loading/Empty Flight Card Component
const EmptyFlightCard = ({ isLoading = true }: { isLoading?: boolean }) => {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm overflow-hidden">
      {isLoading ? (
        <>
          {/* Loading Badge */}
          <div className="mb-3">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          {/* Loading Airline and Flight Number */}
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Loading Flight Route */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-center flex-1">
              <Skeleton className="h-6 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
            <div className="mx-2 flex-1 text-center">
              <Skeleton className="h-3 w-12 mx-auto mb-1" />
              <Skeleton className="h-px w-full mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
            <div className="text-center flex-1">
              <Skeleton className="h-6 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
          </div>

          {/* Loading Cancellation Info */}
          <div className="mb-3">
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>

          {/* Loading Button */}
          <Skeleton className="h-12 w-full rounded" />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 mb-1">Searching for flights...</p>
          <p className="text-xs text-gray-400">This may take a few moments</p>
        </div>
      )}
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

  // If no flights, show empty state with horizontal scroll on mobile
  if (flights.length === 0) {
    return (
      <div className="relative w-full overflow-hidden">
        <div
          className="flex overflow-x-auto scrollbar-hide gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
          style={{
            scrollSnapType: 'x mandatory',
          }}
        >
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[280px] sm:w-auto"
              style={{
                scrollSnapAlign: 'start',
              }}
            >
              <EmptyFlightCard isLoading={false} />
            </div>
          ))}
        </div>
      </div>
    );
  }

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

// Direct Flight Display Component - Shows only the 3 tagged flights
const DirectFlightDisplay = ({
  flights,
  onSelect,
  isLoading,
}: {
  flights: FlightOption[];
  onSelect: (flightId: string) => void;
  isLoading: boolean;
}) => {
  // Get one flight for each mandatory tag
  const recommendedFlight = flights.find(flight => flight.tags?.includes('recommended'));
  const cheapestFlight = flights.find(flight => flight.tags?.includes('cheapest'));
  const fastestFlight = flights.find(flight => flight.tags?.includes('fastest'));

  // Create array of unique flights in priority order: recommended > cheapest > fastest
  // Avoid duplicates if same flight has multiple tags
  const taggedFlights = [];
  const addedFlightIds = new Set();

  // Priority 1: Recommended flight
  if (recommendedFlight && !addedFlightIds.has(recommendedFlight.flightId)) {
    taggedFlights.push(recommendedFlight);
    addedFlightIds.add(recommendedFlight.flightId);
  }

  // Priority 2: Cheapest flight (only if not already added)
  if (cheapestFlight && !addedFlightIds.has(cheapestFlight.flightId)) {
    taggedFlights.push(cheapestFlight);
    addedFlightIds.add(cheapestFlight.flightId);
  }

  // Priority 3: Fastest flight (only if not already added)
  if (fastestFlight && !addedFlightIds.has(fastestFlight.flightId)) {
    taggedFlights.push(fastestFlight);
    addedFlightIds.add(fastestFlight.flightId);
  }

  console.log("DirectFlightDisplay - Tagged flights found:", taggedFlights.length);
  console.log("DirectFlightDisplay - Recommended:", !!recommendedFlight);
  console.log("DirectFlightDisplay - Cheapest:", !!cheapestFlight);
  console.log("DirectFlightDisplay - Fastest:", !!fastestFlight);

  // Create display array with exactly 3 slots in order: recommended, cheapest, fastest
  type DisplaySlot =
    | { type: 'flight'; flight: FlightOption; key: string }
    | { type: 'empty'; key: string };

  const displaySlots: DisplaySlot[] = [];

  // Slot 1: Recommended
  if (recommendedFlight) {
    displaySlots.push({
      type: 'flight',
      flight: recommendedFlight,
      key: `recommended-${recommendedFlight.flightId}`
    });
  } else {
    displaySlots.push({
      type: 'empty',
      key: 'empty-recommended'
    });
  }

  // Slot 2: Cheapest (only if different from recommended)
  if (cheapestFlight && (!recommendedFlight || cheapestFlight.flightId !== recommendedFlight.flightId)) {
    displaySlots.push({
      type: 'flight',
      flight: cheapestFlight,
      key: `cheapest-${cheapestFlight.flightId}`
    });
  } else if (!cheapestFlight) {
    displaySlots.push({
      type: 'empty',
      key: 'empty-cheapest'
    });
  }

  // Slot 3: Fastest (only if different from recommended and cheapest)
  if (fastestFlight &&
      (!recommendedFlight || fastestFlight.flightId !== recommendedFlight.flightId) &&
      (!cheapestFlight || fastestFlight.flightId !== cheapestFlight.flightId)) {
    displaySlots.push({
      type: 'flight',
      flight: fastestFlight,
      key: `fastest-${fastestFlight.flightId}`
    });
  } else if (!fastestFlight) {
    displaySlots.push({
      type: 'empty',
      key: 'empty-fastest'
    });
  }

  // Ensure we always have exactly 3 slots
  while (displaySlots.length < 3) {
    displaySlots.push({
      type: 'empty',
      key: `empty-${displaySlots.length}`
    });
  }

  // Use ResponsiveCarousel for mobile horizontal scrolling
  const flightsToShow = displaySlots
    .filter(slot => slot.type === 'flight')
    .map(slot => (slot as { type: 'flight'; flight: FlightOption; key: string }).flight);

  // If we have flights, use the carousel, otherwise show the grid for empty states
  if (flightsToShow.length > 0) {
    return (
      <ResponsiveCarousel
        flights={flightsToShow}
        onSelect={onSelect}
        isLoading={isLoading}
      />
    );
  }

  // Fallback to grid for empty states
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {displaySlots.map((slot) => (
        slot.type === 'flight' ? (
          <FlightCard
            key={slot.key}
            flight={slot.flight}
            onSelect={onSelect}
            isLoading={isLoading}
          />
        ) : (
          <EmptyFlightCard key={slot.key} isLoading={false} />
        )
      ))}
    </div>
  );
};

// Flight List Item Component for Bottom Sheet
const FlightListItem = ({
  flight,
  onSelect,
  isLoading,
}: {
  flight: FlightOption;
  onSelect: (flightId: string) => void;
  isLoading?: boolean;
}) => {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(\d+)?M?/);
    if (match) {
      const hours = match[1];
      const minutes = match[2] || "0";
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  const getAirlineInfo = (flight: FlightOption) => {
    if (flight.segments && flight.segments.length > 0) {
      const airline = flight.segments[0].airlineName || flight.segments[0].airlineIata || "Unknown";

      // If multiple flights, show individual flight numbers
      if (flight.segments.length > 1) {
        const flightNumbers = flight.segments.map(s => s.flightNumber).join(", ");
        return {
          airline,
          flightNumber: flightNumbers,
          isMultiFlight: true
        };
      } else {
        return {
          airline,
          flightNumber: flight.segments[0].flightNumber,
          isMultiFlight: false
        };
      }
    }
    return { airline: "Unknown", flightNumber: "Unknown", isMultiFlight: false };
  };

  const departureInfo = flight.departure;
  const arrivalInfo = flight.arrival;
  const duration = flight.duration ? formatDuration(flight.duration) : "Unknown";
  const price = flight.totalAmount || 0;
  const currency = flight.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);
  const { airline, flightNumber, isMultiFlight } = getAirlineInfo(flight);

  return (
    <div
      className="border-b border-gray-200 bg-white py-3 px-3 sm:px-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      onClick={() => onSelect(flight.flightId)}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        {/* Main Flight Row */}
        <div className="flex items-center justify-between">
          {/* Left: Airline Info */}
          <div className="flex items-center gap-3">
            {/* Airline Icon */}
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {airline.charAt(0)}
                </span>
              </div>
            </div>

            {/* Airline Details */}
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {airline.length > 12 ? airline.substring(0, 12) + '...' : airline}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {isMultiFlight ? (
                  <div className="space-y-0.5">
                    {flight.segments.map((segment, index) => (
                      <div key={segment.id} className="text-xs">
                        {segment.flightNumber}
                      </div>
                    ))}
                  </div>
                ) : (
                  flightNumber
                )}
              </div>
            </div>
          </div>

          {/* Center: Times and Duration */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            {/* Departure */}
            <div className="text-center">
              <div className="text-sm text-gray-900" style={{ fontSize: '14px' }}>
                {formatTime(departureInfo.date)}
              </div>
            </div>

            {/* Duration & Stops */}
            <div className="text-center min-w-0">
              <div className="text-xs text-gray-700" style={{ fontSize: '12px' }}>
                {duration}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap" style={{ fontSize: '10px' }}>
                {flight.segments.length === 1
                  ? "Non-stop"
                  : `${flight.segments.length - 1} stop${flight.segments.length - 1 > 1 ? "s" : ""}`}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-sm text-gray-900" style={{ fontSize: '14px' }}>
                {formatTime(arrivalInfo.date)}
              </div>
            </div>
          </div>

          {/* Right: Price */}
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-gray-900">
              {currencySymbol}{price.toLocaleString()}
            </div>
          </div>
        </div>


      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        {/* Left: Airline Info */}
        <div className="flex flex-col min-w-0" style={{ width: '180px' }}>
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 text-sm truncate">{airline}</span>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {isMultiFlight ? (
              <div className="space-y-0.5">
                {flight.segments.map((segment, index) => (
                  <div key={segment.id} className="text-xs">
                    {segment.flightNumber}
                  </div>
                ))}
              </div>
            ) : (
              flightNumber
            )}
          </div>
        </div>

        {/* Center-Left: Departure Time */}
        <div className="text-center" style={{ width: '80px' }}>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(departureInfo.date)}
          </div>
          <div className="text-xs text-gray-500">{departureInfo.airportIata}</div>
        </div>

        {/* Center: Duration & Stops */}
        <div className="text-center flex-1 max-w-[120px]">
          <div className="text-sm font-medium text-gray-700">
            {duration}
          </div>
          <div className="relative my-1">
            <div className="border-t border-gray-300 w-full"></div>
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-300"></div>
          </div>
          <div className="text-xs text-gray-500">
            {flight.segments.length === 1
              ? "Non-stop"
              : `${flight.segments.length - 1} stop${flight.segments.length - 1 > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Center-Right: Arrival Time */}
        <div className="text-center" style={{ width: '80px' }}>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(arrivalInfo.date)}
          </div>
          <div className="text-xs text-gray-500">{arrivalInfo.airportIata}</div>
        </div>

        {/* Right: Price */}
        <div className="text-right" style={{ width: '100px' }}>
          <div className="text-lg font-bold text-gray-900">
            {currencySymbol}{price.toLocaleString()}
          </div>
          {flight.offerRules?.isRefundable && (
            <div className="text-xs text-green-600">Free Cancellation</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Tab Component
const FlightTabs = ({
  flights,
  onSelect,
  isLoading,
}: {
  flights: FlightOption[];
  onSelect: (flightId: string) => void;
  isLoading: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'cheapest' | 'fastest'>('recommended');

  // Organize flights by tags
  const recommendedFlights = flights.filter(flight => flight.tags?.includes('recommended'));
  const cheapestFlights = flights.filter(flight => flight.tags?.includes('cheapest'));
  const fastestFlights = flights.filter(flight => flight.tags?.includes('fastest'));

  // Debug logging
  console.log("FlightTabs - Total flights:", flights.length);
  console.log("FlightTabs - Recommended flights:", recommendedFlights.length);
  console.log("FlightTabs - Cheapest flights:", cheapestFlights.length);
  console.log("FlightTabs - Fastest flights:", fastestFlights.length);

  // Fallback: If no flights have the expected tags, distribute them across tabs
  let fallbackRecommended = recommendedFlights;
  let fallbackCheapest = cheapestFlights;
  let fallbackFastest = fastestFlights;

  if (recommendedFlights.length === 0 && cheapestFlights.length === 0 && fastestFlights.length === 0 && flights.length > 0) {
    console.log("No flights with expected tags found, using fallback distribution");
    // Distribute flights across tabs as fallback
    const flightsPerTab = Math.ceil(flights.length / 3);
    fallbackRecommended = flights.slice(0, flightsPerTab);
    fallbackCheapest = flights.slice(flightsPerTab, flightsPerTab * 2);
    fallbackFastest = flights.slice(flightsPerTab * 2);
  }

  const tabs = [
    {
      id: 'recommended' as const,
      label: 'Recommended',
      icon: Star,
      flights: fallbackRecommended,
      color: 'text-blue-600 border-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'cheapest' as const,
      label: 'Cheapest',
      icon: DollarSign,
      flights: fallbackCheapest,
      color: 'text-green-600 border-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'fastest' as const,
      label: 'Fastest',
      icon: Zap,
      flights: fallbackFastest,
      color: 'text-orange-600 border-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200",
                isActive
                  ? `${tab.color} ${tab.bgColor}`
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full min-w-[20px]">
                {tab.flights.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTabData && (
          <>
            {activeTabData.flights.length > 0 ? (
              <ResponsiveCarousel
                flights={activeTabData.flights}
                onSelect={onSelect}
                isLoading={isLoading}
              />
            ) : (
              <div className="relative w-full overflow-hidden">
                <div
                  className="flex overflow-x-auto scrollbar-hide gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
                  style={{
                    scrollSnapType: 'x mandatory',
                  }}
                >
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-[280px] sm:w-auto"
                      style={{
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <EmptyFlightCard isLoading={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const FlightOptionsWidget = (args: Record<string, any>) => {
  console.log("FlightOptionsWidget args:", args);
  console.log("flightOffers:", args.flightOffers);

  const thread = useStreamContext();
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [bottomSheetFilter, setBottomSheetFilter] = useState<'cheapest' | 'fastest' | 'recommended'>('cheapest');

  const allFlightTuples = args.flightOffers || [];

  // Debug: Log flight tags
  if (allFlightTuples.length > 0) {
    console.log("Sample flight tags:", allFlightTuples[0]?.tags);
    console.log("All flight tags:", allFlightTuples.map((f: any) => ({ id: f.flightId, tags: f.tags })));
  }

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

  // Sort flights based on the selected filter
  const getSortedFlights = (flights: FlightOption[], sortBy: 'cheapest' | 'fastest' | 'recommended') => {
    const flightsCopy = [...flights];

    switch (sortBy) {
      case 'cheapest':
        return flightsCopy.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
      case 'fastest':
        // Sort by duration (convert ISO duration to minutes for comparison)
        return flightsCopy.sort((a, b) => {
          const getDurationMinutes = (duration: string) => {
            const match = duration.match(/PT(\d+)H(\d+)?M?/);
            if (match) {
              const hours = parseInt(match[1]) || 0;
              const minutes = parseInt(match[2]) || 0;
              return hours * 60 + minutes;
            }
            return 0;
          };
          return getDurationMinutes(a.duration || '') - getDurationMinutes(b.duration || '');
        });
      case 'recommended':
        // Sort by ranking score (higher is better)
        return flightsCopy.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
      default:
        return flightsCopy;
    }
  };

  const sortedFlights = getSortedFlights(allFlightTuples, bottomSheetFilter);

  // Check if we have any flights with the mandatory tags
  const hasRecommended = allFlightTuples.some((flight: any) => flight.tags?.includes('recommended'));
  const hasCheapest = allFlightTuples.some((flight: any) => flight.tags?.includes('cheapest'));
  const hasFastest = allFlightTuples.some((flight: any) => flight.tags?.includes('fastest'));

  // Show loading state if no mandatory tags are present (unless no flights at all)
  const shouldShowLoading = allFlightTuples.length > 0 && (!hasRecommended || !hasCheapest || !hasFastest);

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

        {/* Direct Flight Display - Only 3 Tagged Flights */}
        <div className="mb-6 overflow-hidden">
          {allFlightTuples.length > 0 ? (
            <DirectFlightDisplay
              flights={allFlightTuples}
              onSelect={handleSelectFlight}
              isLoading={isLoading}
            />
          ) : (
            // Show loading state when no flights are available
            <div className="relative w-full overflow-hidden">
              <div
                className="flex overflow-x-auto scrollbar-hide gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
                style={{
                  scrollSnapType: 'x mandatory',
                }}
              >
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[280px] sm:w-auto"
                    style={{
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <EmptyFlightCard isLoading={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Show All Flights Button */}
        {allFlightTuples.length > 6 && (
          <div className="text-center">
            <Button
              onClick={handleShowAllFlights}
              variant="outline"
              className="border-gray-300 px-8 py-2 text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100"
            >
              Show all flights ({allFlightTuples.length} total)
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
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-semibold">
              All Available Flights ({allFlightTuples.length} flights)
            </SheetTitle>
          </SheetHeader>

          {/* Filter Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'cheapest' as const, label: 'Cheapest', icon: DollarSign },
                { id: 'fastest' as const, label: 'Fastest', icon: Zap },
                { id: 'recommended' as const, label: 'Recommended', icon: Star },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = bottomSheetFilter === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setBottomSheetFilter(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200",
                      isActive
                        ? "text-blue-600 border-blue-600 bg-blue-50"
                        : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flight List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {sortedFlights.map((flight: any, index: number) => (
                <FlightListItem
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
