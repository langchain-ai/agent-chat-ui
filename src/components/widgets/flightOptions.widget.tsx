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
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { trackFlightResults, trackFlightSelected, type FlightResultsAnalytics, type FlightSelectedAnalytics } from "@/services/analyticsService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useTabContext } from "@/providers/TabContext";

interface FlightOption {
  flightOfferId: string;
  totalEmission: number;
  totalEmissionUnit: string;
  currency: string;
  totalAmount: number;
  duration?: string;
  // Legacy fields (optional for backward compatibility)
  departure?: FlightEndpoint;
  arrival?: FlightEndpoint;
  segments?: FlightSegment[];
  offerRules?: FlightOfferRules;
  rankingScore?: number;
  pros?: string[];
  cons?: string[];
  reason?: string; // New field to control reason box display
  tags?: string[];
  // New fields for journey-based structure
  journey?: FlightJourney[]; // New field for journey array
  baggage?: BaggageInfo; // New field for baggage data from API
  // Additional fields from new structure
  tax?: number;
  baseAmount?: number;
  serviceFee?: number;
  convenienceFee?: number;
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
  reason?: string; // New field to control reason box display
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
  isRefundable: boolean;
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
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    CNY: "¥",
    SEK: "kr",
    NOK: "kr",
    MXN: "$",
    NZD: "NZ$",
    SGD: "S$",
    HKD: "HK$",
    ZAR: "R",
    THB: "฿",
    AED: "د.إ",
    SAR: "﷼",
    KRW: "₩",
    BRL: "R$",
    RUB: "₽",
    TRY: "₺",
    PLN: "zł",
    CZK: "Kč",
    HUF: "Ft",
    ILS: "₪",
    CLP: "$",
    COP: "$",
    PEN: "S/",
    ARS: "$",
    UYU: "$U",
    BOB: "Bs",
    PYG: "₲",
    VES: "Bs.S",
    DKK: "kr",
    ISK: "kr",
    RON: "lei",
    BGN: "лв",
    HRK: "kn",
    RSD: "дин",
    UAH: "₴",
    BYN: "Br",
    MDL: "L",
    GEL: "₾",
    AMD: "֏",
    AZN: "₼",
    KZT: "₸",
    UZS: "soʻm",
    KGS: "с",
    TJS: "ЅМ",
    TMT: "T",
    MNT: "₮",
    LAK: "₭",
    KHR: "៛",
    MMK: "K",
    VND: "₫",
    IDR: "Rp",
    MYR: "RM",
    PHP: "₱",
    TWD: "NT$",
    PKR: "₨",
    LKR: "₨",
    BDT: "৳",
    NPR: "₨",
    BTN: "Nu.",
    MVR: ".ރ",
    AFN: "؋",
    IRR: "﷼",
    IQD: "ع.د",
    JOD: "د.ا",
    KWD: "د.ك",
    LBP: "ل.ل",
    OMR: "ر.ع.",
    QAR: "ر.ق",
    SYP: "£",
    YER: "﷼",
    BHD: ".د.ب",
    EGP: "£",
    LYD: "ل.د",
    MAD: "د.م.",
    TND: "د.ت",
    DZD: "د.ج",
    AOA: "Kz",
    BWP: "P",
    BIF: "Fr",
    XOF: "Fr",
    XAF: "Fr",
    KMF: "Fr",
    DJF: "Fr",
    ERN: "Nfk",
    ETB: "Br",
    GMD: "D",
    GHS: "₵",
    GNF: "Fr",
    KES: "Sh",
    LSL: "L",
    LRD: "$",
    MGA: "Ar",
    MWK: "MK",
    MUR: "₨",
    MZN: "MT",
    NAD: "$",
    NGN: "₦",
    RWF: "Fr",
    SCR: "₨",
    SLL: "Le",
    SOS: "Sh",
    STN: "Db",
    SZL: "L",
    TZS: "Sh",
    UGX: "Sh",
    XPF: "Fr",
    ZMW: "ZK",
    ZWL: "$",
  };

  return currencyMap[currencyCode.toUpperCase()] || currencyCode;
};

// Unified duration formatting function
const formatDuration = (duration: string): string => {
  if (!duration) return "";

  // Handle ISO 8601 duration format (PT3H45M)
  const match = duration.match(/PT(\d+)H(\d+)?M?/);
  if (match) {
    const hours = match[1];
    const minutes = match[2] || "0";
    return minutes === "0" ? `${hours}h` : `${hours}h ${minutes}m`;
  }

  // Handle other duration formats if needed
  return duration;
};

// Helper function to get total duration for a flight (handles both legacy and journey-based structures)
const getFlightDuration = (flight: FlightOption): string => {
  // For journey-based flights, calculate total duration from all journeys
  if (flight.journey && flight.journey.length > 0) {
    // If there's a single journey, use its duration
    if (flight.journey.length === 1) {
      return formatDuration(flight.journey[0].duration || "");
    }

    // For multiple journeys (round trips), calculate total duration
    let totalMinutes = 0;
    for (const journey of flight.journey) {
      if (journey.duration) {
        const match = journey.duration.match(/PT(\d+)H(\d+)?M?/);
        if (match) {
          const hours = parseInt(match[1]) || 0;
          const minutes = parseInt(match[2]) || 0;
          totalMinutes += hours * 60 + minutes;
        }
      }
    }

    if (totalMinutes > 0) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  // For legacy flights, use the duration field directly
  if (flight.duration) {
    return formatDuration(flight.duration);
  }

  return "";
};

// Helper function to get airline logo path
const getAirlineLogoPath = (airlineIata: string): string => {
  if (!airlineIata) return "";
  // The airlines folder is in the root directory, so we need to go up from src
  return `/airlines/${airlineIata.toUpperCase()}.png`;
};

// Case-insensitive tag checker
const hasTag = (
  tags: string[] | undefined,
  tag: "best" | "cheapest" | "fastest",
): boolean => {
  return (tags ?? []).some((t) => t.toLowerCase() === tag);
};

// Airline Logo Component
const AirlineLogo = ({
  airlineIata,
  airlineName,
  size = "md",
}: {
  airlineIata: string;
  airlineName: string;
  size?: "sm" | "md" | "lg";
}) => {
  const logoPath = getAirlineLogoPath(airlineIata);

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-5 h-5", fallback: "w-3 h-3" },
    md: { container: "w-6 h-6", fallback: "w-4 h-4" },
    lg: { container: "w-8 h-8", fallback: "w-6 h-6" },
  };

  const { container, fallback } = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200",
        container,
      )}
    >
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${airlineName} logo`}
          width={size === "sm" ? 20 : size === "md" ? 24 : 32}
          height={size === "sm" ? 20 : size === "md" ? 24 : 32}
          className="airline-logo rounded-full object-contain"
          onError={(e) => {
            // Fallback to gray circle if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="${cn("rounded-full bg-gray-400", fallback)}"></div>`;
            }
          }}
        />
      ) : (
        <div className={cn("rounded-full bg-gray-400", fallback)}></div>
      )}
    </div>
  );
};

const getBadgeConfigs = (tags: string[] = []) => {
  // Show all present tags on the same card, ordered: best, cheapest, fastest
  const present = new Set(tags.map((t) => t.toLowerCase()));
  const badges: { emoji: string; text: string; color: string }[] = [];
  if (present.has("best")) {
    badges.push({
      emoji: "⭐",
      text: "Best",
      color: "bg-black text-white border-black",
    });
  }
  if (present.has("cheapest")) {
    badges.push({
      emoji: "💰",
      text: "Cheapest",
      color: "bg-black text-white border-black",
    });
  }
  if (present.has("fastest")) {
    badges.push({
      emoji: "⚡",
      text: "Fastest",
      color: "bg-black text-white border-black",
    });
  }
  return badges;
};

// Get baggage data from API or fallback to mock data
const getBaggageInfo = (flight: FlightOption): BaggageInfo => {
  // Use API baggage data if available
  if (flight.baggage) {
    return flight.baggage;
  }

  // Fallback to mock data for backward compatibility
  const isLowCost = hasTag(flight.tags, "cheapest");
  const isPremium = hasTag(flight.tags, "best");

  // Mock scenarios
  const scenarios = [
    // Scenario 1: Full service airline
    {
      checkedBaggage: { included: true, weight: "23kg", pieces: 1 },
      carryOnBaggage: {
        included: true,
        weight: "7kg",
        dimensions: "55x40x20cm",
      },
    },
    // Scenario 2: Low cost carrier
    {
      checkedBaggage: { included: false },
      carryOnBaggage: {
        included: true,
        weight: "7kg",
        dimensions: "55x40x20cm",
      },
    },
    // Scenario 3: Premium service
    {
      checkedBaggage: { included: true, weight: "32kg", pieces: 2 },
      carryOnBaggage: {
        included: true,
        weight: "10kg",
        dimensions: "55x40x20cm",
      },
    },
    // Scenario 4: Basic service
    {
      checkedBaggage: { included: true, weight: "20kg", pieces: 1 },
      carryOnBaggage: {
        included: true,
        weight: "7kg",
        dimensions: "55x40x20cm",
      },
    },
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
  const formatBaggageWeight = (
    weight: number | string | undefined,
    unit?: string,
  ) => {
    if (typeof weight === "number") {
      return `${weight}${unit || "kg"}`;
    }
    return weight || "";
  };

  // Get check-in baggage info (prioritize API data)
  const getCheckInBaggageInfo = () => {
    if (baggageInfo.check_in_baggage) {
      return {
        hasData: true,
        weight: formatBaggageWeight(
          baggageInfo.check_in_baggage.weight,
          baggageInfo.check_in_baggage.weightUnit?.toLowerCase(),
        ),
      };
    }
    if (baggageInfo.checkedBaggage?.included) {
      return {
        hasData: true,
        weight:
          baggageInfo.checkedBaggage.weight +
          (baggageInfo.checkedBaggage.pieces &&
          baggageInfo.checkedBaggage.pieces > 1
            ? ` (${baggageInfo.checkedBaggage.pieces} pcs)`
            : ""),
      };
    }
    return { hasData: false, weight: "" };
  };

  // Get cabin baggage info (prioritize API data)
  const getCabinBaggageInfo = () => {
    if (baggageInfo.cabin_baggage) {
      return {
        hasData: true,
        weight: formatBaggageWeight(
          baggageInfo.cabin_baggage.weight,
          baggageInfo.cabin_baggage.weightUnit?.toLowerCase(),
        ),
      };
    }
    if (baggageInfo.carryOnBaggage?.included) {
      return {
        hasData: true,
        weight: baggageInfo.carryOnBaggage.weight || "",
      };
    }
    return { hasData: false, weight: "" };
  };

  const checkInInfo = getCheckInBaggageInfo();
  const cabinInfo = getCabinBaggageInfo();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2",
        flight.reason ? "mb-4" : "mb-2",
      )}
    >
      {/* Checked Baggage */}
      <div className="flex flex-1 items-center gap-2">
        <Luggage className="h-4 w-4 flex-shrink-0 text-black" />
        <div className="min-w-0">
          <div className="text-xs font-normal text-black">Check-in</div>
          {checkInInfo.hasData ? (
            <div className="text-xs text-gray-700">{checkInInfo.weight}</div>
          ) : (
            <div className="flex items-center justify-center">
              <X className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-gray-400"></div>

      {/* Carry-on Baggage */}
      <div className="flex flex-1 items-center gap-2">
        <Briefcase className="h-4 w-4 flex-shrink-0 text-black" />
        <div className="min-w-0">
          <div className="text-xs font-normal text-black">Carry-on</div>
          {cabinInfo.hasData ? (
            <div className="text-xs text-gray-700">{cabinInfo.weight}</div>
          ) : (
            <div className="flex items-center justify-center">
              <X className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Journey Display Component for Round Trip flights
const JourneyDisplay = ({
  journey,
  journeyIndex,
  totalJourneys,
}: {
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
        flightNumber: journey.segments
          .map((s) => s.flightNumber)
          .filter((fn) => fn && fn.trim() !== "")
          .join(", "),
      };
    }
    return { airlineIata: "", airlineName: "", flightNumber: "" };
  };

  const { airlineIata, airlineName, flightNumber } = getAirlineInfo(journey);
  const duration = formatDuration(journey.duration || "");

  return (
    <div className="mb-3 rounded-lg border border-gray-300 bg-gray-50 p-3">
      {/* Journey Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-black px-2 py-1 text-xs font-medium text-white">
            {getJourneyLabel(journeyIndex, totalJourneys)}
          </span>
          <span className="text-xs text-gray-700">
            {formatDate(journey.departure.date)}
          </span>
        </div>
        {journey.offerRules?.isRefundable && (
          <span className="text-xs font-medium text-black">Refundable</span>
        )}
      </div>

      {/* Flight Route */}
      <div className="flex items-center justify-between">
        {/* Departure */}
        <div className="min-w-0 flex-1 text-left">
          <div className="text-sm font-bold text-black">
            {formatTime(journey.departure.date)}
          </div>
          <div
            className="text-xs text-gray-700"
            style={{ fontSize: "12px" }}
          >
            {journey.departure.airportIata}
          </div>
        </div>

        {/* Duration and Stops */}
        <div className="mx-2 min-w-0 flex-1 text-center">
          <div className="mb-1 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span
              className="text-xs text-gray-500"
              style={{ fontSize: "11px" }}
            >
              {duration}
            </span>
          </div>
          <div
            className="relative mx-2 border-t border-gray-300"
            style={{ borderWidth: "0.5px" }}
          >
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
          <div
            className="mt-1 text-xs text-gray-500"
            style={{ fontSize: "10px" }}
          >
            {journey.segments && journey.segments.length === 1
              ? "Non-stop"
              : journey.segments
                ? `${journey.segments.length - 1} stop${journey.segments.length - 1 > 1 ? "s" : ""}`
                : "Non-stop"}
          </div>
        </div>

        {/* Arrival */}
        <div className="min-w-0 flex-1 text-right">
          <div className="text-sm font-bold text-black">
            {formatTime(journey.arrival.date)}
          </div>
          <div
            className="text-xs text-gray-700"
            style={{ fontSize: "12px" }}
          >
            {journey.arrival.airportIata}
          </div>
        </div>
      </div>

      {/* Airline Info - only show if we have airline data */}
      {(airlineName || airlineIata || flightNumber) && (
        <div className="mt-2 flex items-center gap-2 border-t border-gray-300 pt-2">
          {(airlineName || airlineIata) && (
            <>
              <AirlineLogo
                airlineIata={airlineIata}
                airlineName={airlineName || airlineIata}
                size="sm"
              />
              <span className="text-xs text-black">
                {airlineName || airlineIata}
              </span>
            </>
          )}
          {flightNumber && (
            <>
              {(airlineName || airlineIata) && (
                <span className="text-xs text-gray-700">•</span>
              )}
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
  readOnly = false,
  selectedFlightId,
}: {
  flight: FlightOption;
  onSelect: (flightOfferId: string) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  selectedFlightId?: string | null;
}) => {
  const badgeConfigs =
    flight.tags && flight.tags.length > 0 ? getBadgeConfigs(flight.tags) : [];

  // Generate personalized flight highlights (consistent with widgets page)
  const getFlightHighlights = (flight: FlightOption) => {
    const highlights = [];

    // Add tag-based highlights
    if (hasTag(flight.tags, "best")) {
      highlights.push("Your usual flight, travelled 12 times");
    }
    if (hasTag(flight.tags, "cheapest")) {
      highlights.push("Cheapest option with short layover");
    }
    if (hasTag(flight.tags, "fastest")) {
      highlights.push("Fastest route to your destination");
    }

    // Add flight-specific highlights based on segments (works for both journey and legacy data)
    const totalSegments = flight.journey
      ? flight.journey.reduce(
          (total, j) => total + (j.segments?.length || 0),
          0,
        )
      : flight.segments?.length || 0;

    if (totalSegments === 1) {
      highlights.push("Direct flight - no hassle with connections");
    } else if (totalSegments === 2) {
      highlights.push("Single layover - good balance of time and price");
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

  //Todo: @Khalid, this is very critical and hacky, please verify the actual flight timings with what we are showing.
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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
    if (
      flight.journey &&
      flight.journey.length > 0 &&
      flight.journey[0].segments.length > 0
    ) {
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
    if (
      flight.journey &&
      flight.journey.length > 0 &&
      flight.journey[0].segments.length > 0
    ) {
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
        .map((segment) => segment.flightNumber)
        .filter((num) => num && num.trim() !== "")
        .join(", ");
      return flightNumbers || "";
    }
    // For journey-based flights, get flight numbers from all journeys
    if (flight.journey && flight.journey.length > 0) {
      const allFlightNumbers = flight.journey
        .flatMap((journey) =>
          journey.segments.map((segment) => segment.flightNumber),
        )
        .filter((num) => num && num.trim() !== "")
        .join(", ");
      return allFlightNumbers || "";
    }
    return "";
  };

  // Check if this is journey-based data for departure/arrival info extraction
  const isJourneyBased = flight.journey && flight.journey.length > 0;

  // Use journey data if available, otherwise fall back to legacy format
  const departureInfo = isJourneyBased
    ? flight.journey![0]?.departure
    : flight.departure;
  const arrivalInfo = isJourneyBased
    ? flight.journey![flight.journey!.length - 1]?.arrival
    : flight.arrival;

  // Safety check - if we don't have departure/arrival info, skip rendering this flight
  if (!departureInfo || !arrivalInfo) {
    console.warn(
      "FlightCard: Missing departure or arrival info for flight:",
      flight.flightOfferId,
    );
    return null;
  }
  const duration = getFlightDuration(flight);
  const price = flight.totalAmount || 0;
  const currency = flight.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md",
        flight.reason ? "h-full p-3 sm:p-4" : "p-3 sm:p-4",
      )}
    >
      {/* Content Area */}
      <div className="flex flex-col overflow-visible">
        {/* Top Row: Badges on left, Flight Info on right */}
        <div
          className={cn(
            "flex items-start justify-between gap-2",
            flight.reason ? "mb-3" : "mb-2",
          )}
        >
          {/* Badges */}
          <div className="flex flex-1 flex-wrap gap-2">
            {badgeConfigs.length > 0 &&
              badgeConfigs.map((badgeConfig, index) => (
                <div
                  key={index}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-800",
                  )}
                >
                  <span className="text-sm">{badgeConfig.emoji}</span>
                  <span className="truncate">{badgeConfig.text}</span>
                </div>
              ))}
          </div>

          {/* Airline and Flight Number - Top Right */}
          <div className="flex min-w-0 flex-shrink-0 flex-col items-end text-right">
            {(getAirlineNameFromFlightOption(flight) ||
              getAirlineIataFromFlightOption(flight)) && (
              <div className="flex items-center gap-2">
                {/* Airline Logo */}
                <AirlineLogo
                  airlineIata={getAirlineIataFromFlightOption(flight)}
                  airlineName={
                    getAirlineNameFromFlightOption(flight) ||
                    getAirlineIataFromFlightOption(flight)
                  }
                  size="md"
                />
                <span className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                  {getAirlineNameFromFlightOption(flight) ||
                    getAirlineIataFromFlightOption(flight)}
                </span>
              </div>
            )}
            {/* Flight numbers - only show if available */}
            {getFlightNumberFromFlightOption(flight) && (
              <div className="mt-0.5 truncate text-xs text-gray-500">
                {getFlightNumberFromFlightOption(flight)}
              </div>
            )}
          </div>
        </div>

        {/* Always use Legacy Flight Route Display for consistent design */}
        <div
          className={cn(
            "flex items-center justify-between overflow-hidden",
            flight.reason ? "mb-3" : "mb-2",
          )}
        >
          <div className="max-w-[30%] min-w-0 flex-1 text-left">
            <div
              className="truncate font-bold text-gray-900"
              style={{ fontSize: "14px" }}
            >
              {formatTime(departureInfo.date)}
            </div>
            <div
              className="truncate text-xs text-gray-600"
              style={{ fontSize: "12px" }}
            >
              {departureInfo.airportIata}
            </div>
          </div>

          <div className="mx-1 max-w-[40%] min-w-0 flex-1 text-center sm:mx-2">
            {duration && (
              <div className="mb-1 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0 text-gray-400" />
                <span
                  className="truncate text-xs text-gray-500"
                  style={{ fontSize: "11px" }}
                >
                  {duration}
                </span>
              </div>
            )}
            <div
              className="relative mx-2 border-t border-gray-300"
              style={{ borderWidth: "0.5px" }}
            >
              {/* Stop dots based on number of stops */}
              {(() => {
                // Handle journey-based flights
                if (flight.journey && flight.journey.length > 0) {
                  const totalSegments = flight.journey.reduce(
                    (total, j) => total + (j.segments?.length || 0),
                    0,
                  );
                  if (totalSegments === 2) {
                    return (
                      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                    );
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
                    return (
                      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-gray-600"></div>
                    );
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
            <div
              className="mt-1 truncate text-xs text-gray-500"
              style={{ fontSize: "10px" }}
            >
              {(() => {
                // Handle journey-based flights
                if (flight.journey && flight.journey.length > 0) {
                  const totalSegments = flight.journey.reduce(
                    (total, j) => total + (j.segments?.length || 0),
                    0,
                  );
                  return totalSegments === 1
                    ? "Non-stop"
                    : `${totalSegments - 1} stop${totalSegments - 1 > 1 ? "s" : ""}`;
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

          <div className="max-w-[30%] min-w-0 flex-1 text-right">
            <div
              className="truncate font-bold text-gray-900"
              style={{ fontSize: "14px" }}
            >
              {formatTime(arrivalInfo.date)}
            </div>
            <div
              className="truncate text-xs text-gray-600"
              style={{ fontSize: "12px" }}
            >
              {arrivalInfo.airportIata}
            </div>
          </div>
        </div>

        {/* Baggage Information - always show to match widgets page design */}
        <BaggageDisplay flight={flight} />

        {/* Flight Highlights with Gradient Border - Only show if reason key exists */}
        {(() => {
          // Only show the reason box if the flight has a reason field
          if (!flight.reason) {
            return null;
          }

          const highlights = getFlightHighlights(flight);
          return (
            highlights.length > 0 && (
              <div className="mb-4">
                <div className="overflow-visible rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px]">
                  <div className="rounded-[calc(0.5rem-2px)] bg-white p-3">
                    <ul className="space-y-1">
                      {highlights.map((highlight, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm font-normal text-black"
                        >
                          <span className="mt-1 text-black">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          );
        })()}
      </div>

      {/* Conditional spacer - only when reason box exists */}
      {flight.reason && <div className="min-h-[8px] flex-grow"></div>}

      {/* Select Button with Price - Natural positioning */}
      <Button
        onClick={() => onSelect(flight.flightOfferId)}
        disabled={isLoading || readOnly}
        className={cn(
          "w-full border border-gray-300 bg-white py-3 text-black transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
          flight.reason ? "mt-1" : "mt-3",
          readOnly && "border-gray-200 bg-gray-100 text-gray-600",
        )}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="font-normal">
            {readOnly
              ? "Selected"
              : isLoading && selectedFlightId === flight.flightOfferId
                ? "Selecting..."
                : "Select Flight"}
          </span>
          <span className="font-bold">
            {currencySymbol}
            {price.toLocaleString()}
          </span>
        </span>
      </Button>
    </div>
  );
};

// Loading/Empty Flight Card Component
const EmptyFlightCard = ({ isLoading = true }: { isLoading?: boolean }) => {
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      {isLoading ? (
        <>
          {/* Content Area - Flexible */}
          <div className="flex flex-grow flex-col">
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
              <div className="flex-1 text-center">
                <Skeleton className="mx-auto mb-1 h-6 w-16" />
                <Skeleton className="mx-auto mb-1 h-3 w-12" />
                <Skeleton className="mx-auto h-3 w-8" />
              </div>
              <div className="mx-2 flex-1 text-center">
                <Skeleton className="mx-auto mb-1 h-3 w-12" />
                <Skeleton className="mb-1 h-px w-full" />
                <Skeleton className="mx-auto h-3 w-16" />
              </div>
              <div className="flex-1 text-center">
                <Skeleton className="mx-auto mb-1 h-6 w-16" />
                <Skeleton className="mx-auto mb-1 h-3 w-12" />
                <Skeleton className="mx-auto h-3 w-8" />
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
        <div className="flex flex-grow flex-col items-center justify-center py-8 text-center">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-gray-400" />
          <p className="mb-1 text-sm text-gray-500">Searching for flights...</p>
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
  readOnly = false,
  selectedFlightId,
}: {
  flights: FlightOption[];
  onSelect: (flightOfferId: string) => void;
  isLoading: boolean;
  readOnly?: boolean;
  selectedFlightId?: string | null;
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Get cards per view based on screen size - more conservative to prevent overflow
  const getCardsPerView = () => {
    if (typeof window === "undefined") return 3;
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      behavior: "smooth",
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
          className="scrollbar-hide flex gap-4 overflow-x-auto sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          style={{
            scrollSnapType: "x mandatory",
          }}
        >
          {[...Array(3)].map((_, index) => {
            // Responsive sizing for empty cards to match regular cards
            const getEmptyCardWidth = () => {
              if (typeof window === "undefined") return "280px";
              const width = window.innerWidth;
              if (width >= 1024) return "320px"; // Desktop: larger cards
              if (width >= 768) return "280px"; // Tablet: medium cards
              return "252px"; // Mobile: keep current size
            };

            return (
              <div
                key={index}
                className="flex-shrink-0 sm:w-auto"
                style={{
                  scrollSnapAlign: "start",
                  width:
                    typeof window !== "undefined" && window.innerWidth < 640
                      ? getEmptyCardWidth()
                      : "auto",
                  minWidth: getEmptyCardWidth(),
                }}
              >
                <EmptyFlightCard isLoading={false} />
              </div>
            );
          })}
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
              "absolute top-1/2 left-1 z-10 hidden -translate-y-1/2 rounded-full bg-white p-1.5 shadow-lg transition-all duration-200 sm:block",
              canScrollLeft
                ? "text-gray-700 hover:bg-gray-50 hover:shadow-xl"
                : "cursor-not-allowed text-gray-300",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={cn(
              "absolute top-1/2 right-1 z-10 hidden -translate-y-1/2 rounded-full bg-white p-1.5 shadow-lg transition-all duration-200 sm:block",
              canScrollRight
                ? "text-gray-700 hover:bg-gray-50 hover:shadow-xl"
                : "cursor-not-allowed text-gray-300",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="scrollbar-hide flex overflow-x-auto"
        style={{
          scrollSnapType: "x mandatory",
          gap: cardsPerView >= 2 ? "16px" : "12px", // Smaller gap on mobile
          paddingLeft:
            shouldShowNavigation && cardsPerView >= 2 ? "40px" : "0px", // Space for nav buttons
          paddingRight:
            shouldShowNavigation && cardsPerView >= 2 ? "40px" : "0px",
        }}
        onScroll={updateScrollButtons}
      >
        {flights.map((flight, index) => {
          // Calculate card width more conservatively to prevent overflow
          const gapSize = cardsPerView >= 2 ? 16 : 12;
          const totalGaps = (cardsPerView - 1) * gapSize;
          const availableWidth = 90; // percentage - reduced by 10%
          const cardWidth =
            availableWidth / cardsPerView - totalGaps / cardsPerView;

          // Responsive card sizing - larger for desktop, same for mobile
          const getMinWidth = () => {
            if (typeof window === "undefined") return "280px";
            const width = window.innerWidth;
            if (width >= 1024) return "320px"; // Desktop: larger cards
            if (width >= 768) return "280px"; // Tablet: medium cards
            return "252px"; // Mobile: keep current size
          };

          const getMinHeight = () => {
            // Remove fixed heights - let cards size naturally based on content
            return "auto";
          };

          return (
            <div
              key={flight.flightOfferId || `flight-${index}`}
              className="flex-shrink-0"
              style={{
                width: `${Math.max(cardWidth, 18)}%`, // Ensure minimum width and use percentage - reduced by 10%
                scrollSnapAlign: "start",
                minWidth: getMinWidth(), // Responsive minimum width
                maxWidth: cardsPerView === 1 ? "90%" : `${cardWidth}%`, // reduced by 10%
                minHeight: getMinHeight(), // Responsive minimum height
              }}
            >
              <FlightCard
                flight={flight}
                onSelect={onSelect}
                isLoading={isLoading}
                readOnly={readOnly}
                selectedFlightId={selectedFlightId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Direct Flight Display Component - Shows up to 3 tagged flights in order: best, cheapest, fastest
const DirectFlightDisplay = ({
  flights,
  onSelect,
  isLoading,
  readOnly = false,
  selectedFlightId,
}: {
  flights: FlightOption[];
  onSelect: (flightOfferId: string) => void;
  isLoading: boolean;
  readOnly?: boolean;
  selectedFlightId?: string | null;
}) => {
  // Pick only tagged flights in strict order and deduplicate when a flight has multiple tags
  const getTaggedFlightsOrdered = () => {
    if (flights.length === 0) return [] as FlightOption[];

    const selected: FlightOption[] = [];
    const usedIds = new Set<string>();

    const pickFirstByTag = (tag: "best" | "cheapest" | "fastest") => {
      const flight = flights.find(
        (f) => hasTag(f.tags, tag) && !usedIds.has(f.flightOfferId),
      );
      if (flight) {
        selected.push(flight);
        usedIds.add(flight.flightOfferId);
      }
    };

    pickFirstByTag("best");
    pickFirstByTag("cheapest");
    pickFirstByTag("fastest");

    return selected;
  };

  const flightsToShow = getTaggedFlightsOrdered();

  console.log(
    "DirectFlightDisplay - Tagged flights to show:",
    flightsToShow.length,
  );

  // Always use ResponsiveCarousel for consistent display
  return (
    <ResponsiveCarousel
      flights={flightsToShow}
      onSelect={onSelect}
      isLoading={isLoading}
      readOnly={readOnly}
      selectedFlightId={selectedFlightId}
    />
  );
};

// Flight List Item Component for Bottom Sheet
const FlightListItem = ({
  flight,
  onSelect,
  isLoading,
  readOnly = false,
}: {
  flight: FlightOption;
  onSelect: (flightOfferId: string) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}) => {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getAirlineInfo = (flight: FlightOption) => {
    // For journey-based flights, get info from first journey
    if (
      flight.journey &&
      flight.journey.length > 0 &&
      flight.journey[0].segments.length > 0
    ) {
      const segment = flight.journey[0].segments[0];
      const airlineName = segment.airlineName || segment.airlineIata || "";
      const airlineIata = segment.airlineIata || "";
      const airline =
        airlineName.length > 10
          ? airlineName.substring(0, 10) + "..."
          : airlineName;

      const flightNumbers = flight.journey
        .flatMap((j) => j.segments.map((s) => s.flightNumber))
        .filter((fn) => fn)
        .join(", ");

      return {
        airline,
        airlineIata,
        flightNumber: flightNumbers,
        isMultiFlight: flight.journey.length > 1,
      };
    }

    // For legacy flights
    if (flight.segments && flight.segments.length > 0) {
      const airlineName =
        flight.segments[0].airlineName || flight.segments[0].airlineIata || "";
      const airlineIata = flight.segments[0].airlineIata || "";
      const airline =
        airlineName.length > 10
          ? airlineName.substring(0, 10) + "..."
          : airlineName;

      const flightNumbers = flight.segments
        .map((s) => s.flightNumber)
        .filter((fn) => fn)
        .join(", ");

      return {
        airline,
        airlineIata,
        flightNumber: flightNumbers,
        isMultiFlight: flight.segments.length > 1,
      };
    }

    return {
      airline: "",
      airlineIata: "",
      flightNumber: "",
      isMultiFlight: false,
    };
  };

  // Handle both legacy and journey-based flights
  const isJourneyBased = flight.journey && flight.journey.length > 0;
  const departureInfo = isJourneyBased
    ? flight.journey![0]?.departure
    : flight.departure;
  const arrivalInfo = isJourneyBased
    ? flight.journey![flight.journey!.length - 1]?.arrival
    : flight.arrival;

  // Safety check - if we don't have departure/arrival info, skip rendering this flight
  if (!departureInfo || !arrivalInfo) {
    console.warn(
      "FlightListItem: Missing departure or arrival info for flight:",
      flight.flightOfferId,
    );
    return null;
  }
  const duration = getFlightDuration(flight);
  const price = flight.totalAmount || 0;
  const currency = flight.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);
  const { airline, airlineIata, flightNumber } = getAirlineInfo(flight);

  // Get intermediate stop IATA codes for connecting flights (updated for new data structure)
  const getStopIataCodes = (flight: FlightOption) => {
    // Handle journey-based flights
    if (flight.journey && flight.journey.length > 0) {
      const allSegments = flight.journey.flatMap((j) => j.segments || []);
      if (allSegments.length <= 1) return [];

      // For connecting flights, intermediate stops are the arrival airports of all segments except the last one
      return allSegments
        .slice(0, -1)
        .map((segment) => segment.arrival?.airportIata)
        .filter(Boolean);
    }

    // Handle legacy flights
    if (!flight.segments || flight.segments.length <= 1) return [];

    // For connecting flights, intermediate stops are the arrival airports of all segments except the last one
    return flight.segments
      .slice(0, -1)
      .map((segment) => segment.arrival?.airportIata)
      .filter(Boolean);
  };

  const stopIataCodes = getStopIataCodes(flight);

  return (
    <div
      className={cn(
        "border-b border-gray-200 bg-white px-3 py-4 transition-colors duration-200 sm:px-4",
        readOnly
          ? "cursor-default bg-gray-50"
          : "cursor-pointer hover:bg-gray-50",
      )}
      onClick={() => !readOnly && onSelect(flight.flightOfferId)}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        {/* Main Flight Row */}
        <div className="flex min-h-[80px] items-start gap-3">
          {/* Left: Airline Info */}
          <div className="flex flex-col items-center gap-1">
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
            <div className="min-w-0 text-center">
              {(airline || airlineIata) && (
                <div className="truncate text-xs text-gray-500" style={{ fontSize: "10px" }}>
                  {(airline || airlineIata).length > 12
                    ? (airline || airlineIata).substring(0, 12) + "..."
                    : airline || airlineIata}
                </div>
              )}
              {flightNumber && (
                <div className="truncate text-xs text-gray-500">
                  {flightNumber}
                </div>
              )}
            </div>
          </div>

          {/* Center: Times and Duration - Original Layout */}
          <div className="flex flex-1 items-center justify-center gap-4">
            {/* Departure */}
            <div className="text-center">
              <div
                className="text-sm text-gray-900"
                style={{ fontSize: "14px" }}
              >
                {formatTime(departureInfo.date)}
              </div>
            </div>

            {/* Duration & Stops */}
            <div className="min-w-0 text-center">
              {duration && (
                <div
                  className="text-xs text-gray-700 font-light"
                  style={{ fontSize: "12px" }}
                >
                  {duration}
                </div>
              )}
              <div className="relative">
                <div className="w-full border-t border-gray-300"></div>
                {(() => {
                  // Handle journey-based flights
                  if (flight.journey && flight.journey.length > 0) {
                    const totalSegments = flight.journey.reduce(
                      (total, j) => total + (j.segments?.length || 0),
                      0,
                    );
                    return totalSegments > 1 ? (
                      <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-orange-400"></div>
                    ) : null;
                  }
                  // Handle legacy flights
                  if (flight.segments && flight.segments.length > 1) {
                    return (
                      <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-orange-400"></div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div
                className="text-xs whitespace-nowrap text-gray-500"
                style={{ fontSize: "10px" }}
              >
                {(() => {
                  // Handle journey-based flights
                  if (flight.journey && flight.journey.length > 0) {
                    const totalSegments = flight.journey.reduce(
                      (total, j) => total + (j.segments?.length || 0),
                      0,
                    );
                    return totalSegments === 1
                      ? "Non-stop"
                      : `${totalSegments - 1} stop${totalSegments - 1 > 1 ? "s" : ""}`;
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
              {/* Show stop IATA codes - NEW */}
              {stopIataCodes.length > 0 && (
                <div
                  className="text-xs whitespace-nowrap text-gray-400"
                  style={{ fontSize: "9px" }}
                >
                  {stopIataCodes.join(", ")}
                </div>
              )}
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div
                className="text-sm text-gray-900"
                style={{ fontSize: "14px" }}
              >
                {formatTime(arrivalInfo.date)}
              </div>
            </div>
          </div>

          {/* Right: Price */}
          <div className="flex flex-shrink-0 flex-col justify-center text-right max-w-[80px]">
            <div className="text-sm font-bold text-gray-900 truncate">
              {currencySymbol}
              {price.toLocaleString()}
            </div>
            {flight.offerRules?.isRefundable && (
              <div className="mt-1 text-xs text-green-600">Refundable</div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden items-center justify-between sm:flex">
        {/* Left: Airline Info */}
        <div
          className="flex min-w-0 flex-col"
          style={{ width: "180px" }}
        >
          {(airline || airlineIata) && (
            <div className="flex items-center gap-2">
              {/* Airline Logo */}
              <AirlineLogo
                airlineIata={airlineIata}
                airlineName={airline || airlineIata}
                size="sm"
              />
              <span className="truncate text-sm font-medium text-gray-900">
                {airline || airlineIata}
              </span>
            </div>
          )}
          {flightNumber && (
            <div className="truncate text-xs text-gray-500">{flightNumber}</div>
          )}
        </div>

        {/* Center-Left: Departure Time */}
        <div
          className="text-center"
          style={{ width: "80px" }}
        >
          <div className="text-lg font-bold text-gray-900">
            {formatTime(departureInfo.date)}
          </div>
          <div className="text-xs text-gray-500">
            {departureInfo.airportIata}
          </div>
        </div>

        {/* Center: Duration & Stops */}
        <div className="max-w-[120px] flex-1 text-center">
          {duration && (
            <div className="text-sm font-medium text-gray-700">{duration}</div>
          )}
          <div className="relative my-1">
            <div className="w-full border-t border-gray-300"></div>
            {(() => {
              // Handle journey-based flights
              if (flight.journey && flight.journey.length > 0) {
                const totalSegments = flight.journey.reduce(
                  (total, j) => total + (j.segments?.length || 0),
                  0,
                );
                return totalSegments > 1 ? (
                  <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-gray-300"></div>
                ) : null;
              }
              // Handle legacy flights
              if (flight.segments && flight.segments.length > 1) {
                return (
                  <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-gray-300"></div>
                );
              }
              return null;
            })()}
          </div>
          <div className="text-xs text-gray-500">
            {(() => {
              // Handle journey-based flights
              if (flight.journey && flight.journey.length > 0) {
                const totalSegments = flight.journey.reduce(
                  (total, j) => total + (j.segments?.length || 0),
                  0,
                );
                return totalSegments === 1
                  ? "Non-stop"
                  : `${totalSegments - 1} stop${totalSegments - 1 > 1 ? "s" : ""}`;
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
        <div
          className="text-center"
          style={{ width: "80px" }}
        >
          <div className="text-lg font-bold text-gray-900">
            {formatTime(arrivalInfo.date)}
          </div>
          <div className="text-xs text-gray-500">{arrivalInfo.airportIata}</div>
        </div>

        {/* Right: Price */}
        <div
          className="text-right"
          style={{ width: "100px" }}
        >
          <div className="text-lg font-bold text-gray-900">
            {currencySymbol}
            {price.toLocaleString()}
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
  const [activeTab, setActiveTab] = useState<
    "recommended" | "cheapest" | "fastest"
  >("recommended");

  // Organize flights by tags
  const recommendedFlights = flights.filter((flight) =>
    flight.tags?.includes("recommended"),
  );
  const cheapestFlights = flights.filter((flight) =>
    flight.tags?.includes("cheapest"),
  );
  const fastestFlights = flights.filter((flight) =>
    flight.tags?.includes("fastest"),
  );

  // Debug logging
  console.log("FlightTabs - Total flights:", flights.length);
  console.log("FlightTabs - Recommended flights:", recommendedFlights.length);
  console.log("FlightTabs - Cheapest flights:", cheapestFlights.length);
  console.log("FlightTabs - Fastest flights:", fastestFlights.length);

  // Fallback: If no flights have the expected tags, distribute them across tabs
  let fallbackRecommended = recommendedFlights;
  let fallbackCheapest = cheapestFlights;
  let fallbackFastest = fastestFlights;

  if (
    recommendedFlights.length === 0 &&
    cheapestFlights.length === 0 &&
    fastestFlights.length === 0 &&
    flights.length > 0
  ) {
    console.log(
      "No flights with expected tags found, using fallback distribution",
    );
    // Distribute flights across tabs as fallback
    const flightsPerTab = Math.ceil(flights.length / 3);
    fallbackRecommended = flights.slice(0, flightsPerTab);
    fallbackCheapest = flights.slice(flightsPerTab, flightsPerTab * 2);
    fallbackFastest = flights.slice(flightsPerTab * 2);
  }

  const tabs = [
    {
      id: "recommended" as const,
      label: "Recommended",
      icon: Star,
      flights: fallbackRecommended,
      color: "text-blue-600 border-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "cheapest" as const,
      label: "Cheapest",
      icon: DollarSign,
      flights: fallbackCheapest,
      color: "text-green-600 border-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "fastest" as const,
      label: "Fastest",
      icon: Zap,
      flights: fallbackFastest,
      color: "text-orange-600 border-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="mb-6 flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-200",
                isActive
                  ? `${tab.color} ${tab.bgColor}`
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className="min-w-[20px] rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {tab.flights.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
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
                  className="scrollbar-hide flex gap-4 overflow-x-auto sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
                  style={{
                    scrollSnapType: "x mandatory",
                  }}
                >
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="w-[280px] flex-shrink-0 sm:w-auto"
                      style={{
                        scrollSnapAlign: "start",
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

interface FlightOptionsProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
}

const FlightOptionsWidget = (args: FlightOptionsProps) => {
  const thread = useStreamContext();

  console.log("FlightOptionsWidget - args:", args);

  const liveArgs = args.apiData?.value?.widget?.args ?? {};
  const frozenArgs = (liveArgs as any)?.submission;
  const effectiveArgs = args.readOnly && frozenArgs ? frozenArgs : liveArgs;

  const flightOffers =
    (effectiveArgs as any)?.flightOffers ?? args.flightOffers ?? {};

  console.log("FlightOptionsWidget - flightOffers:", flightOffers);

  const readOnly = !!args.readOnly;

  const { switchToChat, switchToReview } = useTabContext();
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [bottomSheetFilter, setBottomSheetFilter] = useState<
    "cheapest" | "fastest" | "recommended"
  >("cheapest");

  // Filter states for the bottom sheet
  const [stopsFilter, setStopsFilter] = useState<
    "any" | "nonstop" | "1stop" | "2+stops"
  >("any");
  const [departureTimeFilter, setDepartureTimeFilter] = useState<
    "any" | "morning" | "afternoon" | "evening"
  >("any");
  const [refundableFilter, setRefundableFilter] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const allFlightTuples = flightOffers || [];

  // Only show the "Show all flights" button if there exists at least one flight without any tags
  const hasUntaggedFlight = (allFlightTuples ?? []).some(
    (f: any) => !(Array.isArray(f?.tags) && f.tags.length > 0),
  );

  // Track flight results when component loads with flight data
  useEffect(() => {
    if (allFlightTuples.length > 0 && !readOnly) {
      try {
        // Helper function to get airline name from flight
        const getAirlineName = (flight: any): string => {
          if (flight.segments && flight.segments.length > 0) {
            return flight.segments[0].airlineName || flight.segments[0].airlineIata || 'Unknown';
          }
          if (flight.journey && flight.journey.length > 0 && flight.journey[0].segments.length > 0) {
            const segment = flight.journey[0].segments[0];
            return segment.airlineName || segment.airlineIata || 'Unknown';
          }
          return 'Unknown';
        };

        // Helper function to get stop count from flight
        const getStopCount = (flight: any): number => {
          if (flight.journey && flight.journey.length > 0) {
            return flight.journey.reduce((total: number, j: any) => total + (j.segments?.length || 0), 0) - 1;
          }
          if (flight.segments && flight.segments.length > 0) {
            return flight.segments.length - 1;
          }
          return 0;
        };

        // Helper function to get flight duration
        const getFlightDurationString = (flight: any): string => {
          if (flight.journey && flight.journey.length > 0) {
            return flight.journey[0].duration || flight.duration || '';
          }
          return flight.duration || '';
        };

        // Calculate price metrics
        const prices = allFlightTuples.map((f: any) => f.totalAmount || 0).filter((p: number) => p > 0);
        const lowestPrice = Math.min(...prices);
        const highestPrice = Math.max(...prices);
        const averagePrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;

        // Get unique airlines
        const airlines = [...new Set(allFlightTuples.map((f: any) => getAirlineName(f)))].filter((name): name is string => typeof name === 'string');

        // Check if there are direct flights
        const hasDirectFlights = allFlightTuples.some((f: any) => getStopCount(f) === 0);

        // Get top 3 flights that would be displayed (tagged flights in order: best, cheapest, fastest)
        const getTopDisplayedFlights = () => {
          const topFlights: any[] = [];
          const usedIds = new Set<string>();

          const pickFirstByTag = (tag: string) => {
            const flight = allFlightTuples.find(
              (f: any) => f.tags?.some((t: string) => t.toLowerCase() === tag) && !usedIds.has(f.flightOfferId)
            );
            if (flight) {
              topFlights.push(flight);
              usedIds.add(flight.flightOfferId);
            }
          };

          pickFirstByTag('best');
          pickFirstByTag('cheapest');
          pickFirstByTag('fastest');

          return topFlights;
        };

        const topFlights = getTopDisplayedFlights();

        // Build analytics data
        const resultsAnalytics: FlightResultsAnalytics = {
          result_count: allFlightTuples.length,
          lowest_price: lowestPrice,
          highest_price: highestPrice,
          currency: allFlightTuples[0]?.currency || 'USD',
          top_results: topFlights.map((flight: any) => ({
            flight_id: flight.flightOfferId,
            price: flight.totalAmount || 0,
            airline: getAirlineName(flight),
            duration: getFlightDurationString(flight),
            stops: getStopCount(flight),
            tags: flight.tags || [],
          })),
          search_results_summary: {
            total_flights: allFlightTuples.length,
            price_range: `${lowestPrice}-${highestPrice}`,
            airlines: airlines,
            has_direct_flights: hasDirectFlights,
            average_price: Math.round(averagePrice),
          },
        };

        // Track the event
        trackFlightResults(resultsAnalytics);
      } catch (analyticsError) {
        console.error('Error tracking flight results analytics:', analyticsError);
        // Don't block the component if analytics fails
      }
    }
  }, [allFlightTuples.length, readOnly]); // Trigger when flight data loads

  // Note: Removed journey type detection to match widgets page design

  // Debug: Log flight tags
  if (allFlightTuples.length > 0) {
    console.log("Sample flight tags:", allFlightTuples[0]?.tags);
    console.log(
      "All flight tags:",
      allFlightTuples.map((f: any) => ({ id: f.flightOfferId, tags: f.tags })),
    );
  }

  const handleSelectFlight = async (flightOfferId: string) => {
    // Prevent selection in read-only mode
    if (readOnly) return;

    setSelectedFlight(flightOfferId);
    setIsLoading(true);

    // Determine selection source before closing the sheet
    const selectedFrom: 'cards' | 'bottomsheet' = showAllFlights ? 'bottomsheet' : 'cards';

    // Close the "All Flights" sheet immediately on selection
    setShowAllFlights(false);

    const responseData = {
      selectedFlightId: flightOfferId,
    };

    try {
      const selectedFlightOffer = flightOffers.find(
        (offer: any) => offer.flightOfferId === flightOfferId,
      );

      // Track flight selection event
      if (selectedFlightOffer) {
        try {
          // Helper function to get airline name from flight
          const getAirlineName = (flight: any): string => {
            if (flight.segments && flight.segments.length > 0) {
              return flight.segments[0].airlineName || flight.segments[0].airlineIata || 'Unknown';
            }
            if (flight.journey && flight.journey.length > 0 && flight.journey[0].segments.length > 0) {
              const segment = flight.journey[0].segments[0];
              return segment.airlineName || segment.airlineIata || 'Unknown';
            }
            return 'Unknown';
          };

          // Helper function to get flight numbers (IATA numbers)
          const getFlightNumbers = (flight: any): string => {
            if (flight.segments && flight.segments.length > 0) {
              const flightNumbers = flight.segments
                .map((segment: any) => segment.flightNumber)
                .filter((num: string) => num && num.trim() !== "")
                .join(", ");
              return flightNumbers || 'N/A';
            }
            if (flight.journey && flight.journey.length > 0) {
              const allFlightNumbers = flight.journey
                .flatMap((journey: any) =>
                  journey.segments.map((segment: any) => segment.flightNumber)
                )
                .filter((num: string) => num && num.trim() !== "")
                .join(", ");
              return allFlightNumbers || 'N/A';
            }
            return 'N/A';
          };

          // Helper function to get timing information
          const getTiming = (flight: any): string => {
            const isJourneyBased = flight.journey && flight.journey.length > 0;
            const departureInfo = isJourneyBased
              ? flight.journey[0]?.departure
              : flight.departure;
            const arrivalInfo = isJourneyBased
              ? flight.journey[flight.journey.length - 1]?.arrival
              : flight.arrival;

            if (!departureInfo || !arrivalInfo) return 'N/A';

            const formatTime = (isoString: string) => {
              return new Date(isoString).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            };

            return `${formatTime(departureInfo.date)} - ${formatTime(arrivalInfo.date)}`;
          };

          // Helper function to get stop count
          const getStopCount = (flight: any): number => {
            if (flight.journey && flight.journey.length > 0) {
              return flight.journey.reduce((total: number, j: any) => total + (j.segments?.length || 0), 0) - 1;
            }
            if (flight.segments && flight.segments.length > 0) {
              return flight.segments.length - 1;
            }
            return 0;
          };

          // Build selection analytics data
          const selectionAnalytics: FlightSelectedAnalytics = {
            flight_offer_id: selectedFlightOffer.flightOfferId,
            iata_number: getFlightNumbers(selectedFlightOffer),
            airline: getAirlineName(selectedFlightOffer),
            timing: getTiming(selectedFlightOffer),
            stops: getStopCount(selectedFlightOffer),
            price: selectedFlightOffer.totalAmount || 0,
            currency: selectedFlightOffer.currency || 'USD',
            refundable: selectedFlightOffer.offerRules?.isRefundable ? 'yes' : 'no',
            selected_from: selectedFrom,
            tags: selectedFlightOffer.tags && selectedFlightOffer.tags.length > 0
              ? selectedFlightOffer.tags.join(', ')
              : null,
          };

          // Track the selection event
          trackFlightSelected(selectionAnalytics);
        } catch (analyticsError) {
          console.error('Error tracking flight selection analytics:', analyticsError);
          // Don't block the selection if analytics fails
        }
      }

      const frozen = {
        widget: {
          type: "FlightOptionsWidget",
          args: { flightOffers: [selectedFlightOffer] },
        },
        value: {
          type: "widget",
          widget: {
            type: "FlightOptionsWidget",
            args: { flightOffers: [selectedFlightOffer] },
          },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
    } catch (error) {
      // Optional: already handled inside the utility
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowAllFlights = () => {
    if (readOnly) return;
    setShowAllFlights(true);
  };

  // Sort flights based on the selected filter
  const getSortedFlights = (
    flights: FlightOption[],
    sortBy: "cheapest" | "fastest" | "recommended",
  ) => {
    const flightsCopy = [...flights];

    switch (sortBy) {
      case "cheapest":
        return flightsCopy.sort(
          (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
        );
      case "fastest":
        // Sort by duration (convert ISO duration to minutes for comparison)
        // Use journey[0]?.duration for journey-based flights, fallback to flight.duration
        return flightsCopy.sort((a, b) => {
          const getDurationMinutes = (duration: string) => {
            if (!duration) return Infinity; // Put flights without duration at the end
            const match = duration.match(/PT(\d+)H(\d+)?M?/);
            if (match) {
              const hours = parseInt(match[1]) || 0;
              const minutes = parseInt(match[2]) || 0;
              return hours * 60 + minutes;
            }
            return Infinity; // Put flights with invalid duration format at the end
          };

          // Get duration from journey[0] if available, otherwise use flight.duration
          const aDuration = a.journey?.[0]?.duration || a.duration || "";
          const bDuration = b.journey?.[0]?.duration || b.duration || "";

          return getDurationMinutes(aDuration) - getDurationMinutes(bDuration);
        });
      case "recommended":
        // Sort by ranking score (higher is better)
        return flightsCopy.sort(
          (a, b) => (b.rankingScore || 0) - (a.rankingScore || 0),
        );
      default:
        return flightsCopy;
    }
  };

  // Apply filters to flights (updated to handle new data structure)
  const applyFilters = (flights: FlightOption[]) => {
    return flights.filter((flight) => {
      // Stops filter - handle both journey and legacy structure
      if (stopsFilter !== "any") {
        let stopCount = 0;

        // Calculate stop count based on available data structure
        if (flight.journey && flight.journey.length > 0) {
          // New journey structure - count total segments across all journeys
          stopCount =
            flight.journey.reduce(
              (total, j) => total + (j.segments?.length || 0),
              0,
            ) - 1;
        } else if (flight.segments && flight.segments.length > 0) {
          // Legacy structure
          stopCount = flight.segments.length - 1;
        }

        if (stopsFilter === "nonstop" && stopCount > 0) return false;
        if (stopsFilter === "1stop" && stopCount !== 1) return false;
        if (stopsFilter === "2+stops" && stopCount < 2) return false;
      }

      // Departure time filter - handle both journey and legacy structure
      if (departureTimeFilter !== "any") {
        let departureDate: string | null = null;

        // Get departure date based on available data structure
        if (
          flight.journey &&
          flight.journey.length > 0 &&
          flight.journey[0].departure?.date
        ) {
          departureDate = flight.journey[0].departure.date;
        } else if (flight.departure?.date) {
          departureDate = flight.departure.date;
        }

        if (departureDate) {
          try {
            const departureTime = new Date(departureDate);
            const hour = departureTime.getHours();

            if (departureTimeFilter === "morning" && (hour < 6 || hour >= 12))
              return false;
            if (
              departureTimeFilter === "afternoon" &&
              (hour < 12 || hour >= 18)
            )
              return false;
            if (departureTimeFilter === "evening" && (hour < 18 || hour >= 24))
              return false;
          } catch (error) {
            console.warn(
              "Invalid departure date format:",
              departureDate,
              error,
            );
            // Skip time filter if date is invalid
          }
        }
      }

      // Refundable filter
      if (refundableFilter && !flight.offerRules?.isRefundable) return false;

      return true;
    });
  };

  const filteredFlights = applyFilters(allFlightTuples);
  const sortedFlights = getSortedFlights(filteredFlights, bottomSheetFilter);

  // Count active filters for UI feedback
  const getActiveFilterCount = () => {
    let count = 0;
    if (stopsFilter !== "any") count++;
    if (departureTimeFilter !== "any") count++;
    if (refundableFilter) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setStopsFilter("any");
    setDepartureTimeFilter("any");
    setRefundableFilter(false);
  };

  // Note: Removed tag checking logic to match widgets page design

  return (
    <>
      <div
        className="flight-carousel-container mx-auto mt-4 w-full max-w-full overflow-hidden rounded-2xl border border-gray-300 bg-white p-3 sm:mt-8 sm:p-6"
        style={{
          fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
          maxWidth: "min(100vw - 2rem, 1536px)", // Ensure it never exceeds viewport width minus padding
        }}
      >
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
                Available Flights
              </h2>
              <p className="text-sm text-gray-600">
                {readOnly
                  ? "Your selected flight option"
                  : "Choose from the best options"}
              </p>
            </div>
            {readOnly && (
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                Selected
              </div>
            )}
          </div>
        </div>

        {/* Direct Flight Display - Only 3 Tagged Flights */}
        <div className="mb-6 overflow-hidden">
          {allFlightTuples.length > 0 ? (
            <DirectFlightDisplay
              flights={allFlightTuples}
              onSelect={handleSelectFlight}
              isLoading={isLoading}
              readOnly={readOnly}
              selectedFlightId={selectedFlight}
            />
          ) : (
            // Show loading state when no flights are available
            <div className="relative w-full overflow-hidden">
              <div
                className="scrollbar-hide flex gap-4 overflow-x-auto sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
                style={{
                  scrollSnapType: "x mandatory",
                }}
              >
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="w-[280px] flex-shrink-0 sm:w-auto"
                    style={{
                      scrollSnapAlign: "start",
                    }}
                  >
                    <EmptyFlightCard isLoading={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Show All Flights Button - show only if there is at least one untagged flight */}
        {allFlightTuples.length > 0 && hasUntaggedFlight && !readOnly && (
          <div className="text-center">
            <Button
              onClick={handleShowAllFlights}
              variant="outline"
              className="border-black px-8 py-2 text-black transition-colors duration-200 hover:bg-black hover:text-white"
            >
              Show all flights ({allFlightTuples.length} total)
            </Button>
          </div>
        )}

        {/* Selection Feedback */}
        {selectedFlight && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-800">
              {(() => {
                const selectedFlightData = allFlightTuples.find(
                  (f: any) => f.flightOfferId === selectedFlight,
                );
                if (!selectedFlightData) return "Flight selected!";

                // Try to get flight number from segments
                if (selectedFlightData.segments?.[0]?.flightNumber) {
                  return `Flight ${selectedFlightData.segments[0].flightNumber} selected!`;
                }

                // Try to get flight number from journey
                if (
                  selectedFlightData.journey?.[0]?.segments?.[0]?.flightNumber
                ) {
                  return `Flight ${selectedFlightData.journey[0].segments[0].flightNumber} selected!`;
                }

                return "Flight selected!";
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal for All Flights */}
      <Sheet
        open={showAllFlights}
        onOpenChange={setShowAllFlights}
      >
        <SheetContent
          side="bottom"
          className="flex h-[90vh] flex-col overflow-hidden sm:h-[85vh]"
        >
          <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-2">
            <SheetTitle className="text-lg font-semibold">
              All Flights ({filteredFlights.length} of {allFlightTuples.length}{" "}
              flights)
            </SheetTitle>
          </SheetHeader>

          {/* Desktop Layout with Filters */}
          <div className="hidden flex-1 overflow-hidden lg:flex">
            {/* Left Sidebar - Filters */}
            <div className="w-64 overflow-y-auto border-r border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
              </div>

              {/* Stops Filter */}
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-gray-900">Stops</h4>
                <div className="space-y-2">
                  {[
                    { value: "any", label: "Any number of stops" },
                    { value: "nonstop", label: "Nonstop only" },
                    { value: "1stop", label: "1 stop or fewer" },
                    { value: "2+stops", label: "2+ stops" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="stops"
                        value={option.value}
                        checked={stopsFilter === option.value}
                        onChange={(e) =>
                          setStopsFilter(e.target.value as typeof stopsFilter)
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Departure Times Filter */}
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-gray-900">
                  Departure Times
                </h4>
                <div className="space-y-2">
                  {[
                    { value: "any", label: "Any time" },
                    { value: "morning", label: "Morning (6AM - 12PM)" },
                    { value: "afternoon", label: "Afternoon (12PM - 6PM)" },
                    { value: "evening", label: "Evening (6PM - 12AM)" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="departureTime"
                        value={option.value}
                        checked={departureTimeFilter === option.value}
                        onChange={(e) =>
                          setDepartureTimeFilter(
                            e.target.value as typeof departureTimeFilter,
                          )
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Refundable Filter */}
              {/* <div className="mb-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={refundableFilter}
                    onChange={(e) => setRefundableFilter(e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Refundable fares only
                  </span>
                </label>
              </div> */}

              {/* Clear Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear all filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 text-xs">({activeFilterCount})</span>
                )}
              </Button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Pill-shaped Filter Tabs - Uber Style */}
              <div className="flex-shrink-0 border-b border-gray-200 p-4">
                <div className="flex justify-center gap-3">
                  {[
                    {
                      id: "cheapest" as const,
                      label: "Cheapest",
                      icon: DollarSign,
                    },
                    { id: "fastest" as const, label: "Fastest", icon: Zap },
                    // { id: "recommended" as const, label: "Best", icon: Star },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = bottomSheetFilter === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setBottomSheetFilter(tab.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "border-black bg-black text-white shadow-sm"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
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
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
            {/* Combined Pill Tabs and Filter Button */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-start gap-2">
                {/* Filter Button as Pill */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    activeFilterCount > 0
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                  )}
                >
                  <Filter className="h-3 w-3" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Pill-shaped Filter Tabs - Uber Style Mobile */}
                {[
                  {
                    id: "cheapest" as const,
                    label: "Cheapest",
                    icon: DollarSign,
                  },
                  { id: "fastest" as const, label: "Fastest", icon: Zap },
                  // { id: "recommended" as const, label: "Best", icon: Star },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = bottomSheetFilter === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setBottomSheetFilter(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        isActive
                          ? "border-black bg-black text-white shadow-sm"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                      )}
                    >
                      <Icon className="h-3 w-3" />
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
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Filter Modal */}
      <Sheet
        open={showMobileFilters}
        onOpenChange={setShowMobileFilters}
      >
        <SheetContent
          side="bottom"
          className="flex h-[60vh] flex-col overflow-hidden"
        >
          <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-3">
            <SheetTitle className="text-lg font-semibold">
              Filter Flights
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Stops Filter */}
              <div>
                <h3 className="mb-2 font-medium text-gray-900">Stops</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "any", label: "Any" },
                    { value: "nonstop", label: "Nonstop" },
                    { value: "1stop", label: "1 stop" },
                    { value: "2+stops", label: "2+ stops" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="mobileStops"
                        value={option.value}
                        checked={stopsFilter === option.value}
                        onChange={(e) =>
                          setStopsFilter(e.target.value as typeof stopsFilter)
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Departure Times Filter */}
              <div>
                <h3 className="mb-2 font-medium text-gray-900">
                  Departure Times
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "any", label: "Any time" },
                    { value: "morning", label: "Morning" },
                    { value: "afternoon", label: "Afternoon" },
                    { value: "evening", label: "Evening" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="mobileDepartureTime"
                        value={option.value}
                        checked={departureTimeFilter === option.value}
                        onChange={(e) =>
                          setDepartureTimeFilter(
                            e.target.value as typeof departureTimeFilter,
                          )
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Refundable Filter */}
              <div>
                <h3 className="mb-2 font-medium text-gray-900">
                  Booking Options
                </h3>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={refundableFilter}
                    onChange={(e) => setRefundableFilter(e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Refundable fares only
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear all
                {activeFilterCount > 0 && (
                  <span className="ml-1">({activeFilterCount})</span>
                )}
              </Button>
              <Button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Show {filteredFlights.length} flights
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FlightOptionsWidget;
