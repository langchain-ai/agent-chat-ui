# Review Widget

The ReviewWidget component has been updated to handle streamed API response data and conditionally display components based on available data.

## Features

### 1. API Data Integration
- Accepts streamed response data via the `apiData` prop
- Automatically transforms API data to component format
- Pre-fills form fields when data is available
- Falls back to mock data when no API data is provided

### 2. Bottom Sheet Mode
- Automatically renders as a bottom sheet when triggered via interrupt system
- Includes close button (X) in the top-right corner
- Optimized layout for mobile and desktop
- Sticky action buttons at the bottom of the sheet

### 3. Conditional Component Display
- **Seat Allocation**: Only shown when `seatAllocation` prop is provided
- **Travel Documents**: Only shown when `travelerRequirements` is not null in API data
- If components are not needed, they are hidden entirely
- Payment calculation adjusts automatically based on available components

### 3. Data Transformation
The component includes utility functions to transform API data:
- `transformApiDataToFlightDetails()` - Converts flight offer data to display format
- `transformApiDataToPassengerDetails()` - Extracts user details for form pre-filling
- `transformApiDataToContactInfo()` - Formats contact information
- `transformApiDataToTravelDocument()` - Processes document information
- `transformApiDataToPaymentSummary()` - Calculates payment breakdown
- `transformApiDataToSavedPassengers()` - Formats saved traveller list

## Usage

### Via Interrupt System (Automatic Bottom Sheet)
When triggered through the interrupt system, the widget automatically renders as a bottom sheet:

```typescript
// Server-side interrupt
const result = interrupt({
  value: {
    type: "widget",
    widget: {
      type: "TravelerDetailsWidget",
      args: {
        flightItinerary: { /* ... */ },
        bookingRequirements: { /* ... */ }
      }
    }
  }
});
```

The widget will automatically:
- Render as a bottom sheet overlay
- Include a close button (X)
- Pre-fill data from the API response
- Show sticky action buttons

### Manual Usage (Regular Mode)
```tsx
import ReviewWidget from './review.widget';

const apiResponse = {
  value: {
    type: "widget",
    widget: {
      type: "TravelerDetailsWidget",
      args: {
        flightItinerary: { /* ... */ },
        bookingRequirements: { /* ... */ }
      }
    }
  }
};

<ReviewWidget
  apiData={apiResponse}
  onSubmit={(data) => console.log('Booking data:', data)}
/>
```

### Without API Data (Mock Data)
```tsx
<ReviewWidget 
  onSubmit={(data) => console.log('Booking data:', data)}
/>
```

### With Custom Props (Legacy Support)
```tsx
<ReviewWidget 
  flightDetails={customFlightDetails}
  passengerDetails={customPassengerDetails}
  contactInfo={customContactInfo}
  travelDocument={customTravelDocument}
  seatAllocation={customSeatAllocation} // Optional - hides seat section if not provided
  paymentSummary={customPaymentSummary}
  onSubmit={(data) => console.log('Booking data:', data)}
/>
```

## API Data Structure

The component expects the following API response structure:

```typescript
interface ApiResponse {
  value: {
    type: string;
    widget: {
      type: string;
      args: {
        flightItinerary: {
          userContext: {
            userDetails: {
              travellerId: number;
              firstName: string;
              lastName: string;
              dateOfBirth: string;
              gender: string;
              nationality: string;
              email: string;
              phone: Array<{
                countryCode: string;
                number: string;
              }>;
              documents: Array<{
                documentType: string;
                documentNumber: string;
                nationality: string;
                expiryDate: string;
                issuingCountry: string;
              }>;
            };
            savedTravellers: Array</* same structure as userDetails */>;
          };
          selectionContext: {
            selectedFlightOffers: Array<{
              flightOfferId: string;
              currency: string;
              totalAmount: number;
              duration: string;
              departure: {
                date: string;
                airportIata: string;
                cityCode: string;
              };
              arrival: {
                date: string;
                airportIata: string;
                cityCode: string;
              };
              segments: Array<{
                airlineIata: string;
                flightNumber: string;
                airlineName: string;
              }>;
            }>;
          };
        };
        bookingRequirements: {
          emailAddressRequired: boolean;
          mobilePhoneNumberRequired: boolean;
          // ... other requirements
        };
      };
    };
  };
}
```

## Conditional Component Display

### Travel Documents Section
The travel documents section is conditionally displayed based on the API data:

```typescript
// Hide travel documents when travelerRequirements is null
{
  "bookingRequirements": {
    "travelerRequirements": null  // This will hide the travel documents section
  }
}

// Show travel documents when travelerRequirements has a value
{
  "bookingRequirements": {
    "travelerRequirements": {
      "documentRequired": true,
      "passportRequired": true
    }  // This will show the travel documents section
  }
}
```

### Seat Allocation Section
The seat allocation section is only shown when `seatAllocation` prop is provided.

## Key Changes

1. **Bottom Sheet Integration**: Automatically renders as a bottom sheet when triggered via interrupt system
2. **Conditional Component Display**: Travel documents and seat sections are conditionally rendered
3. **Currency Support**: Proper handling of INR (₹) and USD ($) currencies
4. **Data Pre-filling**: Form fields are automatically populated from API data
5. **Saved Passengers**: Dynamic list from API data with fallback to mock data
6. **Payment Calculation**: Adjusts based on available components
7. **Responsive Design**: Optimized layouts for both bottom sheet and regular modes
8. **Backward Compatibility**: Still supports legacy prop-based usage

## Demo

See `review-widget-demo.tsx` for examples of how to use the component with and without API data.
