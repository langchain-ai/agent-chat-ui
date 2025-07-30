"use client";

import React, { useState, useMemo } from "react";
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
import { useStreamContext } from "@/providers/Stream";

// TypeScript Interfaces for API Response
interface ApiPhone {
  countryCode: string;
  number: string;
}

interface ApiDocument {
  documentId: number;
  documentType: string;
  documentNumber: string;
  nationality: string;
  expiryDate: string;
  issuingDate: string;
  issuingCountry: string;
  documentUrl: string;
}

interface ApiTraveller {
  travellerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  numberOfFlights: number;
  email: string;
  phone: ApiPhone[];
  isPrimaryTraveller: boolean;
  documents: ApiDocument[];
}

interface ApiFlightSegment {
  id: string;
  airlineIata: string;
  flightNumber: string;
  duration: string;
  aircraftType: string;
  airlineName: string;
  departure: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
  arrival: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
}

interface ApiFlightOffer {
  flightOfferId: string;
  totalEmission: number;
  totalEmissionUnit: string;
  currency: string;
  totalAmount: number;
  duration: string;
  departure: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
  arrival: {
    date: string;
    airportIata: string;
    airportName: string;
    cityCode: string;
    countryCode: string;
  };
  segments: ApiFlightSegment[];
  offerRules: {
    isRefundable: boolean;
  };
  rankingScore: number;
  pros: string[];
  cons: string[];
  tags: string[];
}

interface ApiBookingRequirements {
  emailAddressRequired: boolean;
  invoiceAddressRequired: boolean;
  mailingAddressRequired: boolean;
  phoneCountryCodeRequired: boolean;
  mobilePhoneNumberRequired: boolean;
  phoneNumberRequired: boolean;
  postalCodeRequired: boolean;
  travelerRequirements: any;
}

interface ApiWidgetArgs {
  flightItinerary: {
    userContext: {
      userDetails: ApiTraveller;
      savedTravellers: ApiTraveller[];
    };
    selectionContext: {
      selectedFlightOffers: ApiFlightOffer[];
    };
  };
  bookingRequirements: ApiBookingRequirements;
}

interface ApiResponse {
  value: {
    type: string;
    widget: {
      type: string;
      args: ApiWidgetArgs;
    };
  };
}

// Component Interfaces
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
    aircraftType?: string;
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
  // Legacy props for backward compatibility
  flightDetails?: FlightDetails;
  passengerDetails?: PassengerDetails;
  contactInfo?: ContactInformation;
  travelDocument?: TravelDocument;
  seatAllocation?: SeatAllocation;
  paymentSummary?: PaymentSummary;
  onSubmit?: (data: any) => void;
  // New API response prop
  apiData?: ApiResponse;
  // Bottom sheet mode
  isInBottomSheet?: boolean;
}

// Utility functions to transform API data
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return { date: dateStr, time: timeStr };
};

const parseDuration = (duration: string) => {
  // Parse ISO 8601 duration format (PT2H55M)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

const transformApiDataToFlightDetails = (apiData: ApiResponse): FlightDetails | null => {
  const flightOffer = apiData.value.widget.args.flightItinerary.selectionContext.selectedFlightOffers[0];
  if (!flightOffer) return null;

  const departure = formatDateTime(flightOffer.departure.date);
  const arrival = formatDateTime(flightOffer.arrival.date);

  // Get airline info from first segment
  const firstSegment = flightOffer.segments[0];

  return {
    departure: {
      city: flightOffer.departure.cityCode,
      airport: flightOffer.departure.airportName || flightOffer.departure.airportIata,
      code: flightOffer.departure.airportIata,
      date: departure.date,
      time: departure.time,
    },
    arrival: {
      city: flightOffer.arrival.cityCode,
      airport: flightOffer.arrival.airportName || flightOffer.arrival.airportIata,
      code: flightOffer.arrival.airportIata,
      date: arrival.date,
      time: arrival.time,
    },
    airline: {
      name: firstSegment.airlineName || firstSegment.airlineIata,
      flightNumber: `${firstSegment.airlineIata} ${firstSegment.flightNumber}`,
      cabinClass: "Economy", // Default as not provided in API
      aircraftType: firstSegment.aircraftType,
    },
    duration: parseDuration(flightOffer.duration),
  };
};

const transformApiDataToPassengerDetails = (apiData: ApiResponse): PassengerDetails | null => {
  const userDetails = apiData.value.widget.args.flightItinerary.userContext.userDetails;
  if (!userDetails) return null;

  return {
    firstName: userDetails.firstName,
    lastName: userDetails.lastName,
    dateOfBirth: userDetails.dateOfBirth,
    gender: userDetails.gender,
    title: userDetails.gender === 'Male' ? 'Mr' : userDetails.gender === 'Female' ? 'Ms' : '',
  };
};

const transformApiDataToContactInfo = (apiData: ApiResponse): ContactInformation | null => {
  const userDetails = apiData.value.widget.args.flightItinerary.userContext.userDetails;
  if (!userDetails) return null;

  const phone = userDetails.phone && userDetails.phone.length > 0 ? userDetails.phone[0].number : '';

  return {
    phone: phone,
    email: userDetails.email,
  };
};

const transformApiDataToTravelDocument = (apiData: ApiResponse): TravelDocument | null => {
  const userDetails = apiData.value.widget.args.flightItinerary.userContext.userDetails;
  if (!userDetails || !userDetails.documents || userDetails.documents.length === 0) return null;

  const document = userDetails.documents[0];

  return {
    type: document.documentType.charAt(0).toUpperCase() + document.documentType.slice(1),
    number: document.documentNumber,
    issuingCountry: document.issuingCountry,
    expiryDate: document.expiryDate,
    nationality: document.nationality,
  };
};

const transformApiDataToPaymentSummary = (apiData: ApiResponse): PaymentSummary | null => {
  const flightOffer = apiData.value.widget.args.flightItinerary.selectionContext.selectedFlightOffers[0];
  if (!flightOffer) return null;

  // Since detailed breakdown is not provided in API, we'll estimate
  const total = flightOffer.totalAmount;
  const baseFare = Math.round(total * 0.75); // Estimate 75% as base fare
  const taxes = Math.round(total * 0.20); // Estimate 20% as taxes
  const fees = Math.round(total * 0.05); // Estimate 5% as fees

  return {
    baseFare: baseFare,
    taxes: taxes,
    fees: fees,
    discount: 0,
    seatFare: 0,
    total: total,
    currency: flightOffer.currency,
  };
};

const transformApiDataToSavedPassengers = (apiData: ApiResponse) => {
  const savedTravellers = apiData.value.widget.args.flightItinerary.userContext.savedTravellers;
  if (!savedTravellers) return [];

  return savedTravellers.map((traveller, index) => ({
    id: traveller.travellerId.toString(),
    firstName: traveller.firstName,
    lastName: traveller.lastName,
    gender: traveller.gender,
    dateOfBirth: traveller.dateOfBirth,
  }));
};

// Mock saved passengers data (fallback)
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
      aircraftType: "Boeing 737-800",
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
  flightDetails,
  passengerDetails,
  contactInfo,
  travelDocument,
  seatAllocation,
  paymentSummary,
  onSubmit,
  apiData,
  isInBottomSheet = false,
}) => {
  // Get thread context for interrupt responses
  const stream = useStreamContext();
  const thread = (stream as any)?.thread || null;

  // Debug logging for API data (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log("🔄 ReviewWidget received props:", {
      hasApiData: !!apiData,
      apiDataKeys: apiData ? Object.keys(apiData) : null,
      hasFlightDetails: !!flightDetails,
      hasPassengerDetails: !!passengerDetails,
      hasContactInfo: !!contactInfo,
      hasTravelDocument: !!travelDocument,
      hasSeatAllocation: !!seatAllocation,
      hasPaymentSummary: !!paymentSummary
    });
  }

  // Transform API data or use provided props/mock data
  const transformedFlightDetails = apiData ? transformApiDataToFlightDetails(apiData) : null;
  const transformedPassengerDetails = apiData ? transformApiDataToPassengerDetails(apiData) : null;
  const transformedContactInfo = apiData ? transformApiDataToContactInfo(apiData) : null;
  const transformedTravelDocument = apiData ? transformApiDataToTravelDocument(apiData) : null;
  const transformedPaymentSummary = apiData ? transformApiDataToPaymentSummary(apiData) : null;
  const savedPassengers = apiData ? transformApiDataToSavedPassengers(apiData) : mockSavedPassengers;

  // Determine if travel documents component should be shown
  // Hide if travelerRequirements is null in API data
  const showTravelDocuments = apiData
    ? apiData.value.widget.args.bookingRequirements.travelerRequirements !== null
    : true; // Show by default for non-API usage (legacy/demo mode)

  // Debug transformed data (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log("🔄 Transformed data:", {
      hasTransformedFlightDetails: !!transformedFlightDetails,
      hasTransformedPassengerDetails: !!transformedPassengerDetails,
      hasTransformedContactInfo: !!transformedContactInfo,
      hasTransformedTravelDocument: !!transformedTravelDocument,
      hasTransformedPaymentSummary: !!transformedPaymentSummary,
      savedPassengersCount: savedPassengers.length,
      travelerRequirements: apiData?.value.widget.args.bookingRequirements.travelerRequirements,
      showTravelDocuments: showTravelDocuments
    });
  }

  // Use transformed data, provided props, or fallback to mock data
  const finalFlightDetails = transformedFlightDetails || flightDetails || mockData.flightDetails;
  const finalPassengerDetails = transformedPassengerDetails || passengerDetails || mockData.passengerDetails;
  const finalContactInfo = transformedContactInfo || contactInfo || mockData.contactInfo;
  const finalTravelDocument = transformedTravelDocument || travelDocument || mockData.travelDocument;
  const finalPaymentSummary = transformedPaymentSummary || paymentSummary || mockData.paymentSummary;
  const finalSeatAllocation = seatAllocation || mockData.seatAllocation;

  // Determine if seat component should be shown (only if seatAllocation is provided)
  const showSeatComponent = !!seatAllocation;

  // Component state
  const [isFlightExpanded, setIsFlightExpanded] = useState(false);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [isTravelDocsExpanded, setIsTravelDocsExpanded] = useState(false);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [isSeatSelected, setIsSeatSelected] = useState(finalSeatAllocation?.isSelected || false);
  const [isSavedPassengersExpanded, setIsSavedPassengersExpanded] = useState(false);

  // Form state - initialize with transformed/provided data
  const [passenger, setPassenger] = useState(finalPassengerDetails);
  const [contact, setContact] = useState(finalContactInfo);
  const [document, setDocument] = useState(
    showTravelDocuments
      ? finalTravelDocument || {
          type: '',
          number: '',
          issuingCountry: '',
          expiryDate: '',
          nationality: ''
        }
      : null
  );

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});

  // Validation functions
  const validateField = (value: string | undefined | null, fieldName: string): boolean => {
    const isEmpty = !value || value.trim() === '';
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: isEmpty
    }));
    return !isEmpty;
  };

  const validateEmail = (email: string | undefined | null): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = email && emailRegex.test(email);
    setValidationErrors(prev => ({
      ...prev,
      email: !isValid
    }));
    return !!isValid;
  };

  const validateAllFields = (): boolean => {
    let isValid = true;
    const errors: {[key: string]: boolean} = {};

    // Validate passenger details
    if (!passenger.firstName?.trim()) {
      errors.firstName = true;
      isValid = false;
    }
    if (!passenger.lastName?.trim()) {
      errors.lastName = true;
      isValid = false;
    }
    if (!passenger.gender?.trim()) {
      errors.gender = true;
      isValid = false;
    }
    // Only validate Date of Birth if travel documents are shown and expanded
    if (showTravelDocuments && isTravelDocsExpanded && !passenger.dateOfBirth?.trim()) {
      errors.dateOfBirth = true;
      isValid = false;
    }

    // Validate contact information
    if (!contact.email?.trim()) {
      errors.email = true;
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.email = true;
      isValid = false;
    }
    if (!contact.phone?.trim()) {
      errors.phone = true;
      isValid = false;
    }

    // Validate travel documents (only if shown)
    if (showTravelDocuments) {
      if (!document || !document.type?.trim()) {
        errors.documentType = true;
        isValid = false;
      }
      if (!document || !document.number?.trim()) {
        errors.documentNumber = true;
        isValid = false;
      }
      if (!document || !document.issuingCountry?.trim()) {
        errors.issuingCountry = true;
        isValid = false;
      }
      if (!document || !document.expiryDate?.trim()) {
        errors.expiryDate = true;
        isValid = false;
      }
      if (!document || !document.nationality?.trim()) {
        errors.nationality = true;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Check if form is valid for submit button (computed property)
  const isFormValid = useMemo(() => {
    // Check passenger details
    if (!passenger.firstName?.trim() || !passenger.lastName?.trim() || !passenger.gender?.trim()) {
      return false;
    }

    // Only validate Date of Birth if travel documents are shown and expanded
    if (showTravelDocuments && isTravelDocsExpanded && !passenger.dateOfBirth?.trim()) {
      return false;
    }

    // Check contact information
    if (!contact.email?.trim() || !contact.phone?.trim()) {
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return false;
    }

    // Check travel documents (only if shown)
    if (showTravelDocuments) {
      if (!document || !document.type?.trim() || !document.number?.trim() ||
          !document.issuingCountry?.trim() || !document.expiryDate?.trim() ||
          !document.nationality?.trim()) {
        return false;
      }
    }

    return true;
  }, [passenger, contact, document, showTravelDocuments, isTravelDocsExpanded]);

  // Calculate total with seat selection
  const calculateTotal = () => {
    if (!showSeatComponent) {
      return finalPaymentSummary.total;
    }
    const seatFare = isSeatSelected && finalSeatAllocation ? finalSeatAllocation.price : 0;
    return finalPaymentSummary.baseFare + finalPaymentSummary.taxes + finalPaymentSummary.fees + seatFare - finalPaymentSummary.discount;
  };

  // Handle selecting a saved passenger
  const handleSelectSavedPassenger = (savedPassenger: typeof savedPassengers[0]) => {
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
    // Validate all fields before submission
    if (!validateAllFields()) {
      // Scroll to first error field
      const firstErrorField = window.document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const bookingData = {
      flightDetails: finalFlightDetails,
      passenger,
      contact,
      document,
      seatAllocation: showSeatComponent ? {
        ...finalSeatAllocation,
        isSelected: isSeatSelected,
      } : null,
      total: calculateTotal(),
      apiData, // Include original API data for backend processing
    };

    if (onSubmit) {
      onSubmit(bookingData);
    } else if (thread) {
      await submitInterruptResponse(thread, "booking_confirmation", bookingData);
    } else {
      // Demo mode - just log the data
      console.log("Demo booking submission:", bookingData);
      const currency = finalPaymentSummary.currency === 'INR' ? '₹' : '$';
      alert(`Booking confirmed! Total: ${currency}${calculateTotal().toFixed(2)}`);
    }
  };

  return (
    <div className={cn(
      isInBottomSheet ? "bg-white" : "bg-gray-50 min-h-screen"
    )}>
      <div className={cn(
        "max-w-4xl mx-auto",
        isInBottomSheet ? "p-4 pb-4" : "p-3 sm:p-4 pb-20 sm:pb-4"
      )}>
        {/* Header - Only show if not in bottom sheet (title is in sheet header) */}
        {!isInBottomSheet && (
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Review Your Booking
          </h1>
        )}



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
                  <div className="hidden sm:flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-base font-bold">{finalFlightDetails.departure.code}</div>
                        <div className="text-base font-bold">{finalFlightDetails.departure.time}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-center">
                        <div className="text-base font-bold">{finalFlightDetails.arrival.code}</div>
                        <div className="text-base font-bold">{finalFlightDetails.arrival.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">{finalFlightDetails.airline.flightNumber}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">{finalFlightDetails.airline.cabinClass}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">Duration: {finalFlightDetails.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center">
                        <div className="text-base font-bold">{finalFlightDetails.departure.code}</div>
                        <div className="text-base font-bold">{finalFlightDetails.departure.time}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-center">
                        <div className="text-base font-bold">{finalFlightDetails.arrival.code}</div>
                        <div className="text-base font-bold">{finalFlightDetails.arrival.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-3 text-xs text-gray-600">
                      <span>{finalFlightDetails.airline.flightNumber}</span>
                      <span>•</span>
                      <span>{finalFlightDetails.airline.cabinClass}</span>
                      <span>•</span>
                      <span>{finalFlightDetails.duration}</span>
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
              <div className="border-t pt-4 mt-3">
                {/* Airline Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plane className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{finalFlightDetails.airline.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-600">
                        Aircraft: {finalFlightDetails.airline.aircraftType || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Departure */}
                  <div className="text-left">
                    <div className="text-sm text-gray-600 mb-1">Departure</div>
                    <div className="text-base font-bold">{finalFlightDetails.departure.time}</div>
                    <div className="text-sm text-gray-900">{finalFlightDetails.departure.city}</div>
                    <div className="text-xs text-gray-600">{finalFlightDetails.departure.date}</div>
                  </div>

                  {/* Duration Indicator */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">{finalFlightDetails.duration}</div>
                    <div className="flex items-center w-full">
                      <div className="w-20 h-px bg-gray-300"></div>
                      <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Non-stop</div>
                  </div>

                  {/* Arrival */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Arrival</div>
                    <div className="text-base font-bold">{finalFlightDetails.arrival.time}</div>
                    <div className="text-sm text-gray-900">{finalFlightDetails.arrival.city}</div>
                    <div className="text-xs text-gray-600">{finalFlightDetails.arrival.date}</div>
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
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={passenger.firstName}
                  onChange={(e) => {
                    setPassenger({ ...passenger, firstName: e.target.value });
                    validateField(e.target.value, 'firstName');
                  }}
                  className={cn(
                    "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    validationErrors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  )}
                  placeholder="Enter first name"
                />
                {validationErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">First name is required</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName" className="text-xs font-medium text-gray-700 mb-0.5">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={passenger.lastName}
                  onChange={(e) => {
                    setPassenger({ ...passenger, lastName: e.target.value });
                    validateField(e.target.value, 'lastName');
                  }}
                  className={cn(
                    "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    validationErrors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  )}
                  placeholder="Enter last name"
                />
                {validationErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">Last name is required</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor="gender" className="text-xs font-medium text-gray-700 mb-0.5">
                  Gender *
                </Label>
                <Select
                  value={passenger.gender}
                  onValueChange={(value) => {
                    setPassenger({ ...passenger, gender: value });
                    validateField(value, 'gender');
                  }}
                >
                  <SelectTrigger className={cn(
                    "h-9",
                    validationErrors.gender ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  )}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.gender && (
                  <p className="text-red-500 text-xs mt-1">Gender is required</p>
                )}
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
                      {savedPassengers.map((savedPassenger) => (
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
                                {savedPassenger.gender} • {savedPassenger.dateOfBirth ? `Born ${savedPassenger.dateOfBirth}` : 'No DOB'}
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
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => {
                        setContact({ ...contact, phone: e.target.value });
                        validateField(e.target.value, 'phone');
                      }}
                      className={cn(
                        "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        validationErrors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}
                      placeholder="+1 (555) 123-4567"
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">Phone number is required</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label htmlFor="email" className="text-xs font-medium text-gray-700 mb-0.5">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={contact.email}
                      onChange={(e) => {
                        setContact({ ...contact, email: e.target.value });
                        validateEmail(e.target.value);
                      }}
                      className={cn(
                        "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        validationErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}
                      placeholder="your.email@example.com"
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-xs mt-1">Valid email address is required</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 mt-4">
                  <p className="text-xs text-gray-600">
                    We&apos;ll use this information to send you booking confirmations and updates.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Travel Documents - Only show if travelerRequirements is not null */}
          {showTravelDocuments && (
            <div className="bg-white rounded-lg shadow p-4">
            <div
              className="cursor-pointer"
              onClick={() => setIsTravelDocsExpanded(!isTravelDocsExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Travel Documents</h2>
                  {!isTravelDocsExpanded && document && document.type && document.number && (
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
                      Date of Birth *
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={passenger.dateOfBirth}
                      onChange={(e) => {
                        setPassenger({ ...passenger, dateOfBirth: e.target.value });
                        validateField(e.target.value, 'dateOfBirth');
                      }}
                      className={cn(
                        "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        validationErrors.dateOfBirth ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}
                    />
                    {validationErrors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1">Date of birth is required</p>
                    )}
                  </div>

                  {/* Document Type */}
                  <div>
                    <Label htmlFor="documentType" className="text-xs font-medium text-gray-700 mb-0.5">
                      Document Type *
                    </Label>
                    <Select
                      value={document?.type || ''}
                      onValueChange={(value) => {
                        setDocument({ ...(document || {}), type: value } as any);
                        validateField(value, 'documentType');
                      }}
                    >
                      <SelectTrigger className={cn(
                        "h-9",
                        validationErrors.documentType ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="Driver&apos;s License">Driver&apos;s License</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.documentType && (
                      <p className="text-red-500 text-xs mt-1">Document type is required</p>
                    )}
                  </div>

                  {/* Document Number */}
                  <div className="relative">
                    <Label htmlFor="documentNumber" className="text-xs font-medium text-gray-700 mb-0.5">
                      {document?.type || 'Document'} Number *
                    </Label>
                    <Input
                      id="documentNumber"
                      type="text"
                      value={document?.number || ''}
                      onChange={(e) => {
                        setDocument({ ...(document || {}), number: e.target.value } as any);
                        validateField(e.target.value, 'documentNumber');
                      }}
                      className={cn(
                        "w-full border rounded-md px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        validationErrors.documentNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}
                      placeholder="Enter document number"
                    />
                    {validationErrors.documentNumber && (
                      <p className="text-red-500 text-xs mt-1">Document number is required</p>
                    )}
                  </div>

                  {/* Issuing Country */}
                  <div>
                    <Label htmlFor="issuingCountry" className="text-xs font-medium text-gray-700 mb-0.5">
                      Issuing Country *
                    </Label>
                    <Input
                      id="issuingCountry"
                      type="text"
                      value={document?.issuingCountry || ''}
                      onChange={(e) => {
                        setDocument({ ...(document || {}), issuingCountry: e.target.value } as any);
                        validateField(e.target.value, 'issuingCountry');
                      }}
                      className={cn(
                        "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        validationErrors.issuingCountry ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}
                      placeholder="Enter issuing country"
                    />
                    {validationErrors.issuingCountry && (
                      <p className="text-red-500 text-xs mt-1">Issuing country is required</p>
                    )}
                  </div>

                  {/* Nationality */}
                  <div>
                    <Label htmlFor="nationality" className="text-xs font-medium text-gray-700 mb-0.5">
                      Nationality *
                    </Label>
                    <Input
                      id="nationality"
                      type="text"
                      value={document?.nationality || ''}
                      onChange={(e) => {
                        setDocument({ ...(document || {}), nationality: e.target.value } as any);
                        validateField(e.target.value, 'nationality');
                      }}
                      className={cn(
                        "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        validationErrors.nationality ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}
                      placeholder="Enter nationality"
                    />
                    {validationErrors.nationality && (
                      <p className="text-red-500 text-xs mt-1">Nationality is required</p>
                    )}
                  </div>

                  {/* Expiry Date */}
                  <div className="relative">
                    <Label htmlFor="expiryDate" className="text-xs font-medium text-gray-700 mb-0.5">
                      Expiry Date *
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={document?.expiryDate || ''}
                      onChange={(e) => {
                        setDocument({ ...(document || {}), expiryDate: e.target.value } as any);
                        validateField(e.target.value, 'expiryDate');
                      }}
                      className={cn(
                        "w-full border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        validationErrors.expiryDate ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      )}
                    />
                    {validationErrors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">Expiry date is required</p>
                    )}
                    {/* Expiry Warning */}
                    {(() => {
                      if (!document?.expiryDate) return null;
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
          )}

          {/* Seat Allocation - Only show if seat data is available */}
          {showSeatComponent && finalSeatAllocation && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold">Seat Allocation</h2>
                  {isSeatSelected && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {finalSeatAllocation.seatNumber}
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
                        {isSeatSelected ? `Seat ${finalSeatAllocation.seatNumber}` : "No seat selected"}
                      </span>
                    </div>
                    {isSeatSelected && (
                      <p className="text-xs text-gray-600">{finalSeatAllocation.location}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {isSeatSelected ? `${finalPaymentSummary.currency === 'INR' ? '₹' : '$'}${finalSeatAllocation.price.toFixed(2)}` : `${finalPaymentSummary.currency === 'INR' ? '₹' : '$'}0.00`}
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
          )}

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
                    Total: {finalPaymentSummary.currency === 'INR' ? '₹' : '$'}{calculateTotal().toFixed(2)} {finalPaymentSummary.currency}
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
                  <span className="text-xs font-medium">{finalPaymentSummary.currency === 'INR' ? '₹' : '$'}{finalPaymentSummary.baseFare.toFixed(2)}</span>
                </div>

                {/* Taxes */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Taxes & fees</span>
                  <span className="text-xs font-medium">{finalPaymentSummary.currency === 'INR' ? '₹' : '$'}{finalPaymentSummary.taxes.toFixed(2)}</span>
                </div>

                {/* Service Fees */}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Service fees</span>
                  <span className="text-xs font-medium">{finalPaymentSummary.currency === 'INR' ? '₹' : '$'}{finalPaymentSummary.fees.toFixed(2)}</span>
                </div>

                {/* Seat Selection - Only show if seat component is enabled */}
                {showSeatComponent && finalSeatAllocation && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Seat selection</span>
                    <span className="text-xs font-medium">
                      {finalPaymentSummary.currency === 'INR' ? '₹' : '$'}{isSeatSelected ? finalSeatAllocation.price.toFixed(2) : "0.00"}
                    </span>
                  </div>
                )}

                {/* Discount */}
                {finalPaymentSummary.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Discount</span>
                    <span className="text-xs font-medium text-green-600">
                      -{finalPaymentSummary.currency === 'INR' ? '₹' : '$'}{finalPaymentSummary.discount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-sm font-bold">
                      {finalPaymentSummary.currency === 'INR' ? '₹' : '$'}{calculateTotal().toFixed(2)} {finalPaymentSummary.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isInBottomSheet ? (
          // Bottom sheet buttons - always sticky at bottom
          <div className="sticky bottom-0 bg-white border-t p-4 mt-6 -mx-4">
            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={cn(
                  "flex-1",
                  isFormValid
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex justify-end mt-6 space-x-3">
              <Button variant="outline" className="px-6">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={cn(
                  "px-6",
                  isFormValid
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                Confirm Booking
              </Button>
            </div>

            {/* Mobile Sticky Button */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={cn(
                  "w-full py-3 text-base",
                  isFormValid
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                Confirm Booking
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewWidget;
