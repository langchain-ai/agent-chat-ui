import React, { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { AirlineLogo } from "./AirlineLogo";
import { useTranslations } from "@/hooks/useTranslations";
import type { FlightDetails } from "./types";

interface FlightDetailsCardProps {
  flightDetails: FlightDetails | null;
  isDesktop?: boolean;
}

export const FlightDetailsCard: React.FC<FlightDetailsCardProps> = ({
  flightDetails,
  isDesktop = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize translations
  const { t } = useTranslations('reviewWidget');

  if (!flightDetails) {
    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="text-sm text-gray-500">
          {t('flightInfo.noFlightDetailsAvailable', 'No flight details available')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Compact View */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isDesktop ? (
              // Desktop Layout
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-sm font-bold">
                      {flightDetails.departure.code}
                    </div>
                    <div className="text-sm font-bold">
                      {flightDetails.departure.time}
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <div className="text-center">
                    <div className="text-sm font-bold">
                      {flightDetails.arrival.code}
                    </div>
                    <div className="text-sm font-bold">
                      {flightDetails.arrival.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <AirlineLogo
                      airlineIata={flightDetails.airline.iataCode || ""}
                      airlineName={flightDetails.airline.name}
                      size="sm"
                    />
                    <div className="text-xs text-gray-700">
                      <div className="font-medium">
                        {flightDetails.airline.name}
                      </div>
                      <div className="text-gray-600">
                        {flightDetails.airline.cabinClass}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Mobile Layout
              <>
                {/* Desktop Layout for tablets */}
                <div className="hidden items-center space-x-6 sm:flex">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-base font-bold">
                        {flightDetails.departure.code}
                      </div>
                      <div className="text-base font-bold">
                        {flightDetails.departure.time}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <div className="text-base font-bold">
                        {flightDetails.arrival.code}
                      </div>
                      <div className="text-base font-bold">
                        {flightDetails.arrival.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AirlineLogo
                      airlineIata={flightDetails.airline.iataCode || ""}
                      airlineName={flightDetails.airline.name}
                      size="sm"
                    />
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">
                        {flightDetails.airline.name}
                      </div>
                      <div className="text-gray-600">
                        {flightDetails.airline.cabinClass}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="sm:hidden">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-sm font-bold">
                        {flightDetails.departure.code}
                      </div>
                      <div className="text-sm font-bold">
                        {flightDetails.departure.time}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <div className="text-sm font-bold">
                        {flightDetails.arrival.code}
                      </div>
                      <div className="text-sm font-bold">
                        {flightDetails.arrival.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <AirlineLogo
                      airlineIata={flightDetails.airline.iataCode || ""}
                      airlineName={flightDetails.airline.name}
                      size="sm"
                    />
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700">
                        {flightDetails.airline.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {flightDetails.airline.cabinClass}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chevron Icon */}
          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-3 border-t pt-4">
          {/* Additional Flight Info */}
          <div className="mb-3">
            <div className="text-xs text-gray-600">
              {t('flightInfo.aircraft', 'Aircraft')}: {flightDetails.airline.aircraftType || t('flightInfo.notSpecified', 'Not specified')}
            </div>
            <div className="text-xs text-gray-600">
              {t('flightInfo.flight', 'Flight')}: {flightDetails.airline.flightNumber}
            </div>
          </div>

          {/* Route Details */}
          <div className="grid grid-cols-3 items-center gap-3">
            {/* Departure */}
            <div className="text-left">
              <div className="mb-1 text-xs text-gray-600">{t('flightInfo.departure', 'Departure')}</div>
              <div className="text-sm font-bold">
                {flightDetails.departure.time}
              </div>
              <div className="text-xs text-gray-900">
                {flightDetails.departure.city}
              </div>
              <div className="text-xs text-gray-600">
                {flightDetails.departure.date}
              </div>
            </div>

            {/* Duration Indicator */}
            <div className="flex flex-col items-center">
              <div className="mb-1 text-xs text-gray-600">
                {flightDetails.duration}
              </div>
              <div className="relative flex w-full items-center">
                <div className="h-px w-full bg-gray-300"></div>
                <ArrowRight className="absolute left-1/2 h-3 w-3 -translate-x-1/2 text-gray-400" />
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {flightDetails.stopsText}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-right">
              <div className="mb-1 text-xs text-gray-600">{t('flightInfo.arrival', 'Arrival')}</div>
              <div className="text-sm font-bold">
                {flightDetails.arrival.time}
              </div>
              <div className="text-xs text-gray-900">
                {flightDetails.arrival.city}
              </div>
              <div className="text-xs text-gray-600">
                {flightDetails.arrival.date}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
