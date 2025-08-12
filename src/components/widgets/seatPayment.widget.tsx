"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

interface SeatPaymentWidgetProps {
  seatNumber?: string;
  amount?: number;
  currency?: string;
  [key: string]: any;
}

interface SeatPaymentProps extends Record<string, any> {
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
}

const SeatPaymentWidget: React.FC<SeatPaymentProps> = (args) => {
  const thread = useStreamContext();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success"
  >("idle");

  const seatNumber = args.seatNumber || "14F";
  const amount = args.amount || 350;
  const currency = args.currency || "₹";

  const handlePaymentConfirm = () => {
    simulatePayment();
  };

  const handlePaymentCancel = async () => {
    setIsLoading(true);

    const responseData = {
      seatNumber,
      amount,
      currency,
      paymentSuccessful: false,
      action: "cancelled",
    };

    try {
      const frozen = {
        widget: { type: "SeatPaymentWidget", args: { amount, currency } },
        value: {
          type: "widget",
          widget: { type: "SeatPaymentWidget", args: { amount, currency } },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
    } catch (error: any) {
      console.error("Error submitting payment cancellation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePayment = async () => {
    setPaymentStatus("processing");

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Always succeed for demo purposes
    setPaymentStatus("success");
    // Wait a bit to show success message
    setTimeout(() => {
      submitPaymentResult(true);
    }, 1500);
  };

  const submitPaymentResult = async (success: boolean) => {
    setIsLoading(true);

    const responseData = {
      seatNumber,
      amount,
      currency,
      paymentSuccessful: success,
      action: success ? "payment_successful" : "payment_failed",
    };

    try {
      const frozen = {
        widget: { type: "SeatPaymentWidget", args: { amount, currency } },
        value: {
          type: "widget",
          widget: { type: "SeatPaymentWidget", args: { amount, currency } },
        },
      };
      await submitInterruptResponse(thread, "response", responseData, {
        interruptId: args.interruptId,
        frozenValue: frozen,
      });
    } catch (error: any) {
      console.error("Error submitting payment result:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === "processing") {
    return (
      <div
        className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6"
        style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
      >
        <div className="py-6 text-center sm:py-8">
          <h2 className="mb-2 text-xl font-bold text-black sm:text-2xl">
            Processing Payment
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Please wait while we process your payment...
          </p>
          <div className="mt-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div
        className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6"
        style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
      >
        <div className="py-6 text-center sm:py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <span className="text-lg font-bold text-white">✓</span>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-black sm:text-2xl">
            Payment Successful!
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Your seat {seatNumber} has been reserved.
          </p>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-lg font-bold text-green-800">
              Amount Paid: {currency}
              {amount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6"
      style={{ fontFamily: "Uber Move, Arial, Helvetica, sans-serif" }}
    >
      <div className="mb-4 text-center sm:mb-6">
        <h2 className="mb-1 text-xl font-bold text-black sm:mb-2 sm:text-2xl">
          Seat Payment
        </h2>
        <p className="text-sm text-gray-600">
          Complete your payment for seat {seatNumber}
        </p>
      </div>

      {/* Seat Details Card */}
      <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:mb-6 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md sm:h-12 sm:w-12">
              <span className="text-sm font-bold text-white sm:text-base">
                {seatNumber}
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-black sm:text-lg">
                Seat {seatNumber}
              </div>
              <div className="text-sm text-gray-600">
                Premium Selection
                <span className="hidden sm:inline"> • Window/Aisle</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-black sm:text-2xl">
              {currency}
              {amount}
            </div>
            <div className="hidden text-xs text-gray-500 sm:block">
              Total Amount
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handlePaymentConfirm}
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl disabled:bg-gray-300 disabled:text-gray-500 sm:py-4 sm:text-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-5 sm:w-5"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `Pay ${currency}${amount} Now`
          )}
        </Button>

        <Button
          onClick={handlePaymentCancel}
          disabled={isLoading}
          variant="outline"
          className="w-full rounded-xl border-2 border-gray-300 py-3 font-medium text-black hover:border-gray-400 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
              <span>Cancelling...</span>
            </div>
          ) : (
            "Skip Payment"
          )}
        </Button>
      </div>
    </div>
  );
};

export default SeatPaymentWidget;
