"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

interface SeatPreferenceWidgetProps {
  [key: string]: any;
}

const SeatPreferenceWidget: React.FC<SeatPreferenceWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [selectedPreference, setSelectedPreference] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreference) return;

    setIsLoading(true);

    const responseData = {
      seatPreference: selectedPreference,
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting seat preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Seat Preference</h2>
        <p className="text-gray-600">Choose your seat preference for this flight</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <input
              type="radio"
              name="seatPreference"
              value="free"
              checked={selectedPreference === "free"}
              onChange={(e) => setSelectedPreference(e.target.value)}
              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Free Seat</div>
              <div className="text-sm text-gray-500">Choose from available free seats</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <input
              type="radio"
              name="seatPreference"
              value="buy"
              checked={selectedPreference === "buy"}
              onChange={(e) => setSelectedPreference(e.target.value)}
              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Buy Seat</div>
              <div className="text-sm text-gray-500">Purchase premium seat with extra benefits</div>
            </div>
          </label>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading || !selectedPreference}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg text-base"
          >
            {isLoading ? "Processing..." : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SeatPreferenceWidget;
