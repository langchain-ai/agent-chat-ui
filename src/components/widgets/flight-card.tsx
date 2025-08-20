"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { FlightDetailsPopup } from "./flight-details-popup"
import Image from "next/image"

interface FlightCardProps {
  // New data structure props (optional for backward compatibility)
  flightOfferId?: string
  totalAmount?: number
  currency?: string
  journey?: Array<{
    id: string
    duration: string
    departure: {
      date: string
      airportIata: string
      airportName: string
    }
    arrival: {
      date: string
      airportIata: string
      airportName: string
    }
    segments: Array<{
      id: string
      airlineIata: string
      flightNumber: string
      airlineName: string
      duration: string
      departure: {
        date: string
        airportIata: string
        airportName: string
      }
      arrival: {
        date: string
        airportIata: string
        airportName: string
      }
    }>
  }>
  offerRules?: {
    isRefundable: boolean
  }
  tags?: string[]

  // Legacy props for backward compatibility
  type?: "best" | "cheapest" | "fastest"
  price?: string
  duration?: string
  stops?: number
  airline?: string
  airlineCode?: string
  departureTime?: string
  arrivalTime?: string
  nextDay?: boolean
  layovers?: Array<{ city: string; duration: string; iataCode?: string }>

  // Component props
  compact?: boolean
  onSelect?: (flightOfferId: string) => void
  isLoading?: boolean
  selectedFlightId?: string | null
}

// Helper function to get airline logo path
const getAirlineLogoPath = (airlineIata: string): string => {
  if (!airlineIata) return "";
  return `/airlines/${airlineIata.toUpperCase()}.png`;
};

// Helper function to get airline IATA code
const getAirlineIata = (airline: string, airlineCode?: string) => {
  // Map airline names to IATA codes if not provided
  const airlineCodeMap: { [key: string]: string } = {
    "Cathay Pacific": "CX",
    "Air India": "AI",
    "United Airlines": "UA",
    "Emirates": "EK",
    "Lufthansa": "LH",
    "Singapore Airlines": "SQ"
  }

  return airlineCode || airlineCodeMap[airline] || "AI"
}

// Airline Logo Component (matching flightOptions.widget.tsx)
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
    sm: { width: 20, height: 20, container: "w-5 h-5" },
    md: { width: 24, height: 24, container: "w-6 h-6" },
    lg: { width: 32, height: 32, container: "w-8 h-8" },
  };

  const { width, height, container } = sizeConfig[size];

  return (
    <div className={`flex-shrink-0 rounded-full overflow-hidden ${container}`}>
      {logoPath ? (
        <Image
          src={logoPath}
          alt={`${airlineName} logo`}
          width={width}
          height={height}
          className="airline-logo rounded-full object-contain w-full h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/airlines/AI.png'; // fallback
          }}
        />
      ) : (
        <div className={`${container} rounded-full bg-gray-200 flex items-center justify-center`}>
          <span className="text-xs font-medium text-gray-500">
            {airlineName.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
};

// Badge configurations (matching flightOptions.widget.tsx)
const getBadgeConfigs = (tags: string[] = []) => {
  const present = new Set(tags.map((t) => t.toLowerCase()));
  const badges: { emoji: string; text: string; color: string }[] = [];

  if (present.has("best") || present.has("shortest")) {
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

export function FlightCard(props: FlightCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Helper functions to extract data from new structure or use legacy props
  const getFlightData = () => {
    // If new data structure is provided
    if (props.journey && props.journey.length > 0) {
      const firstJourney = props.journey[0];
      const firstSegment = firstJourney.segments[0];
      const lastSegment = firstJourney.segments[firstJourney.segments.length - 1];

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

      return {
        airline: firstSegment.airlineName,
        airlineCode: firstSegment.airlineIata,
        departureTime: formatTime(firstJourney.departure.date),
        arrivalTime: formatTime(firstJourney.arrival.date),
        duration: formatDuration(firstJourney.duration),
        stops: firstJourney.segments.length - 1,
        price: `${getCurrencySymbol(props.currency || 'USD')}${(props.totalAmount || 0).toLocaleString()}`,
        nextDay: false, // Calculate if needed
        layovers: firstJourney.segments.slice(0, -1).map(segment => ({
          city: segment.arrival.airportName,
          duration: '',
          iataCode: segment.arrival.airportIata
        })),
        type: props.tags?.includes('cheapest') ? 'cheapest' as const :
              props.tags?.includes('fastest') ? 'fastest' as const : 'best' as const
      };
    }

    // Use legacy props
    return {
      airline: props.airline || '',
      airlineCode: props.airlineCode || '',
      departureTime: props.departureTime || '',
      arrivalTime: props.arrivalTime || '',
      duration: props.duration || '',
      stops: props.stops || 0,
      price: props.price || '',
      nextDay: props.nextDay || false,
      layovers: props.layovers || [],
      type: props.type || 'best' as const
    };
  };

  const flightData = getFlightData();
  const airlineIata = getAirlineIata(flightData.airline, flightData.airlineCode);
  const badgeConfigs = getBadgeConfigs([flightData.type]);

  const handlePriceButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.onSelect && props.flightOfferId && !props.isLoading) {
      props.onSelect(props.flightOfferId);
    }
  };

  const isSelected = props.selectedFlightId === props.flightOfferId;

  if (props.compact) {
    return (
      <>
        <div
          className={`px-3 py-2 transition-colors duration-200 ${
            isSelected ? 'bg-blue-50 border-blue-200' : ''
          } ${props.isLoading ? 'opacity-50' : ''}`}
        >
          {/* Main Flight Row */}
          <div className="flex min-h-[60px] items-center gap-3">
            {/* Left: Airline Info */}
            <div className="flex flex-col items-center gap-0.5">
              {/* Airline Logo */}
              <div className="flex-shrink-0">
                <AirlineLogo
                  airlineIata={airlineIata}
                  airlineName={flightData.airline}
                  size="md"
                />
              </div>

              {/* Airline Details */}
              <div className="min-w-0 text-center">
                <div className="truncate text-xs text-gray-500" style={{ fontSize: "10px" }}>
                  {flightData.airline && flightData.airline.length > 12 ? flightData.airline.substring(0, 12) + "..." : flightData.airline}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                  className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 text-xs mt-0.5"
                  style={{ fontSize: "10px" }}
                >
                  <Info className="w-2.5 h-2.5" />
                  Details
                </button>
              </div>
            </div>

            {/* Center: Times and Duration */}
            <div className="flex flex-1 items-center justify-center gap-4">
              {/* Departure */}
              <div className="text-center">
                <div
                  className="text-sm text-gray-900"
                  style={{ fontSize: "14px" }}
                >
                  {flightData.departureTime}
                </div>
              </div>

              {/* Duration & Stops */}
              <div className="min-w-0 text-center">
                <div
                  className="text-xs text-gray-700 font-light"
                  style={{ fontSize: "12px" }}
                >
                  {flightData.duration}
                </div>
                <div className="relative">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div
                  className="text-xs whitespace-nowrap text-gray-500"
                  style={{ fontSize: "10px" }}
                >
                  {flightData.stops === 0 ? "Non-stop" : `${flightData.stops} stop${flightData.stops > 1 ? "s" : ""}`}
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <div
                  className="text-sm text-gray-900"
                  style={{ fontSize: "14px" }}
                >
                  {flightData.arrivalTime}
                </div>
              </div>
            </div>

            {/* Right: Price Button */}
            <div className="flex flex-shrink-0 flex-col justify-center text-right max-w-[80px]">
              <button
                onClick={handlePriceButtonClick}
                disabled={props.isLoading}
                className={`px-3 py-2 rounded-md text-sm font-bold text-white transition-colors duration-200 ${
                  props.isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-800 cursor-pointer'
                }`}
              >
                {flightData.price}
              </button>
              {props.offerRules?.isRefundable && (
                <div className="mt-1 text-xs text-green-600">Refundable</div>
              )}
            </div>
          </div>
        </div>

        <FlightDetailsPopup
          open={showDetails}
          onOpenChange={setShowDetails}
          flightData={props.journey ? { journey: props.journey } : undefined}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={`px-2 py-1 transition-all duration-200 rounded-lg ${
          isSelected ? 'bg-blue-50 border border-blue-200' : ''
        } ${props.isLoading ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center justify-between gap-0.5 mb-4 pt-3">
          <div className="flex items-center gap-2">
            <AirlineLogo
              airlineIata={airlineIata}
              airlineName={flightData.airline}
              size="md"
            />
            <div className="font-medium text-foreground text-xs">{flightData.airline}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {badgeConfigs.length > 0 &&
              badgeConfigs.map((badgeConfig, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-800"
                >
                  <span className="text-sm">{badgeConfig.emoji}</span>
                  <span className="truncate">{badgeConfig.text}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="grid grid-cols-3 gap-4 items-start mb-2">
            <div className="text-left">
              <div className="text-muted-foreground text-xs">Departure</div>
              <div className="font-semibold text-foreground text-sm">{flightData.departureTime}</div>
              <div className="text-muted-foreground text-xs">
                {props.journey?.[0]?.departure?.airportIata || "DEL"}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground text-sm">{flightData.duration}</div>
              <div className="font-medium text-muted-foreground text-xs mt-1">{flightData.stops} stops</div>
              <div className="mt-2">
                <div className="text-muted-foreground text-[10px]">
                  {flightData.layovers.map((layover, index) => (
                    <span key={index}>
                      {layover.iataCode || layover.city}
                      {index < flightData.layovers.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs">Arrival</div>
              <div className="font-semibold text-foreground text-sm">{flightData.arrivalTime}</div>
              <div className="text-muted-foreground text-xs">
                {props.journey?.[0]?.arrival?.airportIata || "HNL"}
              </div>
              {flightData.nextDay && (
                <div className="mt-1">
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 text-[10px]">
                    +1 day
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pb-3">
          <button
            onClick={() => setShowDetails(true)}
            className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 text-xs"
          >
            <Info className="w-3 h-3" />
            Flight Info
          </button>
          <button
            onClick={handlePriceButtonClick}
            disabled={props.isLoading}
            className={`px-4 py-2 rounded-md font-bold text-white transition-colors duration-200 text-sm md:text-base ${
              props.isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800 cursor-pointer'
            }`}
          >
            {flightData.price}
          </button>
        </div>
      </div>

      <FlightDetailsPopup
        open={showDetails}
        onOpenChange={setShowDetails}
        flightData={props.journey ? { journey: props.journey } : undefined}
      />
    </>
  )
}
