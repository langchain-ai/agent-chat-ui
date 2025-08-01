import React, { createContext, useContext, ReactNode } from "react";
import {
  useInterruptPersistence,
  InterruptPersistenceContextType,
} from "@/hooks/use-interrupt-persistence";

const InterruptPersistenceContext = createContext<
  InterruptPersistenceContextType | undefined
>(undefined);

export function InterruptPersistenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const interruptPersistence = useInterruptPersistence();

  return (
    <InterruptPersistenceContext.Provider value={interruptPersistence}>
      {children}
    </InterruptPersistenceContext.Provider>
  );
}

export function useInterruptPersistenceContext(): InterruptPersistenceContextType {
  const context = useContext(InterruptPersistenceContext);
  if (context === undefined) {
    throw new Error(
      "useInterruptPersistenceContext must be used within an InterruptPersistenceProvider",
    );
  }
  return context;
}
