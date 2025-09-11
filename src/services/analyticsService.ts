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
      dataLayerExists: typeof window !== 'undefined' ? Array.isArray(window.dataLayer) : false,
    });
  }
  return available;
};

/**
 * Wait for gtag to be available (with timeout)
 */
export const waitForGtag = (timeout: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isGtagAvailable()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isGtagAvailable()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.warn('Timeout waiting for Google Analytics to load');
        resolve(false);
      }
    }, 100);
  });
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

// ============================================================================
// ONBOARDING FLOW ANALYTICS EVENTS
// ============================================================================

/**
 * Track event with retry mechanism
 */
const trackEventWithRetry = async (eventName: string, parameters: any, maxRetries: number = 3): Promise<void> => {
  let retries = 0;

  const attemptTrack = async (): Promise<void> => {
    if (isGtagAvailable()) {
      try {
        window.gtag('event', eventName, parameters);
        console.log(`✅ ${eventName} tracked successfully`);
        return;
      } catch (error) {
        console.error(`Error tracking ${eventName}:`, error);
        throw error;
      }
    }

    if (retries < maxRetries) {
      retries++;
      console.log(`⏳ Waiting for gtag to load (attempt ${retries}/${maxRetries})...`);
      const gtagAvailable = await waitForGtag(2000);
      if (gtagAvailable) {
        return attemptTrack();
      }
    }

    console.warn(`⚠️ Failed to track ${eventName} after ${maxRetries} attempts`);
  };

  return attemptTrack();
};

/**
 * Track login page view
 */
export const trackLoginPageViewed = (): void => {
  trackEventWithRetry('login_page_viewed', {
    event_category: 'onboarding',
    event_label: 'login_page_view',
    page_path: '/login',
    step: 1,
    step_name: 'login',
  });
};

/**
 * Track Google login button click
 */
export const trackGoogleLoginClicked = (): void => {
  trackEventWithRetry('google_login_clicked', {
    event_category: 'onboarding',
    event_label: 'google_oauth_initiated',
    login_method: 'google_oauth',
    step: 1,
    step_name: 'login',
  });
};

/**
 * Track login success
 */
export const trackLoginSuccess = (isNewUser: boolean): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'login_success', {
      event_category: 'onboarding',
      event_label: 'authentication_success',
      login_method: 'google_oauth',
      is_new_user: isNewUser,
      step: 1,
      step_name: 'login',
      next_step: isNewUser ? 'profile_confirmation' : 'chat_screen',
    });

    console.log('✅ Login success tracked:', { isNewUser });
  } catch (error) {
    console.error('Error tracking login success:', error);
  }
};

/**
 * Track login error
 */
export const trackLoginError = (errorMessage: string): void => {
  if (!isGtagAvailable()) return;

  try {
    window.gtag('event', 'login_error', {
      event_category: 'onboarding',
      event_label: 'authentication_failed',
      login_method: 'google_oauth',
      error_message: errorMessage,
      step: 1,
      step_name: 'login',
    });

    console.log('✅ Login error tracked:', errorMessage);
  } catch (error) {
    console.error('Error tracking login error:', error);
  }
};

/**
 * Profile confirmation form data interface
 */
export interface ProfileConfirmationData {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  countryCode: string;
}

/**
 * Track profile confirmation page view
 */
export const trackProfileConfirmationViewed = (): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'profile_confirmation_viewed', {
      event_category: 'onboarding',
      event_label: 'profile_confirmation_page_view',
      page_path: '/profile-confirmation',
      step: 2,
      step_name: 'profile_confirmation',
    });

    console.log('✅ Profile confirmation page view tracked');
  } catch (error) {
    console.error('Error tracking profile confirmation page view:', error);
  }
};

/**
 * Track profile form field changes
 */
export const trackProfileFormFilled = (fieldName: string, hasValue: boolean): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'profile_form_filled', {
      event_category: 'onboarding',
      event_label: 'profile_form_interaction',
      field_name: fieldName,
      has_value: hasValue,
      step: 2,
      step_name: 'profile_confirmation',
    });

    console.log('✅ Profile form field tracked:', { fieldName, hasValue });
  } catch (error) {
    console.error('Error tracking profile form field:', error);
  }
};

/**
 * Track profile confirmation success
 */
export const trackProfileConfirmationSuccess = (profileData: ProfileConfirmationData): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'profile_confirmation_success', {
      event_category: 'onboarding',
      event_label: 'profile_update_success',
      has_first_name: !!profileData.firstName,
      has_last_name: !!profileData.lastName,
      has_mobile_number: !!profileData.mobileNumber,
      country_code: profileData.countryCode,
      step: 2,
      step_name: 'profile_confirmation',
      next_step: 'personalize_travel',
    });

    console.log('✅ Profile confirmation success tracked');
  } catch (error) {
    console.error('Error tracking profile confirmation success:', error);
  }
};

/**
 * Track profile confirmation error
 */
export const trackProfileConfirmationError = (errorMessage: string): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'profile_confirmation_error', {
      event_category: 'onboarding',
      event_label: 'profile_update_failed',
      error_message: errorMessage,
      step: 2,
      step_name: 'profile_confirmation',
    });

    console.log('✅ Profile confirmation error tracked:', errorMessage);
  } catch (error) {
    console.error('Error tracking profile confirmation error:', error);
  }
};

/**
 * Track personalize travel page view
 */
export const trackPersonalizeTravelViewed = (): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'personalize_page_viewed', {
      event_category: 'onboarding',
      event_label: 'personalize_travel_page_view',
      page_path: '/personalize-travel',
      step: 3,
      step_name: 'personalize_travel',
    });

    console.log('✅ Personalize travel page view tracked');
  } catch (error) {
    console.error('Error tracking personalize travel page view:', error);
  }
};

/**
 * Track import option selection
 */
export const trackImportOptionSelected = (): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'import_option_selected', {
      event_category: 'onboarding',
      event_label: 'import_trips_loyalty_selected',
      personalization_method: 'import',
      step: 3,
      step_name: 'personalize_travel',
    });

    console.log('✅ Import option selection tracked');
  } catch (error) {
    console.error('Error tracking import option selection:', error);
  }
};

/**
 * Track manual setup option selection
 */
export const trackManualOptionSelected = (): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'manual_option_selected', {
      event_category: 'onboarding',
      event_label: 'manual_setup_selected',
      personalization_method: 'manual',
      step: 3,
      step_name: 'personalize_travel',
    });

    console.log('✅ Manual option selection tracked');
  } catch (error) {
    console.error('Error tracking manual option selection:', error);
  }
};

/**
 * Track skip personalization click
 */
export const trackSkipPersonalizationClicked = (): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'skip_personalization_clicked', {
      event_category: 'onboarding',
      event_label: 'personalization_skipped',
      personalization_method: 'skipped',
      step: 3,
      step_name: 'personalize_travel',
      next_step: 'chat_screen',
    });

    console.log('✅ Skip personalization tracked');
  } catch (error) {
    console.error('Error tracking skip personalization:', error);
  }
};

/**
 * Track continue button click from personalize travel
 */
export const trackPersonalizeContinueClicked = (selectedOption: string): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'personalize_continue_clicked', {
      event_category: 'onboarding',
      event_label: 'personalize_continue_button',
      selected_option: selectedOption,
      personalization_method: selectedOption,
      step: 3,
      step_name: 'personalize_travel',
      next_step: selectedOption === 'manual' ? 'onboarding_quiz' : 'gmail_integration',
    });

    console.log('✅ Personalize continue clicked tracked:', selectedOption);
  } catch (error) {
    console.error('Error tracking personalize continue click:', error);
  }
};

/**
 * Onboarding quiz data interface for analytics
 */
export interface OnboardingQuizData {
  gender: string;
  dateOfBirth: Date | undefined;
  hasPassport: string;
  travelFrequency: string;
  travelPurposes: string[];
  travelCompanions: string[];
  loyaltyPrograms: string[];
  currency: string;
  language: string;
}

/**
 * Track onboarding quiz start
 */
export const trackQuizStarted = (): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'quiz_started', {
      event_category: 'onboarding',
      event_label: 'onboarding_quiz_started',
      page_path: '/onboarding-quiz',
      step: 4,
      step_name: 'onboarding_quiz',
      quiz_step: 1,
      quiz_step_name: 'personal_details',
    });

    console.log('✅ Quiz started tracked');
  } catch (error) {
    console.error('Error tracking quiz start:', error);
  }
};

/**
 * Track quiz step view
 */
export const trackQuizStepViewed = (currentStep: number, stepName: string): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'quiz_step_viewed', {
      event_category: 'onboarding',
      event_label: 'quiz_step_navigation',
      step: 4,
      step_name: 'onboarding_quiz',
      quiz_step: currentStep,
      quiz_step_name: stepName,
    });

    console.log('✅ Quiz step viewed tracked:', { currentStep, stepName });
  } catch (error) {
    console.error('Error tracking quiz step view:', error);
  }
};

/**
 * Track quiz field change
 */
export const trackQuizFieldChanged = (fieldName: string, value: any, currentStep: number): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'quiz_field_changed', {
      event_category: 'onboarding',
      event_label: 'quiz_form_interaction',
      field_name: fieldName,
      field_value: Array.isArray(value) ? value.join(',') : value?.toString() || '',
      has_value: !!value,
      step: 4,
      step_name: 'onboarding_quiz',
      quiz_step: currentStep,
    });

    console.log('✅ Quiz field change tracked:', { fieldName, value, currentStep });
  } catch (error) {
    console.error('Error tracking quiz field change:', error);
  }
};

/**
 * Track quiz step completion (Next button click)
 */
export const trackQuizStepCompleted = (currentStep: number, stepName: string, stepData: any): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'quiz_step_completed', {
      event_category: 'onboarding',
      event_label: 'quiz_step_next_clicked',
      step: 4,
      step_name: 'onboarding_quiz',
      quiz_step: currentStep,
      quiz_step_name: stepName,
      step_data: JSON.stringify(stepData),
      next_quiz_step: currentStep + 1,
    });

    console.log('✅ Quiz step completed tracked:', { currentStep, stepName });
  } catch (error) {
    console.error('Error tracking quiz step completion:', error);
  }
};

/**
 * Track quiz back button click
 */
export const trackQuizBackClicked = (currentStep: number, stepName: string): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'quiz_back_clicked', {
      event_category: 'onboarding',
      event_label: 'quiz_step_back_clicked',
      step: 4,
      step_name: 'onboarding_quiz',
      quiz_step: currentStep,
      quiz_step_name: stepName,
      previous_quiz_step: currentStep - 1,
    });

    console.log('✅ Quiz back clicked tracked:', { currentStep, stepName });
  } catch (error) {
    console.error('Error tracking quiz back click:', error);
  }
};

/**
 * Track quiz completion
 */
export const trackQuizCompleted = (quizData: OnboardingQuizData): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'quiz_completed', {
      event_category: 'onboarding',
      event_label: 'onboarding_quiz_completed',
      step: 4,
      step_name: 'onboarding_quiz',

      // Personal details
      gender: quizData.gender,
      has_date_of_birth: !!quizData.dateOfBirth,
      has_passport: quizData.hasPassport,

      // Travel style
      travel_frequency: quizData.travelFrequency,
      travel_purposes: quizData.travelPurposes.join(','),
      travel_companions: quizData.travelCompanions.join(','),
      travel_purposes_count: quizData.travelPurposes.length,
      travel_companions_count: quizData.travelCompanions.length,

      // Preferences
      loyalty_programs: quizData.loyaltyPrograms.join(','),
      loyalty_programs_count: quizData.loyaltyPrograms.length,
      currency: quizData.currency,
      language: quizData.language,

      next_step: 'chat_screen',
    });

    console.log('✅ Quiz completed tracked');
  } catch (error) {
    console.error('Error tracking quiz completion:', error);
  }
};

/**
 * Track onboarding completion (final step)
 */
export const trackOnboardingCompleted = (completionData: {
  totalSteps: number;
  completedSteps: string[];
  skippedSteps: string[];
  timeSpent?: number;
}): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'onboarding_completed', {
      event_category: 'onboarding',
      event_label: 'onboarding_flow_completed',
      total_steps: completionData.totalSteps,
      completed_steps: completionData.completedSteps.join(','),
      skipped_steps: completionData.skippedSteps.join(','),
      completion_rate: (completionData.completedSteps.length / completionData.totalSteps) * 100,
      time_spent: completionData.timeSpent || null,
      final_step: 'chat_screen',
    });

    console.log('✅ Onboarding completed tracked');
  } catch (error) {
    console.error('Error tracking onboarding completion:', error);
  }
};

/**
 * Track chat screen reached (final destination)
 */
export const trackChatScreenReached = (source: string): void => {
  if (!isGtagAvailable()) return;

  try {
    const userData = getUserAnalyticsData();

    // Set user properties if available
    if (userData) {
      setUserProperties(userData);
    }

    window.gtag('event', 'chat_screen_reached', {
      event_category: 'onboarding',
      event_label: 'onboarding_success',
      source: source, // 'onboarding_complete', 'existing_user', 'skip_personalization'
      page_path: '/',
      final_destination: true,
    });

    console.log('✅ Chat screen reached tracked:', source);
  } catch (error) {
    console.error('Error tracking chat screen reached:', error);
  }
};
