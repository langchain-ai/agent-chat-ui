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

interface NonAgentFlowWidgetProps {
  tripId: string;
  flightItinerary?: {
    userContext: {
      userDetails: any;
      userId: string;
    };
    selectionContext: {
      selectedFlightOffers: any[];
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
> = ({ tripId, onClose, setIsOpen, onPaymentSuccess, onPaymentFailure }) => {
  const { closeWidget } = useNonAgentFlow();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: "idle",
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initiatePayment = useCallback(async () => {
    try {
      setPaymentState({ status: "loading" });

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
            setPaymentState({
              status: "success",
              prepaymentData: prepaymentResponse.data,
              verificationResponse,
            });

            onPaymentSuccess?.(verificationResponse);

            // Show success message
            if (isPaymentAndBookingSuccessful(verificationResponse)) {
              toast.success("Payment and booking completed successfully!");
              // Don't show reopen button on successful payment
              closeWidget();
            } else {
              toast.warning(
                "Payment completed but booking status needs attention",
              );
            }
          } catch (error) {
            console.error("Transaction verification failed:", error);
            setPaymentState({
              status: "failed",
              prepaymentData: prepaymentResponse.data,
              error:
                error instanceof Error ? error.message : "Verification failed",
            });
            onPaymentFailure?.(
              error instanceof Error ? error.message : "Verification failed",
            );
            toast.error("Payment verification failed");
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
            setPaymentState({
              status: "failed",
              error: "Payment cancelled by user",
            });
            onPaymentFailure?.("Payment cancelled by user");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setPaymentState({
        status: "failed",
        error:
          error instanceof Error ? error.message : "Payment initiation failed",
      });
      onPaymentFailure?.(
        error instanceof Error ? error.message : "Payment initiation failed",
      );
      toast.error("Failed to initiate payment");
    }
  }, [tripId, onPaymentSuccess, onPaymentFailure, closeWidget]);

  // Auto-start payment flow when component mounts
  useEffect(() => {
    if (paymentState.status === "idle") {
      initiatePayment();
    }
  }, [initiatePayment, paymentState.status]);

  const retryPayment = useCallback(() => {
    setPaymentState({ status: "idle" });
    initiatePayment();
  }, [initiatePayment]);

  const renderContent = () => {
    switch (paymentState.status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
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
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Processing Payment
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Please complete the payment in the popup window
            </p>
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
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800">
                    Booking Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Payment Status:
                    </span>
                    <span className="text-sm text-green-600">
                      {getPaymentStatusDescription(
                        paymentState.verificationResponse.data.paymentStatus,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Booking Status:
                    </span>
                    <span className="text-sm text-green-600">
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

            <div className="flex space-x-3">
              <Button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
            </div>
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
                className="flex-1"
                variant="outline"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
              <Button
                onClick={onClose}
                className="flex-1"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Initializing...
              </h3>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Flight Information Card */}
      {paymentState.prepaymentData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg text-blue-800">
              <Plane className="mr-2 h-5 w-5" />
              Flight Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Trip ID:
                </span>
                <span className="text-sm text-gray-900">{tripId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Amount:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {paymentState.prepaymentData.transaction.amount
                    ? formatAmount(
                        paymentState.prepaymentData.transaction.amount,
                        "INR",
                      )
                    : "₹0.00"}
                </span>
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
      />
    );
  }
  return <NonAgentFlowBottomSheet {...props} />;
};

export default NonAgentFlowWidget;
