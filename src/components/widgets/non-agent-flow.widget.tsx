import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  executePrepayment,
  verifyTransaction,
  isPaymentAndBookingSuccessful,
  type TransactionVerifyResponse,
} from "@/services/paymentService";
import { useNonAgentFlow } from "@/providers/NonAgentFlowContext";
import { useStreamContext } from "@/providers/Stream";
import { useTabContext } from "@/providers/TabContext";

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
      contactDetails?: {
        countryCode: string;
        mobileNumber: string;
        email: string;
      };
    };
    selectionContext: {
      selectedFlightOffers: Array<{
        flightOfferId: string;
        totalAmount: number;
        tax: number;
        baseAmount: number;
        serviceFee: number;
        convenienceFee: number;
        currency: string;
        journey?: Array<{
          id: string;
          duration: string;
          departure: {
            date: string;
            airportIata: string;
            airportName: string;
            cityCode: string;
            countryCode: string;
          };
          arrival: {
            date: string;
            airportIata: string;
            airportName: string;
            cityCode: string;
            countryCode: string;
          };
          segments: Array<{
            id: string;
            airlineIata: string;
            flightNumber: string;
            duration: string;
            aircraftType: string;
            airlineName: string;
            departure: {
              date: string;
              airportIata: string;
              airportName: string;
              cityCode: string;
              countryCode: string;
            };
            arrival: {
              date: string;
              airportIata: string;
              airportName: string;
              cityCode: string;
              countryCode: string;
            };
          }>;
        }>;
        baggage?: {
          check_in_baggage: {
            weight: number;
            weightUnit: string;
          };
          cabin_baggage: {
            weight: number;
            weightUnit: string;
          };
        };
        offerRules?: {
          isRefundable: boolean;
        };
        // Legacy fields for backward compatibility
        departure?: {
          date: string;
          airportIata: string;
          airportName: string;
          cityCode: string;
          countryCode: string;
        };
        arrival?: {
          date: string;
          airportIata: string;
          airportName: string;
          cityCode: string;
          countryCode: string;
        };
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

// Minimal wrapper to render inline without any bottom sheet/UI chrome
const NonAgentFlowBottomSheet: React.FC<NonAgentFlowWidgetProps> = (props) => {
  const interruptData = props.apiData?.value?.widget?.args || props.apiData;
  const extractedTripId = interruptData?.tripId || props.tripId;
  const handleClose = () => {
    props.onClose?.();
  };
  return (
    <NonAgentFlowWidgetContent
      {...props}
      tripId={extractedTripId}
      onClose={handleClose}
      setIsOpen={() => {}}
      apiData={props.apiData}
    />
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
  const { closeWidget, submitVerificationResult } = useNonAgentFlow();
  const thread = useStreamContext();
  const { switchToChat } = useTabContext();

  // UI display-only calculations removed to keep flow silent

  // Extract contact details from flightItinerary or apiData
  const getContactDetails = () => {
    // First try to get from flightItinerary prop
    if (flightItinerary?.userContext?.contactDetails) {
      return flightItinerary.userContext.contactDetails;
    }

    // Try to get from apiData (interrupt data)
    const interruptData = apiData?.value?.widget?.args || apiData;
    const contactDetails =
      interruptData?.flightItinerary?.userContext?.contactDetails;

    if (contactDetails) {
      return contactDetails;
    }

    // Return null if no contact details found
    return null;
  };

  const contactDetails = getContactDetails();

  // Log contact details for debugging
  console.log("📞 NonAgentFlow - Contact Details:", contactDetails);

  // Removed flight data formatting helpers used only for display

  // Check if this is an interrupt-triggered widget
  const isInterruptWidget = !!apiData;

  // Initialize payment state with localStorage persistence
  const initializePaymentState = (): PaymentState => {
    try {
      const savedState = localStorage.getItem(`payment_state_${tripId}`);
      console.log(`🔍 Checking localStorage for tripId ${tripId}:`, savedState);

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Only restore if the state is success to maintain booking/payment success across refreshes
        if (
          parsedState.status === "success" &&
          parsedState.verificationResponse
        ) {
          console.log(
            "✅ Restored SUCCESS payment state from localStorage for tripId:",
            tripId,
          );
          return parsedState;
        } else {
          console.log(
            "❌ Found saved state but not success or missing verification response:",
            parsedState.status,
          );
        }
      } else {
        console.log("📭 No saved payment state found in localStorage");
      }
    } catch (error) {
      console.error("Error loading payment state from localStorage:", error);
    }
    console.log("🆕 Initializing with idle payment state");
    return { status: "idle" };
  };

  const [paymentState, setPaymentState] = useState<PaymentState>(
    initializePaymentState,
  );
  const [countdown, setCountdown] = useState(10);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [hasUserClicked, setHasUserClicked] = useState<boolean>(false);
  const [hasSwitchedToChat, setHasSwitchedToChat] = useState(false);
  const [isSubmittingInterrupt, setIsSubmittingInterrupt] = useState(false);

  // Function to save payment state to localStorage
  const savePaymentState = useCallback(
    (state: PaymentState) => {
      try {
        // Only save success states to localStorage for persistence across refreshes
        if (state.status === "success" && state.verificationResponse) {
          localStorage.setItem(
            `payment_state_${tripId}`,
            JSON.stringify(state),
          );
          console.log(
            "Saved payment state to localStorage for tripId:",
            tripId,
          );
        }
      } catch (error) {
        console.error("Error saving payment state to localStorage:", error);
      }
    },
    [tripId],
  );

  // Enhanced setPaymentState that also saves to localStorage
  const updatePaymentState = useCallback(
    (state: PaymentState) => {
      console.log(
        `💳 Payment state transition: ${paymentState.status} → ${state.status}`,
      );
      setPaymentState(state);
      savePaymentState(state);
    },
    [savePaymentState, paymentState.status],
  );

  // Function to clear payment state from localStorage
  const clearPaymentState = useCallback(() => {
    try {
      localStorage.removeItem(`payment_state_${tripId}`);
      console.log(
        "Cleared payment state from localStorage for tripId:",
        tripId,
      );
    } catch (error) {
      console.error("Error clearing payment state from localStorage:", error);
    }
  }, [tripId]);

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
    // Prevent multiple payment attempts or re-triggering when payment is already successful
    if (
      paymentState.status === "loading" ||
      paymentState.status === "processing" ||
      paymentState.status === "success"
    ) {
      console.log(
        `Payment already in ${paymentState.status} state, ignoring click`,
      );
      return;
    }

    setHasUserClicked(true);
    // Mark in existing payment_state that auto-trigger should not re-run
    try {
      const key = `payment_state_${tripId}`;
      const existing = localStorage.getItem(key);
      const obj = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        key,
        JSON.stringify({
          ...obj,
          preventAutoTrigger: true,
          status: obj.status || "attempted",
        }),
      );
    } catch {}
    setIsCountdownActive(false);
    setHasSwitchedToChat(false); // Reset the flag when starting new payment
    clearPaymentState(); // Clear any existing localStorage state when starting new payment
    // We'll call initiatePayment directly here to avoid dependency issues
    console.log("💳 Setting payment state to loading");
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
        console.log(
          "Prepayment response:",
          JSON.stringify(prepaymentResponse, null, 2),
        );

        if (!prepaymentResponse.success) {
          throw new Error(prepaymentResponse.message || "Prepayment failed");
        }

        console.log("💳 Setting payment state to processing");
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
              const transaction_id =
                prepaymentResponse.data.transaction.transaction_id;
              console.log("Transaction ID:", transaction_id);
              console.log("tripId:", tripId);

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

              updatePaymentState({
                status: "success",
                prepaymentData: prepaymentResponse.data,
                verificationResponse,
              });

              onPaymentSuccess?.(verificationResponse);

              // Show success message
              if (isPaymentAndBookingSuccessful(verificationResponse)) {
                toast.success("Payment and booking completed successfully!");
                // Submit compact success response
                try {
                  try {
                    setIsSubmittingInterrupt(true);
                    const paymentMethod =
                      verificationResponse.data?.paymentData?.method || "";

                    const interruptPromise = submitVerificationResult({
                      paymentStatus: verificationResponse.data.paymentStatus,
                      bookingStatus: verificationResponse.data.bookingStatus,
                      pnr,
                      transactionId: transaction_id,
                      paymentMethod,
                    });

                    const timeoutPromise = new Promise((_, reject) => {
                      setTimeout(
                        () => reject(new Error("Interrupt submission timeout")),
                        5000,
                      );
                    });

                    await Promise.race([interruptPromise, timeoutPromise]);
                  } catch (interruptError) {
                    console.error(
                      "Failed to submit interrupt response:",
                      interruptError,
                    );
                  } finally {
                    setIsSubmittingInterrupt(false);
                  }
                } catch (error) {
                  console.error("Error solving interrupt:", error);
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

              // Persist flag to prevent auto re-trigger after failure
              try {
                const key = `payment_state_${tripId}`;
                const existing = localStorage.getItem(key);
                const obj = existing ? JSON.parse(existing) : {};
                localStorage.setItem(
                  key,
                  JSON.stringify({
                    ...obj,
                    preventAutoTrigger: true,
                    status: "failed",
                  }),
                );
              } catch {}

              // Submit compact failure response
              try {
                await submitVerificationResult({
                  paymentStatus: "FAILED",
                  bookingStatus: "FAILED",
                });

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
            email: contactDetails?.email || "customer@example.com",
            contact: contactDetails?.mobileNumber
              ? `+${contactDetails.countryCode || "91"}${contactDetails.mobileNumber}`
              : undefined,
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

              // Persist flag to prevent auto re-trigger after cancellation
              try {
                const key = `payment_state_${tripId}`;
                const existing = localStorage.getItem(key);
                const obj = existing ? JSON.parse(existing) : {};
                localStorage.setItem(
                  key,
                  JSON.stringify({
                    ...obj,
                    preventAutoTrigger: true,
                    status: "failed",
                  }),
                );
              } catch {}

              // Submit compact cancellation response
              (async () => {
                try {
                  await submitVerificationResult({
                    paymentStatus: "FAILED",
                    bookingStatus: "FAILED",
                  });

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
            errorMessage =
              "Data processing error. Please refresh and try again.";
          }
        }

        setPaymentState({
          status: "failed",
          error: errorMessage,
        });

        // Submit compact failure response for initiation error
        try {
          await submitVerificationResult({
            paymentStatus: "FAILED",
            bookingStatus: "FAILED",
          });

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
    clearPaymentState,
    paymentState.status,
    updatePaymentState,
  ]);

  // Auto-trigger payment effect - only when payment state is idle
  useEffect(() => {
    // Only trigger payment if the state is idle (not success, failed, loading, or processing)
    let preventAuto = false;
    try {
      const key = `payment_state_${tripId}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        const obj = JSON.parse(existing);
        preventAuto = !!obj?.preventAutoTrigger;
      }
    } catch {}
    if (paymentState.status === "idle" && !hasUserClicked && !preventAuto) {
      console.log("🚀 Auto-triggering payment for idle state");
      handlePaymentClick();
    }
  }, [paymentState.status, hasUserClicked, handlePaymentClick, tripId]);

  // Countdown effect (currently disabled but preserved for future use)
  useEffect(() => {
    // Countdown logic is commented out but preserved
    // if (isCountdownActive && countdown > 0 && !hasUserClicked) {
    //   const timer = setTimeout(() => {
    //     setCountdown(countdown - 1);
    //   }, 1000);
    //   return () => clearTimeout(timer);
    // } else if (isCountdownActive && countdown === 0 && !hasUserClicked) {
    //   // Auto-trigger payment when countdown reaches 0
    //   handlePaymentClick();
    // }
  }, [countdown, isCountdownActive, hasUserClicked]);

  // Start countdown when component mounts
  useEffect(() => {
    if (paymentState.status === "idle") {
      setIsCountdownActive(true);
    }
  }, [paymentState.status]);

  // Remove auto-start payment flow - now controlled by user interaction or countdown

  // Removed retry UI logic

  // const renderContent = () => {
  //   switch (paymentState.status) {
  //     case "loading":
  //       return (
  //         <div className="flex flex-col items-center justify-center space-y-4 py-12">
  //           <Loader2 className="h-12 w-12 animate-spin text-black" />
  //           <div className="text-center">
  //             <h3 className="text-lg font-semibold text-gray-900">
  //               Preparing Payment
  //             </h3>
  //             <p className="text-sm text-gray-600">
  //               Setting up your payment gateway...
  //             </p>
  //           </div>
  //         </div>
  //       );

  //     case "processing":
  //       return (
  //         <div className="flex flex-col items-center justify-center space-y-4 py-12">
  //           <div className="flex items-center space-x-2">
  //             <Loader2 className="h-6 w-6 animate-spin text-black" />
  //             <span className="text-lg font-semibold text-gray-900">
  //               Processing Payment
  //             </span>
  //           </div>
  //         </div>
  //       );

  //     case "success":
  //       return (
  //         <div className="space-y-6">
  //           <div className="flex flex-col items-center space-y-4 py-8">
  //             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
  //               <CheckCircle className="h-8 w-8 text-green-600" />
  //             </div>
  //             <div className="text-center">
  //               <h3 className="text-xl font-semibold text-gray-900">
  //                 Payment Successful!
  //               </h3>
  //               <p className="text-sm text-gray-600">
  //                 Your payment has been processed successfully
  //               </p>
  //             </div>
  //           </div>

  //           {paymentState.verificationResponse && (
  //             <Card className="border-gray-200 bg-gray-50">
  //               <CardHeader className="pb-3">
  //                 <CardTitle className="text-lg text-gray-900">
  //                   Booking Status
  //                 </CardTitle>
  //               </CardHeader>
  //               <CardContent className="space-y-4">
  //                 <div className="flex items-center justify-between">
  //                   <span className="text-sm font-medium text-gray-700">
  //                     Payment Status:
  //                   </span>
  //                   <span className="text-sm text-gray-900">
  //                     {getPaymentStatusDescription(
  //                       paymentState.verificationResponse.data.paymentStatus,
  //                     )}
  //                   </span>
  //                 </div>
  //                 <div className="flex items-center justify-between">
  //                   <span className="text-sm font-medium text-gray-700">
  //                     Booking Status:
  //                   </span>
  //                   <span className="text-sm text-gray-900">
  //                     {getBookingStatusDescription(
  //                       paymentState.verificationResponse.data.bookingStatus,
  //                     )}
  //                   </span>
  //                 </div>
  //                 {paymentState.verificationResponse.data.bookingError && (
  //                   <div className="rounded-md bg-yellow-50 p-3">
  //                     <p className="text-sm text-yellow-800">
  //                       Note:{" "}
  //                       {paymentState.verificationResponse.data.bookingError}
  //                     </p>
  //                   </div>
  //                 )}
  //               </CardContent>
  //             </Card>
  //           )}
  //         </div>
  //       );

  //     case "failed":
  //       return (
  //         <div className="space-y-6">
  //           <div className="flex flex-col items-center space-y-4 py-8">
  //             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
  //               <XCircle className="h-8 w-8 text-red-600" />
  //             </div>
  //             <div className="text-center">
  //               <h3 className="text-xl font-semibold text-gray-900">
  //                 Payment Failed
  //               </h3>
  //               <p className="text-sm text-gray-600">
  //                 {paymentState.error || "Something went wrong"}
  //               </p>
  //             </div>
  //           </div>

  //           {/* Button container with mobile-friendly positioning */}
  //           <div className="sticky bottom-0 -mx-4 mt-6 flex space-x-3 border-t border-gray-200 bg-white p-4 sm:static sm:mx-0 sm:mt-4 sm:border-t-0 sm:bg-transparent sm:p-0">
  //             <Button
  //               onClick={retryPayment}
  //               className="flex-1 bg-black text-white hover:bg-gray-800"
  //             >
  //               <CreditCard className="mr-2 h-4 w-4" />
  //               Retry Payment
  //             </Button>
  //             <Button
  //               onClick={onClose}
  //               className="flex-1 border-black text-black hover:bg-gray-100"
  //               variant="outline"
  //             >
  //               Cancel
  //             </Button>
  //           </div>
  //         </div>
  //       );

  //     case "idle":
  //     default:
  //       return (
  //         <div className="space-y-6">
  //           <div className="flex flex-col items-center space-y-4 py-8">
  //             <div className="text-center">
  //               <h3 className="mb-2 text-xl font-semibold text-gray-900">
  //                 Complete Your Payment
  //               </h3>
  //               <p className="text-sm text-gray-600">
  //                 Your booking is ready. Complete the payment to confirm your
  //                 flight.
  //               </p>
  //             </div>
  //           </div>

  //           {/* Price Breakdown Card */}
  //           {(totalAmount ||
  //             baseAmount ||
  //             serviceFee ||
  //             tax ||
  //             convenienceFee) && (
  //             <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
  //               <h4 className="mb-4 text-center text-lg font-semibold text-black">
  //                 Payment Summary
  //               </h4>
  //               <div className="space-y-3">
  //                 {/* Base Amount */}
  //                 {baseAmount && baseAmount > 0 && (
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-sm text-gray-700">Base Amount</span>
  //                     <span className="text-sm font-medium text-black">
  //                       {currency === "INR" ? "₹" : currency}
  //                       {baseAmount.toLocaleString()}
  //                     </span>
  //                   </div>
  //                 )}

  //                 {/* Service Fee */}
  //                 {serviceFee && serviceFee > 0 && (
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-sm text-gray-700">Service Fee</span>
  //                     <span className="text-sm font-medium text-black">
  //                       {currency === "INR" ? "₹" : currency}
  //                       {serviceFee.toLocaleString()}
  //                     </span>
  //                   </div>
  //                 )}

  //                 {/* Tax */}
  //                 {tax !== undefined && tax !== null && tax > 0 && (
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-sm text-gray-700">Tax</span>
  //                     <span className="text-sm font-medium text-black">
  //                       {currency === "INR" ? "₹" : currency}
  //                       {tax.toLocaleString()}
  //                     </span>
  //                   </div>
  //                 )}

  //                 {/* Convenience Fee (crossed out) */}
  //                 {convenienceFee && convenienceFee > 0 && (
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-sm text-gray-700">
  //                       Convenience Fee
  //                     </span>
  //                     <div className="flex items-center space-x-2">
  //                       <span className="text-sm font-medium text-red-500 line-through">
  //                         {currency === "INR" ? "₹" : currency}
  //                         {convenienceFee.toLocaleString()}
  //                       </span>
  //                       <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
  //                         FREE
  //                       </span>
  //                     </div>
  //                   </div>
  //                 )}

  //                 {/* Total Amount */}
  //                 <div className="mt-3 border-t border-gray-300 pt-3">
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-lg font-semibold text-black">
  //                       Total Amount
  //                     </span>
  //                     <span className="text-xl font-bold text-black">
  //                       {currency === "INR" ? "₹" : currency}
  //                       {totalAmount?.toLocaleString() || "0"}
  //                     </span>
  //                   </div>
  //                 </div>

  //                 {/* Free convenience fee promotional message */}
  //                 {convenienceFee && convenienceFee > 0 && (
  //                   <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
  //                     <p className="text-center text-xs text-green-800">
  //                       🎉 Great news! We&apos;re waiving the convenience fee
  //                       for you. Save {currency === "INR" ? "₹" : currency}
  //                       {convenienceFee.toLocaleString()}!
  //                     </p>
  //                   </div>
  //                 )}
  //               </div>
  //             </div>
  //           )}

  //           {/* Button container with mobile-friendly positioning */}
  //           <div className="sticky bottom-0 -mx-4 mt-6 flex space-x-3 border-t border-gray-200 bg-white p-4 sm:static sm:mx-0 sm:mt-4 sm:border-t-0 sm:bg-transparent sm:p-0">
  //             <Button
  //               onClick={handlePaymentClick}
  //               className="relative flex-1 overflow-hidden bg-black text-white hover:bg-gray-800"
  //               disabled={hasUserClicked}
  //             >
  //               {/* Countdown animation background */}
  //               {isCountdownActive && !hasUserClicked && (
  //                 <div
  //                   className="absolute inset-0 bg-gray-700 transition-all duration-1000 ease-linear"
  //                   style={{
  //                     width: `${((10 - countdown) / 10) * 100}%`,
  //                   }}
  //                 />
  //               )}
  //               <span className="relative z-10 flex items-center justify-center">
  //                 <CreditCard className="mr-2 h-4 w-4" />
  //                 {isCountdownActive && !hasUserClicked
  //                   ? `Make Payment`
  //                   : "Make Payment"}
  //               </span>
  //             </Button>
  //             <Button
  //               onClick={onClose}
  //               variant="outline"
  //               className="flex-1 border-black text-black hover:bg-gray-100"
  //             >
  //               Cancel
  //             </Button>
  //           </div>
  //         </div>
  //       );
  //   }
  // };

  // Minimal UI: show only a small loader during payment initiation/processing
  const showLoader =
    paymentState.status === "loading" || paymentState.status === "processing";
  return (
    <>
      {showLoader && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
          Processing payment...
        </div>
      )}
    </>
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
  // Always render inline content (no bottom sheet)
  return (
    <NonAgentFlowWidgetContent
      {...props}
      onClose={() => {
        closeWidget();
      }}
      setIsOpen={() => {}}
      apiData={props.apiData}
    />
  );
};

export default NonAgentFlowWidget;
