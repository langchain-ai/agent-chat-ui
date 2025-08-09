"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/common/ui/button";
import {
  Clock,
  Star,
  DollarSign,
  Zap,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Luggage,
  Briefcase,
  X,
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
import Image from "next/image";

interface FlightOption {
  flightOfferId: string;
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
  journey?: FlightJourney[]; // New field for journey array
  baggage?: BaggageInfo; // New field for baggage data from API
}

interface FlightJourney {
  flightOfferId: string;
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
  baggage?: BaggageInfo;
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

interface BaggageInfo {
  checkedBaggage?: {
    included: boolean;
    weight?: string;
    pieces?: number;
  };
  carryOnBaggage?: {
    included: boolean;
    weight?: string;
    dimensions?: string;
  };
  check_in_baggage?: {
    weight: number;
    weightUnit: string;
  };
  cabin_baggage?: {
    weight: number;
    weightUnit: string;
  };
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

// Helper function to get airline logo path
const getAirlineLogoPath = (airlineIata: string): string => {
  if (!airlineIata) return '';
  // The airlines folder is in the root directory, so we need to go up from src
  return `/airlines/${airlineIata.toUpperCase()}.png`;
};

// Airline Logo Component
const AirlineLogo = ({
  airlineIata,
  airlineName,
  size = 'md'
}: {
  airlineIata: string;
  airlineName: string;
  size?: 'sm' | 'md' | 'lg'
}) => {
  const logoPath = getAirlineLogoPath(airlineIata);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-5 h-5', fallback: 'w-3 h-3' },
    md: { container: 'w-6 h-6', fallback: 'w-4 h-4' },
    lg: { container: 'w-8 h-8', fallback: 'w-6 h-6' }
  };

  const { container, fallback } = sizeConfig[size];

  return (
    <div className={cn("rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden", container)}>
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${airlineName} logo`}
          width={size === 'sm' ? 20 : size === 'md' ? 24 : 32}
          height={size === 'sm' ? 20 : size === 'md' ? 24 : 32}
          className="object-contain rounded-full"
          onError={(e) => {
            // Fallback to gray circle if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="${cn('rounded-full bg-gray-400', fallback)}"></div>`;
            }
          }}
        />
      ) : (
        <div className={cn("rounded-full bg-gray-400", fallback)}></div>
      )}
    </div>
  );
};

const getBadgeConfigs = (tags: string[]) => {
  // Priority order: recommended > cheapest > fastest
  // Only show one badge per flight
  if (tags.includes("recommended")) {
    return [{
      emoji: "⭐",
      text: "Best",
      color: "bg-black text-white border-black",
    }];
  }
  if (tags.includes("cheapest")) {
    return [{
      emoji: "💰",
      text: "Cheapest",
      color: "bg-black text-white border-black",
    }];
  }
  if (tags.includes("fastest")) {
    return [{
      emoji: "⚡",
      text: "Fastest",
      color: "bg-black text-white border-black",
    }];
  }

  return [];
};

// Get baggage data from API or fallback to mock data
const getBaggageInfo = (flight: FlightOption): BaggageInfo => {
  // Use API baggage data if available
  if (flight.baggage) {
    return flight.baggage;
  }

  // Fallback to mock data for backward compatibility
  const isLowCost = flight.tags?.includes('cheapest');
  const isPremium = flight.tags?.includes('recommended');

  // Mock scenarios
  const scenarios = [
    // Scenario 1: Full service airline
    {
      checkedBaggage: { included: true, weight: "23kg", pieces: 1 },
      carryOnBaggage: { included: true, weight: "7kg", dimensions: "55x40x20cm" }
    },
    // Scenario 2: Low cost carrier
    {
      checkedBaggage: { included: false },
      carryOnBaggage: { included: true, weight: "7kg", dimensions: "55x40x20cm" }
    },
    // Scenario 3: Premium service
    {
      checkedBaggage: { included: true, weight: "32kg", pieces: 2 },
      carryOnBaggage: { included: true, weight: "10kg", dimensions: "55x40x20cm" }
    },
    // Scenario 4: Basic service
    {
      checkedBaggage: { included: true, weight: "20kg", pieces: 1 },
      carryOnBaggage: { included: true, weight: "7kg", dimensions: "55x40x20cm" }
    }
  ];

  // Select scenario based on flight type
  if (isPremium) {
    return scenarios[2]; // Premium service
  } else if (isLowCost) {
    return scenarios[1]; // Low cost carrier
  } else {
    // Randomly select between full service and basic service
    return Math.random() > 0.5 ? scenarios[0] : scenarios[3];
  }
};

// Baggage Display Component
const BaggageDisplay = ({ flight }: { flight: FlightOption }) => {
  const baggageInfo = getBaggageInfo(flight);

  // Helper function to format baggage weight
  const formatBaggageWeight = (weight: number | string | undefined, unit?: string) => {
    if (typeof weight === 'number') {
      return `${weight}${unit || 'kg'}`;
    }
    return weight || '';
  };

  // Get check-in baggage info (prioritize API data)
  const getCheckInBaggageInfo = () => {
    if (baggageInfo.check_in_baggage) {
      return {
        hasData: true,
        weight: formatBaggageWeight(baggageInfo.check_in_baggage.weight, baggageInfo.check_in_baggage.weightUnit?.toLowerCase())
      };
    }
    if (baggageInfo.checkedBaggage?.included) {
      return {
        hasData: true,
        weight: baggageInfo.checkedBaggage.weight + (baggageInfo.checkedBaggage.pieces && baggageInfo.checkedBaggage.pieces > 1 ? ` (${baggageInfo.checkedBaggage.pieces} pcs)` : '')
      };
    }
    return { hasData: false, weight: '' };
  };

  // Get cabin baggage info (prioritize API data)
  const getCabinBaggageInfo = () => {
    if (baggageInfo.cabin_baggage) {
      return {
        hasData: true,
        weight: formatBaggageWeight(baggageInfo.cabin_baggage.weight, baggageInfo.cabin_baggage.weightUnit?.toLowerCase())
      };
    }
    if (baggageInfo.carryOnBaggage?.included) {
      return {
        hasData: true,
        weight: baggageInfo.carryOnBaggage.weight || ''
      };
    }
    return { hasData: false, weight: '' };
  };

  const checkInInfo = getCheckInBaggageInfo();
  const cabinInfo = getCabinBaggageInfo();

  return (
    <div className="mb-4 flex items-center justify-between gap-4 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
      {/* Checked Baggage */}
      <div className="flex items-center gap-2 flex-1">
        <Luggage className="h-4 w-4 text-black flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-medium text-black">Check-in</div>
          {checkInInfo.hasData ? (
            <div className="text-xs text-gray-700">
              {checkInInfo.weight}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <X className="h-4 w-4 text-black" />
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-400"></div>

      {/* Carry-on Baggage */}
      <div className="flex items-center gap-2 flex-1">
        <Briefcase className="h-4 w-4 text-black flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-medium text-black">Carry-on</div>
          {cabinInfo.hasData ? (
            <div className="text-xs text-gray-700">
              {cabinInfo.weight}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <X className="h-4 w-4 text-black" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Journey Display Component for Round Trip flights
const JourneyDisplay = ({ journey, journeyIndex, totalJourneys }: {
  journey: FlightJourney;
  journeyIndex: number;
  totalJourneys: number;
}) => {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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

  const getJourneyLabel = (index: number, total: number) => {
    if (total === 1) return "One-way";
    if (index === 0) return "Outbound";
    if (index === 1) return "Return";
    return `Journey ${index + 1}`;
  };

  const getAirlineInfo = (journey: FlightJourney) => {
    if (journey.segments && journey.segments.length > 0) {
      const segment = journey.segments[0];
      return {
        airlineIata: segment.airlineIata || "",
        airlineName: segment.airlineName || segment.airlineIata || "",
        flightNumber: journey.segments.map(s => s.flightNumber).filter(fn => fn && fn.trim() !== "").join(", ")
      };
    }
    return { airlineIata: "", airlineName: "", flightNumber: "" };
  };

  const { airlineIata, airlineName, flightNumber } = getAirlineInfo(journey);
  const duration = formatDuration(journey.duration || "");

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
      {/* Journey Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white bg-black px-2 py-1 rounded-full">
            {getJourneyLabel(journeyIndex, totalJourneys)}
          </span>
          <span className="text-xs text-gray-700">
            {formatDate(journey.departure.date)}
          </span>
        </div>
        {journey.offerRules?.isRefundable && (
          <span className="text-xs text-black font-medium">Refundable</span>
        )}
      </div>

      {/* Flight Route */}
      <div className="flex items-center justify-between">
        {/* Departure */}
        <div className="text-left flex-1 min-w-0">
          <div className="font-bold text-black text-sm">
            {formatTime(journey.departure.date)}
          </div>
          <div className="text-xs text-gray-700">{journey.departure.airportIata}</div>
        </div>

        {/* Duration and Stops */}
        <div className="mx-2 flex-1 text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-black" />
            <span className="text-xs text-black">{duration}</span>
          </div>
          <div className="relative border-t border-black mx-2">
            {journey.segments && journey.segments.length === 2 && (
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
            )}
            {journey.segments && journey.segments.length === 3 && (
              <>
                <div className="absolute -top-1 left-1/3 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                <div className="absolute -top-1 left-2/3 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
              </>
            )}
          </div>
          <div className="text-xs text-gray-700 mt-1">
            {journey.segments && journey.segments.length === 1
              ? "Non-stop"
              : journey.segments
                ? `${journey.segments.length - 1} stop${journey.segments.length - 1 > 1 ? "s" : ""}`
                : "Non-stop"}
          </div>
        </div>

        {/* Arrival */}
        <div className="text-right flex-1 min-w-0">
          <div className="font-bold text-black text-sm">
            {formatTime(journey.arrival.date)}
          </div>
          <div className="text-xs text-gray-700">{journey.arrival.airportIata}</div>
        </div>
      </div>

      {/* Airline Info - only show if we have airline data */}
      {(airlineName || airlineIata || flightNumber) && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-300">
          {(airlineName || airlineIata) && (
            <>
              <AirlineLogo
                airlineIata={airlineIata}
                airlineName={airlineName || airlineIata}
                size="sm"
              />
              <span className="text-xs text-black">{airlineName || airlineIata}</span>
            </>
          )}
          {flightNumber && (
            <>
              {(airlineName || airlineIata) && <span className="text-xs text-gray-700">•</span>}
              <span className="text-xs text-gray-700">{flightNumber}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const FlightCard = ({
  flight,
  onSelect,
  isLoading,
}: {
  flight: FlightOption;
  onSelect: (flightOfferId: string) => void;
  isLoading?: boolean;
}) => {
  const badgeConfigs = flight.tags && flight.tags.length > 0 ? getBadgeConfigs(flight.tags) : [];

  // Check if this is a journey-based flight (round trip)
  const isJourneyBased = flight.journey && flight.journey.length > 0;
  const isRoundTrip = isJourneyBased && flight.journey!.length === 2;

  // Generate personalized flight highlights - Commented out since highlights rendering is disabled
  /*
  const getFlightHighlights = (flight: FlightOption) => {
    const highlights = [];

    // Add tag-based highlights
    if (flight.tags?.includes('recommended')) {
      highlights.push("Your usual flight, travelled 12 times");
    }
    if (flight.tags?.includes('cheapest')) {
      highlights.push("Cheapest option with short layover");
    }
    if (flight.tags?.includes('fastest')) {
      highlights.push("Fastest route to your destination");
    }

    // Add journey-specific highlights
    if (isRoundTrip) {
      highlights.push("Round trip - convenient return journey included");
    } else if (isJourneyBased) {
      highlights.push("One-way journey - flexible travel option");
    } else {
      // Add additional contextual highlights for legacy format
      if (flight.segments && flight.segments.length === 1) {
        highlights.push("Direct flight - no hassle with connections");
      } else if (flight.segments && flight.segments.length === 2) {
        highlights.push("Single layover - good balance of time and price");
      }
    }

    // Add cancellation policy information
    if (flight.offerRules?.isRefundable) {
      highlights.push("Flexible booking with free cancellation");
    } else {
      highlights.push("Non-refundable - lock in this great price");
    }

    // Return max 3 highlights
    return highlights.slice(0, 3);
  };
  */

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

  // Helper function to truncate airline name to 10 characters
  const truncateAirlineName = (name: string) => {
    if (name.length > 10) {
      return name.substring(0, 10) + "...";
    }
    return name;
  };

  // Get airline IATA code from segments
  const getAirlineIataFromFlightOption = (flight: FlightOption): string => {
    if (flight.segments && flight.segments.length > 0) {
      return flight.segments[0].airlineIata || "";
    }
    // For journey-based flights, try to get from journey data
    if (flight.journey && flight.journey.length > 0 && flight.journey[0].segments.length > 0) {
      return flight.journey[0].segments[0].airlineIata || "";
    }
    return "";
  };

  // Get airline name from segments (truncated to 10 characters)
  const getAirlineNameFromFlightOption = (flight: FlightOption): string => {
    if (flight.segments && flight.segments.length > 0) {
      const segment = flight.segments[0];
      if (segment.airlineName) {
        return truncateAirlineName(segment.airlineName);
      }
      if (segment.airlineIata) {
        return segment.airlineIata;
      }
    }
    // For journey-based flights, try to get from journey data
    if (flight.journey && flight.journey.length > 0 && flight.journey[0].segments.length > 0) {
      const journeySegment = flight.journey[0].segments[0];
      if (journeySegment.airlineName) {
        return truncateAirlineName(journeySegment.airlineName);
      }
      if (journeySegment.airlineIata) {
        return journeySegment.airlineIata;
      }
    }
    return ""; // Return empty string instead of "Unknown"
  };

  // Get flight number from segments
  const getFlightNumberFromFlightOption = (flight: FlightOption): string => {
    if (flight.segments && flight.segments.length > 0) {
      const flightNumbers = flight.segments
          .map(segment => segment.flightNumber)
          .filter(num => num && num.trim() !== "")
          .join(", ");
      return flightNumbers || "";
    }
    // For journey-based flights, get flight numbers from all journeys
    if (flight.journey && flight.journey.length > 0) {
      const allFlightNumbers = flight.journey
          .flatMap(journey => journey.segments.map(segment => segment.flightNumber))
          .filter(num => num && num.trim() !== "")
          .join(", ");
      return allFlightNumbers || "";
    }
    return "";
  };



  // Use journey data if available, otherwise fall back to legacy format
  const departureInfo = isJourneyBased ? flight.journey![0].departure : flight.departure;
  const arrivalInfo = isJourneyBased ? flight.journey![flight.journey!.length - 1].arrival : flight.arrival;
  const duration = flight.duration ? formatDuration(flight.duration) : "Unknown";
  const price = flight.totalAmount || 0;
  const currency = flight.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-shadow duration-200 hover:shadow-md overflow-hidden flex flex-col">
      {/* Content Area */}
      <div className="flex flex-col">
        {/* Top Row: Badges on left, Flight Info on right */}
        <div className="mb-3 flex items-start justify-between gap-2">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 flex-1">
            {badgeConfigs.length > 0 && badgeConfigs.map((badgeConfig, index) => (
              <div
                key={index}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium bg-white text-gray-800 border-gray-200",
                )}
              >
                <span className="text-sm">{badgeConfig.emoji}</span>
                <span className="truncate">{badgeConfig.text}</span>
              </div>
            ))}
          </div>

          {/* Airline and Flight Number - Top Right */}
          <div className="flex flex-col items-end text-right min-w-0 flex-shrink-0">
            {(getAirlineNameFromFlightOption(flight) || getAirlineIataFromFlightOption(flight)) && (
              <div className="flex items-center gap-2">
                {/* Airline Logo */}
                <AirlineLogo
                  airlineIata={getAirlineIataFromFlightOption(flight)}
                  airlineName={getAirlineNameFromFlightOption(flight) || getAirlineIataFromFlightOption(flight)}
                  size="md"
                />
                <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                  {getAirlineNameFromFlightOption(flight) || getAirlineIataFromFlightOption(flight)}
                </span>
              </div>
            )}
            {/* Flight numbers - only show if available */}
            {getFlightNumberFromFlightOption(flight) && (
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {getFlightNumberFromFlightOption(flight)}
              </div>
            )}
          </div>
        </div>

        {/* Journey Display for Round Trip or Journey-based flights */}
        {isJourneyBased ? (
          <div className="mb-4">
            {flight.journey!.map((journey, index) => (
              <JourneyDisplay
                key={`journey-${index}`}
                journey={journey}
                journeyIndex={index}
                totalJourneys={flight.journey!.length}
              />
            ))}
          </div>
        ) : (
          /* Legacy Flight Route Display */
          <div className="mb-3 flex items-center justify-between overflow-hidden">
            <div className="text-left flex-1 min-w-0 max-w-[30%]">
              <div className="font-bold text-gray-900 truncate" style={{ fontSize: '14px' }}>
                {formatTime(departureInfo.date)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">{departureInfo.airportIata}</div>
            </div>

            <div className="mx-1 sm:mx-2 flex-1 text-center min-w-0 max-w-[40%]">
              <div className="mb-1 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-black flex-shrink-0" />
                <span className="text-xs text-black truncate">{duration}</span>
              </div>
              <div className="relative border-t border-black mx-2">
                {/* Stop dots based on number of stops */}
                {(() => {
                  // Handle journey-based flights
                  if (flight.journey && flight.journey.length > 0) {
                    const totalSegments = flight.journey.reduce((total, j) => total + (j.segments?.length || 0), 0);
                    if (totalSegments === 2) {
                      return <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>;
                    } else if (totalSegments === 3) {
                      return (
                        <>
                          <div className="absolute -top-1 left-1/3 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                          <div className="absolute -top-1 left-2/3 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                        </>
                      );
                    } else if (totalSegments > 3) {
                      return (
                        <>
                          <div className="absolute -top-1 left-1/4 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                          <div className="absolute -top-1 left-3/4 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                        </>
                      );
                    }
                    return null;
                  }
                  // Handle legacy flights
                  if (flight.segments && flight.segments.length > 0) {
                    if (flight.segments.length === 2) {
                      return <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>;
                    } else if (flight.segments.length === 3) {
                      return (
                        <>
                          <div className="absolute -top-1 left-1/3 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                          <div className="absolute -top-1 left-2/3 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                        </>
                      );
                    } else if (flight.segments.length > 3) {
                      return (
                        <>
                          <div className="absolute -top-1 left-1/4 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                          <div className="absolute -top-1 left-3/4 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                        </>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              <div className="mt-1 text-xs text-gray-700 truncate">
                {(() => {
                  // Handle journey-based flights
                  if (flight.journey && flight.journey.length > 0) {
                    const totalSegments = flight.journey.reduce((total, j) => total + (j.segments?.length || 0), 0);
                    return totalSegments === 1 ? "Non-stop" : `${totalSegments - 1} stop${totalSegments - 1 > 1 ? "s" : ""}`;
                  }
                  // Handle legacy flights
                  if (flight.segments && flight.segments.length > 0) {
                    return flight.segments.length === 1
                      ? "Non-stop"
                      : `${flight.segments.length - 1} stop${flight.segments.length - 1 > 1 ? "s" : ""}`;
                  }
                  // Fallback
                  return "Non-stop";
                })()}
              </div>
            </div>

            <div className="text-right flex-1 min-w-0 max-w-[30%]">
              <div className="font-bold text-gray-900 truncate" style={{ fontSize: '14px' }}>
                {formatTime(arrivalInfo.date)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 truncate">{arrivalInfo.airportIata}</div>
            </div>
          </div>
        )}

        {/* Baggage Information - only show for legacy format or if baggage data is available */}
        {(!isJourneyBased || flight.baggage) && <BaggageDisplay flight={flight} />}

      {/* Flight Highlights with Clean Black Border - Commented out for now, can be easily restored */}
      {/*
      {(() => {
        const highlights = getFlightHighlights(flight);
        return highlights.length > 0 && (
          <div className="mb-4">
            <div className="rounded-lg border-2 border-black bg-white p-3">
              <ul className="space-y-1">
                {highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-black font-medium"
                  >
                    <span className="mt-1 text-black">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}
      */}
      </div>

      {/* Minimal spacer for button alignment */}
      <div className="flex-grow min-h-[8px]"></div>

      {/* Select Button with Price - Pinned to bottom */}
      <Button
        onClick={() => onSelect(flight.flightOfferId)}
        disabled={isLoading}
        className="w-full bg-black text-white border border-black py-3 transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="font-normal">{isLoading ? "Selecting..." : "Select Flight"}</span>
          <span className="font-bold">{currencySymbol}{price.toLocaleString()}</span>
        </span>
      </Button>
    </div>
  );
};

// Loading/Empty Flight Card Component
const EmptyFlightCard = ({ isLoading = true }: { isLoading?: boolean }) => {
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm overflow-hidden flex flex-col">
      {isLoading ? (
        <>
          {/* Content Area - Flexible */}
          <div className="flex-grow flex flex-col">
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
          </div>

          {/* Loading Button - Pinned to bottom */}
          <Skeleton className="h-12 w-full rounded" />
        </>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center py-8 text-center">
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
  onSelect: (flightOfferId: string) => void;
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
              key={flight.flightOfferId || `flight-${index}`}
              className="flex-shrink-0"
              style={{
                width: `${Math.max(cardWidth, 20)}%`, // Ensure minimum width and use percentage
                scrollSnapAlign: 'start',
                minWidth: '280px', // Minimum card width for readability
                maxWidth: cardsPerView === 1 ? '100%' : `${cardWidth}%`,
                minHeight: '420px', // Ensure consistent card height
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

// Direct Flight Display Component - Shows exactly 3 distinct flights
const DirectFlightDisplay = ({
  flights,
  onSelect,
  isLoading,
}: {
  flights: FlightOption[];
  onSelect: (flightOfferId: string) => void;
  isLoading: boolean;
}) => {
  // Helper function to get flights sorted by different criteria
  const getSortedFlights = (flights: FlightOption[], sortBy: 'price' | 'duration' | 'ranking') => {
    const flightsCopy = [...flights];

    switch (sortBy) {
      case 'price':
        return flightsCopy.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
      case 'duration':
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
      case 'ranking':
        return flightsCopy.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
      default:
        return flightsCopy;
    }
  };

  // Get the three distinct flights to display
  const getThreeDistinctFlights = () => {
    if (flights.length === 0) return [];

    const selectedFlights: FlightOption[] = [];
    const usedFlightIds = new Set<string>();

    // 1. First priority: Best flight (highest ranking or recommended)
    const recommendedFlight = flights.find(flight => flight.tags?.includes('recommended'));
    const bestFlight = recommendedFlight || getSortedFlights(flights, 'ranking')[0];

    if (bestFlight) {
      // Ensure this flight has the "recommended" tag for display
      const flightWithBestTag = {
        ...bestFlight,
        tags: [...(bestFlight.tags || []), 'recommended'].filter((tag, index, arr) => arr.indexOf(tag) === index)
      };
      selectedFlights.push(flightWithBestTag);
      usedFlightIds.add(bestFlight.flightOfferId);
    }

    // 2. Second priority: Cheapest flight (not already selected)
    const cheapestFlights = getSortedFlights(flights, 'price');
    const cheapestFlight = cheapestFlights.find(flight => !usedFlightIds.has(flight.flightOfferId));

    if (cheapestFlight) {
      // Ensure this flight has the "cheapest" tag for display
      const flightWithCheapestTag = {
        ...cheapestFlight,
        tags: [...(cheapestFlight.tags || []), 'cheapest'].filter((tag, index, arr) => arr.indexOf(tag) === index)
      };
      selectedFlights.push(flightWithCheapestTag);
      usedFlightIds.add(cheapestFlight.flightOfferId);
    }

    // 3. Third priority: Fastest flight (not already selected)
    const fastestFlights = getSortedFlights(flights, 'duration');
    const fastestFlight = fastestFlights.find(flight => !usedFlightIds.has(flight.flightOfferId));

    if (fastestFlight) {
      // Ensure this flight has the "fastest" tag for display
      const flightWithFastestTag = {
        ...fastestFlight,
        tags: [...(fastestFlight.tags || []), 'fastest'].filter((tag, index, arr) => arr.indexOf(tag) === index)
      };
      selectedFlights.push(flightWithFastestTag);
      usedFlightIds.add(fastestFlight.flightOfferId);
    }

    // If we still don't have 3 flights, add more from the remaining flights
    if (selectedFlights.length < 3) {
      const remainingFlights = flights.filter(flight => !usedFlightIds.has(flight.flightOfferId));
      const additionalFlights = remainingFlights.slice(0, 3 - selectedFlights.length);
      selectedFlights.push(...additionalFlights);
    }

    return selectedFlights;
  };

  const flightsToShow = getThreeDistinctFlights();

  console.log("DirectFlightDisplay - Flights to show:", flightsToShow.length);

  // Always use ResponsiveCarousel for consistent display
  return (
    <ResponsiveCarousel
      flights={flightsToShow}
      onSelect={onSelect}
      isLoading={isLoading}
    />
  );
};

// Flight List Item Component for Bottom Sheet
const FlightListItem = ({
  flight,
  onSelect,
  isLoading,
}: {
  flight: FlightOption;
  onSelect: (flightOfferId: string) => void;
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
    // For journey-based flights, get info from first journey
    if (flight.journey && flight.journey.length > 0 && flight.journey[0].segments.length > 0) {
      const segment = flight.journey[0].segments[0];
      const airlineName = segment.airlineName || segment.airlineIata || "";
      const airlineIata = segment.airlineIata || "";
      const airline = airlineName.length > 10 ? airlineName.substring(0, 10) + "..." : airlineName;

      const flightNumbers = flight.journey.flatMap(j => j.segments.map(s => s.flightNumber)).filter(fn => fn).join(", ");

      return {
        airline,
        airlineIata,
        flightNumber: flightNumbers,
        isMultiFlight: flight.journey.length > 1
      };
    }

    // For legacy flights
    if (flight.segments && flight.segments.length > 0) {
      const airlineName = flight.segments[0].airlineName || flight.segments[0].airlineIata || "";
      const airlineIata = flight.segments[0].airlineIata || "";
      const airline = airlineName.length > 10 ? airlineName.substring(0, 10) + "..." : airlineName;

      const flightNumbers = flight.segments.map(s => s.flightNumber).filter(fn => fn).join(", ");

      return {
        airline,
        airlineIata,
        flightNumber: flightNumbers,
        isMultiFlight: flight.segments.length > 1
      };
    }

    return { airline: "", airlineIata: "", flightNumber: "", isMultiFlight: false };
  };

  // Handle both legacy and journey-based flights
  const isJourneyBased = flight.journey && flight.journey.length > 0;
  const departureInfo = isJourneyBased ? flight.journey![0].departure : flight.departure;
  const arrivalInfo = isJourneyBased ? flight.journey![flight.journey!.length - 1].arrival : flight.arrival;
  const duration = flight.duration ? formatDuration(flight.duration) : "";
  const price = flight.totalAmount || 0;
  const currency = flight.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);
  const { airline, airlineIata, flightNumber } = getAirlineInfo(flight);

  return (
    <div
      className="border-b border-gray-200 bg-white py-3 px-3 sm:px-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      onClick={() => onSelect(flight.flightOfferId)}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        {/* Main Flight Row */}
        <div className="flex items-center justify-between">
          {/* Left: Airline Info */}
          <div className="flex items-center gap-3">
            {/* Airline Logo - only show if we have airline data */}
            {(airline || airlineIata) && (
              <div className="flex-shrink-0">
                <AirlineLogo
                  airlineIata={airlineIata}
                  airlineName={airline || airlineIata}
                  size="md"
                />
              </div>
            )}

            {/* Airline Details */}
            <div className="min-w-0">
              {(airline || airlineIata) && (
                <div className="text-xs font-medium text-gray-900 truncate">
                  {(airline || airlineIata).length > 12 ? (airline || airlineIata).substring(0, 12) + '...' : (airline || airlineIata)}
                </div>
              )}
              {flightNumber && (
                <div className="text-xs text-gray-500 truncate">
                  {flightNumber}
                </div>
              )}
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
                {(() => {
                  // Handle journey-based flights
                  if (flight.journey && flight.journey.length > 0) {
                    const totalSegments = flight.journey.reduce((total, j) => total + (j.segments?.length || 0), 0);
                    return totalSegments === 1 ? "Non-stop" : `${totalSegments - 1} stop${totalSegments - 1 > 1 ? "s" : ""}`;
                  }
                  // Handle legacy flights
                  if (flight.segments && flight.segments.length > 0) {
                    return flight.segments.length === 1
                      ? "Non-stop"
                      : `${flight.segments.length - 1} stop${flight.segments.length - 1 > 1 ? "s" : ""}`;
                  }
                  // Fallback
                  return "Non-stop";
                })()}
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
          {(airline || airlineIata) && (
            <div className="flex items-center gap-2">
              {/* Airline Logo */}
              <AirlineLogo
                airlineIata={airlineIata}
                airlineName={airline || airlineIata}
                size="sm"
              />
              <span className="font-medium text-gray-900 text-sm truncate">{airline || airlineIata}</span>
            </div>
          )}
          {flightNumber && (
            <div className="text-xs text-gray-500 truncate">
              {flightNumber}
            </div>
          )}
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
            {(() => {
              // Handle journey-based flights
              if (flight.journey && flight.journey.length > 0) {
                const totalSegments = flight.journey.reduce((total, j) => total + (j.segments?.length || 0), 0);
                return totalSegments > 1 ? (
                  <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-300"></div>
                ) : null;
              }
              // Handle legacy flights
              if (flight.segments && flight.segments.length > 1) {
                return <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-300"></div>;
              }
              return null;
            })()}
          </div>
          <div className="text-xs text-gray-500">
            {(() => {
              // Handle journey-based flights
              if (flight.journey && flight.journey.length > 0) {
                const totalSegments = flight.journey.reduce((total, j) => total + (j.segments?.length || 0), 0);
                return totalSegments === 1 ? "Non-stop" : `${totalSegments - 1} stop${totalSegments - 1 > 1 ? "s" : ""}`;
              }
              // Handle legacy flights
              if (flight.segments && flight.segments.length > 0) {
                return flight.segments.length === 1
                  ? "Non-stop"
                  : `${flight.segments.length - 1} stop${flight.segments.length - 1 > 1 ? "s" : ""}`;
              }
              // Fallback
              return "Non-stop";
            })()}
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
  onSelect: (flightOfferId: string) => void;
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

  // Determine if we have journey-based flights and the journey type
  const hasJourneyBasedFlights = allFlightTuples.some((flight: any) => flight.journey && flight.journey.length > 0);
  const isRoundTrip = hasJourneyBasedFlights && allFlightTuples.some((flight: any) => flight.journey && flight.journey.length === 2);
  const journeyType = isRoundTrip ? "Round Trip" : hasJourneyBasedFlights ? "One-way" : "Available";

  // Debug: Log flight tags
  if (allFlightTuples.length > 0) {
    console.log("Sample flight tags:", allFlightTuples[0]?.tags);
    console.log("All flight tags:", allFlightTuples.map((f: any) => ({ id: f.flightOfferId, tags: f.tags })));
  }

  const handleSelectFlight = async (flightOfferId: string) => {
    setSelectedFlight(flightOfferId);
    setIsLoading(true);

    const responseData = {
      selectedFlightId: flightOfferId,
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
        className="mx-auto mt-4 w-full max-w-full rounded-2xl border border-gray-300 bg-white p-3 sm:mt-8 sm:p-6 overflow-hidden flight-carousel-container"
        style={{
          fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
          maxWidth: "min(100vw - 2rem, 1536px)" // Ensure it never exceeds viewport width minus padding
        }}
      >
        <div className="mb-4 sm:mb-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
            {journeyType} Flights
          </h2>
          <p className="text-sm text-gray-600">
            {isRoundTrip
              ? "Choose your complete round trip journey"
              : "Choose from the best options"
            }
          </p>
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
              className="border-black text-black px-8 py-2 transition-colors duration-200 hover:bg-black hover:text-white"
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
              {(() => {
                const selectedFlightData = allFlightTuples.find((f: any) => f.flightOfferId === selectedFlight);
                if (!selectedFlightData) return "Unknown";

                // Try to get flight number from segments
                if (selectedFlightData.segments?.[0]?.flightNumber) {
                  return selectedFlightData.segments[0].flightNumber;
                }

                // Try to get flight number from journey
                if (selectedFlightData.journey?.[0]?.segments?.[0]?.flightNumber) {
                  return selectedFlightData.journey[0].segments[0].flightNumber;
                }

                return "Unknown";
              })()}{" "}
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
                  key={flight.flightOfferId || `flight-${index}`}
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
