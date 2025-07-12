'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/common/ui/button';
import { Plane, Clock, Star, DollarSign, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
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
  price: number;
  stops: number;
  badge?: 'recommended' | 'cheapest' | 'fastest';
  whyChoose?: string[];
  cancellable?: boolean;
}

const mockFlightData: FlightOption[] = [
  {
    id: '1',
    airline: 'IndiGo',
    flightNumber: '6E 2156',
    departure: {
      time: '18:45',
      airport: 'BLR',
      city: 'Bangalore'
    },
    arrival: {
      time: '21:30',
      airport: 'DEL',
      city: 'New Delhi'
    },
    duration: '2h 45m',
    price: 4500,
    stops: 0,
    badge: 'recommended',
    whyChoose: [
      'Fastest and cheapest option',
      'You have traveled with the same flight twice',
      'Lands in the evening, avoiding the office traffic'
    ],
    cancellable: true
  },
  {
    id: '2',
    airline: 'SpiceJet',
    flightNumber: 'SG 8156',
    departure: {
      time: '14:20',
      airport: 'BLR',
      city: 'Bangalore'
    },
    arrival: {
      time: '17:10',
      airport: 'DEL',
      city: 'New Delhi'
    },
    duration: '2h 50m',
    price: 3800,
    stops: 0,
    badge: 'cheapest',
    whyChoose: [
      'Lowest price available',
      'Good timing for business travelers'
    ],
    cancellable: false
  },
  {
    id: '3',
    airline: 'Vistara',
    flightNumber: 'UK 864',
    departure: {
      time: '06:00',
      airport: 'BLR',
      city: 'Bangalore'
    },
    arrival: {
      time: '08:30',
      airport: 'DEL',
      city: 'New Delhi'
    },
    duration: '2h 30m',
    price: 5200,
    stops: 0,
    badge: 'fastest',
    whyChoose: [
      'Shortest flight duration',
      'Early morning arrival',
      'Premium service quality'
    ],
    cancellable: true
  },
  {
    id: '4',
    airline: 'Air India',
    flightNumber: 'AI 2620',
    departure: {
      time: '10:15',
      airport: 'BLR',
      city: 'Bangalore'
    },
    arrival: {
      time: '13:00',
      airport: 'DEL',
      city: 'New Delhi'
    },
    duration: '2h 45m',
    price: 4800,
    stops: 0,
    whyChoose: [
      'National carrier reliability',
      'Mid-day departure timing'
    ],
    cancellable: true
  },
  {
    id: '5',
    airline: 'GoAir',
    flightNumber: 'G8 2266',
    departure: {
      time: '22:30',
      airport: 'BLR',
      city: 'Bangalore'
    },
    arrival: {
      time: '01:15',
      airport: 'DEL',
      city: 'New Delhi'
    },
    duration: '2h 45m',
    price: 3500,
    stops: 0,
    whyChoose: [
      'Late night departure',
      'Budget-friendly option'
    ],
    cancellable: false
  },
  {
    id: '6',
    airline: 'IndiGo',
    flightNumber: '6E 6177',
    departure: {
      time: '12:45',
      airport: 'BLR',
      city: 'Bangalore'
    },
    arrival: {
      time: '16:30',
      airport: 'DEL',
      city: 'New Delhi'
    },
    duration: '3h 45m',
    price: 4200,
    stops: 1,
    whyChoose: [
      'One stop via Mumbai',
      'Affordable with good timing'
    ],
    cancellable: true
  }
];

const getBadgeConfig = (badge: string) => {
  switch (badge) {
    case 'recommended':
      return { icon: Star, text: 'Recommended', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'cheapest':
      return { icon: DollarSign, text: 'Cheapest', color: 'bg-green-100 text-green-800 border-green-200' };
    case 'fastest':
      return { icon: Zap, text: 'Fastest', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    default:
      return null;
  }
};

const FlightCard = ({ flight, onSelect, isLoading }: { flight: FlightOption; onSelect: (flightId: string) => void; isLoading?: boolean }) => {
  const badgeConfig = flight.badge ? getBadgeConfig(flight.badge) : null;
  const [isWhyChooseExpanded, setIsWhyChooseExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-center">
      {/* Badge */}
      {badgeConfig && (
        <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mb-3", badgeConfig.color)}>
          <badgeConfig.icon className="h-3 w-3" />
          {badgeConfig.text}
        </div>
      )}

      {/* Airline and Flight Number */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">{flight.airline}</span>
          <span className="text-sm text-gray-500">{flight.flightNumber}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">₹{flight.price.toLocaleString()}</div>
          <div className="text-xs text-gray-500">per person</div>
        </div>
      </div>

      {/* Flight Route */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{flight.departure.time}</div>
          <div className="text-sm text-gray-600">{flight.departure.airport}</div>
          <div className="text-xs text-gray-500">{flight.departure.city}</div>
        </div>

        <div className="flex-1 mx-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-500">{flight.duration}</span>
          </div>
          <div className="border-t border-gray-300 relative">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </div>
        </div>

        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{flight.arrival.time}</div>
          <div className="text-sm text-gray-600">{flight.arrival.airport}</div>
          <div className="text-xs text-gray-500">{flight.arrival.city}</div>
        </div>
      </div>

      {/* Cancellation Info */}
      <div className="mb-3 flex items-center gap-2">
        <div className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          flight.cancellable
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", flight.cancellable ? "bg-green-500" : "bg-red-500")} />
          {flight.cancellable ? "Free Cancellation" : "Non-Refundable"}
        </div>
      </div>

      {/* Why Choose This - Expandable for all flights with reasons */}
      {flight.whyChoose && flight.whyChoose.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsWhyChooseExpanded(!isWhyChooseExpanded)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Why choose this?</span>
            </div>
            {isWhyChooseExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {isWhyChooseExpanded && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <ul className="space-y-2">
                {flight.whyChoose.map((reason, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-400 mt-1 text-xs">•</span>
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
        onClick={() => onSelect(flight.id)}
        disabled={isLoading}
        className="w-full bg-black text-white hover:bg-gray-900 transition-colors duration-200 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center justify-center gap-2">
          <span>{isLoading ? "Selecting..." : "Select Flight"}</span>
          <span className="font-bold">₹{flight.price.toLocaleString()}</span>
        </span>
      </Button>
    </div>
  );
};

const FlightOptionsWidget = ({ interrupt }: { interrupt: Record<string, any> }) => {
  const thread = useStreamContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllFlights, setShowAllFlights] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleSelectFlight = async (flightId: string) => {
    setSelectedFlight(flightId);
    setIsLoading(true);

    const selectedFlightData = mockFlightData.find(flight => flight.id === flightId);

    const responseData = {
      selectedFlightId: flightId,
      selectedFlight: selectedFlightData,
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
    setShowAllFlights(!showAllFlights);
  };

  // Touch/Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Scroll indicators
  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = 320; // Approximate card width + gap
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-4 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-2xl border border-gray-200" style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Available Flights</h2>
        <p className="text-sm text-gray-600">Swipe to see more options</p>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {(showAllFlights ? mockFlightData : mockFlightData.slice(0, 3)).map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            onSelect={handleSelectFlight}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center gap-2 mt-4 mb-6">
        {(showAllFlights ? mockFlightData : mockFlightData.slice(0, 3)).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToCard(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-200",
              index === currentIndex ? "bg-gray-900" : "bg-gray-300"
            )}
          />
        ))}
      </div>

      {/* Show All Flights Button */}
      <div className="text-center">
        <Button
          onClick={handleShowAllFlights}
          variant="outline"
          className="px-8 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200"
        >
          {showAllFlights ? `Show fewer flights (${mockFlightData.length - 3} hidden)` : `Show all flights (${mockFlightData.length - 3} more)`}
        </Button>
      </div>

      {/* Selection Feedback */}
      {selectedFlight && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Flight {mockFlightData.find(f => f.id === selectedFlight)?.flightNumber} selected!
          </p>
        </div>
      )}
    </div>
  );
};

export default FlightOptionsWidget;