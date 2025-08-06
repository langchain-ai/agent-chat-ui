import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/services/paymentService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tripId,
      transaction_id,
      reference_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_order_id,
    } = body;

    console.log(`Payment verification request for tripId: ${tripId}`);

    // Validate required fields
    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 },
      );
    }

    if (!razorpay_payment_id || !razorpay_signature || !razorpay_order_id || !transaction_id) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters" },
        { status: 400 },
      );
    }

    // Use the payment service to verify transaction
    const response = await verifyTransaction({
      tripId,
      transaction_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_order_id,
    });

    console.log(`Payment verification completed for tripId: ${tripId}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Payment verification error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("authentication") || error.message.includes("token")) {
        return NextResponse.json(
          { error: "Authentication failed. Please login again." },
          { status: 401 },
        );
      }
      
      if (error.message.includes("All payment verification parameters are required")) {
        return NextResponse.json(
          { error: "Missing required payment verification parameters" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Payment verification failed. Please try again." },
      { status: 500 },
    );
  }
}
