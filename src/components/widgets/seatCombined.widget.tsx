"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Shuffle, MapPin, Plane } from "lucide-react";

interface SeatCombinedWidgetProps {
  usualSeat?: string;
  [key: string]: any;
}

// Generate seat map with static pricing and availability for demo
const generateSeatMap = () => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

  // Hardcoded unavailable seats for demo
  const unavailableSeats = [
    '1C', '1D', '2A', '2F', '3B', '3E', '4C', '4D',
    '5A', '5F', '7B', '7E', '8C', '8D', '10A', '10F',
    '12B', '12E', '15C', '15D', '18A', '18F', '20B', '20E'
  ];

  // Static pricing based on seat position for consistent pricing
  const getPriceForSeat = (seatId: string, row: number) => {
    if (unavailableSeats.includes(seatId)) return 0;

    // Window seats (A, F) are premium
    if (seatId.endsWith('A') || seatId.endsWith('F')) {
      return row <= 10 ? 500 : 400; // Front window seats more expensive
    }

    // Aisle seats (C, D) are mid-tier
    if (seatId.endsWith('C') || seatId.endsWith('D')) {
      return row <= 10 ? 400 : 350;
    }

    // Middle seats (B, E) - some free, some paid
    if (row % 3 === 0) return 0; // Every 3rd row is free for middle seats
    return row <= 15 ? 350 : 0; // Front middle seats paid, back ones free
  };

  const seats = [];
  for (let num of seatNumbers) {
    for (let row of rows) {
      const seatId = `${num}${row}`;
      const isUnavailable = unavailableSeats.includes(seatId);
      const price = getPriceForSeat(seatId, num);

      seats.push({
        id: seatId,
        row: num,
        seat: row,
        status: isUnavailable ? 'unavailable' : 'available',
        price,
        isAisle: row === 'C' || row === 'D',
        isWindow: row === 'A' || row === 'F'
      });
    }
  }

  return seats;
};

const SeatCombinedWidget: React.FC<SeatCombinedWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [hoveredSeat, setHoveredSeat] = useState<string>("");

  const usualSeat = args.usualSeat || "14F";
  const seats = useMemo(() => generateSeatMap(), []); // Memoize to prevent regeneration
  const seatRows = Array.from(new Set(seats.map(s => s.row))).sort((a, b) => a - b);

  // Get a random free seat
  const getRandomFreeSeat = () => {
    const freeSeats = seats.filter(seat => seat.status === 'available' && seat.price === 0);
    if (freeSeats.length > 0) {
      const randomIndex = Math.floor(Math.random() * freeSeats.length);
      return freeSeats[randomIndex];
    }
    return null;
  };

  const handleUsualSeatSelect = async () => {
    setIsLoading(true);

    const responseData = {
      seatNumber: usualSeat,
      price: 350,
      type: "paid",
      option: "usual_seat"
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting usual seat selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomFreeSeat = async () => {
    setIsLoading(true);
    
    const randomSeat = getRandomFreeSeat();
    if (!randomSeat) {
      console.error("No free seats available");
      setIsLoading(false);
      return;
    }

    const responseData = {
      seatNumber: randomSeat.id,
      price: 0,
      type: "free",
      option: "random_free_seat"
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting random free seat selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseSeatMap = () => {
    setSelectedOption("browse");
    setShowSeatMap(true);
  };

  const handleSeatClick = (seat: any) => {
    if (seat.status === 'available') {
      setSelectedSeat(seat.id);
      setSelectedPrice(seat.price);
    }
  };

  const handleSeatMapSubmit = async () => {
    if (!selectedSeat) return;

    setIsLoading(true);

    const responseData = {
      seatNumber: selectedSeat,
      price: selectedPrice,
      type: selectedPrice === 0 ? "free" : "paid",
      option: "browse_seat_map"
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting seat selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeatColor = (seat: any) => {
    if (seat.id === selectedSeat) {
      return "bg-blue-500 text-white border-blue-500";
    }
    if (seat.status === 'available') {
      return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer";
    }
    return "bg-red-100 text-red-800 border-red-300 cursor-not-allowed";
  };

  return (
    <>
      <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Seat Option</h2>
          <p className="text-gray-600">Select one of the following seat options</p>
        </div>

        <form className="space-y-3">
          {/* Option 1: Select Usual Seat */}
          <label className={cn(
            "flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all",
            selectedOption === "usual"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}>
            <input
              type="radio"
              name="seatOption"
              value="usual"
              checked={selectedOption === "usual"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Select Usual Seat</div>
              <div className="text-sm text-gray-500">Seat {usualSeat} - ₹350</div>
            </div>
          </label>

          {/* Option 2: Browse Seat Map */}
          <label className={cn(
            "flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all",
            selectedOption === "browse"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}>
            <input
              type="radio"
              name="seatOption"
              value="browse"
              checked={selectedOption === "browse"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Browse Seat Map</div>
              <div className="text-sm text-gray-500">Choose from available seats</div>
            </div>
          </label>

          {/* Option 3: Random Free Seat */}
          <label className={cn(
            "flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all",
            selectedOption === "random"
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}>
            <input
              type="radio"
              name="seatOption"
              value="random"
              checked={selectedOption === "random"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
            />
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Shuffle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Random Free Seat</div>
              <div className="text-sm text-gray-500">Get any available free seat</div>
            </div>
          </label>
        </form>

        {/* Action Button */}
        <div className="mt-6">
          <Button
            onClick={() => {
              if (selectedOption === "usual") {
                handleUsualSeatSelect();
              } else if (selectedOption === "browse") {
                handleBrowseSeatMap();
              } else if (selectedOption === "random") {
                handleRandomFreeSeat();
              }
            }}
            disabled={!selectedOption || isLoading}
            className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed py-3 text-base font-medium"
          >
            {isLoading ? "Processing..." :
             selectedOption === "usual" ? `Choose Seat ${usualSeat}` :
             selectedOption === "browse" ? "Browse Seats" :
             selectedOption === "random" ? "Get Random Free Seat" :
             "Select an Option"}
          </Button>
        </div>
      </div>

      {/* Seat Map Bottom Sheet */}
      <Sheet open={showSeatMap} onOpenChange={setShowSeatMap}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Select Your Seat</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            {/* Legend */}
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 border border-blue-500 rounded"></div>
                <span>Selected</span>
              </div>
            </div>

            {/* Seat Map */}
            <div className="mb-6 overflow-x-auto">
              <div className="min-w-max">
                {/* Header with seat letters */}
                <div className="flex justify-center mb-2">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 flex items-center justify-center text-sm font-medium"></div>
                    {['A', 'B', 'C'].map(letter => (
                      <div key={letter} className="w-8 h-8 flex items-center justify-center text-sm font-medium">
                        {letter}
                      </div>
                    ))}
                    <div className="w-4"></div> {/* Aisle space */}
                    {['D', 'E', 'F'].map(letter => (
                      <div key={letter} className="w-8 h-8 flex items-center justify-center text-sm font-medium">
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seat rows */}
                <div className="space-y-1">
                  {seatRows.map(rowNum => {
                    const rowSeats = seats.filter(s => s.row === rowNum);
                    const leftSeats = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.seat));
                    const rightSeats = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.seat));

                    return (
                      <div key={rowNum} className="flex justify-center">
                        <div className="flex gap-1 items-center">
                          {/* Row number */}
                          <div className="w-8 h-8 flex items-center justify-center text-sm font-medium">
                            {rowNum}
                          </div>

                          {/* Left side seats (A, B, C) */}
                          {leftSeats.map(seat => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat.id)}
                              onMouseLeave={() => setHoveredSeat("")}
                              disabled={seat.status === 'unavailable'}
                              className={cn(
                                "w-8 h-8 text-xs font-medium border rounded transition-colors relative",
                                getSeatColor(seat)
                              )}
                              title={`Seat ${seat.id} - ${seat.price === 0 ? 'Free' : `₹${seat.price}`}`}
                            >
                              {seat.seat}
                              {seat.price > 0 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full text-[8px] flex items-center justify-center text-black font-bold">
                                  ₹
                                </div>
                              )}
                            </button>
                          ))}

                          {/* Aisle space */}
                          <div className="w-4 flex items-center justify-center">
                            <div className="w-px h-6 bg-gray-300"></div>
                          </div>

                          {/* Right side seats (D, E, F) */}
                          {rightSeats.map(seat => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat.id)}
                              onMouseLeave={() => setHoveredSeat("")}
                              disabled={seat.status === 'unavailable'}
                              className={cn(
                                "w-8 h-8 text-xs font-medium border rounded transition-colors relative",
                                getSeatColor(seat)
                              )}
                              title={`Seat ${seat.id} - ${seat.price === 0 ? 'Free' : `₹${seat.price}`}`}
                            >
                              {seat.seat}
                              {seat.price > 0 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full text-[8px] flex items-center justify-center text-black font-bold">
                                  ₹
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected seat info and submit button */}
            {selectedSeat && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="font-medium">Selected Seat: {selectedSeat}</div>
                    <div className="text-sm text-gray-600">
                      {selectedPrice === 0 ? 'Free' : `₹${selectedPrice}`}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSeatMapSubmit}
                  disabled={isLoading}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {isLoading ? "Confirming..." : "Confirm Seat Selection"}
                </Button>
              </div>
            )}

            {/* Close button */}
            <Button
              onClick={() => setShowSeatMap(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SeatCombinedWidget;
