import { useState, useCallback, useRef } from "react";

export interface PersistedInterrupt {
  id: string;
  interrupt: Record<string, any>;
  timestamp: number;
  messageId?: string;
  associatedResponseId?: string;
  isCompleted: boolean;
}

export interface InterruptPersistenceContextType {
  persistedInterrupts: PersistedInterrupt[];
  addInterrupt: (interrupt: Record<string, any>, messageId?: string) => string;
  markAsCompleted: (interruptId: string, responseId?: string) => void;
  getInterruptById: (id: string) => PersistedInterrupt | undefined;
  getInterruptsForMessage: (messageId: string) => PersistedInterrupt[];
  clearAllInterrupts: () => void;
}

export function useInterruptPersistence(): InterruptPersistenceContextType {
  const [persistedInterrupts, setPersistedInterrupts] = useState<
    PersistedInterrupt[]
  >([]);
  const interruptCounterRef = useRef(0);

  const addInterrupt = useCallback(
    (interrupt: Record<string, any>, messageId?: string): string => {
      const id = `interrupt-${Date.now()}-${++interruptCounterRef.current}`;
      const newInterrupt: PersistedInterrupt = {
        id,
        interrupt,
        timestamp: Date.now(),
        messageId,
        isCompleted: false,
      };

      setPersistedInterrupts((prev) => [...prev, newInterrupt]);
      return id;
    },
    [],
  );

  const markAsCompleted = useCallback(
    (interruptId: string, responseId?: string) => {
      setPersistedInterrupts((prev) =>
        prev.map((interrupt) =>
          interrupt.id === interruptId
            ? {
                ...interrupt,
                isCompleted: true,
                associatedResponseId: responseId,
              }
            : interrupt,
        ),
      );
    },
    [],
  );

  const getInterruptById = useCallback(
    (id: string): PersistedInterrupt | undefined => {
      return persistedInterrupts.find((interrupt) => interrupt.id === id);
    },
    [persistedInterrupts],
  );

  const getInterruptsForMessage = useCallback(
    (messageId: string): PersistedInterrupt[] => {
      return persistedInterrupts.filter(
        (interrupt) => interrupt.messageId === messageId,
      );
    },
    [persistedInterrupts],
  );

  const clearAllInterrupts = useCallback(() => {
    setPersistedInterrupts([]);
  }, []);

  return {
    persistedInterrupts,
    addInterrupt,
    markAsCompleted,
    getInterruptById,
    getInterruptsForMessage,
    clearAllInterrupts,
  };
}
