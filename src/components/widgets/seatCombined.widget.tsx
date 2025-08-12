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

interface SeatCombinedWidgetProps {
  usualSeat?: string;
  [key: string]: any;
}

// Generate seat map with static pricing and availability for demo
const generateSeatMap = () => {
  const rows = ["A", "B", "C", "D", "E", "F"];
  const seatNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

  // Hardcoded unavailable seats for demo
  const unavailableSeats = [
    "1C",
    "1D",
    "2A",
    "2F",
    "3B",
    "3E",
    "4C",
    "4D",
    "5A",
    "5F",
    "7B",
    "7E",
    "8C",
    "8D",
    "10A",
    "10F",
    "12B",
    "12E",
    "15C",
    "15D",
    "18A",
    "18F",
    "20B",
    "20E",
  ];

  // Static pricing based on seat position for consistent pricing
  const getPriceForSeat = (seatId: string, row: number) => {
    if (unavailableSeats.includes(seatId)) return 0;

    // Window seats (A, F) are premium
    if (seatId.endsWith("A") || seatId.endsWith("F")) {
      return row <= 10 ? 500 : 400; // Front window seats more expensive
    }

    // Aisle seats (C, D) are mid-tier
    if (seatId.endsWith("C") || seatId.endsWith("D")) {
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
        status: isUnavailable ? "unavailable" : "available",
        price,
        isAisle: row === "C" || row === "D",
        isWindow: row === "A" || row === "F",
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
  const seatRows = Array.from(new Set(seats.map((s) => s.row))).sort(
    (a, b) => a - b,
  );

  // Get a random free seat
  const getRandomFreeSeat = () => {
    const freeSeats = seats.filter(
      (seat) => seat.status === "available" && seat.price === 0,
    );
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
      option: "usual_seat",
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
      option: "random_free_seat",
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
    if (seat.status === "available") {
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
      option: "browse_seat_map",
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
      return "bg-black text-white border-black";
    }
    if (seat.status === "available") {
      return "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400 cursor-pointer";
    }
    return "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed";
  };

  return (
    <>
      <div
        className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6"
        style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
      >
        <div className="mb-4 text-center sm:mb-6">
          <h2 className="mb-1 text-xl font-bold text-black sm:mb-2 sm:text-2xl">
            Choose Your Seat
          </h2>
          <p className="text-sm text-gray-600">
            Select the option that works best for you
          </p>
        </div>

        <form className="space-y-2 sm:space-y-3">
          {/* Option 1: Select Usual Seat */}
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-md sm:gap-4 sm:p-5",
              selectedOption === "usual"
                ? "border-black bg-gray-50 shadow-md"
                : "border-gray-200 hover:border-gray-300",
            )}
          >
            <input
              type="radio"
              name="seatOption"
              value="usual"
              checked={selectedOption === "usual"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="h-4 w-4 flex-shrink-0 border-gray-300 text-black focus:ring-2 focus:ring-black sm:h-5 sm:w-5"
            />
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-black sm:text-lg">
                Your Usual Seat
              </div>
              <div className="text-sm text-gray-600">
                Seat {usualSeat}
                <span className="hidden sm:inline"> • Premium location</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-black sm:text-xl">
                ₹350
              </div>
              <div className="hidden text-xs text-gray-500 sm:block">
                Premium
              </div>
            </div>
          </label>

          {/* Option 2: Browse Seat Map */}
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-md sm:gap-4 sm:p-5",
              selectedOption === "browse"
                ? "border-black bg-gray-50 shadow-md"
                : "border-gray-200 hover:border-gray-300",
            )}
          >
            <input
              type="radio"
              name="seatOption"
              value="browse"
              checked={selectedOption === "browse"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="h-4 w-4 flex-shrink-0 border-gray-300 text-black focus:ring-2 focus:ring-black sm:h-5 sm:w-5"
            />
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-black sm:text-lg">
                Browse Seat Map
              </div>
              <div className="text-sm text-gray-600">
                Choose from available seats
                <span className="hidden sm:inline"> • View full layout</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-black">From ₹0</div>
              <div className="hidden text-xs text-gray-500 sm:block">
                Varies by seat
              </div>
            </div>
          </label>

          {/* Option 3: Random Free Seat */}
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-md sm:gap-4 sm:p-5",
              selectedOption === "random"
                ? "border-black bg-gray-50 shadow-md"
                : "border-gray-200 hover:border-gray-300",
            )}
          >
            <input
              type="radio"
              name="seatOption"
              value="random"
              checked={selectedOption === "random"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="h-4 w-4 flex-shrink-0 border-gray-300 text-black focus:ring-2 focus:ring-black sm:h-5 sm:w-5"
            />
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-black sm:text-lg">
                Auto Assign Seat
              </div>
              <div className="text-sm text-gray-600">
                Best available free seat
                <span className="hidden sm:inline"> • No extra cost</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-green-600 sm:text-xl">
                FREE
              </div>
              <div className="hidden text-xs text-gray-500 sm:block">
                No charge
              </div>
            </div>
          </label>
        </form>

        {/* Action Button */}
        <div className="mt-6 sm:mt-8">
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
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl disabled:bg-gray-300 disabled:text-gray-500 sm:py-4 sm:text-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-5 sm:w-5"></div>
                <span>Processing...</span>
              </div>
            ) : selectedOption === "usual" ? (
              `Confirm Seat ${usualSeat}`
            ) : selectedOption === "browse" ? (
              "View Seat Map"
            ) : selectedOption === "random" ? (
              "Assign Free Seat"
            ) : (
              "Choose an Option Above"
            )}
          </Button>
        </div>
      </div>

      {/* Seat Map Bottom Sheet */}
      <Sheet
        open={showSeatMap}
        onOpenChange={setShowSeatMap}
      >
        <SheetContent
          side="bottom"
          className="flex h-[85vh] flex-col p-0"
        >
          <SheetHeader className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <SheetTitle className="text-xl font-bold text-black">
              Select Your Seat
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Legend */}
            <div className="mb-8 flex justify-center gap-8 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg border-2 border-gray-300 bg-white shadow-sm"></div>
                <span className="font-medium text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg border-2 border-gray-400 bg-gray-300"></div>
                <span className="font-medium text-gray-700">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg border-2 border-black bg-black"></div>
                <span className="font-medium text-gray-700">Selected</span>
              </div>
            </div>

            {/* Seat Map */}
            <div className="mb-20 overflow-x-auto">
              <div className="min-w-max">
                {/* Header with seat letters */}
                <div className="mb-4 flex justify-center">
                  <div className="flex gap-1">
                    <div className="flex h-8 w-10 items-center justify-center text-sm font-semibold text-gray-600"></div>
                    {["A", "B", "C"].map((letter) => (
                      <div
                        key={letter}
                        className="flex h-8 w-10 items-center justify-center text-sm font-semibold text-gray-600"
                      >
                        {letter}
                      </div>
                    ))}
                    <div className="w-6"></div> {/* Aisle space */}
                    {["D", "E", "F"].map((letter) => (
                      <div
                        key={letter}
                        className="flex h-8 w-10 items-center justify-center text-sm font-semibold text-gray-600"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seat rows */}
                <div className="space-y-2">
                  {seatRows.map((rowNum) => {
                    const rowSeats = seats.filter((s) => s.row === rowNum);
                    const leftSeats = rowSeats.filter((s) =>
                      ["A", "B", "C"].includes(s.seat),
                    );
                    const rightSeats = rowSeats.filter((s) =>
                      ["D", "E", "F"].includes(s.seat),
                    );

                    return (
                      <div
                        key={rowNum}
                        className="flex justify-center"
                      >
                        <div className="flex items-center gap-1">
                          {/* Row number */}
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-sm font-semibold text-gray-600">
                            {rowNum}
                          </div>

                          {/* Left side seats (A, B, C) */}
                          {leftSeats.map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat.id)}
                              onMouseLeave={() => setHoveredSeat("")}
                              disabled={seat.status === "unavailable"}
                              className={cn(
                                "relative h-10 w-10 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md",
                                getSeatColor(seat),
                              )}
                              title={`Seat ${seat.id} - ${seat.price === 0 ? "Free" : `₹${seat.price}`}`}
                            >
                              {seat.seat}
                              {seat.price > 0 && (
                                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                                  ₹
                                </div>
                              )}
                            </button>
                          ))}

                          {/* Aisle space */}
                          <div className="flex w-6 items-center justify-center">
                            <div className="h-8 w-px bg-gray-300"></div>
                          </div>

                          {/* Right side seats (D, E, F) */}
                          {rightSeats.map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              onMouseEnter={() => setHoveredSeat(seat.id)}
                              onMouseLeave={() => setHoveredSeat("")}
                              disabled={seat.status === "unavailable"}
                              className={cn(
                                "relative h-10 w-10 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md",
                                getSeatColor(seat),
                              )}
                              title={`Seat ${seat.id} - ${seat.price === 0 ? "Free" : `₹${seat.price}`}`}
                            >
                              {seat.seat}
                              {seat.price > 0 && (
                                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
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
          </div>

          {/* Sticky Footer with selected seat info and buttons */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
            {selectedSeat ? (
              <div className="space-y-4">
                {/* Selected seat info */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black shadow-md">
                        <span className="text-lg font-bold text-white">
                          {selectedSeat}
                        </span>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-black">
                          Seat {selectedSeat}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {selectedPrice === 0
                            ? "Complimentary seat selection"
                            : `Premium seat with extra benefits`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-black">
                        {selectedPrice === 0 ? "FREE" : `₹${selectedPrice}`}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {selectedPrice === 0
                          ? "No additional cost"
                          : "One-time fee"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSeatMapSubmit}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Confirming Selection...</span>
                      </div>
                    ) : (
                      `Confirm Seat ${selectedSeat}`
                    )}
                  </Button>

                  <Button
                    onClick={() => setShowSeatMap(false)}
                    variant="outline"
                    className="w-full rounded-xl border-2 border-gray-300 py-3 font-medium text-black hover:border-gray-400 hover:bg-gray-50"
                  >
                    Back to Options
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* No seat selected message */}
                <div className="rounded-xl bg-gray-50 py-6 text-center">
                  <div className="mb-2 text-lg font-medium text-gray-600">
                    Choose Your Seat
                  </div>
                  <div className="text-sm text-gray-500">
                    Tap any available seat from the map above to select it
                  </div>
                </div>

                {/* Close button only */}
                <Button
                  onClick={() => setShowSeatMap(false)}
                  variant="outline"
                  className="w-full rounded-xl border-2 border-gray-300 py-3 font-medium text-black hover:border-gray-400 hover:bg-gray-50"
                >
                  Back to Options
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SeatCombinedWidget;
