"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

interface SeatPreferenceWidgetProps {
  [key: string]: any;
}

interface SeatPreferenceProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
}

const SeatPreferenceWidget: React.FC<SeatPreferenceProps> = (args) => {
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
      const frozen = {
        widget: {
          type: "SeatPreferenceWidget",
          args: { seatPreference: selectedPreference },
        },
        value: {
          type: "widget",
          widget: {
            type: "SeatPreferenceWidget",
            args: { seatPreference: selectedPreference },
          },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
    } catch (error: any) {
      console.error("Error submitting seat preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Seat Preference
        </h2>
        <p className="text-gray-600">
          Choose your seat preference for this flight
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300">
            <input
              type="radio"
              name="seatPreference"
              value="free"
              checked={selectedPreference === "free"}
              onChange={(e) => setSelectedPreference(e.target.value)}
              className="h-4 w-4 border-gray-300 text-black focus:ring-black"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Free Seat</div>
              <div className="text-sm text-gray-500">
                Choose from available free seats
              </div>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300">
            <input
              type="radio"
              name="seatPreference"
              value="buy"
              checked={selectedPreference === "buy"}
              onChange={(e) => setSelectedPreference(e.target.value)}
              className="h-4 w-4 border-gray-300 text-black focus:ring-black"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Buy Seat</div>
              <div className="text-sm text-gray-500">
                Purchase premium seat with extra benefits
              </div>
            </div>
          </label>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading || !selectedPreference}
            className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white hover:bg-gray-800"
          >
            {isLoading ? "Processing..." : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SeatPreferenceWidget;
