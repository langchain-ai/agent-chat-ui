"use client";

import React, { useState } from "react";
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

interface SeatSelectionWidgetProps {
  usualSeat?: string;
  [key: string]: any;
}

// Generate seat map with random pricing and availability for demo
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

  const seats = [];
  for (let num of seatNumbers) {
    for (let row of rows) {
      const seatId = `${num}${row}`;
      const isUnavailable = unavailableSeats.includes(seatId);

      let price = 0;
      if (!isUnavailable) {
        // Random pricing: some free, some between 350-500
        const priceOptions = [0, 0, 350, 400, 450, 500]; // More free seats
        price = priceOptions[Math.floor(Math.random() * priceOptions.length)];
      }

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

interface SeatSelectionProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
}

const SeatSelectionWidget: React.FC<SeatSelectionProps> = (args) => {
  const thread = useStreamContext();
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [hoveredSeat, setHoveredSeat] = useState<string>("");

  const usualSeat = args.usualSeat || "14F";
  const seats = generateSeatMap();
  const seatRows = Array.from(new Set(seats.map((s) => s.row))).sort(
    (a, b) => a - b,
  );

  const handleUsualSeatSelect = async () => {
    setIsLoading(true);

    const responseData = {
      selectedSeat: usualSeat,
      price: 350, // Assuming usual seat is free
      option: "usual_seat",
    };

    try {
      const frozen = {
        widget: {
          type: "SeatSelectionWidget",
          args: { selectedSeatIds: selectedSeats },
        },
        value: {
          type: "widget",
          widget: {
            type: "SeatSelectionWidget",
            args: { selectedSeatIds: selectedSeats },
          },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
    } catch (error: any) {
      console.error("Error submitting usual seat selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseSeatMap = () => {
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
      selectedSeat: selectedSeat,
      price: selectedPrice,
      option: "browse_seat_map",
    };

    try {
      const frozen = {
        widget: {
          type: "SeatSelectionWidget",
          args: { selectedSeatIds: selectedSeats },
        },
        value: {
          type: "widget",
          widget: {
            type: "SeatSelectionWidget",
            args: { selectedSeatIds: selectedSeats },
          },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
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
    if (seat.status === "available") {
      return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer";
    }
    return "bg-red-100 text-red-800 border-red-300 cursor-not-allowed";
  };

  const getSeatTooltip = (seat: any) => {
    if (seat.status === "unavailable") {
      return "Not available";
    }
    if (seat.price === 0) {
      return "Free seat";
    }
    return `₹${seat.price}`;
  };

  return (
    <>
      {/* Initial Options */}
      <div
        className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6"
        style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
      >
        <div className="mb-4 sm:mb-6">
          <h2 className="mb-2 text-xl font-bold text-black sm:text-2xl">
            Seat Selection
          </h2>
          <p className="text-sm text-gray-600">
            Choose your usual seat {usualSeat} or browse all available options
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleUsualSeatSelect}
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl sm:py-4 sm:text-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-5 sm:w-5"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Reserve Seat ${usualSeat}`
            )}
          </Button>

          <Button
            onClick={handleBrowseSeatMap}
            disabled={isLoading}
            variant="outline"
            className="w-full rounded-xl border-2 border-gray-300 py-3 text-base font-medium text-black hover:border-gray-400 hover:bg-gray-50"
          >
            Browse All Seats
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
          className="flex h-[90vh] flex-col overflow-hidden p-0 sm:h-[85vh]"
        >
          <SheetHeader className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <SheetTitle className="text-xl font-semibold">
              Select Your Seat
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="mb-6">
              <p className="mb-4 text-gray-600">
                Choose an available seat from the seat map below
              </p>

              {/* Legend */}
              <div className="mb-6 flex justify-center gap-6 rounded-xl bg-gray-50 p-4 text-sm sm:gap-8">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-lg border-2 border-green-300 bg-green-100 shadow-sm"></div>
                  <span className="font-medium text-gray-700">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-lg border-2 border-red-300 bg-red-100"></div>
                  <span className="font-medium text-gray-700">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-lg border-2 border-blue-500 bg-blue-500"></div>
                  <span className="font-medium text-gray-700">Selected</span>
                </div>
              </div>
            </div>

            {/* Seat Map */}
            <div className="mb-6 overflow-x-auto">
              <div className="min-w-max">
                {/* Header with seat letters */}
                <div className="mb-2 flex justify-center">
                  <div className="flex gap-1">
                    <div className="flex h-8 w-8 items-center justify-center text-sm font-medium"></div>
                    {["A", "B", "C"].map((letter) => (
                      <div
                        key={letter}
                        className="flex h-8 w-8 items-center justify-center text-sm font-medium"
                      >
                        {letter}
                      </div>
                    ))}
                    <div className="w-4"></div> {/* Aisle space */}
                    {["D", "E", "F"].map((letter) => (
                      <div
                        key={letter}
                        className="flex h-8 w-8 items-center justify-center text-sm font-medium"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seat rows */}
                <div className="space-y-1">
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
                          <div className="flex h-8 w-8 items-center justify-center text-sm font-medium">
                            {rowNum}
                          </div>
                          {leftSeats.map((seat) => (
                            <div
                              key={seat.id}
                              className="relative"
                            >
                              <button
                                type="button"
                                onClick={() => handleSeatClick(seat)}
                                onMouseEnter={() => setHoveredSeat(seat.id)}
                                onMouseLeave={() => setHoveredSeat("")}
                                className={cn(
                                  "h-8 w-8 rounded border text-xs font-medium transition-colors",
                                  getSeatColor(seat),
                                )}
                                disabled={seat.status === "unavailable"}
                              >
                                {seat.seat}
                              </button>
                              {hoveredSeat === seat.id && (
                                <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 transform rounded bg-black px-2 py-1 text-xs whitespace-nowrap text-white">
                                  {getSeatTooltip(seat)}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex w-4 items-center justify-center text-xs text-gray-400">
                            ||
                          </div>
                          {rightSeats.map((seat) => (
                            <div
                              key={seat.id}
                              className="relative"
                            >
                              <button
                                type="button"
                                onClick={() => handleSeatClick(seat)}
                                onMouseEnter={() => setHoveredSeat(seat.id)}
                                onMouseLeave={() => setHoveredSeat("")}
                                className={cn(
                                  "h-8 w-8 rounded border text-xs font-medium transition-colors",
                                  getSeatColor(seat),
                                )}
                                disabled={seat.status === "unavailable"}
                              >
                                {seat.seat}
                              </button>
                              {hoveredSeat === seat.id && (
                                <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 transform rounded bg-black px-2 py-1 text-xs whitespace-nowrap text-white">
                                  {getSeatTooltip(seat)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedSeat && (
              <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md">
                      <span className="text-sm font-bold text-white">
                        {selectedSeat}
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-bold text-blue-800 sm:text-lg">
                        Seat {selectedSeat}
                      </div>
                      <div className="text-sm text-blue-600">
                        {selectedPrice === 0
                          ? "Complimentary selection"
                          : "Premium seat"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-800">
                      {selectedPrice === 0 ? "FREE" : `₹${selectedPrice}`}
                    </div>
                    <div className="text-xs text-blue-600">
                      {selectedPrice === 0 ? "No charge" : "One-time fee"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSeatMapSubmit}
              disabled={isLoading || !selectedSeat}
              className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl sm:py-4 sm:text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-5 sm:w-5"></div>
                  <span>Processing...</span>
                </div>
              ) : selectedSeat ? (
                `Confirm Seat ${selectedSeat}`
              ) : (
                "Select a Seat Above"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SeatSelectionWidget;
