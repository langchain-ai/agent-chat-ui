"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Plane } from "lucide-react";
import { useNonAgentFlow } from "@/providers/NonAgentFlowContext";
import { cn } from "@/lib/utils";

export function NonAgentFlowReopenButton() {
  const { shouldShowReopenButton, widgetData, openWidget } = useNonAgentFlow();

  if (!shouldShowReopenButton || !widgetData) {
    return null;
  }

  const handleReopen = () => {
    openWidget(widgetData);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <Button
        onClick={handleReopen}
        className={cn(
          "group relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 p-0 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl",
          "animate-in slide-in-from-bottom-2 fade-in duration-300"
        )}
        title="Reopen Payment Widget"
      >
        <div className="flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        
        {/* Hover tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden w-48 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white group-hover:block">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span>Complete your booking</span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Trip ID: {widgetData.tripId}
          </div>
          <div className="absolute top-full right-4 h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </Button>
    </div>
  );
} 