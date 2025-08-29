/**
 * Google Analytics Service
 * Handles all Google Analytics tracking events and user properties
 */

import { getJwtToken, GetUserId, getUserEmail, getUserFullName } from './authService';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Flight search criteria interface for analytics
 */
export interface FlightSearchAnalytics {
  originAirport: string;
  destinationAirport: string;
  departureDate: string;
  returnDate?: string;
  isRoundTrip: boolean;
  adults: number;
  children: number;
  infants: number;
  class: string;
  totalPassengers: number;
}

/**
 * User data interface for analytics
 */
export interface UserAnalytics {
  userId: string | number;
  email: string | null;
  fullName: string;
}

/**
 * Check if Google Analytics is available
 */
export const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Get user data for analytics
 */
export const getUserAnalyticsData = (): UserAnalytics | null => {
  try {
    const token = getJwtToken();
    if (!token) return null;

    const userId = GetUserId(token);
    const email = getUserEmail();
    const fullName = getUserFullName();

    return {
      userId,
      email,
      fullName,
    };
  } catch (error) {
    console.error('Error getting user analytics data:', error);
    return null;
  }
};

/**
 * Set user properties in Google Analytics
 */
export const setUserProperties = (userData: UserAnalytics): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available');
    return;
  }

  try {
    // Set user ID
    if (userData.userId) {
      window.gtag('config', 'G-SLRTVD2EYS', {
        user_id: userData.userId.toString(),
      });
    }

    // Set custom user properties
    window.gtag('set', {
      user_email: userData.email || 'unknown',
      user_name: userData.fullName || 'unknown',
    });

    console.log('✅ User properties set in Google Analytics:', userData);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

/**
 * Track flight search event
 */
export const trackFlightSearch = (searchCriteria: FlightSearchAnalytics): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available');
    return;
  }

  try {
    // Get user data
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    // Track the flight search event
    window.gtag('event', 'flight_search', {
      event_category: 'engagement',
      event_label: 'flight_search_form',
      // Flight route information
      origin_airport: searchCriteria.originAirport,
      destination_airport: searchCriteria.destinationAirport,
      route: `${searchCriteria.originAirport}-${searchCriteria.destinationAirport}`,
      
      // Trip details
      trip_type: searchCriteria.isRoundTrip ? 'round_trip' : 'one_way',
      departure_date: searchCriteria.departureDate,
      return_date: searchCriteria.returnDate || null,
      
      // Passenger information
      adults_count: searchCriteria.adults,
      children_count: searchCriteria.children,
      infants_count: searchCriteria.infants,
      total_passengers: searchCriteria.totalPassengers,
      
      // Service class
      flight_class: searchCriteria.class,
      
      // Additional metadata
      search_timestamp: new Date().toISOString(),
    });

    console.log('✅ Flight search event tracked:', {
      searchCriteria,
      userData,
    });
  } catch (error) {
    console.error('Error tracking flight search event:', error);
  }
};

/**
 * Track flight booking attempt
 */
export const trackFlightBookingAttempt = (flightData: any): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'flight_booking_attempt', {
      event_category: 'conversion',
      event_label: 'booking_attempt',
      flight_id: flightData.flightId || 'unknown',
      airline: flightData.airline || 'unknown',
      price: flightData.price || 0,
      currency: flightData.currency || 'INR',
    });

    console.log('✅ Flight booking attempt tracked');
  } catch (error) {
    console.error('Error tracking flight booking attempt:', error);
  }
};

/**
 * Track flight booking success
 */
export const trackFlightBookingSuccess = (bookingData: any): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'purchase', {
      event_category: 'conversion',
      transaction_id: bookingData.bookingId || bookingData.transactionId,
      value: bookingData.totalAmount || 0,
      currency: bookingData.currency || 'INR',
      items: [{
        item_id: bookingData.flightId || 'flight',
        item_name: `Flight ${bookingData.route || 'booking'}`,
        category: 'flight',
        quantity: bookingData.passengerCount || 1,
        price: bookingData.totalAmount || 0,
      }],
    });

    console.log('✅ Flight booking success tracked');
  } catch (error) {
    console.error('Error tracking flight booking success:', error);
  }
};

/**
 * Flight results interface for analytics
 */
export interface FlightResultsAnalytics {
  result_count: number;
  lowest_price: number;
  highest_price: number;
  currency: string;
  response_time?: number;
  top_results: Array<{
    flight_id: string;
    price: number;
    airline: string;
    duration?: string;
    stops: number;
    tags?: string[];
  }>;
  search_results_summary: {
    total_flights: number;
    price_range: string;
    airlines: string[];
    has_direct_flights: boolean;
    average_price: number;
  };
}

/**
 * Track flight results event
 */
export const trackFlightResults = (resultsData: FlightResultsAnalytics): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available');
    return;
  }

  try {
    // Get user data
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    // Track the flight results event
    window.gtag('event', 'flight_results', {
      event_category: 'engagement',
      event_label: 'flight_results_loaded',

      // Result metrics
      result_count: resultsData.result_count,
      lowest_price: resultsData.lowest_price,
      highest_price: resultsData.highest_price,
      currency: resultsData.currency,
      response_time: resultsData.response_time || null,

      // Price analysis
      price_range: resultsData.search_results_summary.price_range,
      average_price: resultsData.search_results_summary.average_price,

      // Flight characteristics
      total_airlines: resultsData.search_results_summary.airlines.length,
      has_direct_flights: resultsData.search_results_summary.has_direct_flights,

      // Top results (first 3 flights shown)
      top_flight_1_id: resultsData.top_results[0]?.flight_id || null,
      top_flight_1_price: resultsData.top_results[0]?.price || null,
      top_flight_1_airline: resultsData.top_results[0]?.airline || null,
      top_flight_1_stops: resultsData.top_results[0]?.stops || null,
      top_flight_1_tags: resultsData.top_results[0]?.tags?.join(',') || null,

      top_flight_2_id: resultsData.top_results[1]?.flight_id || null,
      top_flight_2_price: resultsData.top_results[1]?.price || null,
      top_flight_2_airline: resultsData.top_results[1]?.airline || null,
      top_flight_2_stops: resultsData.top_results[1]?.stops || null,
      top_flight_2_tags: resultsData.top_results[1]?.tags?.join(',') || null,

      top_flight_3_id: resultsData.top_results[2]?.flight_id || null,
      top_flight_3_price: resultsData.top_results[2]?.price || null,
      top_flight_3_airline: resultsData.top_results[2]?.airline || null,
      top_flight_3_stops: resultsData.top_results[2]?.stops || null,
      top_flight_3_tags: resultsData.top_results[2]?.tags?.join(',') || null,

      // Additional metadata
      results_timestamp: new Date().toISOString(),
    });

    console.log('✅ Flight results event tracked:', {
      result_count: resultsData.result_count,
      price_range: `${resultsData.lowest_price}-${resultsData.highest_price} ${resultsData.currency}`,
      top_results_count: resultsData.top_results.length,
      userData,
    });
  } catch (error) {
    console.error('Error tracking flight results event:', error);
  }
};

/**
 * Flight selection interface for analytics
 */
export interface FlightSelectedAnalytics {
  flight_offer_id: string;
  iata_number: string;
  airline: string;
  timing: string;
  stops: number;
  price: number;
  currency: string;
  refundable: 'yes' | 'no';
  selected_from: 'cards' | 'bottomsheet';
  tags: string | null;
}

/**
 * Track flight selection event
 */
export const trackFlightSelected = (selectionData: FlightSelectedAnalytics): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not available');
    return;
  }

  try {
    // Get user data
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    // Track the flight selection event
    window.gtag('event', 'flight_selected', {
      event_category: 'engagement',
      event_label: 'flight_selection',

      // Flight identification
      flight_offer_id: selectionData.flight_offer_id,
      iata_number: selectionData.iata_number,
      airline: selectionData.airline,

      // Flight characteristics
      timing: selectionData.timing,
      stops: selectionData.stops,
      price: selectionData.price,
      currency: selectionData.currency,
      refundable: selectionData.refundable,

      // Selection context
      selected_from: selectionData.selected_from,
      tags: selectionData.tags,

      // Additional metadata
      selection_timestamp: new Date().toISOString(),
    });

    console.log('✅ Flight selection event tracked:', {
      flight_id: selectionData.flight_offer_id,
      airline: selectionData.airline,
      price: `${selectionData.price} ${selectionData.currency}`,
      selected_from: selectionData.selected_from,
      tags: selectionData.tags,
      userData,
    });
  } catch (error) {
    console.error('Error tracking flight selection event:', error);
  }
};

/**
 * Track widget interaction
 */
export const trackWidgetInteraction = (widgetType: string, action: string, data?: any): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'widget_interaction', {
      event_category: 'engagement',
      event_label: `${widgetType}_${action}`,
      widget_type: widgetType,
      action: action,
      ...data,
    });

    console.log(`✅ Widget interaction tracked: ${widgetType} - ${action}`);
  } catch (error) {
    console.error('Error tracking widget interaction:', error);
  }
};
