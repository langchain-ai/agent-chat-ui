# Google Analytics Implementation

This document describes the Google Analytics implementation for flight search tracking in the agent-chat-ui application.

## Overview

The implementation tracks comprehensive flight search events with user data and search criteria, providing detailed analytics for user behavior and search patterns.

## Implementation Details

### 1. Google Analytics Setup

Google Analytics is already configured in `src/app/layout.tsx` with tracking ID `G-SLRTVD2EYS`:

```tsx
<Script src="https://www.googletagmanager.com/gtag/js?id=G-SLRTVD2EYS" strategy="afterInteractive" />
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-SLRTVD2EYS');
  `}
</Script>
```

### 2. Analytics Service (`src/services/analyticsService.ts`)

A comprehensive service that handles:
- Flight search event tracking
- User property management
- Booking attempt tracking
- Widget interaction tracking

#### Key Functions:

- `trackFlightSearch(searchCriteria)` - Tracks flight search with all parameters
- `trackFlightResults(resultsData)` - Tracks flight results when loaded
- `trackFlightSelected(selectionData)` - Tracks flight selection from cards or bottom sheet
- `setUserProperties(userData)` - Sets user ID, email, and name
- `getUserAnalyticsData()` - Extracts user data from JWT token
- `trackFlightBookingAttempt()` - Tracks booking attempts
- `trackWidgetInteraction()` - Tracks general widget interactions

### 3. Authentication Service Updates (`src/services/authService.ts`)

Added `getUserEmail()` function to extract email from JWT token:

```typescript
export const getUserEmail = (): string | null => {
  try {
    const token = getJwtToken();
    if (!token) return null;
    
    const decoded = decodeJwtPayload(token);
    return decoded?.email || null;
  } catch (err) {
    console.error("Error getting user email from JWT:", err);
    return null;
  }
};
```

### 4. SearchCriteriaWidget Integration

The flight search form now tracks comprehensive analytics when submitted:

```typescript
const searchAnalytics: FlightSearchAnalytics = {
  originAirport: fromAirport,
  destinationAirport: toAirport,
  departureDate: formatDateForSubmission(finalDepartureDate) || '',
  returnDate: formatDateForSubmission(finalReturnDate) || undefined,
  isRoundTrip: tripType === "round",
  adults,
  children,
  infants,
  class: flightClass.toLowerCase(),
  totalPassengers: adults + children + infants,
};

trackFlightSearch(searchAnalytics);
```

### 5. FlightOptionsWidget Integration

The flight results widget tracks comprehensive analytics when flight data loads:

```typescript
useEffect(() => {
  if (allFlightTuples.length > 0 && !readOnly) {
    const resultsAnalytics: FlightResultsAnalytics = {
      result_count: allFlightTuples.length,
      lowest_price: lowestPrice,
      highest_price: highestPrice,
      currency: allFlightTuples[0]?.currency || 'USD',
      top_results: topFlights.map(flight => ({
        flight_id: flight.flightOfferId,
        price: flight.totalAmount || 0,
        airline: getAirlineName(flight),
        duration: getFlightDurationString(flight),
        stops: getStopCount(flight),
        tags: flight.tags || [],
      })),
      search_results_summary: {
        total_flights: allFlightTuples.length,
        price_range: `${lowestPrice}-${highestPrice}`,
        airlines: airlines,
        has_direct_flights: hasDirectFlights,
        average_price: Math.round(averagePrice),
      },
    };

    trackFlightResults(resultsAnalytics);
  }
}, [allFlightTuples.length, readOnly]);
```

## Event Structure

### Flight Search Event (`flight_search`)

**Event Category:** `engagement`
**Event Label:** `flight_search_form`

**Parameters:**
- `origin_airport` - IATA code of departure airport
- `destination_airport` - IATA code of arrival airport
- `route` - Combined route (e.g., "DEL-BOM")
- `trip_type` - "round_trip" or "one_way"
- `departure_date` - Departure date (YYYY-MM-DD)
- `return_date` - Return date (YYYY-MM-DD) or null
- `adults_count` - Number of adult passengers
- `children_count` - Number of child passengers
- `infants_count` - Number of infant passengers
- `total_passengers` - Total passenger count
- `flight_class` - "economy", "business", or "first"
- `search_timestamp` - ISO timestamp of search
- `user_id` - User ID from JWT token
- `user_email` - User email from JWT token

### Flight Results Event (`flight_results`)

**Event Category:** `engagement`
**Event Label:** `flight_results_loaded`

**Parameters:**
- `result_count` - Total number of flights returned
- `lowest_price` - Minimum price among all results
- `highest_price` - Maximum price among all results
- `currency` - Currency code (e.g., "INR", "USD")
- `response_time` - Time taken to load results (optional)
- `price_range` - Price range string (e.g., "8500-25000")
- `average_price` - Average price of all flights
- `total_airlines` - Number of unique airlines
- `has_direct_flights` - Boolean indicating if direct flights available
- `top_flight_1_id` - Flight ID of first displayed flight
- `top_flight_1_price` - Price of first displayed flight
- `top_flight_1_airline` - Airline of first displayed flight
- `top_flight_1_stops` - Number of stops for first flight
- `top_flight_1_tags` - Tags for first flight (comma-separated)
- `top_flight_2_*` - Same parameters for second displayed flight
- `top_flight_3_*` - Same parameters for third displayed flight
- `results_timestamp` - ISO timestamp when results loaded
- `user_id` - User ID from JWT token
- `user_email` - User email from JWT token

### Flight Selection Event (`flight_selected`)

**Event Category:** `engagement`
**Event Label:** `flight_selection`

**Parameters:**
- `flight_offer_id` - Unique identifier of the selected flight
- `iata_number` - Flight number(s) from segments (e.g., "AI 101, AI 102")
- `airline` - Airline name (e.g., "Air India")
- `timing` - Departure and arrival times (e.g., "14:30 - 17:00")
- `stops` - Number of stops (0 for direct, 1+ for connecting)
- `price` - Flight price as number
- `currency` - Currency code (e.g., "INR", "USD")
- `refundable` - "yes" or "no" based on offer rules
- `selected_from` - "cards" (main view) or "bottomsheet" (all flights view)
- `tags` - Comma-separated tags (e.g., "best, recommended") or null
- `selection_timestamp` - ISO timestamp when flight was selected
- `user_id` - User ID from JWT token
- `user_email` - User email from JWT token

### User Properties

Set automatically with each event:
- `user_id` - Unique user identifier
- `user_email` - User's email address
- `user_name` - User's full name

## Testing

### Manual Testing

1. **Test Page**: Visit `/analytics-test` for manual testing interface
2. **Browser DevTools**: Check Network tab for gtag requests
3. **Google Analytics**: Verify events in Real-Time reports

### Test Functions Available

- Check Google Analytics setup
- Test user properties
- Test flight search event
- Test flight results event
- Test flight selection event
- Test booking attempt event
- Test widget interaction event

## Verification Steps

1. **Development Environment:**
   ```bash
   npm run dev
   ```

2. **Visit Test Page:**
   ```
   http://localhost:3000/analytics-test
   ```

3. **Check Browser Console:**
   - Look for analytics success messages
   - Verify no error messages

4. **Network Tab:**
   - Filter for "google-analytics.com" or "gtag"
   - Verify requests are being sent

5. **Google Analytics Dashboard:**
   - Go to Real-Time → Events
   - Perform test actions
   - Verify events appear in real-time

## Event Flow

### Flight Search Flow
1. User fills out flight search form
2. User clicks "Search flights" button
3. Form validation passes
4. `flight_search` event is tracked with all search criteria
5. User properties are set/updated
6. Form submission continues to LangGraph server
7. Event appears in Google Analytics within 1-2 minutes

### Flight Results Flow
1. FlightOptionsWidget receives flight data from server
2. Component mounts/updates with flight offers
3. `useEffect` hook triggers when `allFlightTuples.length > 0`
4. Flight data is analyzed (prices, airlines, stops, etc.)
5. Top 3 displayed flights are identified (best, cheapest, fastest)
6. `flight_results` event is tracked with comprehensive data
7. User properties are set/updated
8. Event appears in Google Analytics within 1-2 minutes

### Flight Selection Flow
1. User clicks "Select Flight" button on a flight card or in bottom sheet
2. `handleSelectFlight` function is called with flight offer ID
3. Selection source is determined (cards vs bottom sheet)
4. Selected flight data is extracted and analyzed
5. Flight characteristics are calculated (timing, stops, airline, etc.)
6. `flight_selected` event is tracked with detailed flight data
7. User properties are set/updated
8. Flight selection continues to booking flow
9. Event appears in Google Analytics within 1-2 minutes

## Error Handling

- Analytics failures don't block form submission
- Errors are logged to console for debugging
- Graceful fallbacks for missing user data
- Safe handling of unavailable gtag function

## Data Privacy

- Only logged-in user data is tracked
- No sensitive information (passwords, tokens) is sent
- User email and ID are from authenticated sessions
- Complies with standard analytics practices

## Future Enhancements

Potential additions:
- Flight booking success tracking
- Search result interaction tracking
- User journey funnel analysis
- A/B testing event parameters
- Custom dimensions for advanced segmentation
