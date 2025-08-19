"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { FlightDetailsPopup } from "./flight-details-popup"
import Image from "next/image"

interface FlightCardProps {
  type?: "best" | "cheapest" | "fastest"
  price: string
  duration: string
  stops: number
  airline: string
  airlineCode?: string
  departureTime: string
  arrivalTime: string
  nextDay?: boolean
  layovers: Array<{ city: string; duration: string; iataCode?: string }>
  compact?: boolean
  flightOfferId?: string
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

export function FlightCard({
  type = "best",
  price,
  duration,
  stops,
  airline,
  airlineCode,
  departureTime,
  arrivalTime,
  nextDay = false,
  layovers,
  compact = false,
  flightOfferId,
  onSelect,
  isLoading = false,
  selectedFlightId,
}: FlightCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const airlineIata = getAirlineIata(airline, airlineCode);
  const badgeConfigs = getBadgeConfigs([type]);

  const handleCardClick = () => {
    if (onSelect && flightOfferId && !isLoading) {
      onSelect(flightOfferId);
    }
  };

  const isSelected = selectedFlightId === flightOfferId;

  if (compact) {
    return (
      <>
        <div
          className={`px-3 py-2 border-b border-border last:border-b-0 cursor-pointer transition-colors duration-200 ${
            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleCardClick}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-24 flex-shrink-0">
              <AirlineLogo
                airlineIata={airlineIata}
                airlineName={airline}
                size="sm"
              />
              <div className="flex flex-col items-start min-w-0">
                <div className="font-normal text-sm md:text-xs text-foreground truncate w-full">{airline}</div>
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 text-xs md:text-[10px] mt-0.5"
                >
                  <Info className="w-3 h-3 md:w-2.5 md:h-2.5" />
                  Info
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center w-16 flex-shrink-0">
              <div className="text-xs md:text-[10px] text-muted-foreground">DEL</div>
              <div className="font-semibold text-sm md:text-xs text-foreground">{departureTime}</div>
            </div>

            <div className="flex flex-col items-center w-20 flex-shrink-0">
              <div className="font-semibold text-sm md:text-xs text-foreground">{duration}</div>
              <div className="text-xs md:text-[10px] text-muted-foreground">{stops} stops</div>
            </div>

            <div className="flex flex-col items-center w-16 flex-shrink-0">
              <div className="text-xs md:text-[10px] text-muted-foreground">HNL</div>
              <div className="font-semibold text-sm md:text-xs text-foreground">{arrivalTime}</div>
              {nextDay && (
                <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 text-xs md:text-[10px] mt-1">
                  +1 day
                </span>
              )}
            </div>

            <div className="flex flex-col items-end w-20 flex-shrink-0">
              <div className="font-bold text-sm md:text-base text-foreground">{price}</div>
            </div>
          </div>
        </div>

        <FlightDetailsPopup open={showDetails} onOpenChange={setShowDetails} />
      </>
    )
  }

  return (
    <>
      <div
        className={`px-2 py-1 cursor-pointer transition-all duration-200 rounded-lg ${
          isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between gap-0.5 mb-4 pt-3">
          <div className="flex items-center gap-2">
            <AirlineLogo
              airlineIata={airlineIata}
              airlineName={airline}
              size="md"
            />
            <div className="font-medium text-foreground text-xs">{airline}</div>
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
              <div className="font-semibold text-foreground text-sm">{departureTime}</div>
              <div className="text-muted-foreground text-xs">New Delhi (DEL)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground text-sm">{duration}</div>
              <div className="font-medium text-muted-foreground text-xs mt-1">{stops} stops</div>
              <div className="mt-2">
                <div className="text-muted-foreground text-[10px]">
                  {layovers.map((layover, index) => (
                    <span key={index}>
                      {layover.iataCode || layover.city}
                      {index < layovers.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs">Arrival</div>
              <div className="font-semibold text-foreground text-sm">{arrivalTime}</div>
              <div className="text-muted-foreground text-xs">Honolulu (HNL)</div>
              {nextDay && (
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
          <div className="font-bold text-foreground text-sm md:text-base">{price}</div>
        </div>
      </div>

      <FlightDetailsPopup open={showDetails} onOpenChange={setShowDetails} />
    </>
  )
}
