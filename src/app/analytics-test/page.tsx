"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  trackFlightSearch,
  trackFlightResults,
  trackFlightSelected,
  trackFlightBookingAttempt,
  trackWidgetInteraction,
  getUserAnalyticsData,
  setUserProperties,
  type FlightSearchAnalytics,
  type FlightResultsAnalytics,
  type FlightSelectedAnalytics
} from "@/services/analyticsService";

/**
 * Analytics Test Page
 * This page allows manual testing of Google Analytics events
 */
export default function AnalyticsTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFlightSearch = () => {
    const mockSearchData: FlightSearchAnalytics = {
      originAirport: "DEL",
      destinationAirport: "BOM",
      departureDate: "2024-12-25",
      returnDate: "2024-12-30",
      isRoundTrip: true,
      adults: 2,
      children: 1,
      infants: 0,
      class: "economy",
      totalPassengers: 3,
    };

    try {
      trackFlightSearch(mockSearchData);
      addTestResult("✅ Flight search event sent successfully");
    } catch (error) {
      addTestResult(`❌ Flight search event failed: ${error}`);
    }
  };

  const testFlightResults = () => {
    const mockResultsData: FlightResultsAnalytics = {
      result_count: 15,
      lowest_price: 8500,
      highest_price: 25000,
      currency: "INR",
      response_time: 2500,
      top_results: [
        {
          flight_id: "AI101",
          price: 12000,
          airline: "Air India",
          duration: "PT2H30M",
          stops: 0,
          tags: ["best", "recommended"]
        },
        {
          flight_id: "6E202",
          price: 8500,
          airline: "IndiGo",
          duration: "PT2H45M",
          stops: 0,
          tags: ["cheapest"]
        },
        {
          flight_id: "SG303",
          price: 9200,
          airline: "SpiceJet",
          duration: "PT2H20M",
          stops: 0,
          tags: ["fastest"]
        }
      ],
      search_results_summary: {
        total_flights: 15,
        price_range: "8500-25000",
        airlines: ["Air India", "IndiGo", "SpiceJet", "Vistara"],
        has_direct_flights: true,
        average_price: 14500,
      },
    };

    try {
      trackFlightResults(mockResultsData);
      addTestResult("✅ Flight results event sent successfully");
    } catch (error) {
      addTestResult(`❌ Flight results event failed: ${error}`);
    }
  };

  const testFlightSelected = () => {
    const mockSelectionData: FlightSelectedAnalytics = {
      flight_offer_id: "AI101-DEL-BOM-20241225",
      iata_number: "AI 101",
      airline: "Air India",
      timing: "14:30 - 17:00",
      stops: 0,
      price: 12000,
      currency: "INR",
      refundable: "yes",
      selected_from: "cards",
      tags: "best, recommended",
    };

    try {
      trackFlightSelected(mockSelectionData);
      addTestResult("✅ Flight selection event sent successfully");
    } catch (error) {
      addTestResult(`❌ Flight selection event failed: ${error}`);
    }
  };

  const testBookingAttempt = () => {
    const mockBookingData = {
      flightId: "TEST123",
      airline: "Air India",
      price: 15000,
      currency: "INR",
      route: "DEL-BOM",
    };

    try {
      trackFlightBookingAttempt(mockBookingData);
      addTestResult("✅ Booking attempt event sent successfully");
    } catch (error) {
      addTestResult(`❌ Booking attempt event failed: ${error}`);
    }
  };

  const testWidgetInteraction = () => {
    try {
      trackWidgetInteraction("SearchCriteriaWidget", "form_submit", {
        trip_type: "round_trip",
        passenger_count: 3,
      });
      addTestResult("✅ Widget interaction event sent successfully");
    } catch (error) {
      addTestResult(`❌ Widget interaction event failed: ${error}`);
    }
  };

  const testUserProperties = () => {
    try {
      const userData = getUserAnalyticsData();
      if (userData) {
        setUserProperties(userData);
        addTestResult(`✅ User properties set: ${JSON.stringify(userData)}`);
      } else {
        addTestResult("⚠️ No user data available (user not logged in)");
      }
    } catch (error) {
      addTestResult(`❌ User properties failed: ${error}`);
    }
  };

  const checkGoogleAnalytics = () => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      addTestResult("✅ Google Analytics (gtag) is available");

      // Check if dataLayer exists
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        addTestResult(`✅ DataLayer exists with ${window.dataLayer.length} items`);
      } else {
        addTestResult("❌ DataLayer not found");
      }
    } else {
      addTestResult("❌ Google Analytics (gtag) not available");
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Google Analytics Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <Button 
            onClick={checkGoogleAnalytics}
            className="w-full"
            variant="outline"
          >
            Check GA Setup
          </Button>
          
          <Button 
            onClick={testUserProperties}
            className="w-full"
            variant="outline"
          >
            Test User Properties
          </Button>
          
          <Button
            onClick={testFlightSearch}
            className="w-full"
          >
            Test Flight Search Event
          </Button>

          <Button
            onClick={testFlightResults}
            className="w-full"
          >
            Test Flight Results Event
          </Button>

          <Button
            onClick={testFlightSelected}
            className="w-full"
          >
            Test Flight Selection Event
          </Button>

          <Button
            onClick={testBookingAttempt}
            className="w-full"
          >
            Test Booking Attempt Event
          </Button>
          
          <Button 
            onClick={testWidgetInteraction}
            className="w-full"
          >
            Test Widget Interaction Event
          </Button>
          
          <Button 
            onClick={clearResults}
            className="w-full"
            variant="destructive"
          >
            Clear Results
          </Button>
        </div>

        {/* Test Results */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Click a test button to start.</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>First, click &quot;Check GA Setup&quot; to verify Google Analytics is loaded</li>
          <li>If logged in, click &quot;Test User Properties&quot; to set user data</li>
          <li>Click the event test buttons to send test events</li>
          <li>Open browser DevTools → Network tab to see gtag requests</li>
          <li>Check Google Analytics Real-Time reports to verify events</li>
        </ol>
      </div>

      {/* Event Details */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Expected Events</h3>
        <div className="text-sm space-y-2">
          <p><strong>flight_search:</strong> Tracks search form submissions with all criteria</p>
          <p><strong>flight_results:</strong> Tracks when flight results are loaded with pricing and options</p>
          <p><strong>flight_selected:</strong> Tracks when user selects a specific flight from cards or bottom sheet</p>
          <p><strong>flight_booking_attempt:</strong> Tracks when user attempts to book</p>
          <p><strong>widget_interaction:</strong> Tracks general widget interactions</p>
          <p><strong>User Properties:</strong> Sets user_id, user_email, user_name</p>
        </div>
      </div>
    </div>
  );
}
