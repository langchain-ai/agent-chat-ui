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
  const available = typeof window !== 'undefined' && typeof window.gtag === 'function';
  if (!available) {
    console.warn('Google Analytics gtag not available:', {
      windowExists: typeof window !== 'undefined',
      gtagExists: typeof window !== 'undefined' ? typeof window.gtag === 'function' : false,
    });
  }
  return available;
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
 * Review submit interface for analytics
 */
export interface ReviewSubmitAnalytics {
  passenger_count: number;
  total_amount: number;
  currency: string;
  flight_id: string;
  airline: string;
  route: string;
  departure_date?: string;
  return_date?: string;
  trip_type: 'one_way' | 'round_trip';
  has_documents: boolean;
  has_contact_info: boolean;
  validation_errors_count: number;
  form_completion_time?: number; // Time spent on form in seconds
}

/**
 * Track review submit event (when submit button is clicked)
 */
export const trackReviewSubmit = (submitData: ReviewSubmitAnalytics): void => {
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

    // Track the review submit event
    window.gtag('event', 'review_submit', {
      event_category: 'conversion',
      event_label: 'review_form_submit',

      // Passenger and booking details
      passenger_count: submitData.passenger_count,
      total_amount: submitData.total_amount,
      currency: submitData.currency,

      // Flight details
      flight_id: submitData.flight_id,
      airline: submitData.airline,
      route: submitData.route,
      departure_date: submitData.departure_date || null,
      return_date: submitData.return_date || null,
      trip_type: submitData.trip_type,

      // Form completion details
      has_documents: submitData.has_documents,
      has_contact_info: submitData.has_contact_info,
      validation_errors_count: submitData.validation_errors_count,
      form_completion_time: submitData.form_completion_time || null,

      // Additional metadata
      submit_timestamp: new Date().toISOString(),
    });

    console.log('✅ Review submit event tracked:', {
      passenger_count: submitData.passenger_count,
      total_amount: `${submitData.total_amount} ${submitData.currency}`,
      flight_id: submitData.flight_id,
      airline: submitData.airline,
      route: submitData.route,
      userData,
    });
  } catch (error) {
    console.error('Error tracking review submit event:', error);
  }
};

/**
 * Booking confirmation interface for analytics
 */
export interface BookingConfirmationAnalytics {
  booking_status: string;
  payment_status: string;
  pnr: string;
  booking_id: string;
  total_amount: number;
  currency: string;
  flight_id: string;
  airline: string;
  route: string;
  passenger_count: number;
  payment_method?: string;
  transaction_id?: string;
}

/**
 * Track booking confirmation widget load
 */
export const trackBookingConfirmation = (confirmationData: BookingConfirmationAnalytics): void => {
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

    // Track the booking confirmation event
    window.gtag('event', 'booking_confirmation', {
      event_category: 'conversion',
      event_label: 'booking_confirmation_loaded',

      // Booking status
      booking_status: confirmationData.booking_status,
      payment_status: confirmationData.payment_status,
      pnr: confirmationData.pnr,
      booking_id: confirmationData.booking_id,

      // Financial details
      total_amount: confirmationData.total_amount,
      currency: confirmationData.currency,
      payment_method: confirmationData.payment_method || null,
      transaction_id: confirmationData.transaction_id || null,

      // Flight details
      flight_id: confirmationData.flight_id,
      airline: confirmationData.airline,
      route: confirmationData.route,
      passenger_count: confirmationData.passenger_count,

      // Additional metadata
      confirmation_timestamp: new Date().toISOString(),
    });

    console.log('✅ Booking confirmation event tracked:', {
      booking_status: confirmationData.booking_status,
      payment_status: confirmationData.payment_status,
      pnr: confirmationData.pnr,
      total_amount: `${confirmationData.total_amount} ${confirmationData.currency}`,
      userData,
    });
  } catch (error) {
    console.error('Error tracking booking confirmation event:', error);
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
