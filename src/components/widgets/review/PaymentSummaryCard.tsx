import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getCurrencySymbol } from "@/utils/currency-storage";
import type { PaymentSummary } from "./types";

interface PaymentSummaryCardProps {
  paymentSummary: PaymentSummary | null;
  isRefundable?: boolean | null;
  calculateTotal: () => number;
  isDesktop?: boolean;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  paymentSummary,
  isRefundable,
  calculateTotal,
  isDesktop = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isDesktop);

  if (!paymentSummary) {
    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="text-lg font-semibold">Payment Summary</h2>
        <div className="mt-1 text-sm text-gray-500">
          No payment details available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Payment Summary</h2>
            {!isExpanded && (
              <div className="mt-1 text-sm text-gray-600">
                Total:{" "}
                {getCurrencySymbol(paymentSummary.currency)}
                {calculateTotal().toFixed(2)}{" "}
                {paymentSummary.currency}
                {isRefundable !== null && (
                  <span
                    className={`ml-2 ${isRefundable ? "text-green-600" : "text-red-600"}`}
                  >
                    •{" "}
                    {isRefundable ? "Refundable" : "Non-refundable"}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {/* Base Fare */}
          <div className="flex justify-between">
            <span className="text-xs text-gray-600">Base fare</span>
            <span className="text-xs font-medium">
              {getCurrencySymbol(paymentSummary.currency)}
              {paymentSummary.baseFare.toFixed(2)}
            </span>
          </div>

          {/* Taxes */}
          <div className="flex justify-between">
            <span className="text-xs text-gray-600">
              Taxes & fees
            </span>
            <span className="text-xs font-medium">
              {getCurrencySymbol(paymentSummary.currency)}
              {paymentSummary.taxes.toFixed(2)}
            </span>
          </div>

          {/* Service Fees */}
          {paymentSummary.fees > 0 && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">
                Service fees
              </span>
              <span className="text-xs font-medium">
                {getCurrencySymbol(paymentSummary.currency)}
                {paymentSummary.fees.toFixed(2)}
              </span>
            </div>
          )}

          {/* Discount */}
          {paymentSummary.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">
                Discount
              </span>
              <span className="text-xs font-medium text-green-600">
                -{getCurrencySymbol(paymentSummary.currency)}
                {paymentSummary.discount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="mt-2 border-t pt-2">
            <div className="flex justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold">
                {getCurrencySymbol(paymentSummary.currency)}
                {calculateTotal().toFixed(2)}{" "}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
