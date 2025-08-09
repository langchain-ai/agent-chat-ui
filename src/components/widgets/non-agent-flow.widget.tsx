import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  CreditCard,
  CheckCircle,
  XCircle,
  Lock,
  AlertCircle,
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import { FlyoLogoSVG } from "@/components/icons/langgraph";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  executePrepayment,
  verifyTransaction,
  formatAmount,
  getPaymentStatusDescription,
  getBookingStatusDescription,
  isPaymentAndBookingSuccessful,
  type TransactionVerifyResponse,
} from "@/services/paymentService";
import { useNonAgentFlow } from "@/providers/NonAgentFlowContext";
import { useStreamContext } from "@/providers/Stream";
import { useTabContext } from "@/providers/TabContext";
import { submitInterruptResponse } from "@/components/widgets/util";

// Utility function to switch to chat tab with a small delay
const switchToChatWithDelay = (
  switchToChat: () => void,
  hasSwitchedToChat: boolean,
  setHasSwitchedToChat: (value: boolean) => void,
) => {
  if (hasSwitchedToChat) {
    console.log("Tab switch already initiated, skipping...");
    return;
  }

  console.log("Initiating tab switch to Chat...");
  setHasSwitchedToChat(true);

  // Use a shorter delay and add error handling
  const timeoutId = setTimeout(() => {
    try {
      console.log("Executing switchToChat()...");
      switchToChat();
      console.log("switchToChat() executed successfully");
    } catch (error) {
      console.error("Failed to switch to chat tab:", error);
      // Reset the flag on error so it can be retried
      setHasSwitchedToChat(false);
    }
  }, 1000); // Reduced to 1 second

  // Cleanup function to prevent memory leaks
  return () => clearTimeout(timeoutId);
};

interface NonAgentFlowWidgetProps {
  tripId: string;
  flightItinerary?: {
    userContext: {
      userDetails: any;
      userId: string;
    };
    selectionContext: {
      selectedFlightOffers:  Array<{
        flightOfferId: string;
        totalAmount: number;
        tax: number;
        baseAmount: number;
        serviceFee: number;
        convenienceFee: number;
        currency: string;
        [key: string]: any;
      }>;
    };
  };
  itinId?: string;
  apiData?: any;
  onClose?: () => void;
  onPaymentSuccess?: (response: TransactionVerifyResponse) => void;
  onPaymentFailure?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Payment status types
type PaymentStatus = "idle" | "loading" | "processing" | "success" | "failed";

interface PaymentState {
  status: PaymentStatus;
  prepaymentData?: any;
  verificationResponse?: TransactionVerifyResponse;
  error?: string;
}

// Bottom sheet wrapper for NonAgentFlowWidget
const NonAgentFlowBottomSheet: React.FC<NonAgentFlowWidgetProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);

  // Extract tripId from the interrupt data structure if available
  const interruptData = props.apiData?.value?.widget?.args || props.apiData;
  const extractedTripId = interruptData?.tripId || props.tripId;

  const handleClose = () => {
    setIsOpen(false);
    props.onClose?.();
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SheetContent
        side="bottom"
        className="flex h-[90vh] flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-0 sm:h-[85vh]"
      >
        <SheetHeader className="flex-shrink-0 border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                <FlyoLogoSVG
                  width={20}
                  height={20}
                  className="text-white"
                />
              </div>
              <SheetTitle className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-semibold text-transparent">
                Complete Your Booking
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-6">
          <NonAgentFlowWidgetContent
            {...props}
            tripId={extractedTripId}
            onClose={handleClose}
            setIsOpen={setIsOpen}
            apiData={props.apiData}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

const NonAgentFlowWidgetContent: React.FC<
  NonAgentFlowWidgetProps & {
    onClose: () => void;
    setIsOpen: (isOpen: boolean) => void;
  }
> = ({
  tripId,
  flightItinerary,
  onClose,
  setIsOpen,
  onPaymentSuccess,
  onPaymentFailure,
  apiData,
}) => {
  const { closeWidget } = useNonAgentFlow();
  const thread = useStreamContext();
  const { switchToChat } = useTabContext();

  // Extract price data for display
  const totalAmount = flightItinerary?.selectionContext?.selectedFlightOffers?.[0]?.totalAmount;
  const currency = flightItinerary?.selectionContext?.selectedFlightOffers?.[0]?.currency;
  const tax = flightItinerary?.selectionContext?.selectedFlightOffers?.[0]?.tax;
  const baseAmount = flightItinerary?.selectionContext?.selectedFlightOffers?.[0]?.baseAmount;
  const serviceFee = flightItinerary?.selectionContext?.selectedFlightOffers?.[0]?.serviceFee;
  const convenienceFee = flightItinerary?.selectionContext?.selectedFlightOffers?.[0]?.convenienceFee;

  // Extract price breakdown from selectedFlightOffers
  const getPriceBreakdown = () => {
    // First try to get from flightItinerary prop
    if (flightItinerary?.selectionContext?.selectedFlightOffers && flightItinerary.selectionContext.selectedFlightOffers.length > 0) {
      const offer = flightItinerary.selectionContext.selectedFlightOffers[0];
      return {
        totalAmount: offer.totalAmount || 0,
        tax: offer.tax || 0,
        baseAmount: offer.baseAmount || 0,
        serviceFee: offer.serviceFee || 0,
        convenienceFee: offer.convenienceFee || 0
      };
    }

    // Try to get from apiData (interrupt data)
    const interruptData = apiData?.value?.widget?.args || apiData;
    const selectedFlightOffers = interruptData?.flightItinerary?.selectionContext?.selectedFlightOffers;

    if (selectedFlightOffers && selectedFlightOffers.length > 0) {
      const offer = selectedFlightOffers[0];
      return {
        totalAmount: offer.totalAmount || 0,
        tax: offer.tax || 0,
        baseAmount: offer.baseAmount || 0,
        serviceFee: offer.serviceFee || 0,
        convenienceFee: offer.convenienceFee || 0
      };
    }

    // Fallback to default values
    return {
      totalAmount: 0,
      tax: 0,
      baseAmount: 0,
      serviceFee: 0,
      convenienceFee: 0
    };
  };

  const priceBreakdown = getPriceBreakdown();

  // Check if this is an interrupt-triggered widget
  const isInterruptWidget = !!apiData;
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: "idle",
  });
  const [countdown, setCountdown] = useState(10);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [hasUserClicked, setHasUserClicked] = useState(false);
  const [hasSwitchedToChat, setHasSwitchedToChat] = useState(false);
  const [isSubmittingInterrupt, setIsSubmittingInterrupt] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (error) {
        console.log("Script already removed");
      }
    };
  }, []);

  // Define handlePaymentClick early so it can be used in useEffect
  const handlePaymentClick = useCallback(() => {
    // Prevent multiple payment attempts
    if (
      paymentState.status === "loading" ||
      paymentState.status === "processing"
    ) {
      console.log("Payment already in progress, ignoring click");
      return;
    }

    setHasUserClicked(true);
    setIsCountdownActive(false);
    setHasSwitchedToChat(false); // Reset the flag when starting new payment
    // We'll call initiatePayment directly here to avoid dependency issues
    setPaymentState({ status: "loading" });

    // Trigger payment initiation
    (async () => {
      try {
        console.log("Starting payment process...");

        // Validate tripId
        if (!tripId) {
          throw new Error("Trip ID is required but not provided");
        }

        // Step 1: Execute prepayment API
        console.log("Initiating prepayment for tripId:", tripId);
        const prepaymentResponse = await executePrepayment(tripId);

        if (!prepaymentResponse.success) {
          throw new Error(prepaymentResponse.message || "Prepayment failed");
        }

        setPaymentState({
          status: "processing",
          prepaymentData: prepaymentResponse.data,
        });

        // Step 2: Initialize Razorpay payment
        const options = {
          key: prepaymentResponse.data.transaction.key,
          amount: prepaymentResponse.data.transaction.amount,
          currency: prepaymentResponse.data.transaction.currency || "INR",
          name: prepaymentResponse.data.transaction.name,
          description: prepaymentResponse.data.transaction.description,
          order_id: prepaymentResponse.data.transaction.razorpay_order_id,
          handler: async function (response: any) {
            try {
              console.log("Razorpay payment successful:", response);

              // Step 3: Verify transaction
              const verificationResponse = await verifyTransaction({
                tripId,
                transaction_id:
                  prepaymentResponse.data.transaction.transaction_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                razorpay_order_id: response.razorpay_order_id,
              });

              console.log("Verification response:", verificationResponse);

              // Safely extract PNR with error handling
              const extractPNR = (response: any): string => {
                try {
                  const associatedRecords =
                    response?.data?.bookingData?.associatedRecords;
                  const recordIndex =
                    Array.isArray(associatedRecords) &&
                    associatedRecords.length > 1
                      ? 1
                      : 0;
                  const pnr = associatedRecords?.[recordIndex]?.reference;

                  if (pnr && typeof pnr === "string" && pnr.trim() !== "") {
                    console.log("PNR extracted successfully:", pnr);
                    return pnr.trim();
                  } else {
                    console.warn(
                      "PNR not found or invalid in response:",
                      associatedRecords,
                    );
                    return "";
                  }
                } catch (error) {
                  console.error("Error extracting PNR from response:", error);
                  return "";
                }
              };

              const pnr = extractPNR(verificationResponse);

              setPaymentState({
                status: "success",
                prepaymentData: prepaymentResponse.data,
                verificationResponse,
              });

              onPaymentSuccess?.(verificationResponse);

              // Show success message
              if (isPaymentAndBookingSuccessful(verificationResponse)) {
                toast.success("Payment and booking completed successfully!");

                // If this is an interrupt widget, solve the interrupt and send response back to server
                if (isInterruptWidget) {
                  try {
                    const responseData = {
                      status: "completed",
                      paymentStatus: verificationResponse.data.paymentStatus,
                      bookingStatus: verificationResponse.data.bookingStatus,
                      tripId,
                      pnr: pnr || "", // Ensure PNR is always a string (empty if not found)
                      transactionData: {
                        paymentStatus: verificationResponse.data.paymentStatus,
                        bookingStatus: verificationResponse.data.bookingStatus,
                        transactionId:
                          prepaymentResponse.data.transaction.transaction_id,
                        bookingError: verificationResponse.data.bookingError,
                        // Add booking data structure - this would typically come from the server response
                        bookingData: (verificationResponse.data as any)?.bookingData || null, // Will be populated by server with actual booking details
                      },
                    };

                    console.log(
                      "Sending interrupt response with PNR:",
                      pnr || "No PNR found",
                    );
                    console.log("Complete response data:", responseData);

                    try {
                      setIsSubmittingInterrupt(true);

                      // Validate response data before submission
                      if (!responseData || typeof responseData !== 'object') {
                        throw new Error("Invalid response data structure");
                      }

                      console.log("Submitting interrupt response:", JSON.stringify(responseData, null, 2));

                      // Add timeout to prevent hanging
                      const interruptPromise = submitInterruptResponse(
                        thread,
                        "response",
                        responseData,
                      );

                      const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(
                          () =>
                            reject(new Error("Interrupt submission timeout")),
                          5000,
                        );
                      });

                      await Promise.race([interruptPromise, timeoutPromise]);
                      console.log("Interrupt response submitted successfully");

                      // Switch to chat tab immediately after successful interrupt resolution
                      console.log(
                        "Switching to chat tab after successful payment",
                      );
                      switchToChatWithDelay(
                        switchToChat,
                        hasSwitchedToChat,
                        setHasSwitchedToChat,
                      );
                    } catch (interruptError) {
                      console.error(
                        "Failed to submit interrupt response:",
                        interruptError,
                      );
                      // Still try to switch to chat even if interrupt submission fails
                      switchToChatWithDelay(
                        switchToChat,
                        hasSwitchedToChat,
                        setHasSwitchedToChat,
                      );
                    } finally {
                      setIsSubmittingInterrupt(false);
                    }
                  } catch (error) {
                    console.error("Error solving interrupt:", error);
                  }
                }

                // Don't show reopen button on successful payment
                closeWidget();
              } else {
                toast.warning(
                  "Payment completed but booking status needs attention",
                );
              }
            } catch (error) {
              console.error("Transaction verification failed:", error);
              const errorMessage =
                error instanceof Error ? error.message : "Verification failed";

              setPaymentState({
                status: "failed",
                prepaymentData: prepaymentResponse.data,
                error: errorMessage,
              });

              // If this is an interrupt widget, solve the interrupt with failure data
              if (isInterruptWidget) {
                try {
                  const responseData = {
                    status: "failed",
                    paymentStatus: "FAILED",
                    bookingStatus: "FAILED",
                    tripId,
                    pnr: "", // No PNR available on verification failure
                    error: errorMessage,
                    transactionData: {
                      paymentStatus: "FAILED",
                      bookingStatus: "FAILED",
                      transactionId:
                        prepaymentResponse.data.transaction.transaction_id,
                      error: errorMessage,
                      bookingData: null,
                    },
                  };

                  // Validate response data before submission
                  if (!responseData || typeof responseData !== 'object') {
                    console.error("Invalid response data for payment failure:", responseData);
                    return;
                  }

                  console.log("Submitting payment failure interrupt:", JSON.stringify(responseData, null, 2));
                  await submitInterruptResponse(
                    thread,
                    "response",
                    responseData,
                  );

                  // Switch to chat tab after error interrupt resolution
                  console.log(
                    "Switching to chat tab after payment verification error",
                  );
                  switchToChatWithDelay(
                    switchToChat,
                    hasSwitchedToChat,
                    setHasSwitchedToChat,
                  );
                } catch (interruptError) {
                  console.error("Error solving interrupt:", interruptError);
                }
              }

              onPaymentFailure?.(errorMessage);
              toast.error("Payment verification failed");
            } finally {
              setIsCountdownActive(false);
              switchToChatWithDelay(
                switchToChat,
                hasSwitchedToChat,
                setHasSwitchedToChat,
              );
            }
          },
          prefill: {
            name: "Customer Name",
            email: "customer@example.com",
          },
          theme: {
            color: "#3B82F6",
          },
          modal: {
            ondismiss: function () {
              const errorMessage = "Payment cancelled by user";

              setPaymentState({
                status: "failed",
                error: errorMessage,
              });

              // If this is an interrupt widget, solve the interrupt with cancellation data
              if (isInterruptWidget) {
                (async () => {
                  try {
                    const responseData = {
                      status: "cancelled",
                      paymentStatus: "FAILED",
                      bookingStatus: "FAILED",
                      tripId,
                      pnr: "", // No PNR available on cancellation
                      error: errorMessage,
                      cancelled: true,
                      transactionData: {
                        paymentStatus: "FAILED",
                        bookingStatus: "FAILED",
                        error: errorMessage,
                        cancelled: true,
                        bookingData: null,
                      },
                    };

                    // Validate response data before submission
                    if (!responseData || typeof responseData !== 'object') {
                      console.error("Invalid response data for cancellation:", responseData);
                      return;
                    }

                    console.log("Submitting cancellation interrupt:", JSON.stringify(responseData, null, 2));
                    await submitInterruptResponse(
                      thread,
                      "response",
                      responseData,
                    );

                    // Switch to chat tab after cancellation interrupt resolution
                    console.log(
                      "Switching to chat tab after payment cancellation",
                    );
                    switchToChatWithDelay(
                      switchToChat,
                      hasSwitchedToChat,
                      setHasSwitchedToChat,
                    );
                  } catch (interruptError) {
                    console.error("Error solving interrupt:", interruptError);
                  }
                })();
              }

              onPaymentFailure?.(errorMessage);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error) {
        console.error("Payment initiation failed:", error);

        // Check for specific error types
        let errorMessage = "Payment initiation failed";
        if (error instanceof Error) {
          errorMessage = error.message;

          // Handle specific airportIata error
          if (error.message.includes("airportIata")) {
            console.error("AirportIata error detected:", error);
            errorMessage = "Flight data processing error. Please try again.";
          }

          // Handle other common errors
          if (error.message.includes("Cannot read properties of undefined")) {
            console.error("Data structure error:", error);
            errorMessage = "Data processing error. Please refresh and try again.";
          }
        }

        setPaymentState({
          status: "failed",
          error: errorMessage,
        });

        // If this is an interrupt widget, solve the interrupt with failure data
        if (isInterruptWidget) {
          try {
            const responseData = {
              status: "failed",
              paymentStatus: "FAILED",
              bookingStatus: "FAILED",
              tripId,
              pnr: "", // No PNR available on payment initiation failure
              error: errorMessage,
              transactionData: {
                paymentStatus: "FAILED",
                bookingStatus: "FAILED",
                error: errorMessage,
                bookingData: null,
              },
            };

            // Validate response data before submission
            if (!responseData || typeof responseData !== 'object') {
              console.error("Invalid response data for payment initiation error:", responseData);
              return;
            }

            console.log("Submitting payment initiation error interrupt:", JSON.stringify(responseData, null, 2));
            await submitInterruptResponse(thread, "response", responseData);

            // Switch to chat tab after payment initiation error interrupt resolution
            console.log("Switching to chat tab after payment initiation error");
            switchToChatWithDelay(
              switchToChat,
              hasSwitchedToChat,
              setHasSwitchedToChat,
            );
          } catch (interruptError) {
            console.error("Error solving interrupt:", interruptError);
          }
        }

        onPaymentFailure?.(errorMessage);
        toast.error("Failed to initiate payment");
      }
    })();
  }, [
    tripId,
    onPaymentSuccess,
    onPaymentFailure,
    closeWidget,
    hasSwitchedToChat,
    isInterruptWidget,
    switchToChat,
    thread,
  ]);

  // Countdown effect
  useEffect(() => {
    if (isCountdownActive && countdown > 0 && !hasUserClicked) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCountdownActive && countdown === 0 && !hasUserClicked) {
      // Auto-trigger payment when countdown reaches 0
      handlePaymentClick();
    }
  }, [countdown, isCountdownActive, hasUserClicked, handlePaymentClick]);

  // Start countdown when component mounts
  useEffect(() => {
    if (paymentState.status === "idle") {
      setIsCountdownActive(true);
    }
  }, [paymentState.status]);

  // Remove auto-start payment flow - now controlled by user interaction or countdown

  const retryPayment = useCallback(() => {
    setPaymentState({ status: "idle" });
    setCountdown(10);
    setIsCountdownActive(true);
    setHasUserClicked(false);
    setHasSwitchedToChat(false);
  }, []);

  const renderContent = () => {
    switch (paymentState.status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-black" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Preparing Payment
              </h3>
              <p className="text-sm text-gray-600">
                Setting up your payment gateway...
              </p>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-black" />
              <span className="text-lg font-semibold text-gray-900">
                Processing Payment
              </span>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Payment Successful!
                </h3>
                <p className="text-sm text-gray-600">
                  Your payment has been processed successfully
                </p>
              </div>
            </div>

            {paymentState.verificationResponse && (
              <Card className="border-gray-200 bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900">
                    Booking Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Payment Status:
                    </span>
                    <span className="text-sm text-gray-900">
                      {getPaymentStatusDescription(
                        paymentState.verificationResponse.data.paymentStatus,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Booking Status:
                    </span>
                    <span className="text-sm text-gray-900">
                      {getBookingStatusDescription(
                        paymentState.verificationResponse.data.bookingStatus,
                      )}
                    </span>
                  </div>
                  {paymentState.verificationResponse.data.bookingError && (
                    <div className="rounded-md bg-yellow-50 p-3">
                      <p className="text-sm text-yellow-800">
                        Note:{" "}
                        {paymentState.verificationResponse.data.bookingError}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "failed":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Payment Failed
                </h3>
                <p className="text-sm text-gray-600">
                  {paymentState.error || "Something went wrong"}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={retryPayment}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 border-black text-black hover:bg-gray-100"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case "idle":
      default:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="text-center">
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Complete Your Payment
                </h3>
                <p className="text-sm text-gray-600">
                  Your booking is ready. Complete the payment to confirm your
                  flight.
                </p>
              </div>
            </div>

            {/* Price Breakdown Card */}
            {(totalAmount || baseAmount || serviceFee || tax || convenienceFee) && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h4 className="text-lg font-semibold text-black mb-4 text-center">Payment Summary</h4>
                <div className="space-y-3">
                  {/* Base Amount */}
                  {baseAmount && baseAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Base Amount</span>
                      <span className="text-sm font-medium text-black">
                        {currency === 'INR' ? '₹' : currency}{baseAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Service Fee */}
                  {serviceFee && serviceFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Service Fee</span>
                      <span className="text-sm font-medium text-black">
                        {currency === 'INR' ? '₹' : currency}{serviceFee.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Tax */}
                  {tax !== undefined && tax !== null && tax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Tax</span>
                      <span className="text-sm font-medium text-black">
                        {currency === 'INR' ? '₹' : currency}{tax.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Convenience Fee (crossed out) */}
                  {convenienceFee && convenienceFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Convenience Fee</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-red-500 line-through font-medium">
                          {currency === 'INR' ? '₹' : currency}{convenienceFee.toLocaleString()}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">FREE</span>
                      </div>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-black">Total Amount</span>
                      <span className="text-xl font-bold text-black">
                        {currency === 'INR' ? '₹' : currency}{totalAmount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>

                  {/* Free convenience fee promotional message */}
                  {convenienceFee && convenienceFee > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-xs text-green-800 text-center">
                        🎉 Great news! We're waiving the convenience fee for you. Save {currency === 'INR' ? '₹' : currency}{convenienceFee.toLocaleString()}!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handlePaymentClick}
                className="relative flex-1 overflow-hidden bg-black text-white hover:bg-gray-800"
                disabled={hasUserClicked}
              >
                {/* Countdown animation background */}
                {isCountdownActive && !hasUserClicked && (
                  <div
                    className="absolute inset-0 bg-gray-700 transition-all duration-1000 ease-linear"
                    style={{
                      width: `${((10 - countdown) / 10) * 100}%`,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isCountdownActive && !hasUserClicked
                    ? `Make Payment (${countdown}s)`
                    : "Make Payment"}
                </span>
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-black text-black hover:bg-gray-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Flight Information Card */}
      {paymentState.prepaymentData && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-gray-900">
              <Plane className="mr-2 h-5 w-5" />
              Flight Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Trip ID:
                </span>
                <span className="text-sm text-gray-900">{tripId}</span>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 border-t border-gray-200 pt-3">
                <h4 className="text-sm font-semibold text-black">Price Details</h4>

                {/* Base Amount */}
                {priceBreakdown.baseAmount && priceBreakdown.baseAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Base Amount</span>
                    <span className="text-sm text-black">₹{priceBreakdown.baseAmount.toLocaleString()}</span>
                  </div>
                )}

                {/* Service Fee */}
                {priceBreakdown.serviceFee && priceBreakdown.serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Service Fee</span>
                    <span className="text-sm text-black">₹{priceBreakdown.serviceFee.toLocaleString()}</span>
                  </div>
                )}

                {/* Tax */}
                {priceBreakdown.tax !== undefined && priceBreakdown.tax !== null && priceBreakdown.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Tax</span>
                    <span className="text-sm text-black">₹{priceBreakdown.tax.toLocaleString()}</span>
                  </div>
                )}

                {/* Convenience Fee (crossed out) */}
                {priceBreakdown.convenienceFee && priceBreakdown.convenienceFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Convenience Fee</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-red-500 line-through">₹{priceBreakdown.convenienceFee.toLocaleString()}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">FREE</span>
                    </div>
                  </div>
                )}

                {/* Total Amount */}
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-sm font-semibold text-black">Total Amount</span>
                  <span className="text-lg font-bold text-black">
                    {paymentState.prepaymentData.transaction.amount
                      ? formatAmount(
                          paymentState.prepaymentData.transaction.amount,
                          "INR",
                        )
                      : priceBreakdown.totalAmount
                        ? `₹${priceBreakdown.totalAmount.toLocaleString()}`
                        : "₹0.00"}
                  </span>
                </div>

                {/* Free convenience fee note */}
                {priceBreakdown.convenienceFee && priceBreakdown.convenienceFee > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-green-800">
                      🎉 Great news! We're waiving the convenience fee for you. Save ₹{priceBreakdown.convenienceFee.toLocaleString()}!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

const NonAgentFlowWidget: React.FC<NonAgentFlowWidgetProps> = (props) => {
  const { openWidget, closeWidget } = useNonAgentFlow();

  // If called from interrupt handler, extract tripId from apiData
  if (props.apiData) {
    // Extract tripId from the interrupt data structure
    const interruptData = props.apiData.value?.widget?.args || props.apiData;
    const extractedTripId = interruptData.tripId || props.tripId;

    // For interrupt-triggered widgets, don't use context - render directly
    return (
      <NonAgentFlowWidgetContent
        {...props}
        tripId={extractedTripId}
        onClose={() => {
          // When closing from interrupt, initialize context for reopen button
          openWidget({
            tripId: extractedTripId,
            flightItinerary: interruptData.flightItinerary,
            itinId: interruptData.itinId,
          });
          closeWidget();
        }}
        setIsOpen={() => {}}
        apiData={props.apiData}
      />
    );
  }
  return <NonAgentFlowBottomSheet {...props} />;
};

export default NonAgentFlowWidget;
