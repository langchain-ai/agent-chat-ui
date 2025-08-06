"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { Luggage, Check } from "lucide-react";

interface AddBaggageWidgetProps {
  [key: string]: any;
}

interface BaggageOption {
  weight: number;
  price: number;
  description: string;
}

const AddBaggageWidget: React.FC<AddBaggageWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [selectedBaggage, setSelectedBaggage] = useState<BaggageOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const baggageOptions: BaggageOption[] = [
    {
      weight: 10,
      price: 1200,
      description: "Perfect for short trips"
    },
    {
      weight: 20,
      price: 2000,
      description: "Ideal for week-long vacations"
    },
    {
      weight: 30,
      price: 2800,
      description: "Great for extended stays"
    }
  ];

  const handleBaggageSelect = (baggage: BaggageOption) => {
    setSelectedBaggage(baggage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaggage) return;

    setIsLoading(true);

    const responseData = {
      baggageWeight: selectedBaggage.weight,
      baggagePrice: selectedBaggage.price,
      baggageDescription: selectedBaggage.description,
      action: "baggage_selected"
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting baggage selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black">
          <Luggage className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-black">Add Baggage</h2>
        <p className="mt-1 text-sm text-gray-600">
          Select your preferred baggage allowance
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {baggageOptions.map((option) => (
            <div
              key={option.weight}
              onClick={() => handleBaggageSelect(option)}
              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                selectedBaggage?.weight === option.weight
                  ? "border-black bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                      <span className="text-sm font-bold">{option.weight}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-black">
                        {option.weight}kg Baggage
                      </h3>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-black">₹{option.price}</p>
                    <p className="text-xs text-gray-500">per bag</p>
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selectedBaggage?.weight === option.weight
                        ? "border-black bg-black"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedBaggage?.weight === option.weight && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {selectedBaggage && (
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Selected:</span>
                <span className="font-semibold text-black">
                  {selectedBaggage.weight}kg - ₹{selectedBaggage.price}
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={!selectedBaggage || isLoading}
            className="w-full rounded-xl bg-black py-3 text-white transition-all duration-200 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Add Selected Baggage"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddBaggageWidget;
