"use client";

import React, { createContext, useContext, useState } from "react";
import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";

type ToolCallStatus = "running" | "success" | "failed";
type ToolCall = NonNullable<AIMessage["tool_calls"]>[number];

export interface ToolCallDetail {
  toolCall: ToolCall;
  toolResult?: ToolMessage;
  status: ToolCallStatus;
}

interface ToolCallContextType {
  toolCallDetail: ToolCallDetail | null;
  setToolCallDetail: (detail: ToolCallDetail | null) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openToolCallDetail: (detail: ToolCallDetail) => void;
  closeToolCallDetail: () => void;
}

const ToolCallContext = createContext<ToolCallContextType | undefined>(undefined);

export function ToolCallProvider({ children }: { children: React.ReactNode }) {
  const [toolCallDetail, setToolCallDetail] = useState<ToolCallDetail | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openToolCallDetail = (detail: ToolCallDetail) => {
    setToolCallDetail(detail);
    setIsOpen(true);
  };

  const closeToolCallDetail = () => {
    setIsOpen(false);
    setToolCallDetail(null);
  };

  return (
    <ToolCallContext.Provider
      value={{
        toolCallDetail,
        setToolCallDetail,
        isOpen,
        setIsOpen,
        openToolCallDetail,
        closeToolCallDetail,
      }}
    >
      {children}
    </ToolCallContext.Provider>
  );
}

export function useToolCallContext() {
  const context = useContext(ToolCallContext);
  if (context === undefined) {
    throw new Error("useToolCallContext must be used within a ToolCallProvider");
  }
  return context;
}