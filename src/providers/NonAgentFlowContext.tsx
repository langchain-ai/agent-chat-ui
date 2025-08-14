"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "@/components/widgets/util";

interface NonAgentFlowData {
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
}

interface NonAgentFlowContextType {
  isWidgetOpen: boolean;
  widgetData: NonAgentFlowData | null;
  openWidget: (data: NonAgentFlowData) => void;
  closeWidget: () => void;
  shouldShowReopenButton: boolean;
  setShouldShowReopenButton: (show: boolean) => void;
  submitVerificationResult: (data: {
    paymentStatus: string;
    bookingStatus: string;
  }) => Promise<void>;
}

const NonAgentFlowContext = createContext<NonAgentFlowContextType | undefined>(
  undefined,
);

export function NonAgentFlowProvider({ children }: { children: ReactNode }) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [widgetData, setWidgetData] = useState<NonAgentFlowData | null>(null);
  const [shouldShowReopenButton, setShouldShowReopenButton] = useState(false);
  const thread = useStreamContext();

  const openWidget = (data: NonAgentFlowData) => {
    setWidgetData(data);
    setIsWidgetOpen(true);
    setShouldShowReopenButton(false);
  };

  const closeWidget = () => {
    setIsWidgetOpen(false);
    // Only show reopen button if we have widget data
    if (widgetData) {
      setShouldShowReopenButton(true);
    }
  };

  const submitVerificationResult = async (data: {
    paymentStatus: string;
    bookingStatus: string;
  }) => {
    console.log("---> Submitting Verification Result", JSON.stringify(data));
    await submitInterruptResponse(thread, "response", data);
  };

  const value: NonAgentFlowContextType = {
    isWidgetOpen,
    widgetData,
    openWidget,
    closeWidget,
    shouldShowReopenButton,
    setShouldShowReopenButton,
    submitVerificationResult,
  };

  return (
    <NonAgentFlowContext.Provider value={value}>
      {children}
    </NonAgentFlowContext.Provider>
  );
}

export function useNonAgentFlow() {
  const context = useContext(NonAgentFlowContext);
  if (context === undefined) {
    throw new Error(
      "useNonAgentFlow must be used within a NonAgentFlowProvider",
    );
  }
  return context;
}
