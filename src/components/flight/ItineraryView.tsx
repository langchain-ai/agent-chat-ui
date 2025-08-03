"use client";

import React from "react";
import { FlightSearchCriteria } from "@/types/flightSearchCriteria";
import { Clock, Calendar, Plane, Users, Luggage } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ItineraryViewProps {
  flightSearchCriteria: FlightSearchCriteria;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ flightSearchCriteria }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getPassengerList = () => {
    const passengers = [];
    if (flightSearchCriteria.adults > 0) {
      passengers.push(`${flightSearchCriteria.adults} Adult${flightSearchCriteria.adults > 1 ? 's' : ''}`);
    }
    if (flightSearchCriteria.children > 0) {
      passengers.push(`${flightSearchCriteria.children} Child${flightSearchCriteria.children > 1 ? 'ren' : ''}`);
    }
    if (flightSearchCriteria.infants > 0) {
      passengers.push(`${flightSearchCriteria.infants} Infant${flightSearchCriteria.infants > 1 ? 's' : ''}`);
    }
    return passengers.join(', ');
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Travel Itinerary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Outbound Flight */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-blue-700">Outbound Journey</h3>
                <Badge variant="outline" className="bg-blue-50">
                  {formatShortDate(flightSearchCriteria.departureDate)}
                </Badge>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">
                        {flightSearchCriteria.originAirport || "TBD"} → {flightSearchCriteria.destinationAirport || "TBD"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(flightSearchCriteria.departureDate)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Flight Status</div>
                    <Badge variant="secondary">Searching...</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Departure Time:</span>
                    </div>
                    <div className="text-gray-600 ml-6">To be determined</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Arrival Time:</span>
                    </div>
                    <div className="text-gray-600 ml-6">To be determined</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Flight (if round trip) */}
            {flightSearchCriteria.isRoundTrip && (
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-green-700">Return Journey</h3>
                  <Badge variant="outline" className="bg-green-50">
                    {formatShortDate(flightSearchCriteria.returnDate)}
                  </Badge>
                </div>

                <div className="bg-green-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Plane className="w-6 h-6 text-green-600 rotate-180" />
                      </div>
                      <div>
                        <div className="font-medium text-lg">
                          {flightSearchCriteria.destinationAirport || "TBD"} → {flightSearchCriteria.originAirport || "TBD"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(flightSearchCriteria.returnDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Flight Status</div>
                      <Badge variant="secondary">Searching...</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Departure Time:</span>
                      </div>
                      <div className="text-gray-600 ml-6">To be determined</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Arrival Time:</span>
                      </div>
                      <div className="text-gray-600 ml-6">To be determined</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Travel Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Travel Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Passengers:</span>
                    <span>{getPassengerList()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Travel Class:</span>
                    <span className="capitalize">{flightSearchCriteria.class || "Economy"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Trip Type:</span>
                    <span>{flightSearchCriteria.isRoundTrip ? "Round Trip" : "One Way"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Baggage:</span>
                    <div className="flex items-center gap-1">
                      <Luggage className="w-4 h-4 text-gray-500" />
                      <span>As per airline policy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger List (if available) */}
            {flightSearchCriteria.passengers && flightSearchCriteria.passengers.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Passenger Information</h4>
                <div className="space-y-2">
                  {flightSearchCriteria.passengers.map((passenger, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="font-medium">
                        {passenger.firstName && passenger.lastName
                          ? `${passenger.firstName} ${passenger.lastName}`
                          : `Passenger ${index + 1}`
                        }
                      </span>
                      <Badge variant="outline">
                        Adult
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
