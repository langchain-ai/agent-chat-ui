import { NextRequest, NextResponse } from "next/server";
import { executePrepayment } from "@/services/paymentService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;

    // Validate tripId
    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 },
      );
    }

    console.log(`Executing prepayment for tripId: ${tripId}`);

    // Execute prepayment using the service
    const response = await executePrepayment(tripId);

    console.log(`Prepayment executed successfully for tripId: ${tripId}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Prepayment API error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (
        error.message.includes("authentication") ||
        error.message.includes("token")
      ) {
        return NextResponse.json(
          { error: "Authentication failed. Please login again." },
          { status: 401 },
        );
      }

      if (error.message.includes("Trip ID is required")) {
        return NextResponse.json(
          { error: "Invalid trip ID provided" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to execute prepayment. Please try again." },
      { status: 500 },
    );
  }
}
