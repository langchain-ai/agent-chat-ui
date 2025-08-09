"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/common/ui/button";
import { Plus, Minus, CalendarIcon } from "lucide-react";
import { AirportCombobox } from "@/components/common/ui/airportCombobox";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useTabContext } from "@/providers/TabContext";
import {submitInterruptResponse} from "./util";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getUserLocation, LocationResult } from "@/lib/utils";

// DateInput component using shadcn Calendar
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
  const [isOpen, setIsOpen] = useState(false);

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return placeholder || "Select date";
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal focus:border-black focus:ring-black",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateDisplay(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate: Date | undefined) => {
            onDateChange?.(selectedDate);
            setIsOpen(false);
          }}
          disabled={(date: Date) => date < today}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

const SearchCriteriaWidget = (args: Record<string, any>) => {
  const thread = useStreamContext();
  const { switchToChat } = useTabContext();

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
  // Helper function to get tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  // Helper function to check if a date is in the past
  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const [departureDate, setDepartureDate] = useState<Date | undefined>(() => {
    if (flightSearchCriteria.departureDate) {
      const serverDate = new Date(flightSearchCriteria.departureDate);
      // If server date is in the past, use tomorrow's date instead
      return isDateInPast(serverDate) ? getTomorrowDate() : serverDate;
    }
    return undefined;
  });

  const [returnDate, setReturnDate] = useState<Date | undefined>(() => {
    if (flightSearchCriteria.returnDate) {
      const serverDate = new Date(flightSearchCriteria.returnDate);
      // If server date is in the past, use tomorrow's date instead
      return isDateInPast(serverDate) ? getTomorrowDate() : serverDate;
    }
    return undefined;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTravellerDropdown, setShowTravellerDropdown] = useState(false);

  // Location-related state
  const [locationResult, setLocationResult] = useState<LocationResult | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Request user location when component loads
  useEffect(() => {
    const requestLocation = async () => {
      setIsGettingLocation(true);
      try {
        const result = await getUserLocation();
        setLocationResult(result);

        if (result.success) {
          console.log("Location obtained successfully:", result.data);
          // You can use the location data here if needed
          // For example, to find nearby airports or set default location
        } else {
          console.log("Location request failed:", result.error);
        }
      } catch (error) {
        console.error("Unexpected error getting location:", error);
        setLocationResult({
          success: false,
          error: {
            code: -1,
            message: "Unexpected error occurred while getting location"
          }
        });
      } finally {
        setIsGettingLocation(false);
      }
    };

    requestLocation();
  }, [setLocationResult, setIsGettingLocation]); // Dependencies to avoid warnings

  // Wrapper functions for date state setters to match DateInput component interface
  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);
  };

  const handleReturnDateChange = (date: Date | undefined) => {
    setReturnDate(date);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Ensure departure date is not in the past
    let finalDepartureDate = departureDate;
    if (finalDepartureDate && isDateInPast(finalDepartureDate)) {
      finalDepartureDate = getTomorrowDate();
    }

    // Ensure return date is not in the past
    let finalReturnDate = returnDate;
    if (finalReturnDate && isDateInPast(finalReturnDate)) {
      finalReturnDate = getTomorrowDate();
    }

    const responseData = {
      flightSearchCriteria: {
        adults,
        children,
        infants,
        class: flightClass.toLowerCase(),
        departureDate: finalDepartureDate?.toISOString().split("T")[0],
        returnDate: finalReturnDate?.toISOString().split("T")[0],
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



  return (
    <>
      <div
        className="mx-auto mt-2 w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg rounded-2xl border border-gray-200 bg-white p-3 font-sans shadow-lg sm:mt-10 sm:p-6"
        style={{
          fontFamily: "Uber Move, Arial, Helvetica, sans-serif"
        }}
      >
        <form
          className="w-full space-y-4 sm:space-y-4"
          onSubmit={handleSubmit}
        >
          {/* Trip Type - Horizontal tabs */}
          {/* <div className="flex gap-2">
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
           
          </div> */}

          {/* Flight Details - From/To */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1">
              <AirportCombobox
                value={fromAirport}
                onValueChange={setFromAirport}
                placeholder="From - City or Airport"
                excludeAirport={toAirport}
              />
            </div>

            <div className="flex-1">
              <AirportCombobox
                value={toAirport}
                onValueChange={setToAirport}
                placeholder="To - City or Airport"
                excludeAirport={fromAirport}
              />
            </div>
          </div>

          {/* Date Inputs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {/* Departure Date */}
            <div className="flex-1">
              <DateInput
                date={departureDate}
                onDateChange={handleDepartureDateChange}
                placeholder="Select departure date"
              />
            </div>

            {/* Return Date - Only show for round trip */}
            {tripType === "round" && (
              <div className="flex-1">
                <DateInput
                  date={returnDate}
                  onDateChange={handleReturnDateChange}
                  placeholder="Select return date"
                />
              </div>
            )}
          </div>

          {/* Travellers & Class - Dropdown */}
          <div>
            <Popover open={showTravellerDropdown} onOpenChange={setShowTravellerDropdown}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={showTravellerDropdown}
                  className="w-full justify-between focus:ring-black focus:border-black"
                >
                  <span>{formatTravellerText()}</span>
                  <span className="ml-2 text-gray-400">▼</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] sm:w-[380px] md:w-[420px] p-0">
                <div className="p-4 space-y-6">
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
              </PopoverContent>
            </Popover>
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


    </>
  );
};

export default SearchCriteriaWidget;
