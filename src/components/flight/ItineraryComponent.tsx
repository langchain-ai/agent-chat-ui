"use client";

import React from "react";
import { FlightSearchCriteria } from "@/types/flightSearchCriteria";
import { Clock, Calendar, Plane, Users, Luggage, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ItineraryComponentProps {
  flightSearchCriteria?: FlightSearchCriteria;
  streamData?: any;
}

export const ItineraryView: React.FC<ItineraryComponentProps> = ({
  flightSearchCriteria,
  streamData
}) => {
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
      year: "numeric",
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPassengerList = () => {
    if (!flightSearchCriteria) return "No passengers";
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
    return passengers.join(', ') || "No passengers";
  };

  const getDaysBetween = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Process stream data for flight details (this can be expanded based on your stream structure)
  const processFlightData = () => {
    if (!streamData) return null;

    // Extract flight information from stream data
    // This is a placeholder - adjust based on your actual stream data structure
    const flights = streamData.flights || [];
    const bookingStatus = streamData.bookingStatus || "searching";

    return { flights, bookingStatus };
  };

  const flightData = processFlightData();

  if (!flightSearchCriteria) {
    return (
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <Calendar className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Itinerary Available
              </h3>
              <p className="text-gray-500 max-w-md">
                Your travel itinerary will appear here once flight search criteria is available from the conversation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tripDuration = flightSearchCriteria.isRoundTrip
    ? getDaysBetween(flightSearchCriteria.departureDate, flightSearchCriteria.returnDate)
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Trip Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Travel Itinerary Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Route Summary */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-700">
                    {flightSearchCriteria.originAirport}
                  </div>
                  <div className="text-sm text-gray-600">Origin</div>
                </div>

                <div className="flex items-center">
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                  {flightSearchCriteria.isRoundTrip && (
                    <ArrowRight className="w-5 h-5 text-green-500 rotate-180 ml-1" />
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-blue-700">
                    {flightSearchCriteria.destinationAirport}
                  </div>
                  <div className="text-sm text-gray-600">Destination</div>
                </div>
              </div>
            </div>

            {/* Trip Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{getPassengerList()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-gray-500" />
                <Badge variant="outline" className="capitalize">
                  {flightSearchCriteria.class || "Economy"}
                </Badge>
              </div>
              {tripDuration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{tripDuration} days</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outbound Journey */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Plane className="w-5 h-5" />
              Outbound Journey
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50">
              {formatShortDate(flightSearchCriteria.departureDate)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Flight Route */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">
                    {flightSearchCriteria.originAirport} → {flightSearchCriteria.destinationAirport}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(flightSearchCriteria.departureDate)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary">
                  {flightData?.bookingStatus === "confirmed" ? "Confirmed" : "Searching..."}
                </Badge>
              </div>
            </div>

            {/* Flight Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Departure:</span>
                  <span className="text-sm">TBD</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">From:</span>
                  <span className="text-sm">{flightSearchCriteria.originAirport}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Arrival:</span>
                  <span className="text-sm">TBD</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">To:</span>
                  <span className="text-sm">{flightSearchCriteria.destinationAirport}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Journey (if round trip) */}
      {flightSearchCriteria.isRoundTrip && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Plane className="w-5 h-5 rotate-180" />
                Return Journey
              </CardTitle>
              <Badge variant="outline" className="bg-green-50">
                {formatShortDate(flightSearchCriteria.returnDate)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Flight Route */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Plane className="w-5 h-5 text-green-600 rotate-180" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {flightSearchCriteria.destinationAirport} → {flightSearchCriteria.originAirport}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(flightSearchCriteria.returnDate)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    {flightData?.bookingStatus === "confirmed" ? "Confirmed" : "Searching..."}
                  </Badge>
                </div>
              </div>

              {/* Flight Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Departure:</span>
                    <span className="text-sm">TBD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">From:</span>
                    <span className="text-sm">{flightSearchCriteria.destinationAirport}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Arrival:</span>
                    <span className="text-sm">TBD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">To:</span>
                    <span className="text-sm">{flightSearchCriteria.originAirport}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passenger Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Passenger Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Passenger Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {flightSearchCriteria.adults || 0}
                </div>
                <div className="text-sm text-gray-600">Adults</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {flightSearchCriteria.children || 0}
                </div>
                <div className="text-sm text-gray-600">Children</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {flightSearchCriteria.infants || 0}
                </div>
                <div className="text-sm text-gray-600">Infants</div>
              </div>
            </div>

            {/* Individual Passengers */}
            {flightSearchCriteria.passengers && flightSearchCriteria.passengers.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium">Passenger Details</h4>
                <div className="space-y-2">
                  {flightSearchCriteria.passengers.map((passenger, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {passenger.firstName && passenger.lastName
                              ? `${passenger.firstName} ${passenger.lastName}`
                              : `Passenger ${index + 1}`
                            }
                          </div>
                          {passenger.dateOfBirth && (
                            <div className="text-sm text-gray-500">
                              DOB: {new Date(passenger.dateOfBirth).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Adult</Badge>
                        {passenger.nationality && (
                          <div className="text-xs text-gray-500 mt-1">
                            {passenger.nationality}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Travel Essentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Luggage className="w-5 h-5" />
            Travel Essentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Baggage Allowance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cabin Baggage:</span>
                  <span className="text-gray-600">7 kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in Baggage:</span>
                  <span className="text-gray-600">15-25 kg</span>
                </div>
                <div className="text-xs text-gray-500">
                  * Varies by airline and class
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Important Notes</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Check-in opens 2 hours before departure</div>
                <div>• Arrive at airport 3 hours early for international flights</div>
                <div>• Valid passport/ID required</div>
                <div>• Visa requirements may apply</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
