'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/ui/button';
import { Input } from '@/components/common/ui/input';
import { Label } from '@/components/common/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/ui/select';
import { Calendar as CalendarIcon, ArrowUpDown } from 'lucide-react';
import { AirportSearch } from '@/components/common/ui/airportSearch';
import { cn } from '@/lib/utils';
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

// Simple DateInput component
interface DateInputProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

const DateInput = ({ date, onDateChange, placeholder, className }: DateInputProps) => {
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange?.(new Date(value));
    } else {
      onDateChange?.(undefined);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative">
      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none z-10" />
      <Input
        type="date"
        value={formatDateForInput(date)}
        onChange={handleDateChange}
        min={today}
        className={cn("w-full focus:ring-black focus:border-black cursor-pointer pl-10", className)}
      />
    </div>
  );
};

const FlightSearchWidget = ({ interrupt }: { interrupt: Record<string, any> }) => {
  const thread = useStreamContext();
  const [tripType, setTripType] = useState<'oneway' | 'round'>('oneway');
  const [pax, setPax] = useState(1);
  const [flightClass, setFlightClass] = useState('Economy');
  const [fromAirport, setFromAirport] = useState<string>('');
  const [toAirport, setToAirport] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwapAirports = () => {
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const responseData = {
      tripType,
      fromAirport,
      toAirport,
      departureDate: departureDate?.toISOString(),
      returnDate: returnDate?.toISOString(),
      passengers: pax,
      flightClass,
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error) {
      // Optional: already handled inside the utility
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-4 sm:mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-lg border border-gray-200 font-sans" style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Trip Type - Lounge-style tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTripType('oneway')}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 border",
              tripType === 'oneway'
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900"
            )}
          >
            One Way
          </button>
          <button
            type="button"
            onClick={() => setTripType('round')}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 border",
              tripType === 'round'
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900"
            )}
          >
            Round Trip
          </button>
        </div>

        {/* From/To with Switch Button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">From</Label>
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
              className="h-10 w-10 p-0 rounded-full border-gray-300 hover:bg-gray-50 flex-shrink-0"
              onClick={handleSwapAirports}
            >
              <ArrowUpDown className="h-4 w-4 text-gray-600 rotate-90" />
            </Button>
          </div>

          <div className="flex-1">
            <Label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">To</Label>
            <AirportSearch
              value={toAirport}
              onValueChange={setToAirport}
              placeholder="City or Airport"
              excludeAirport={fromAirport}
            />
          </div>
        </div>

        {/* Dates and Pax/Class - Conditional Layout */}
        {tripType === 'round' ? (
          <>
            {/* Round Trip: Dates Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Label htmlFor="departure" className="block text-sm font-medium text-gray-700 mb-1">Departure</Label>
                <DateInput
                  date={departureDate}
                  onDateChange={setDepartureDate}
                  placeholder="Select departure date"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="return" className="block text-sm font-medium text-gray-700 mb-1">Return</Label>
                <DateInput
                  date={returnDate}
                  onDateChange={setReturnDate}
                  placeholder="Select return date"
                />
              </div>
            </div>
            {/* Round Trip: Pax and Class Row */}
            <div className="flex gap-3 sm:gap-4">
              <div className="w-24 sm:w-32">
                <Label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">Passengers</Label>
                <Select value={pax.toString()} onValueChange={(value) => setPax(Number(value))}>
                  <SelectTrigger className="w-full focus:ring-black focus:border-black text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">Class</Label>
                <Select value={flightClass} onValueChange={setFlightClass}>
                  <SelectTrigger className="w-full focus:ring-black focus:border-black text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Economy">Economy</SelectItem>
                    <SelectItem value="Premium Economy">Premium Economy</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="First">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : (
          /* One Way: Departure date, passengers and class in same line */
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 sm:flex-[2]">
              <Label htmlFor="departure-oneway" className="block text-sm font-medium text-gray-700 mb-1">Departure</Label>
              <DateInput
                date={departureDate}
                onDateChange={setDepartureDate}
                placeholder="Select departure date"
              />
            </div>
            <div className="w-full sm:w-24 sm:flex-shrink-0">
              <Label htmlFor="passengers-oneway" className="block text-sm font-medium text-gray-700 mb-1">Passengers</Label>
              <Select value={pax.toString()} onValueChange={(value) => setPax(Number(value))}>
                <SelectTrigger className="w-full focus:ring-black focus:border-black text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="class-oneway" className="block text-sm font-medium text-gray-700 mb-1">Class</Label>
              <Select value={flightClass} onValueChange={setFlightClass}>
                <SelectTrigger className="w-full focus:ring-black focus:border-black text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy">Economy</SelectItem>
                  <SelectItem value="Premium Economy">Premium Economy</SelectItem>
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
            className="w-auto px-8 py-3 mt-4 sm:mt-2 bg-black text-white font-bold hover:bg-gray-900 text-base sm:text-base min-h-[48px] sm:min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Searching..." : "Search Flights"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FlightSearchWidget;
