"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
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
  updateToolCallDetail: (toolCallId: string, toolResult?: ToolMessage) => void;
}

const ToolCallContext = createContext<ToolCallContextType | undefined>(undefined);

function getToolCallStatus(
  toolResult?: ToolMessage,
): ToolCallStatus {
  if (!toolResult) {
    return "running";
  }

  // Check if the result indicates an error
  const content =
    typeof toolResult.content === "string"
      ? toolResult.content
      : JSON.stringify(toolResult.content);

  if (
    content.toLowerCase().includes("error") ||
    content.toLowerCase().includes("failed")
  ) {
    return "failed";
  }

  return "success";
}

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

  const updateToolCallDetail = useCallback((toolCallId: string, toolResult?: ToolMessage) => {
    if (toolCallDetail && toolCallDetail.toolCall.id === toolCallId) {
      const newStatus = getToolCallStatus(toolResult);
      setToolCallDetail({
        ...toolCallDetail,
        toolResult,
        status: newStatus,
      });
    }
  }, [toolCallDetail]);

  return (
    <ToolCallContext.Provider
      value={{
        toolCallDetail,
        setToolCallDetail,
        isOpen,
        setIsOpen,
        openToolCallDetail,
        closeToolCallDetail,
        updateToolCallDetail,
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