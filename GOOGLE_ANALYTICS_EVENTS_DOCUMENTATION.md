# Google Analytics Events Documentation

This document provides a comprehensive overview of all Google Analytics events implemented in the agent-chat-ui flight booking application.

## Overview

The application tracks the complete user journey from flight search to booking completion, providing detailed insights into user behavior, preferences, and conversion patterns.

## Event Tracking Flow

```
User Journey: Search → Results → Selection → Booking → Purchase
Analytics:   flight_search → flight_results → flight_selected → flight_booking_attempt → purchase
```

## Events Implemented

### 1. Flight Search Event (`flight_search`)

**Trigger:** When user submits the flight search form
**Location:** SearchCriteriaWidget
**Category:** `engagement`
**Label:** `flight_search_form`

#### Parameters Captured

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `origin_airport` | string | IATA code of departure airport | "DEL" |
| `destination_airport` | string | IATA code of arrival airport | "BOM" |
| `route` | string | Combined route | "DEL-BOM" |
| `trip_type` | string | Type of trip | "round_trip" or "one_way" |
| `departure_date` | string | Departure date | "2024-12-25" |
| `return_date` | string | Return date (null for one-way) | "2024-12-30" |
| `adults_count` | number | Number of adult passengers | 2 |
| `children_count` | number | Number of child passengers | 1 |
| `infants_count` | number | Number of infant passengers | 0 |
| `total_passengers` | number | Total passenger count | 3 |
| `flight_class` | string | Service class | "economy" |
| `search_timestamp` | string | ISO timestamp of search | "2024-12-20T10:30:00.000Z" |

#### Example Event Data
```json
{
  "event": "flight_search",
  "event_category": "engagement",
  "event_label": "flight_search_form",
  "origin_airport": "DEL",
  "destination_airport": "BOM",
  "route": "DEL-BOM",
  "trip_type": "round_trip",
  "departure_date": "2024-12-25",
  "return_date": "2024-12-30",
  "adults_count": 2,
  "children_count": 1,
  "infants_count": 0,
  "total_passengers": 3,
  "flight_class": "economy",
  "search_timestamp": "2024-12-20T10:30:00.000Z"
}
```

### 2. Flight Results Event (`flight_results`)

**Trigger:** When FlightOptionsWidget loads with flight data
**Location:** FlightOptionsWidget (useEffect hook)
**Category:** `engagement`
**Label:** `flight_results_loaded`

#### Parameters Captured

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `result_count` | number | Total flights returned | 15 |
| `lowest_price` | number | Minimum price among results | 8500 |
| `highest_price` | number | Maximum price among results | 25000 |
| `currency` | string | Currency code | "INR" |
| `response_time` | number | Load time in milliseconds | 2500 |
| `price_range` | string | Price range string | "8500-25000" |
| `average_price` | number | Average price of all flights | 14500 |
| `total_airlines` | number | Number of unique airlines | 4 |
| `has_direct_flights` | boolean | Direct flights available | true |
| `top_flight_1_id` | string | First displayed flight ID | "AI101" |
| `top_flight_1_price` | number | First flight price | 12000 |
| `top_flight_1_airline` | string | First flight airline | "Air India" |
| `top_flight_1_stops` | number | First flight stops | 0 |
| `top_flight_1_tags` | string | First flight tags | "best,recommended" |
| `top_flight_2_*` | various | Second flight details | Similar structure |
| `top_flight_3_*` | various | Third flight details | Similar structure |
| `results_timestamp` | string | ISO timestamp | "2024-12-20T10:30:05.000Z" |

#### Example Event Data
```json
{
  "event": "flight_results",
  "event_category": "engagement",
  "event_label": "flight_results_loaded",
  "result_count": 15,
  "lowest_price": 8500,
  "highest_price": 25000,
  "currency": "INR",
  "response_time": 2500,
  "price_range": "8500-25000",
  "average_price": 14500,
  "total_airlines": 4,
  "has_direct_flights": true,
  "top_flight_1_id": "AI101",
  "top_flight_1_price": 12000,
  "top_flight_1_airline": "Air India",
  "top_flight_1_stops": 0,
  "top_flight_1_tags": "best,recommended",
  "top_flight_2_id": "6E202",
  "top_flight_2_price": 8500,
  "top_flight_2_airline": "IndiGo",
  "top_flight_2_stops": 0,
  "top_flight_2_tags": "cheapest",
  "top_flight_3_id": "SG303",
  "top_flight_3_price": 9200,
  "top_flight_3_airline": "SpiceJet",
  "top_flight_3_stops": 0,
  "top_flight_3_tags": "fastest",
  "results_timestamp": "2024-12-20T10:30:05.000Z"
}
```

### 3. Flight Selection Event (`flight_selected`)

**Trigger:** When user selects a specific flight from cards or bottom sheet
**Location:** FlightOptionsWidget (handleSelectFlight function)
**Category:** `engagement`
**Label:** `flight_selection`

#### Parameters Captured

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `flight_offer_id` | string | Unique flight offer identifier | "AI101-DEL-BOM-20241225" |
| `iata_number` | string | Flight number(s) from segments | "AI 101" |
| `airline` | string | Airline name | "Air India" |
| `timing` | string | Departure and arrival times | "14:30 - 17:00" |
| `stops` | number | Number of stops | 0 |
| `price` | number | Flight price | 12000 |
| `currency` | string | Currency code | "INR" |
| `refundable` | string | Refundability status | "yes" or "no" |
| `selected_from` | string | Selection source | "cards" or "bottomsheet" |
| `tags` | string | Flight tags (comma-separated) | "best, recommended" |
| `selection_timestamp` | string | ISO timestamp of selection | "2024-12-20T10:35:00.000Z" |

#### Example Event Data
```json
{
  "event": "flight_selected",
  "event_category": "engagement",
  "event_label": "flight_selection",
  "flight_offer_id": "AI101-DEL-BOM-20241225",
  "iata_number": "AI 101",
  "airline": "Air India",
  "timing": "14:30 - 17:00",
  "stops": 0,
  "price": 12000,
  "currency": "INR",
  "refundable": "yes",
  "selected_from": "cards",
  "tags": "best, recommended",
  "selection_timestamp": "2024-12-20T10:35:00.000Z"
}
```

### 4. Flight Booking Attempt Event (`flight_booking_attempt`)

**Trigger:** When user attempts to book a selected flight
**Location:** Various booking components
**Category:** `conversion`
**Label:** `booking_attempt`

#### Parameters Captured

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `flight_id` | string | Flight identifier | "AI101-DEL-BOM-20241225" |
| `airline` | string | Airline name | "Air India" |
| `price` | number | Flight price | 12000 |
| `currency` | string | Currency code | "INR" |


#### Example Event Data
```json
{
  "event": "flight_booking_attempt",
  "event_category": "conversion",
  "event_label": "booking_attempt",
  "flight_id": "AI101-DEL-BOM-20241225",
  "airline": "Air India",
  "price": 12000,
  "currency": "INR"
}
```

### 5. Purchase Event (`purchase`)

**Trigger:** When flight booking is successfully completed
**Location:** Booking completion components
**Category:** `conversion`
**Label:** Standard Google Analytics purchase event

#### Parameters Captured

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `transaction_id` | string | Booking/transaction ID | "TXN_12345_20241220" |
| `value` | number | Total booking amount | 12000 |
| `currency` | string | Currency code | "INR" |
| `items` | array | Purchased items details | See example below |

#### Example Event Data
```json
{
  "event": "purchase",
  "event_category": "conversion",
  "transaction_id": "TXN_12345_20241220",
  "value": 12000,
  "currency": "INR",
  "items": [{
    "item_id": "AI101-DEL-BOM-20241225",
    "item_name": "Flight DEL-BOM booking",
    "category": "flight",
    "quantity": 1,
    "price": 12000
  }]
}
```

### 6. Widget Interaction Event (`widget_interaction`)

**Trigger:** General widget interactions and user interface events
**Location:** Various components
**Category:** `engagement`
**Label:** `{widget_type}_{action}`

#### Parameters Captured

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `widget_type` | string | Type of widget | "SearchCriteriaWidget" |
| `action` | string | Action performed | "form_submit" |
| Additional custom parameters | various | Context-specific data | Varies by widget |

#### Example Event Data
```json
{
  "event": "widget_interaction",
  "event_category": "engagement",
  "event_label": "SearchCriteriaWidget_form_submit",
  "widget_type": "SearchCriteriaWidget",
  "action": "form_submit",
  "trip_type": "round_trip",
  "passenger_count": 3
}
```

## User Properties

All events automatically set the following user properties in Google Analytics (not as event parameters):

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `user_id` | string | Unique user identifier from JWT token | "user_12345" |
| `user_email` | string | User's email address from JWT token | "user@example.com" |
| `user_name` | string | User's full name from JWT token | "John Doe" |

**Important Note:** User ID and email are set as Google Analytics user properties using `gtag('set', {...})` and `gtag('config', 'GA_MEASUREMENT_ID', {user_id: ...})`, not as individual event parameters. This follows Google Analytics best practices for user identification and allows for proper user journey tracking across sessions.

## Event Implementation Details

### Analytics Service (`src/services/analyticsService.ts`)

The analytics service provides the following key functions:

- `trackFlightSearch(searchCriteria)` - Tracks flight search events
- `trackFlightResults(resultsData)` - Tracks flight results loading
- `trackFlightSelected(selectionData)` - Tracks flight selection
- `trackFlightBookingAttempt(bookingData)` - Tracks booking attempts
- `trackFlightBookingSuccess(bookingData)` - Tracks successful bookings
- `trackWidgetInteraction(widgetType, action, data)` - Tracks general interactions
- `setUserProperties(userData)` - Sets user properties
- `getUserAnalyticsData()` - Extracts user data from JWT token

### Error Handling

- Analytics failures do not block user interactions
- Errors are logged to console for debugging
- Graceful fallbacks for missing user data
- Safe handling when Google Analytics is unavailable

### Privacy Considerations

- Only authenticated user data is tracked
- No sensitive information (passwords, tokens) is sent
- User email and ID are from authenticated sessions
- Complies with standard analytics practices

## Testing and Verification

### Manual Testing

1. Visit `/analytics-test` page for interactive testing
2. Use browser DevTools Network tab to verify gtag requests
3. Check Google Analytics Real-Time reports for events

### Test Functions Available

- Check Google Analytics setup
- Test user properties
- Test flight search event
- Test flight results event
- Test flight selection event
- Test booking attempt event
- Test widget interaction event

## Analytics Dashboard Usage

### Key Metrics to Monitor

1. **Conversion Funnel:**
   - Search → Results → Selection → Booking → Purchase
   - Drop-off rates at each stage

2. **Flight Preferences:**
   - Popular routes and airlines
   - Price sensitivity analysis
   - Direct vs connecting flight preferences

3. **User Behavior:**
   - Search patterns and frequency
   - Selection preferences (cards vs bottom sheet)
   - Tag effectiveness (best, cheapest, fastest)

4. **Performance Metrics:**
   - Search response times
   - Result loading performance
   - User engagement patterns

### Custom Reports

Create custom reports in Google Analytics using these events to analyze:

- Flight search trends by route and date
- Price sensitivity and booking patterns
- User journey optimization opportunities
- A/B testing results for UI changes

## Implementation Status

✅ **Completed Events:**
- `flight_search` - Flight search form submissions
- `flight_results` - Flight results loading and display
- `flight_selected` - Flight selection from cards or bottom sheet
- `flight_booking_attempt` - Booking attempt tracking
- `purchase` - Successful booking completion
- `widget_interaction` - General widget interactions

🔧 **Technical Implementation:**
- Google Analytics 4 (GA4) compatible
- Next.js Script component integration
- TypeScript interfaces for type safety
- Comprehensive error handling
- Production-ready implementation

📊 **Analytics Ready:**
- Real-time event tracking
- Custom parameter capture
- User property management
- Conversion funnel analysis
- Performance monitoring
