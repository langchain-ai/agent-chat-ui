"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/ui/select";
import {
  ArrowRight,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Plane,
  MapPin,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitInterruptResponse } from "./util";

// TypeScript Interfaces
interface FlightDetails {
  departure: {
    city: string;
    airport: string;
    code: string;
    date: string;
    time: string;
  };
  arrival: {
    city: string;
    airport: string;
    code: string;
    date: string;
    time: string;
  };
  airline: {
    name: string;
    flightNumber: string;
    cabinClass: string;
  };
  duration: string;
}

interface PassengerDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  title: string;
}

interface ContactInformation {
  phone: string;
  email: string;
}

interface TravelDocument {
  type: string;
  number: string;
  issuingCountry: string;
  expiryDate: string;
  nationality: string;
}

interface SeatAllocation {
  isSelected: boolean;
  seatNumber: string;
  location: string;
  price: number;
}

interface PaymentSummary {
  baseFare: number;
  taxes: number;
  fees: number;
  discount: number;
  seatFare: number;
  total: number;
  currency: string;
}

interface ReviewWidgetProps {
  flightDetails?: FlightDetails;
  passengerDetails?: PassengerDetails;
  contactInfo?: ContactInformation;
  travelDocument?: TravelDocument;
  seatAllocation?: SeatAllocation;
  paymentSummary?: PaymentSummary;
  onSubmit?: (data: any) => void;
}

// Mock saved passengers data
const mockSavedPassengers = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    gender: "Male",
    dateOfBirth: "1990-01-15",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    gender: "Female",
    dateOfBirth: "1985-03-22",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Johnson",
    gender: "Male",
    dateOfBirth: "1992-07-08",
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Williams",
    gender: "Female",
    dateOfBirth: "1988-11-30",
  },
];

// Mock data for demonstration
const mockData = {
  flightDetails: {
    departure: {
      city: "New York",
      airport: "John F. Kennedy International Airport",
      code: "JFK",
      date: "Dec 15, 2024",
      time: "2:30 PM",
    },
    arrival: {
      city: "San Francisco",
      airport: "San Francisco International Airport", 
      code: "SFO",
      date: "Dec 15, 2024",
      time: "6:15 PM",
    },
    airline: {
      name: "American Airlines",
      flightNumber: "AA 1234",
      cabinClass: "Economy",
    },
    duration: "5h 45m",
  },
  passengerDetails: {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-15",
    gender: "Male",
    title: "Mr",
  },
  contactInfo: {
    phone: "+1 (555) 123-4567",
    email: "john.doe@email.com",
  },
  travelDocument: {
    type: "Passport",
    number: "A12345678",
    issuingCountry: "United States",
    expiryDate: "2029-01-11",
    nationality: "American",
  },
  seatAllocation: {
    isSelected: true,
    seatNumber: "12A",
    location: "Window seat, front of aircraft",
    price: 25.0,
  },
  paymentSummary: {
    baseFare: 249.0,
    taxes: 35.5,
    fees: 12.75,
    discount: 20.0,
    seatFare: 25.0,
    total: 302.25,
    currency: "USD",
  },
};

const ReviewWidget: React.FC<ReviewWidgetProps> = ({
  flightDetails = mockData.flightDetails,
  passengerDetails = mockData.passengerDetails,
  contactInfo = mockData.contactInfo,
  travelDocument = mockData.travelDocument,
  seatAllocation = mockData.seatAllocation,
  paymentSummary = mockData.paymentSummary,
  onSubmit,
}) => {
  // For demo purposes, we'll work without stream context
  // In actual chat usage, this would be provided by the interrupt system
  const thread = null;
  
  // Component state
  const [isFlightExpanded, setIsFlightExpanded] = useState(false);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [isTravelDocsExpanded, setIsTravelDocsExpanded] = useState(false);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [isSeatSelected, setIsSeatSelected] = useState(seatAllocation.isSelected);
  const [isSavedPassengersExpanded, setIsSavedPassengersExpanded] = useState(false);
  
  // Form state
  const [passenger, setPassenger] = useState(passengerDetails);
  const [contact, setContact] = useState(contactInfo);
  const [document, setDocument] = useState(travelDocument);

  // Calculate total with seat selection
  const calculateTotal = () => {
    const seatFare = isSeatSelected ? seatAllocation.price : 0;
    return paymentSummary.baseFare + paymentSummary.taxes + paymentSummary.fees + seatFare - paymentSummary.discount;
  };

  // Handle selecting a saved passenger
  const handleSelectSavedPassenger = (savedPassenger: typeof mockSavedPassengers[0]) => {
    setPassenger({
      firstName: savedPassenger.firstName,
      lastName: savedPassenger.lastName,
      gender: savedPassenger.gender,
      dateOfBirth: savedPassenger.dateOfBirth,
      title: passenger.title, // Keep existing title if any
    });
    setIsSavedPassengersExpanded(false); // Collapse the section after selection
  };

  const handleSubmit = async () => {
    const bookingData = {
      flightDetails,
      passenger,
      contact,
      document,
      seatAllocation: {
        ...seatAllocation,
        isSelected: isSeatSelected,
      },
      total: calculateTotal(),
    };

    if (onSubmit) {
      onSubmit(bookingData);
    } else if (thread) {
      await submitInterruptResponse(thread, "booking_confirmation", bookingData);
    } else {
      // Demo mode - just log the data
      console.log("Demo booking submission:", bookingData);
      alert(`Booking confirmed! Total: $${calculateTotal().toFixed(2)}`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 pb-20 sm:pb-4">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Review Your Booking
        </h1>

        {/* Component sections */}
        <div className="space-y-3">
          {/* Flight Details */}
          <div className="bg-white rounded-lg shadow p-4">
            <div
              className="cursor-pointer"
              onClick={() => setIsFlightExpanded(!isFlightExpanded)}
            >
              {/* Compact View */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{flightDetails.departure.city}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-bold">{flightDetails.arrival.city}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{flightDetails.departure.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{flightDetails.departure.time} - {flightDetails.arrival.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-base font-bold">{flightDetails.departure.city}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-base font-bold">{flightDetails.arrival.city}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{flightDetails.departure.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">{flightDetails.departure.time} - {flightDetails.arrival.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chevron Icon */}
                <div className="ml-4">
                  {isFlightExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {isFlightExpanded && (
              <div className="border-t pt-3 mt-3">
                {/* Airline Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plane className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{flightDetails.airline.name}</span>
                      <span className="text-sm text-gray-600">{flightDetails.airline.flightNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {flightDetails.airline.cabinClass}
                      </span>
                      <span className="text-xs text-gray-600">Duration: {flightDetails.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Departure */}
                  <div className="text-center">
                    <div className="text-lg font-bold">{flightDetails.departure.time}</div>
                    <div className="text-lg font-bold">{flightDetails.departure.city}</div>
                    <div className="text-xs text-gray-600">{flightDetails.departure.code}</div>
                    <div className="text-xs text-gray-600">{flightDetails.departure.date}</div>
                  </div>

                  {/* Duration Indicator */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">{flightDetails.duration}</div>
                    <div className="flex items-center w-full">
                      <div className="w-20 h-px bg-gray-300"></div>
                      <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Non-stop</div>
                  </div>

                  {/* Arrival */}
                  <div className="text-center">
                    <div className="text-lg font-bold">{flightDetails.arrival.time}</div>
                    <div className="text-lg font-bold">{flightDetails.arrival.city}</div>
                    <div className="text-xs text-gray-600">{flightDetails.arrival.code}</div>
                    <div className="text-xs text-gray-600">{flightDetails.arrival.date}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Passenger Details */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Passenger Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* First Name */}
              <div>
                <Label htmlFor="firstName" className="text-xs font-medium text-gray-700 mb-0.5">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={passenger.firstName}
                  onChange={(e) => setPassenger({ ...passenger, firstName: e.target.value })}
                  className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName" className="text-xs font-medium text-gray-700 mb-0.5">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={passenger.lastName}
                  onChange={(e) => setPassenger({ ...passenger, lastName: e.target.value })}
                  className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter last name"
                />
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor="gender" className="text-xs font-medium text-gray-700 mb-0.5">
                  Gender
                </Label>
                <Select
                  value={passenger.gender}
                  onValueChange={(value) => setPassenger({ ...passenger, gender: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t pt-3 mt-4">
              <p className="text-xs text-gray-600">
                Please ensure all details match your travel documents exactly.
              </p>
            </div>

            {/* Saved Passengers Button */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsSavedPassengersExpanded(!isSavedPassengersExpanded)}
                className="w-full flex items-center justify-between text-sm"
              >
                <span>Saved Passengers</span>
                {isSavedPassengersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {/* Saved Passengers List */}
              {isSavedPassengersExpanded && (
                <div className="mt-3 border rounded-lg bg-gray-50">
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Select a saved passenger:
                    </div>
                    <div className="space-y-2">
                      {mockSavedPassengers.map((savedPassenger) => (
                        <button
                          key={savedPassenger.id}
                          onClick={() => handleSelectSavedPassenger(savedPassenger)}
                          className="w-full text-left p-3 bg-white border rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">
                                {savedPassenger.firstName} {savedPassenger.lastName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {savedPassenger.gender} • Born {savedPassenger.dateOfBirth}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-4">
            <div
              className="cursor-pointer"
              onClick={() => setIsContactExpanded(!isContactExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Contact Information</h2>
                  {!isContactExpanded && (
                    <div className="text-sm text-gray-600 mt-1">
                      {contact.phone} • {contact.email}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {isContactExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {isContactExpanded && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phone" className="text-xs font-medium text-gray-700 mb-0.5">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label htmlFor="email" className="text-xs font-medium text-gray-700 mb-0.5">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="border-t pt-3 mt-4">
                  <p className="text-xs text-gray-600">
                    We'll use this information to send you booking confirmations and updates.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Travel Documents */}
          <div className="bg-white rounded-lg shadow p-4">
            <div
              className="cursor-pointer"
              onClick={() => setIsTravelDocsExpanded(!isTravelDocsExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Travel Documents</h2>
                  {!isTravelDocsExpanded && (
                    <div className="text-sm text-gray-600 mt-1">
                      {document.type} • {document.number} • Expires {document.expiryDate}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {isTravelDocsExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {isTravelDocsExpanded && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Date of Birth */}
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-xs font-medium text-gray-700 mb-0.5">
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={passenger.dateOfBirth}
                      onChange={(e) => setPassenger({ ...passenger, dateOfBirth: e.target.value })}
                      className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Document Type */}
                  <div>
                    <Label htmlFor="documentType" className="text-xs font-medium text-gray-700 mb-0.5">
                      Document Type
                    </Label>
                    <Select
                      value={document.type}
                      onValueChange={(value) => setDocument({ ...document, type: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="Driver's License">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Document Number */}
                  <div className="relative">
                    <Label htmlFor="documentNumber" className="text-xs font-medium text-gray-700 mb-0.5">
                      {document.type} Number
                    </Label>
                    <Input
                      id="documentNumber"
                      type="text"
                      value={document.number}
                      onChange={(e) => setDocument({ ...document, number: e.target.value })}
                      className="w-full border rounded-md px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter document number"
                    />
                  </div>

                  {/* Issuing Country */}
                  <div>
                    <Label htmlFor="issuingCountry" className="text-xs font-medium text-gray-700 mb-0.5">
                      Issuing Country
                    </Label>
                    <Input
                      id="issuingCountry"
                      type="text"
                      value={document.issuingCountry}
                      onChange={(e) => setDocument({ ...document, issuingCountry: e.target.value })}
                      className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter issuing country"
                    />
                  </div>

                  {/* Nationality */}
                  <div>
                    <Label htmlFor="nationality" className="text-xs font-medium text-gray-700 mb-0.5">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      type="text"
                      value={document.nationality}
                      onChange={(e) => setDocument({ ...document, nationality: e.target.value })}
                      className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter nationality"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="relative">
                    <Label htmlFor="expiryDate" className="text-xs font-medium text-gray-700 mb-0.5">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={document.expiryDate}
                      onChange={(e) => setDocument({ ...document, expiryDate: e.target.value })}
                      className="w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {/* Expiry Warning */}
                    {(() => {
                      const expiryDate = new Date(document.expiryDate);
                      const today = new Date();
                      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                      if (daysUntilExpiry < 180 && daysUntilExpiry > 0) {
                        return (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 mt-3">
                            <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Expires soon</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Verification Status */}
                <div className="border-t pt-4 mt-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Document verified</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seat Allocation */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold">Seat Allocation</h2>
                {isSeatSelected && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {seatAllocation.seatNumber}
                  </span>
                )}
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Select seat</span>
                <button
                  onClick={() => setIsSeatSelected(!isSeatSelected)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                    isSeatSelected ? "bg-green-600" : "bg-gray-300"
                  )}
                  role="switch"
                  aria-checked={isSeatSelected}
                  aria-label="Toggle seat selection"
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full transition-transform duration-200 shadow-sm border border-gray-200",
                      isSeatSelected
                        ? "translate-x-6 bg-white"
                        : "translate-x-1 bg-white"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Seat Card */}
            <div
              className={cn(
                "border rounded-lg p-4 transition-colors duration-200",
                isSeatSelected
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm">
                      {isSeatSelected ? `Seat ${seatAllocation.seatNumber}` : "No seat selected"}
                    </span>
                  </div>
                  {isSeatSelected && (
                    <p className="text-xs text-gray-600">{seatAllocation.location}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {isSeatSelected ? `$${seatAllocation.price.toFixed(2)}` : "$0.00"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {isSeatSelected ? "Seat fee" : "No fee"}
                  </div>
                </div>
              </div>
            </div>

            {!isSeatSelected && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 Select a seat to ensure you get your preferred location on the aircraft.
                </p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <div
              className="cursor-pointer"
              onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
            >
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Payment Summary</h2>
                  <div className="text-sm font-bold text-gray-900">
                    Total: ${calculateTotal().toFixed(2)} {paymentSummary.currency}
                  </div>
                </div>
                <div>
                  {isPaymentExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {isPaymentExpanded && (
              <div className="border-t pt-4 mt-4 space-y-2">
                {/* Base Fare */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Base fare</span>
                  <span className="text-xs font-medium">${paymentSummary.baseFare.toFixed(2)}</span>
                </div>

                {/* Taxes */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Taxes & fees</span>
                  <span className="text-xs font-medium">${paymentSummary.taxes.toFixed(2)}</span>
                </div>

                {/* Service Fees */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Service fees</span>
                  <span className="text-xs font-medium">${paymentSummary.fees.toFixed(2)}</span>
                </div>

                {/* Seat Selection */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Seat selection</span>
                  <span className="text-xs font-medium">
                    ${isSeatSelected ? seatAllocation.price.toFixed(2) : "0.00"}
                  </span>
                </div>

                {/* Discount */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Discount</span>
                  <span className="text-xs font-medium text-green-600">
                    -${paymentSummary.discount.toFixed(2)}
                  </span>
                </div>

                {/* Total */}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-sm font-bold">
                      ${calculateTotal().toFixed(2)} {paymentSummary.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex justify-end mt-6 space-x-3">
          <Button variant="outline" className="px-6">
            Back
          </Button>
          <Button onClick={handleSubmit} className="px-6 bg-blue-600 hover:bg-blue-700">
            Confirm Booking
          </Button>
        </div>

        {/* Mobile Sticky Button */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
          <Button onClick={handleSubmit} className="w-full py-3 text-base bg-blue-600 hover:bg-blue-700">
            Confirm Booking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewWidget;
