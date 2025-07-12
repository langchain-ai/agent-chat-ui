"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/ui/select";
import { Calendar as CalendarIcon, ArrowUpDown } from "lucide-react";
import { AirportSearch } from "@/components/common/ui/airportSearch";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

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
  const selectedTravellerIds = args.selectedTravellerIds || [];
  const allTravellers = args.allTravellers || [];

  // Initialize state from args
  const [tripType, setTripType] = useState<"oneway" | "round">(
    flightSearchCriteria.isRoundTrip ? "round" : "oneway",
  );
  const [pax, setPax] = useState(
    (flightSearchCriteria.adults || 0) +
      (flightSearchCriteria.children || 0) +
      (flightSearchCriteria.infants || 0) || 1,
  );
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
        adults: pax,
        children: 0,
        infants: 0,
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

  return (
    <div
      className="mx-auto mt-4 max-w-xl rounded-2xl border border-gray-200 bg-white p-4 font-sans shadow-lg sm:mt-10 sm:p-6"
      style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        {/* Trip Type - Lounge-style tabs */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTripType("oneway")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm",
              tripType === "oneway"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
            )}
          >
            One Way
          </button>
          <button
            type="button"
            onClick={() => setTripType("round")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm",
              tripType === "round"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900",
            )}
          >
            Round Trip
          </button>
        </div>

        {/* From/To with Switch Button */}
        <div className="flex flex-col items-end gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1">
            <Label
              htmlFor="from"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              From
            </Label>
            <AirportSearch
              value={fromAirport}
              onValueChange={setFromAirport}
              placeholder="City or Airport"
              excludeAirport={toAirport}
            />
          </div>

          {/* Switch Button */}
          <div className="flex justify-center sm:px-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-10 flex-shrink-0 rounded-full border-gray-300 p-0 hover:bg-gray-50"
              onClick={handleSwapAirports}
            >
              <ArrowUpDown className="h-4 w-4 rotate-90 text-gray-600" />
            </Button>
          </div>

          <div className="flex-1">
            <Label
              htmlFor="to"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              To
            </Label>
            <AirportSearch
              value={toAirport}
              onValueChange={setToAirport}
              placeholder="City or Airport"
              excludeAirport={fromAirport}
            />
          </div>
        </div>

        {/* Dates and Pax/Class - Conditional Layout */}
        {tripType === "round" ? (
          <>
            {/* Round Trip: Dates Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <Label
                  htmlFor="departure"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Departure
                </Label>
                <DateInput
                  date={departureDate}
                  onDateChange={handleDepartureDateChange}
                  placeholder="Select departure date"
                />
              </div>
              <div className="flex-1">
                <Label
                  htmlFor="return"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Return
                </Label>
                <DateInput
                  date={returnDate}
                  onDateChange={handleReturnDateChange}
                  placeholder="Select return date"
                />
              </div>
            </div>
            {/* Round Trip: Pax and Class Row */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-24 sm:w-32">
                <Label
                  htmlFor="passengers"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Passengers
                </Label>
                <Select
                  value={pax.toString()}
                  onValueChange={(value) => setPax(Number(value))}
                >
                  <SelectTrigger className="w-full text-sm focus:border-black focus:ring-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                      >
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label
                  htmlFor="class"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Class
                </Label>
                <Select
                  value={flightClass}
                  onValueChange={setFlightClass}
                >
                  <SelectTrigger className="w-full text-sm focus:border-black focus:ring-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Economy">Economy</SelectItem>
                    <SelectItem value="Premium Economy">
                      Premium Economy
                    </SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="First">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : (
          /* One Way: Departure date, passengers and class in same line */
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1 sm:flex-[2]">
              <Label
                htmlFor="departure-oneway"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Departure
              </Label>
              <DateInput
                date={departureDate}
                onDateChange={handleDepartureDateChange}
                placeholder="Select departure date"
              />
            </div>
            <div className="w-full sm:w-24 sm:flex-shrink-0">
              <Label
                htmlFor="passengers-oneway"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Passengers
              </Label>
              <Select
                value={pax.toString()}
                onValueChange={(value) => setPax(Number(value))}
              >
                <SelectTrigger className="w-full text-sm focus:border-black focus:ring-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                    <SelectItem
                      key={num}
                      value={num.toString()}
                    >
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label
                htmlFor="class-oneway"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Class
              </Label>
              <Select
                value={flightClass}
                onValueChange={setFlightClass}
              >
                <SelectTrigger className="w-full text-sm focus:border-black focus:ring-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy">Economy</SelectItem>
                  <SelectItem value="Premium Economy">
                    Premium Economy
                  </SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="First">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-4 min-h-[48px] w-auto bg-black px-8 py-3 text-base font-bold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-2 sm:min-h-[40px] sm:text-base"
          >
            {isLoading ? "Searching..." : "Search Flights"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchCriteriaWidget;
