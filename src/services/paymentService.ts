import { getJwtToken } from "./authService";

// Types for the payment APIs
export interface PrepaymentRequest {
  tripId: string;
}

export interface PrepaymentResponse {
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
    };
  };
}

export interface TransactionVerifyRequest {
  tripId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  transaction_id: string;
}

export interface TransactionVerifyResponse {
  success: boolean;
  data: {
    paymentStatus: "SUCCESS" | "FAILED" | "PENDING";
    bookingStatus: "SUCCESS" | "FAILED" | "PENDING";
    paymentData?: {
      method?: string;
    };
    bookingError?: string;
  };
}

export interface PaymentError {
  message: string;
  code?: string;
  status?: number;
}

// Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://prod-api.flyo.ai";
const API_VERSION = "v1";

/**
 * Get authorization header with JWT token
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getJwtToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * Generic API request handler with error handling
 */
async function makeApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const url = `${API_BASE_URL}/core/${API_VERSION}${endpoint}`;
    const headers = getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Execute prepayment to get Razorpay payment data
 * @param tripId - The trip ID for which payment is being initiated
 * @returns Promise<PrepaymentResponse> - Payment gateway configuration
 */
export const executePrepayment = async (
  tripId: string,
): Promise<PrepaymentResponse> => {
  if (!tripId) {
    throw new Error("Trip ID is required");
  }

  try {
    const response = await makeApiRequest<PrepaymentResponse>(
      `/prePayment/executePrepayment/${tripId}`,
      {
        method: "POST",
      },
    );

    if (!response.success) {
      throw new Error(response.message || "Prepayment execution failed");
    }

    return response;
  } catch (error) {
    console.error("Execute prepayment failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to execute prepayment",
    );
  }
};

/**
 * Verify transaction and execute booking
 * @param request - Transaction verification request data
 * @returns Promise<TransactionVerifyResponse> - Payment and booking status
 */
export const verifyTransaction = async (
  request: TransactionVerifyRequest,
): Promise<TransactionVerifyResponse> => {
  const { tripId, ...verificationData } = request;

  if (!tripId) {
    throw new Error("Trip ID is required");
  }

  if (
    !verificationData.razorpay_payment_id ||
    !verificationData.razorpay_order_id ||
    !verificationData.razorpay_signature ||
    !verificationData.transaction_id
  ) {
    throw new Error("All payment verification parameters are required");
  }

  try {
    const response = await makeApiRequest<TransactionVerifyResponse>(
      `/transactions/verify/${tripId}`,
      {
        method: "POST",
        body: JSON.stringify(verificationData),
      },
    );

    if (!response.success) {
      throw new Error("Transaction verification failed");
    }

    return response;
  } catch (error) {
    console.error("Transaction verification failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to verify transaction",
    );
  }
};

/**
 * Complete payment flow: execute prepayment and handle verification
 * @param tripId - The trip ID
 * @param verificationData - Payment verification data from Razorpay
 * @returns Promise<TransactionVerifyResponse> - Final payment and booking status
 */
export const completePaymentFlow = async (
  tripId: string,
  verificationData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    transaction_id: string;
  },
): Promise<TransactionVerifyResponse> => {
  try {
    // First execute prepayment to get transaction data
    const prepaymentResponse = await executePrepayment(tripId);

    // Then verify the transaction
    const verifyResponse = await verifyTransaction({
      tripId,
      ...verificationData,
    });

    return verifyResponse;
  } catch (error) {
    console.error("Complete payment flow failed:", error);
    throw error;
  }
};

/**
 * Get payment status description
 */
export const getPaymentStatusDescription = (status: string): string => {
  switch (status) {
    case "SUCCESS":
      return "Payment completed successfully";
    case "FAILED":
      return "Payment failed";
    case "PENDING":
      return "Payment is being processed";
    default:
      return "Unknown payment status";
  }
};

/**
 * Get booking status description
 */
export const getBookingStatusDescription = (status: string): string => {
  switch (status) {
    case "SUCCESS":
      return "Booking confirmed successfully";
    case "FAILED":
      return "Booking failed";
    case "PENDING":
      return "Booking is being processed";
    default:
      return "Unknown booking status";
  }
};

/**
 * Check if payment and booking are both successful
 */
export const isPaymentAndBookingSuccessful = (
  response: TransactionVerifyResponse,
): boolean => {
  return (
    response.data.paymentStatus === "SUCCESS" &&
    response.data.bookingStatus === "SUCCESS"
  );
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
  }).format(amount);
};
