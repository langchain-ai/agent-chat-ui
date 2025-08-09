"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type TabName = "Chat" | "Map" | "Itinerary";

interface TabContextType {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  switchToItinerary: () => void;
  switchToChat: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabName>("Chat");

  const switchToItinerary = () => {
    console.log("TabContext: Switching to Itinerary");
    setActiveTab("Itinerary");
  };
  const switchToChat = () => {
    console.log("TabContext: Switching to Chat");
    setActiveTab("Chat");
  };

  const value: TabContextType = {
    activeTab,
    setActiveTab,
    switchToItinerary,
    switchToChat,
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabContext() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
}
