# NonAgentFlowWidget Documentation

## Overview

The `NonAgentFlowWidget` is a specialized widget designed to handle the complete payment flow for flight bookings without requiring agent intervention. It automatically opens as a bottom sheet and guides users through the payment process.

## Flow Description

The widget follows this exact flow:

1. **Interrupt Trigger**: Server sends `NonAgentFlowWidget` interrupt
2. **Bottom Sheet Opens**: Widget automatically opens as a bottom sheet with loader
3. **PrePayment API**: Triggers the prePayment API with the provided `tripId`
4. **Razorpay Integration**: Based on prePayment response, opens Razorpay payment gateway
5. **Transaction Verification**: After payment completion, triggers verifyTransaction API
6. **Status Display**: Shows payment and booking status to the user

## Usage

### Server-Side Interrupt

```typescript
const result = interrupt({
  value: {
    interrupt_id: "payment-flow-id",
    type: "NonAgentFlowWidget",
    args: {
      tripId: "Tswodli37",
      flightItinerary: {
        userContext: {
          userDetails:
            state.allTravellers.find(
              (traveller) => traveller.isPrimaryTraveller,
            ) || null,
          userId: state.userId,
        },
        selectionContext: {
          selectedFlightOffers: state.flightOffers.filter(
            (flightOffer) =>
              state.selectedFlightOfferId === flightOffer.flightOfferId,
          ),
        },
      },
      itinId: state.itinId,
    },
  },
});
```

### Client-Side Direct Usage

```typescript
import NonAgentFlowWidget from "@/components/widgets/non-agent-flow.widget";

<NonAgentFlowWidget
  tripId="Tswodli37"
  flightItinerary={{
    userContext: {
      userDetails: primaryTraveller,
      userId: "user123",
    },
    selectionContext: {
      selectedFlightOffers: selectedOffers,
    }
  }}
  itinId="itin123"
  onPaymentSuccess={(response) => {
    console.log("Payment successful:", response);
  }}
  onPaymentFailure={(error) => {
    console.error("Payment failed:", error);
  }}
  onClose={() => {
    // Handle widget close
  }}
/>
```

## Props Interface

```typescript
interface NonAgentFlowWidgetProps {
  tripId: string; // Required: The trip ID for payment
  flightItinerary?: {
    userContext: {
      userDetails: any; // Primary traveler details
      userId: string; // User ID
    };
    selectionContext: {
      selectedFlightOffers: any[]; // Selected flight offers
    };
  };
  itinId?: string; // Optional: Itinerary ID
  apiData?: any; // Internal: Used when called from interrupt handler
  onClose?: () => void; // Optional: Callback when widget closes
  onPaymentSuccess?: (response: TransactionVerifyResponse) => void; // Optional: Payment success callback
  onPaymentFailure?: (error: string) => void; // Optional: Payment failure callback
}
```

## API Integration

### 1. PrePayment API

**Endpoint**: `POST /api/payment/prepayment/[tripId]`

**Purpose**: Initiates payment and returns Razorpay configuration

**Response**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    transaction: {
      transaction_id: string;
      reference_id: string;
      razorpay_order_id: string;
      amount: number;
      currency: string;
      key: string;
      name: string;
      description: string;
    }
  }
}
```

### 2. Transaction Verify API

**Endpoint**: `POST /api/payment/verify`

**Purpose**: Verifies payment and executes booking

**Request**:

```typescript
{
  tripId: string;
  transaction_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  data: {
    paymentStatus: "SUCCESS" | "FAILED" | "PENDING";
    bookingStatus: "SUCCESS" | "FAILED" | "PENDING";
    bookingError?: string;
  };
}
```

## UI States

### 1. Loading State

- Shows spinner with "Preparing Payment" message
- Displays while calling prePayment API

### 2. Processing State

- Shows "Processing Payment" with spinner
- Displays while Razorpay payment is active

### 3. Success State

- Shows green checkmark and success message
- Displays payment and booking status
- Shows transaction details

### 4. Failed State

- Shows red X and error message
- Provides retry and cancel options
- Displays specific error details

## Features

### Automatic Flow

- No user interaction required to start payment
- Automatically opens Razorpay payment gateway
- Seamless transition between API calls

### Reopen Button

- Hover button appears on main chat screen if widget is closed
- Allows users to reopen the payment widget if accidentally closed
- Shows trip ID and booking information in tooltip
- Positioned in bottom-right corner for easy access

### Error Handling

- Comprehensive error handling for all API calls
- User-friendly error messages
- Retry functionality for failed payments

### Status Tracking

- Real-time payment status updates
- Booking status verification
- Detailed transaction information display

### Responsive Design

- Bottom sheet layout for mobile and desktop
- Responsive UI components
- Touch-friendly interface

## Testing

### Test Page

Visit `/non-agent-flow-test` to test the widget with sample data.

### Manual Testing Steps

1. Set a valid `tripId`
2. Trigger the widget
3. Verify prePayment API call
4. Complete Razorpay payment
5. Verify transaction verification
6. Check status display

## Integration with Existing System

### Component Map

The widget is registered in `src/components/widgets/index.ts`:

```typescript
export const componentMap = {
  // ... other widgets
  NonAgentFlowWidget, /// Non-agent flow payment widget with bottom sheet
} as const;
```

### Interrupt Handler

The widget is handled in `src/components/thread/messages/generic-interrupt.tsx`:

```typescript
// For NonAgentFlowWidget, render in bottom sheet
if (interrupt.value.widget.type === "NonAgentFlowWidget") {
  return (
    <NonAgentFlowBottomSheet
      apiData={interrupt}
      args={interrupt.value.widget.args}
    />
  );
}
```

## Security Considerations

### Authentication

- All API calls require valid JWT token
- Token validation on both client and server side

### Payment Security

- Razorpay signature verification
- Secure handling of payment data
- PCI compliance considerations

### Data Validation

- Input validation for all parameters
- Sanitization of user inputs
- Protection against injection attacks

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure JWT token is valid
   - Check token expiration
   - Verify token storage

2. **PrePayment API Failed**
   - Verify tripId is valid
   - Check API base URL configuration
   - Review server logs

3. **Razorpay Not Loading**
   - Check internet connection
   - Verify Razorpay script loading
   - Check browser console for errors

4. **Transaction Verification Failed**
   - Ensure all required parameters are provided
   - Check Razorpay signature validity
   - Verify transaction ID format

### Debug Mode

Enable debug logging by checking browser console for detailed logs.

## Future Enhancements

### Planned Features

- Payment method selection
- Saved payment methods
- Subscription payments
- Refund handling
- Multi-currency support

### Performance Optimizations

- Request caching
- Connection pooling
- Response compression
- CDN integration

---

**Last Updated**: December 2024
**Version**: 1.0.0
