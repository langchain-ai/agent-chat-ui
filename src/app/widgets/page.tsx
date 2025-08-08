"use client";

import React from "react";
import FlightStatusWidget from "@/components/widgets/flightStatus.wdiget";
import LoungeWidget from "@/components/widgets/lounge.widget";
import WeatherWidget from "@/components/widgets/weather.widget";

// Import the actual widgets
import SearchCriteriaWidget from "@/components/widgets/searchCriteria.widget";
import FlightOptionsWidget from "@/components/widgets/flightOptions.widget";
import ReviewWidget from "@/components/widgets/review.widget";
import PaymentWidget from "@/components/widgets/payment.widget";
import SeatPreferenceWidget from "@/components/widgets/seatPreference.widget";
import SeatSelectionWidget from "@/components/widgets/seatSelection.widget";
import SeatPaymentWidget from "@/components/widgets/seatPayment.widget";
import SeatCombinedWidget from "@/components/widgets/seatCombined.widget";
import AddBaggageWidget from "@/components/widgets/addBaggage.widget";
import WhosTravellingWidget from "@/components/widgets/whosTravelling.widget";
import ReviewWidgetDemo from "@/components/widgets/review-widget-demo";

// Import the StreamProvider to wrap our widgets
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { TabProvider } from "@/providers/TabContext";

// Mock data for SearchCriteriaWidget
const mockSearchCriteriaData = {
  flightSearchCriteria: {
    adults: 2,
    children: 0,
    infants: 0,
    class: "economy",
    departureDate: "2024-07-20",
    returnDate: "2024-07-25",
    destinationAirport: "BOM",
    originAirport: "DEL",
    isRoundTrip: true,
    passengers: [
      { id: 1, type: "adult" },
      { id: 2, type: "adult" },
    ],
  },
  selectedTravellerIds: [],
  allTravellers: [],
};

// Mock flight data - Updated to match FlightOptionsWidget interface
const mockFlights = [
  {
    flightOfferId: "AI101-DEL-BOM-20240720",
    totalEmission: 145,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 8500,
    duration: "PT3H25M",
    departure: {
      date: "2024-07-20T10:30:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T13:55:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "AI101-DEL-BOM-1",
        airlineIata: "AI",
        flightNumber: "AI 101",
        aircraftType: "Boeing 737-800",
        airlineName: "Air India",
        duration: "PT2H5M",
        departure: {
          date: "2024-07-20T10:30:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T12:35:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: true,
    },
    rankingScore: 8.5,
    pros: [
      "Direct flight",
      "Good timing",
      "Reliable airline",
      "Free cancellation",
    ],
    cons: ["Higher price than budget airlines"],
    tags: ["recommended"],
  },
  {
    flightOfferId: "6E202-DEL-BOM-20240720",
    totalEmission: 138,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 7200,
    duration: "PT2H10M",
    departure: {
      date: "2024-07-20T14:15:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T16:25:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "6E202-DEL-BOM-1",
        airlineIata: "6E",
        flightNumber: "6E 202",
        aircraftType: "Airbus A320",
        airlineName: "IndiGo",
        duration: "PT2H10M",
        departure: {
          date: "2024-07-20T14:15:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T16:25:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: false,
    },
    rankingScore: 7.8,
    pros: ["Lowest price", "Direct flight", "On-time performance"],
    cons: ["Non-refundable", "Basic service", "No meals included"],
    tags: ["cheapest"],
  },
  {
    flightOfferId: "UK955-DEL-BOM-20240720",
    totalEmission: 142,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 9200,
    duration: "PT4H35M",
    departure: {
      date: "2024-07-20T18:45:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T23:20:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "UK955-DEL-BOM-1",
        airlineIata: "UK",
        flightNumber: "UK 955",
        aircraftType: "Airbus A320neo",
        airlineName: "Vistara",
        duration: "PT2H5M",
        departure: {
          date: "2024-07-20T18:45:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T20:50:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: true,
    },
    rankingScore: 9.2,
    pros: [
      "Premium service",
      "Direct flight",
      "Evening departure",
      "Complimentary meals",
    ],
    cons: ["Higher price", "Limited baggage allowance"],
    tags: ["fastest"],
  },
  // Additional flights for more comprehensive showcase
  {
    flightOfferId: "SG8182-DEL-BOM-20240720",
    totalEmission: 155,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 7800,
    duration: "PT3H25M",
    departure: {
      date: "2024-07-20T08:15:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T12:40:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "SG8182-DEL-BLR-1",
        airlineIata: "SG",
        flightNumber: "SG 8182",
        aircraftType: "Boeing 737-800",
        airlineName: "SpiceJet",
        duration: "PT2H15M",
        departure: {
          date: "2024-07-20T08:15:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T10:30:00Z",
          airportIata: "BLR",
          airportName: "Kempegowda International Airport",
          cityCode: "BLR",
          countryCode: "IN",
        },
      },
      {
        id: "SG8183-BLR-BOM-2",
        airlineIata: "SG",
        flightNumber: "SG 8183",
        aircraftType: "Boeing 737-800",
        airlineName: "SpiceJet",
        duration: "PT1H10M",
        departure: {
          date: "2024-07-20T11:30:00Z",
          airportIata: "BLR",
          airportName: "Kempegowda International Airport",
          cityCode: "BLR",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T12:40:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: false,
    },
    rankingScore: 6.5,
    pros: ["Early morning departure", "Affordable price"],
    cons: ["One stop", "Long layover", "Non-refundable"],
    tags: [],
  },
  {
    flightOfferId: "G8394-DEL-BOM-20240720",
    totalEmission: 148,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 8200,
    duration: "PT5H15M",
    departure: {
      date: "2024-07-20T16:30:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T21:45:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "G8394-DEL-BOM-1",
        airlineIata: "G8",
        flightNumber: "G8 394",
        aircraftType: "Airbus A320",
        airlineName: "GoAir",
        duration: "PT2H15M",
        departure: {
          date: "2024-07-20T16:30:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T18:45:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: true,
    },
    rankingScore: 7.2,
    pros: ["Direct flight", "Afternoon departure", "Refundable"],
    cons: ["Slightly longer duration"],
    tags: [],
  },
  {
    flightOfferId: "AI127-DEL-BOM-20240720",
    totalEmission: 140,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 10500,
    duration: "PT2H0M",
    departure: {
      date: "2024-07-20T21:15:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T23:15:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "AI127-DEL-BOM-1",
        airlineIata: "AI",
        flightNumber: "AI 127",
        aircraftType: "Boeing 787-8",
        airlineName: "Air India",
        duration: "PT2H0M",
        departure: {
          date: "2024-07-20T21:15:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T23:15:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: true,
    },
    rankingScore: 8.8,
    pros: [
      "Late night departure",
      "Premium aircraft",
      "Shortest duration",
      "Business class available",
    ],
    cons: ["Most expensive", "Late arrival"],
    tags: [],
  },
  // Additional flights to make 10 total
  {
    flightOfferId: "6E456-DEL-BOM-20240720",
    totalEmission: 135,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 6800,
    duration: "PT2H8M",
    departure: {
      date: "2024-07-20T06:30:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T08:38:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "6E456-DEL-BOM-1",
        airlineIata: "6E",
        flightNumber: "6E 456",
        aircraftType: "Airbus A320neo",
        airlineName: "IndiGo",
        duration: "PT2H8M",
        departure: {
          date: "2024-07-20T06:30:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T08:38:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: false,
    },
    rankingScore: 7.5,
    pros: ["Early morning departure", "Good value for money", "Direct flight"],
    cons: ["Very early departure", "Non-refundable", "Basic service"],
    tags: ["cheapest"],
  },
  {
    flightOfferId: "UK789-DEL-BOM-20240720",
    totalEmission: 141,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 9800,
    duration: "PT1H58M",
    departure: {
      date: "2024-07-20T12:45:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T14:43:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "UK789-DEL-BOM-1",
        airlineIata: "UK",
        flightNumber: "UK 789",
        aircraftType: "Boeing 737 MAX",
        airlineName: "Vistara",
        duration: "PT1H58M",
        departure: {
          date: "2024-07-20T12:45:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T14:43:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: true,
    },
    rankingScore: 9.5,
    pros: [
      "Fastest flight",
      "Premium service",
      "Midday departure",
      "Free meals and drinks",
    ],
    cons: ["Higher price", "Limited availability"],
    tags: ["fastest"],
  },
  {
    flightOfferId: "AI234-DEL-BOM-20240720",
    totalEmission: 147,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 8900,
    duration: "PT2H12M",
    departure: {
      date: "2024-07-20T15:20:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T17:32:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "AI234-DEL-BOM-1",
        airlineIata: "AI",
        flightNumber: "AI 234",
        aircraftType: "Airbus A321",
        airlineName: "Air India",
        duration: "PT2H12M",
        departure: {
          date: "2024-07-20T15:20:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T17:32:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: true,
    },
    rankingScore: 8.2,
    pros: [
      "Afternoon departure",
      "Reliable airline",
      "Good timing",
      "Refundable",
    ],
    cons: ["Moderate price", "Slightly longer duration"],
    tags: ["recommended"],
  },
  {
    flightOfferId: "G8567-DEL-BOM-20240720",
    totalEmission: 152,
    totalEmissionUnit: "kg CO2",
    currency: "INR",
    totalAmount: 7500,
    duration: "PT2H18M",
    departure: {
      date: "2024-07-20T19:10:00Z",
      airportIata: "DEL",
      airportName: "Indira Gandhi International Airport",
      cityCode: "DEL",
      countryCode: "IN",
    },
    arrival: {
      date: "2024-07-20T21:28:00Z",
      airportIata: "BOM",
      airportName: "Chhatrapati Shivaji Maharaj International Airport",
      cityCode: "BOM",
      countryCode: "IN",
    },
    segments: [
      {
        id: "G8567-DEL-BOM-1",
        airlineIata: "G8",
        flightNumber: "G8 567",
        aircraftType: "Airbus A320",
        airlineName: "GoAir",
        duration: "PT2H18M",
        departure: {
          date: "2024-07-20T19:10:00Z",
          airportIata: "DEL",
          airportName: "Indira Gandhi International Airport",
          cityCode: "DEL",
          countryCode: "IN",
        },
        arrival: {
          date: "2024-07-20T21:28:00Z",
          airportIata: "BOM",
          airportName: "Chhatrapati Shivaji Maharaj International Airport",
          cityCode: "BOM",
          countryCode: "IN",
        },
      },
    ],
    offerRules: {
      isRefundable: false,
    },
    rankingScore: 6.8,
    pros: ["Evening departure", "Reasonable price", "Direct flight"],
    cons: ["Non-refundable", "Basic service", "Limited baggage"],
    tags: [],
  },
];

// Mock data for FlightOptionsWidget
const mockFlightOptionsData = {
  flightOffers: mockFlights,
};

// Mock data for PaymentWidget
const mockPaymentData = {
  transaction_id: "TXN123456789",
  reference_id: "REF987654321",
  razorpay_order_id: "order_123456789",
  amount: 30225, // Amount in paise (₹302.25)
  currency: "INR",
  razorpayKey: "rzp_test_1234567890",
  name: "Flight Booking Payment",
  description: "Payment for flight booking from Delhi to Mumbai",
};



// Mock data for WhosTravellingWidget
const mockWhosTravellingData = {
  numberOfTravellers: { adults: 2, children: 1, infants: 0 },
  totalAmount: 25500,
  currency: "INR",
  isInternational: false,
  savedTravellers: [
    {
      travellerId: 1,
      firstName: "John",
      lastName: "Doe",
      gender: "Male",
      dateOfBirth: "1990-01-15",
      nationality: "Indian",
      email: "john.doe@example.com",
      phone: [{ countryCode: "+91", number: "9876543210" }],
      numberOfFlights: 5,
      isPrimaryTraveller: true,
      documents: [
        {
          documentId: 1,
          documentType: "passport",
          documentNumber: "A12345678",
          nationality: "Indian",
          expiryDate: "2029-01-11",
          issuingCountry: "India",
          issuingDate: "2019-01-11",
          documentUrl: "",
        },
      ],
    },
    {
      travellerId: 2,
      firstName: "Jane",
      lastName: "Smith",
      gender: "Female",
      dateOfBirth: "1985-03-22",
      nationality: "Indian",
      email: "jane.smith@example.com",
      phone: [{ countryCode: "+91", number: "9876543211" }],
      numberOfFlights: 3,
      isPrimaryTraveller: false,
      documents: [
        {
          documentId: 2,
          documentType: "passport",
          documentNumber: "B87654321",
          nationality: "Indian",
          expiryDate: "2028-05-15",
          issuingCountry: "India",
          issuingDate: "2018-05-15",
          documentUrl: "",
        },
      ],
    },
  ],
  userDetails: {
    travellerId: 1,
    firstName: "John",
    lastName: "Doe",
    gender: "Male",
    dateOfBirth: "1990-01-15",
    nationality: "Indian",
    email: "john.doe@example.com",
    phone: [{ countryCode: "+91", number: "9876543210" }],
    numberOfFlights: 5,
    isPrimaryTraveller: true,
    documents: [
      {
        documentId: 1,
        documentType: "passport",
        documentNumber: "A12345678",
        nationality: "Indian",
        expiryDate: "2029-01-11",
        issuingCountry: "India",
        issuingDate: "2019-01-11",
        documentUrl: "",
      },
    ],
  },
};

// Wrapper component for SearchCriteriaWidget
const StandaloneSearchCriteriaWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <TabProvider>
          <div className="w-full">
            <SearchCriteriaWidget {...mockSearchCriteriaData} />
          </div>
        </TabProvider>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for FlightOptionsWidget
const StandaloneFlightOptionsWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="flex justify-center">
          <FlightOptionsWidget {...mockFlightOptionsData} />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for ReviewWidget
const StandaloneReviewWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <ReviewWidget />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for PaymentWidget
const StandalonePaymentWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <PaymentWidget {...mockPaymentData} />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Simple demo component for NonAgentFlowWidget (avoiding context issues)
const StandaloneNonAgentFlowWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                <span className="text-white font-semibold">F</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Non-Agent Flow Payment</h3>
                <p className="text-sm text-gray-600">Complete your booking with secure payment</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-medium text-gray-900 mb-2">Trip Details</h4>
                <p className="text-sm text-gray-600">Trip ID: trip_123456789</p>
                <p className="text-sm text-gray-600">Flight: Delhi to Mumbai</p>
                <p className="text-sm text-gray-600">Amount: ₹8,500</p>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700">
                  Proceed to Payment
                </button>
                <button className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Note: This is a demo version. The actual widget requires NonAgentFlowProvider context.
            </div>
          </div>
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for WhosTravellingWidget
const StandaloneWhosTravellingWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <WhosTravellingWidget {...mockWhosTravellingData} />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for AddBaggageWidget
const StandaloneAddBaggageWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <AddBaggageWidget />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for SeatPreferenceWidget
const StandaloneSeatPreferenceWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <SeatPreferenceWidget />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for SeatSelectionWidget
const StandaloneSeatSelectionWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <SeatSelectionWidget />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for SeatPaymentWidget
const StandaloneSeatPaymentWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <SeatPaymentWidget />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for SeatCombinedWidget
const StandaloneSeatCombinedWidget = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <SeatCombinedWidget />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

// Wrapper component for ReviewWidgetDemo
const StandaloneReviewWidgetDemo = () => {
  return (
    <ThreadProvider>
      <StreamProvider>
        <div className="w-full">
          <ReviewWidgetDemo />
        </div>
      </StreamProvider>
    </ThreadProvider>
  );
};

export default function WidgetsPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Widget Showcase
          </h1>
          <p className="text-lg text-gray-600">
            All available widgets displayed in one place
          </p>
        </div>

        <div className="space-y-12">
          {/* Interactive Widgets Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
              Interactive Chat Widgets
            </h2>
            <p className="mb-8 text-center text-gray-600">
              These widgets are used for user input and interaction in chat
              conversations
            </p>
          </div>

          {/* Search Criteria Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Search Criteria Widget
              </h3>
              <p className="text-sm text-gray-600">
                Interactive form for flight search parameters. Used when the
                agent needs user input for flight search criteria.
              </p>
            </div>
            <div className="w-full">
              <StandaloneSearchCriteriaWidget />
            </div>
          </section>

          {/* Flight Options Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Flight Options Widget
              </h3>
              <p className="text-sm text-gray-600">
                Interactive flight selection interface. Used when the agent
                presents flight options for user selection.
              </p>
            </div>
            <div className="flex justify-center">
              <StandaloneFlightOptionsWidget />
            </div>
          </section>

          {/* Display Widgets Section */}
          <div className="mt-16 mb-8">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
              Display Widgets
            </h2>
            <p className="mb-8 text-center text-gray-600">
              These widgets display information sent from the server (marked as
              &quot;simple widget needs to send from server&quot;)
            </p>
          </div>

          {/* Flight Status Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Flight Status Widget
              </h3>
              <p className="text-sm text-gray-600">
                Display-only widget showing flight status information.
              </p>
            </div>
            <div className="flex justify-center">
              <FlightStatusWidget />
            </div>
          </section>

          {/* Lounge Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Lounge Widget
              </h3>
              <p className="text-sm text-gray-600">
                Display-only widget showing airport lounge options.
              </p>
            </div>
            <div className="flex justify-center">
              <LoungeWidget />
            </div>
          </section>

          {/* Weather Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Weather Widget
              </h3>
              <p className="text-sm text-gray-600">
                Display-only widget showing weather information with hourly
                forecast.
              </p>
            </div>
            <div className="flex justify-center">
              <WeatherWidget />
            </div>
          </section>

          {/* Review Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Review Widget
              </h3>
              <p className="text-sm text-gray-600">
                Comprehensive flight booking review page with collapsible
                sections, form validation, and responsive design.
              </p>
            </div>
            <div className="w-full">
              <StandaloneReviewWidget />
            </div>
          </section>

          {/* Review Widget Demo */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Review Widget Demo
              </h3>
              <p className="text-sm text-gray-600">
                Demo version of the Review Widget with real API data examples and bottom sheet functionality.
              </p>
            </div>
            <div className="w-full">
              <StandaloneReviewWidgetDemo />
            </div>
          </section>

          {/* Booking & Payment Widgets Section */}
          <div className="mt-16 mb-8">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
              Booking & Payment Widgets
            </h2>
            <p className="mb-8 text-center text-gray-600">
              These widgets handle passenger details, payments, and booking flow
            </p>
          </div>

          {/* Who's Travelling Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Who&apos;s Travelling Widget
              </h3>
              <p className="text-sm text-gray-600">
                Passenger selection and details widget for booking. Allows users to select from saved passengers or add new ones.
              </p>
            </div>
            <div className="w-full">
              <StandaloneWhosTravellingWidget />
            </div>
          </section>

          {/* Payment Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Payment Widget
              </h3>
              <p className="text-sm text-gray-600">
                Razorpay payment integration widget for processing flight bookings.
              </p>
            </div>
            <div className="w-full">
              <StandalonePaymentWidget />
            </div>
          </section>

          {/* Non-Agent Flow Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Non-Agent Flow Widget
              </h3>
              <p className="text-sm text-gray-600">
                Non-agent flow payment widget with bottom sheet for direct booking flow.
              </p>
            </div>
            <div className="w-full">
              <StandaloneNonAgentFlowWidget />
            </div>
          </section>

          {/* Seat Selection Widgets Section */}
          <div className="mt-16 mb-8">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
              Seat Selection Widgets
            </h2>
            <p className="mb-8 text-center text-gray-600">
              These widgets handle seat preferences, selection, and payment
            </p>
          </div>

          {/* Seat Preference Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Seat Preference Widget
              </h3>
              <p className="text-sm text-gray-600">
                Seat preference selection widget for choosing seat types and preferences.
              </p>
            </div>
            <div className="w-full">
              <StandaloneSeatPreferenceWidget />
            </div>
          </section>

          {/* Seat Selection Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Seat Selection Widget
              </h3>
              <p className="text-sm text-gray-600">
                Visual seat map selection widget for choosing specific seats on the aircraft.
              </p>
            </div>
            <div className="w-full">
              <StandaloneSeatSelectionWidget />
            </div>
          </section>

          {/* Seat Payment Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Seat Payment Widget
              </h3>
              <p className="text-sm text-gray-600">
                Seat payment confirmation widget for processing seat upgrade payments.
              </p>
            </div>
            <div className="w-full">
              <StandaloneSeatPaymentWidget />
            </div>
          </section>

          {/* Seat Combined Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Seat Combined Widget
              </h3>
              <p className="text-sm text-gray-600">
                Combined seat selection widget with all seat options and preferences in one interface.
              </p>
            </div>
            <div className="w-full">
              <StandaloneSeatCombinedWidget />
            </div>
          </section>

          {/* Add-ons Widgets Section */}
          <div className="mt-16 mb-8">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
              Add-ons Widgets
            </h2>
            <p className="mb-8 text-center text-gray-600">
              These widgets handle additional services like baggage
            </p>
          </div>

          {/* Add Baggage Widget */}
          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-gray-800">
                Add Baggage Widget
              </h3>
              <p className="text-sm text-gray-600">
                Baggage selection widget with weight and price options for adding extra baggage.
              </p>
            </div>
            <div className="w-full">
              <StandaloneAddBaggageWidget />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="mx-auto max-w-4xl rounded-lg bg-blue-50 p-6">
            <h4 className="mb-2 text-lg font-semibold text-blue-900">
              How These Widgets Are Used in Chat
            </h4>
            <p className="mb-4 text-sm text-blue-800">
              These widgets are rendered in chat conversations through the
              LangGraph interrupt system. The server sends widget data via
              interrupts, and the client renders the appropriate widget based on
              the type.
            </p>
            <div className="text-left text-sm text-blue-700">
              <p className="mb-2">
                <strong>Interactive widgets</strong> collect user input and send
                responses back to continue the conversation.
              </p>
              <p>
                <strong>Display widgets</strong> show information sent from the
                server without requiring user interaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
