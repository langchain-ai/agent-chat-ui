"use client";

import React from "react";
import { FlightSearchCriteria } from "@/types/flightSearchCriteria";
import { MapPin, Plane, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MapViewProps {
  flightSearchCriteria: FlightSearchCriteria;
}

export const MapView: React.FC<MapViewProps> = ({ flightSearchCriteria }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalPassengers = () => {
    return (flightSearchCriteria.adults || 0) +
           (flightSearchCriteria.children || 0) +
           (flightSearchCriteria.infants || 0);
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Flight Route Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Route visualization */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {flightSearchCriteria.originAirport || "---"}
              </div>
              <div className="text-sm text-gray-600">Origin</div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-blue-400"></div>
                <Plane className="w-6 h-6 text-blue-500 mx-2" />
                <div className="w-8 h-0.5 bg-blue-400"></div>
                {flightSearchCriteria.isRoundTrip && (
                  <>
                    <Plane className="w-6 h-6 text-green-500 mx-2 rotate-180" />
                    <div className="w-8 h-0.5 bg-green-400"></div>
                  </>
                )}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {flightSearchCriteria.destinationAirport || "---"}
              </div>
              <div className="text-sm text-gray-600">Destination</div>
            </div>
          </div>

          {/* Flight details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Departure:</span>
                <span className="text-sm">{formatDate(flightSearchCriteria.departureDate)}</span>
              </div>

              {flightSearchCriteria.isRoundTrip && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Return:</span>
                  <span className="text-sm">{formatDate(flightSearchCriteria.returnDate)}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Passengers:</span>
                <span className="text-sm">{getTotalPassengers()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Class:</span>
                <span className="text-sm capitalize">{flightSearchCriteria.class || "Economy"}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Trip Type:</span>
                <span className="text-sm">{flightSearchCriteria.isRoundTrip ? "Round Trip" : "One Way"}</span>
              </div>
            </div>
          </div>

          {/* Passenger breakdown */}
          {getTotalPassengers() > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Passenger Details:</h4>
              <div className="flex gap-4 text-sm">
                {flightSearchCriteria.adults > 0 && (
                  <span>Adults: {flightSearchCriteria.adults}</span>
                )}
                {flightSearchCriteria.children > 0 && (
                  <span>Children: {flightSearchCriteria.children}</span>
                )}
                {flightSearchCriteria.infants > 0 && (
                  <span>Infants: {flightSearchCriteria.infants}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
