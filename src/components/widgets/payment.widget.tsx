import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CreditCard, CheckCircle, XCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { FlyoLogoSVG } from "@/components/icons/langgraph";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PaymentWidgetProps {
  transaction_id: string;
  reference_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  razorpayKey: string;
  name: string;
  description: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Bottom sheet wrapper for payment widget
const PaymentBottomSheet: React.FC<PaymentWidgetProps> = (props) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
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
                Complete Payment
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
          <PaymentWidgetContent
            {...props}
            onClose={handleClose}
            setIsOpen={setIsOpen}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Main payment widget content
const PaymentWidgetContent: React.FC<
  PaymentWidgetProps & {
    onClose: () => void;
    setIsOpen: (isOpen: boolean) => void;
  }
> = ({
  transaction_id,
  reference_id,
  razorpay_order_id,
  amount,
  currency,
  razorpayKey,
  name,
  description,
  onClose,
  setIsOpen,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed"
  >("pending");

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      toast.error("Failed to load payment gateway");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setIsLoading(true);

    try {
      const options = {
        key: razorpayKey,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        name: name,
        description: description,
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          console.log("Payment successful:", response);
          setIsOpen(true); // Reopen bottom sheet

          try {
            // Send payment verification to backend
            const verificationResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transaction_id,
                reference_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                razorpay_order_id,
              }),
            });

            if (verificationResponse.ok) {
              setPaymentStatus("success");
              toast.success("Payment completed and verified successfully!");
            } else {
              console.error("Payment verification failed");
              setPaymentStatus("failed");
              toast.error(
                "Payment completed but verification failed. Please contact support.",
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setPaymentStatus("failed");
            toast.error(
              "Payment completed but verification failed. Please contact support.",
            );
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "+919999999999",
        },
        notes: {
          transaction_id,
          reference_id,
        },
        theme: {
          color: "#286BF9", // Flyo blue color
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            setIsOpen(true); // Reopen bottom sheet
            toast.info("Payment cancelled");
          },
        },
      };

      setIsOpen(false); // Close bottom sheet before opening Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setPaymentStatus("failed");
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (paymentStatus === "success") {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-green-600">
            Payment Successful!
          </h2>
          <p className="mb-6 text-gray-600">
            Your payment has been processed successfully.
          </p>
        </div>

        <div className="mb-6 w-full max-w-sm rounded-xl bg-white/80 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-center">
            <FlyoLogoSVG
              width={60}
              height={24}
            />
          </div>
          <p className="mb-2 text-sm text-gray-600">
            Transaction ID:{" "}
            <span className="font-mono text-xs">{transaction_id}</span>
          </p>
          <p className="text-sm text-gray-600">
            Amount:{" "}
            <span className="font-semibold">
              {formatAmount(amount, currency)}
            </span>
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Button
            variant="outline"
            onClick={() => setPaymentStatus("pending")}
            className="w-full"
          >
            Make Another Payment
          </Button>
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-red-600">
            Payment Failed
          </h2>
          <p className="mb-6 text-gray-600">
            There was an issue processing your payment.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={() => setPaymentStatus("pending")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with Flyo branding */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <FlyoLogoSVG
            width={80}
            height={32}
          />
        </div>
        <h1 className="mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent">
          Secure Payment
        </h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Payment Details Card */}
      <Card className="mb-6 border-0 bg-white/80 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex h-4 items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-gray-600">Amount:</span>
              <span className="text-lg font-semibold">
                {formatAmount(amount, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Reference ID:</span>
              <span className="font-mono text-xs text-gray-500">
                {reference_id}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <div className="mt-auto space-y-3">
        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="h-12 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-lg font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay {formatAmount(amount, currency)}
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full text-gray-600 hover:text-gray-800"
        >
          Cancel Payment
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Powered by <span className="font-semibold">Razorpay</span> • Secured
          by <span className="font-semibold">Flyo</span>
        </p>
      </div>
    </div>
  );
};

// Export the bottom sheet version as the main component
const PaymentWidget: React.FC<PaymentWidgetProps> = (props) => {
  return <PaymentBottomSheet {...props} />;
};

export default PaymentWidget;
