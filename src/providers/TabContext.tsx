"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type TabName = "Chat" | "Review"; // "Map" commented out - can be restored later

interface TabContextType {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  switchToReview: () => void;
  switchToChat: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabName>("Chat");

  const switchToReview = () => {
    console.log("🔄 TabContext: switchToReview called, current tab:", activeTab);
    setActiveTab("Review");
    console.log("✅ TabContext: setActiveTab('Review') executed");
  };
  const switchToChat = () => {
    console.log("TabContext: Switching to Chat");
    setActiveTab("Chat");
  };

  const value: TabContextType = {
    activeTab,
    setActiveTab,
    switchToReview,
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
