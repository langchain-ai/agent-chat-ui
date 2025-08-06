"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { CreditCard, X, CheckCircle, Plane } from "lucide-react";

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
      <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
        <div className="text-center py-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black animate-pulse">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Processing Payment</h2>
          <p className="text-sm text-gray-600">Please wait while we process your payment...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
        <div className="text-center py-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Payment Successful!</h2>
          <p className="text-sm text-gray-600 mb-4">Your seat {seatNumber} has been reserved.</p>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-black font-semibold">Amount Paid: {currency}{amount}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black">
          <span className="text-lg font-bold text-white">{seatNumber}</span>
        </div>

        <h2 className="text-xl font-bold text-black">Seat Payment</h2>
        <p className="mt-1 text-sm text-gray-600">
          Complete your payment for seat {seatNumber}
        </p>
      </div>

      {/* Seat Details Card */}
      <div className="rounded-lg bg-gray-50 p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-black">Seat {seatNumber}</div>
              <div className="text-xs text-gray-600">Premium Selection</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-black">{currency} {amount}</div>
            <div className="text-xs text-gray-500">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handlePaymentConfirm}
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-white transition-all duration-200 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Pay {currency} {amount} Now</span>
            </div>
          )}
        </Button>

        <Button
          onClick={handlePaymentCancel}
          disabled={isLoading}
          variant="outline"
          className="w-full rounded-xl border-2 border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
              <span>Cancelling...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <X className="w-5 h-5" />
              <span>Skip Payment</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SeatPaymentWidget;
