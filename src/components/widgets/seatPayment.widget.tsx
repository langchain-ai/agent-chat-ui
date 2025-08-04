"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/common/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";
import { CreditCard, X, CheckCircle, AlertCircle, Plane } from "lucide-react";

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
  const [countdown, setCountdown] = useState(5);
  const [autoPayStarted, setAutoPayStarted] = useState(false);
  
  const seatNumber = args.seatNumber || "14F";
  const amount = args.amount || 350;
  const currency = args.currency || "₹";

  // Auto-pay countdown effect
  useEffect(() => {
    if (paymentStatus === 'idle' && !autoPayStarted) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setAutoPayStarted(true);
            simulatePayment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus, autoPayStarted]);

  const handlePaymentConfirm = () => {
    setAutoPayStarted(true);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we process your payment...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your seat {seatNumber} has been reserved.</p>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-800 font-medium">Amount Paid: {currency}{amount}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 font-sans shadow-lg">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <span className="text-2xl font-bold text-blue-600">{seatNumber}</span>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">Seat Payment</h2>
        <p className="text-gray-600 mb-4">
          Complete your payment for seat {seatNumber}
        </p>
      </div>

      {/* Seat Details Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Seat {seatNumber}</div>
              <div className="text-sm text-gray-600">Premium Selection</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{currency}{amount}</div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </div>
        </div>

        {/* Payment Benefits */}
        <div className="border-t border-blue-200 pt-3 mt-3">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Guaranteed seat reservation</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Priority boarding</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Free cancellation up to 24hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-pay countdown notice */}
      {!autoPayStarted && countdown > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              Auto-payment in <span className="font-bold">{countdown}</span> seconds
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={handlePaymentConfirm}
          disabled={isLoading || autoPayStarted}
          className="w-full relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 rounded-lg text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-75"
        >
          {/* Loading fill effect */}
          {!autoPayStarted && countdown < 5 && (
            <div
              className="absolute left-0 top-0 h-full bg-green-800 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          )}

          <div className="relative z-10 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {autoPayStarted ? "Processing..." : `Pay ${currency}${amount} Now`}
          </div>
        </Button>

        <Button
          onClick={handlePaymentCancel}
          disabled={isLoading || autoPayStarted}
          variant="outline"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium py-3 rounded-lg text-base flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          {isLoading ? "Cancelling..." : "Skip Payment"}
        </Button>
      </div>
    </div>
  );
};

export default SeatPaymentWidget;
