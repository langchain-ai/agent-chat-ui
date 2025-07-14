"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Calendar as CalendarIcon, ArrowUpDown, Plus, Minus } from "lucide-react";
import { AirportSearch } from "@/components/common/ui/airportSearch";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Simple DateInput component
interface DateInputProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

const DateInput = ({
  date,
  onDateChange,
  placeholder,
  className,
}: DateInputProps) => {
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange?.(new Date(value));
    } else {
      onDateChange?.(undefined);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="relative">
      <CalendarIcon className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
      <Input
        type="date"
        value={formatDateForInput(date)}
        onChange={handleDateChange}
        min={today}
        className={cn(
          "w-full cursor-pointer pl-10 focus:border-black focus:ring-black",
          className,
        )}
      />
    </div>
  );
};

const SearchCriteriaWidget = (args: Record<string, any>) => {
  const thread = useStreamContext();

  // Extract data from args
  const flightSearchCriteria = args.flightSearchCriteria || {};

  // Initialize state from args
  const [tripType, setTripType] = useState<"oneway" | "round">(
    flightSearchCriteria.isRoundTrip ? "round" : "oneway",
  );

  // Separate traveller counts
  const [adults, setAdults] = useState(flightSearchCriteria.adults || 1);
  const [children, setChildren] = useState(flightSearchCriteria.children || 0);
  const [infants, setInfants] = useState(flightSearchCriteria.infants || 0);

  const [flightClass, setFlightClass] = useState(
    flightSearchCriteria.class
      ? flightSearchCriteria.class.charAt(0).toUpperCase() +
      flightSearchCriteria.class.slice(1)
      : "Economy",
  );
  const [fromAirport, setFromAirport] = useState<string>(
    flightSearchCriteria.originAirport || "",
  );
  const [toAirport, setToAirport] = useState<string>(
    flightSearchCriteria.destinationAirport || "",
  );
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    flightSearchCriteria.departureDate
      ? new Date(flightSearchCriteria.departureDate)
      : undefined,
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    flightSearchCriteria.returnDate ? new Date(flightSearchCriteria.returnDate) : undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showTravellerSheet, setShowTravellerSheet] = useState(false);

  // Wrapper functions for date state setters to match DateInput component interface
  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);
  };

  const handleReturnDateChange = (date: Date | undefined) => {
    setReturnDate(date);
  };

  const handleSwapAirports = () => {
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const responseData = {
      flightSearchCriteria: {
        adults,
        children,
        infants,
        class: flightClass.toLowerCase(),
        departureDate: departureDate?.toISOString().split("T")[0],
        returnDate: returnDate?.toISOString().split("T")[0],
        destinationAirport: toAirport,
        originAirport: fromAirport,
        isRoundTrip: tripType === "round",
        passengers: [{ id: 1, type: "adult" }],
      },
      selectedTravellerIds: [],
      allTravellers: [],
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting interrupt response:", error);
      // Optional: already handled inside the utility
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for traveller counts
  const getTotalTravellers = () => adults + children + infants;

  const formatTravellerText = () => {
    const total = getTotalTravellers();
    if (total === 1 && adults === 1) {
      return `1 Adult, ${flightClass}`;
    }

    const parts = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
    if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`);

    return `${parts.join(', ')}, ${flightClass}`;
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return '';
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getSelectedAirportInfo = (airportCode: string) => {
    // This should match the POPULAR_AIRPORTS from AirportSearch
    const airports = [
      { code: "BLR", city: "Bangalore" },
      { code: "DEL", city: "New Delhi" },
      { code: "BOM", city: "Mumbai" },
      { code: "MAA", city: "Chennai" },
      { code: "CCU", city: "Kolkata" },
      { code: "HYD", city: "Hyderabad" },
      { code: "COK", city: "Kochi" },
      { code: "AMD", city: "Ahmedabad" },
      { code: "PNQ", city: "Pune" },
      { code: "GOI", city: "Goa" },
      { code: "DXB", city: "Dubai" },
      { code: "SIN", city: "Singapore" },
      { code: "LHR", city: "London" },
      { code: "JFK", city: "New York" },
      { code: "LAX", city: "Los Angeles" },
    ];

    return airports.find(airport => airport.code === airportCode);
  };

  return (
    <>
      <div
        className="mx-auto mt-2 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-3 font-sans shadow-lg sm:mt-10 sm:p-6"
        style={{
          fontFamily: "Uber Move, Arial, Helvetica, sans-serif",
          maxWidth: "min(100vw - 1rem, 36rem)"
        }}
      >
        <form
          className="w-full space-y-4"
          onSubmit={handleSubmit}
        >
          {/* Trip Type - Horizontal tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTripType("oneway")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                tripType === "oneway"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
              )}
            >
              One way
            </button>
            <button
              type="button"
              onClick={() => setTripType("round")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                tripType === "round"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
              )}
            >
              Round trip
            </button>
          </div>

          {/* Flight Details - From/To with city names and IATA codes */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 mb-1">From - {getSelectedAirportInfo(fromAirport)?.code || 'DEL'}</div>
              <div className="font-bold text-base sm:text-lg text-black truncate">
                {getSelectedAirportInfo(fromAirport)?.city || 'New Delhi'}
              </div>
              <div className="mt-2">
                <AirportSearch
                  value={fromAirport}
                  onValueChange={setFromAirport}
                  placeholder="City or Airport"
                  excludeAirport={toAirport}
                />
              </div>
            </div>

            {/* Swap Button - Centered */}
            <div className="flex justify-center flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-10 rounded-full border-gray-300 bg-white p-0 hover:bg-gray-50 hover:border-gray-400"
                onClick={handleSwapAirports}
              >
                <ArrowUpDown className="h-4 w-4 rotate-90 text-gray-600" />
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 mb-1 text-right">To - {getSelectedAirportInfo(toAirport)?.code || 'BOM'}</div>
              <div className="font-bold text-base sm:text-lg text-black text-right truncate">
                {getSelectedAirportInfo(toAirport)?.city || 'Mumbai'}
              </div>
              <div className="mt-2">
                <AirportSearch
                  value={toAirport}
                  onValueChange={setToAirport}
                  placeholder="City or Airport"
                  excludeAirport={fromAirport}
                />
              </div>
            </div>
          </div>

          {/* Departure Date */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Departure</div>
            <div className="font-bold text-lg text-black mb-2">
              {formatDateDisplay(departureDate) || 'Tue, 15 Jul'}
            </div>
            <DateInput
              date={departureDate}
              onDateChange={handleDepartureDateChange}
              placeholder="Select departure date"
            />
          </div>

          {/* Return Date - Only show for round trip */}
          {tripType === "round" && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Return</div>
              <div className="font-bold text-lg text-black mb-2">
                {returnDate ? formatDateDisplay(returnDate) : ''}
              </div>
              <DateInput
                date={returnDate}
                onDateChange={handleReturnDateChange}
                placeholder="Select return date"
              />
            </div>
          )}

          {/* Travellers & Class - Clickable to open bottom sheet */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Travellers & Class</div>
            <button
              type="button"
              onClick={() => setShowTravellerSheet(true)}
              className="font-bold text-lg text-black hover:text-gray-700 transition-colors text-left"
            >
              {formatTravellerText()}
            </button>
          </div>

          {/* Search Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg text-base"
            >
              {isLoading ? "Searching..." : "Search flights"}
            </Button>
          </div>
        </form>
      </div>

      {/* Bottom Sheet for Traveller & Class Selection */}
      <Sheet open={showTravellerSheet} onOpenChange={setShowTravellerSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto px-4 sm:px-6">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">Travellers & Class</SheetTitle>
            <div className="text-left text-sm text-gray-600">{formatTravellerText()}</div>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            {/* Select travellers */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select travellers</h3>

              {/* Adults */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">Adult</div>
                  <div className="text-sm text-gray-500">12+ Years</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{adults}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setAdults(adults + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">Children</div>
                  <div className="text-sm text-gray-500">2 - 12 yrs</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    disabled={children <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{children}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setChildren(children + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">Infant</div>
                  <div className="text-sm text-gray-500">Below 2 yrs</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setInfants(Math.max(0, infants - 1))}
                    disabled={infants <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{infants}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setInfants(infants + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Select class */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select class</h3>
              <div className="space-y-3">
                {['Economy', 'Business', 'Premium Economy'].map((classOption) => (
                  <label key={classOption} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="flightClass"
                      value={classOption}
                      checked={flightClass === classOption}
                      onChange={(e) => setFlightClass(e.target.value)}
                      className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="font-medium">{classOption}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SearchCriteriaWidget;
