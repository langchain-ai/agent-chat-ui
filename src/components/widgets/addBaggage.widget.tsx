"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

interface AddBaggageWidgetProps {
  [key: string]: any;
}

interface BaggageOption {
  weight: number;
  price: number;
  description: string;
}

interface BaggageSelection {
  [key: number]: number; // weight -> quantity
}

const AddBaggageWidget: React.FC<AddBaggageWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [baggageSelection, setBaggageSelection] = useState<BaggageSelection>({});
  const [isLoading, setIsLoading] = useState(false);

  const baggageOptions: BaggageOption[] = [
    {
      weight: 10,
      price: 1200,
      description: ""
    },
    {
      weight: 20,
      price: 2000,
      description: ""
    },
    {
      weight: 30,
      price: 2800,
      description: ""
    }
  ];

  const updateBaggageQuantity = (weight: number, change: number) => {
    setBaggageSelection(prev => {
      const currentQuantity = prev[weight] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);

      if (newQuantity === 0) {
        const { [weight]: removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [weight]: newQuantity };
    });
  };

  const getTotalBags = () => {
    return Object.values(baggageSelection).reduce((sum, quantity) => sum + quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(baggageSelection).reduce((total, [weight, quantity]) => {
      const option = baggageOptions.find(opt => opt.weight === parseInt(weight));
      return total + (option ? option.price * quantity : 0);
    }, 0);
  };

  const getTotalWeight = () => {
    return Object.entries(baggageSelection).reduce((total, [weight, quantity]) => {
      return total + (parseInt(weight) * quantity);
    }, 0);
  };

  const hasSelection = () => {
    return getTotalBags() > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSelection()) return;

    setIsLoading(true);

    const responseData = {
      baggageSelection,
      totalBags: getTotalBags(),
      totalWeight: getTotalWeight(),
      totalPrice: getTotalPrice(),
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
    <div
      className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg"
      style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}
    >
      <div className="mb-4 sm:mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-1 sm:mb-2">Add Baggage</h2>
        <p className="text-sm text-gray-600">
          Select your preferred baggage allowance
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="space-y-2 sm:space-y-3">
          {baggageOptions.map((option) => {
            const quantity = baggageSelection[option.weight] || 0;
            return (
              <div
                key={option.weight}
                className={`relative rounded-xl border-2 p-3 sm:p-4 transition-all duration-200 ${
                  quantity > 0
                    ? "border-black bg-gray-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col space-y-1">
                      <h3 className="font-semibold text-black text-sm sm:text-base">
                        {option.weight}kg Baggage
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-black">₹{option.price} per bag</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updateBaggageQuantity(option.weight, -1)}
                        disabled={quantity === 0}
                        className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="text-sm sm:text-base font-bold">−</span>
                      </button>

                      <span className="min-w-[2rem] text-center text-sm sm:text-base font-bold text-black">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateBaggageQuantity(option.weight, 1)}
                        className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        <span className="text-sm sm:text-base font-bold">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 space-y-3">
          {hasSelection() && (
            <div className="rounded-lg bg-gray-50 p-3 sm:p-4 border border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Summary:</span>
                </div>

                {Object.entries(baggageSelection).map(([weight, quantity]) => {
                  const option = baggageOptions.find(opt => opt.weight === parseInt(weight));
                  if (!option || quantity === 0) return null;

                  return (
                    <div key={weight} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {quantity}x {option.weight}kg bags
                      </span>
                      <span className="font-medium text-black">
                        ₹{option.price * quantity}
                      </span>
                    </div>
                  );
                })}

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-black text-sm sm:text-base">
                      Total: {getTotalBags()} bags ({getTotalWeight()}kg)
                    </span>
                    <span className="font-bold text-black text-base sm:text-lg">
                      ₹{getTotalPrice()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={!hasSelection() || isLoading}
            className="w-full rounded-xl bg-black py-3 sm:py-4 text-white text-sm sm:text-base font-medium transition-all duration-200 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : hasSelection() ? (
              `Add ${getTotalBags()} Bag${getTotalBags() > 1 ? 's' : ''} - ₹${getTotalPrice()}`
            ) : (
              "Select Baggage to Continue"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddBaggageWidget;
