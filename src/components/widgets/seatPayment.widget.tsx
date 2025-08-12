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

const SeatPaymentWidget: React.FC<SeatPaymentWidgetProps> = (args) => {
  const thread = useStreamContext();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

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
      action: "cancelled"
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting payment cancellation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePayment = async () => {
    setPaymentStatus('processing');

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Always succeed for demo purposes
    setPaymentStatus('success');
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
      action: success ? "payment_successful" : "payment_failed"
    };

    try {
      await submitInterruptResponse(thread, "response", responseData);
    } catch (error: any) {
      console.error("Error submitting payment result:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === 'processing') {
    return (
      <div
        className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg"
        style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}
      >
        <div className="text-center py-6 sm:py-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Processing Payment</h2>
          <p className="text-sm text-gray-600 mb-4">Please wait while we process your payment...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div
        className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg"
        style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}
      >
        <div className="text-center py-6 sm:py-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">✓</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">Payment Successful!</h2>
          <p className="text-sm text-gray-600 mb-4">Your seat {seatNumber} has been reserved.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-bold text-lg">Amount Paid: {currency}{amount}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg"
      style={{ fontFamily: 'Uber Move, Arial, Helvetica, sans-serif' }}
    >
      <div className="mb-4 sm:mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-1 sm:mb-2">Seat Payment</h2>
        <p className="text-sm text-gray-600">
          Complete your payment for seat {seatNumber}
        </p>
      </div>

      {/* Seat Details Card */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-5 mb-4 sm:mb-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm sm:text-base">{seatNumber}</span>
            </div>
            <div>
              <div className="font-bold text-black text-base sm:text-lg">Seat {seatNumber}</div>
              <div className="text-sm text-gray-600">
                Premium Selection
                <span className="hidden sm:inline"> • Window/Aisle</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-black">{currency}{amount}</div>
            <div className="text-xs text-gray-500 hidden sm:block">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handlePaymentConfirm}
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 py-3 sm:py-4 text-white font-semibold text-base sm:text-lg transition-all duration-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
          className="w-full rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400 py-3 font-medium"
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
