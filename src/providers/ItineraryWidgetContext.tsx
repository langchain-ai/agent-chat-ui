"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ItineraryWidget {
  id: string;
  component: React.ReactNode;
  timestamp: number;
}

interface ItineraryWidgetContextType {
  widgets: ItineraryWidget[];
  addWidget: (id: string, component: React.ReactNode) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;
}

const ItineraryWidgetContext = createContext<ItineraryWidgetContextType | undefined>(undefined);

export function ItineraryWidgetProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<ItineraryWidget[]>([]);

  const addWidget = (id: string, component: React.ReactNode) => {
    setWidgets(prev => {
      // Remove existing widget with same id if it exists
      const filtered = prev.filter(widget => widget.id !== id);
      // Add new widget
      return [...filtered, { id, component, timestamp: Date.now() }];
    });
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const clearWidgets = () => {
    setWidgets([]);
  };

  const value: ItineraryWidgetContextType = {
    widgets,
    addWidget,
    removeWidget,
    clearWidgets,
  };

  return (
    <ItineraryWidgetContext.Provider value={value}>
      {children}
    </ItineraryWidgetContext.Provider>
  );
}

export function useItineraryWidget() {
  const context = useContext(ItineraryWidgetContext);
  if (context === undefined) {
    throw new Error("useItineraryWidget must be used within an ItineraryWidgetProvider");
  }
  return context;
}
