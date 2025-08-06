import React, { useRef, useCallback, useEffect } from "react";
import { useStreamContext } from "@/providers/Stream";
import { useInterruptPersistenceContext } from "@/providers/InterruptPersistenceContext";

interface InterruptManagerProps {
  children: React.ReactNode;
}

export function InterruptManager({ children }: InterruptManagerProps) {
  const stream = useStreamContext();
  const interruptPersistence = useInterruptPersistenceContext();
  const activeInterruptIdRef = useRef<string | null>(null);
  const lastInterruptRef = useRef<any>(null);

  // Handle new interrupts
  useEffect(() => {
    if (stream.interrupt && stream.interrupt !== lastInterruptRef.current) {
      // New interrupt detected
      const currentMessageId =
        stream.messages.length > 0
          ? stream.messages[stream.messages.length - 1].id
          : undefined;

      const interruptId = interruptPersistence.addInterrupt(
        stream.interrupt.value || stream.interrupt,
        currentMessageId,
      );

      activeInterruptIdRef.current = interruptId;
      lastInterruptRef.current = stream.interrupt;

      console.log("📌 Persisted new interrupt:", interruptId);
    }
  }, [stream.interrupt, interruptPersistence]);

  // Handle interrupt completion (when stream.interrupt becomes null)
  useEffect(() => {
    if (
      !stream.interrupt &&
      activeInterruptIdRef.current &&
      lastInterruptRef.current
    ) {
      // Interrupt was cleared, mark as completed
      const responseMessageId =
        stream.messages.length > 0
          ? stream.messages[stream.messages.length - 1].id
          : undefined;

      interruptPersistence.markAsCompleted(
        activeInterruptIdRef.current,
        responseMessageId,
      );

      console.log(
        "✅ Marked interrupt as completed:",
        activeInterruptIdRef.current,
      );

      activeInterruptIdRef.current = null;
      lastInterruptRef.current = null;
    }
  }, [stream.interrupt, stream.messages, interruptPersistence]);

  return <>{children}</>;
}

// Hook to get interrupt submission handlers with persistence
export function useInterruptSubmission() {
  const interruptPersistence = useInterruptPersistenceContext();

  const createSubmissionHandlers = useCallback(
    (interruptId?: string) => ({
      onSubmitStart: () => {
        console.log("🔄 Interrupt submission started");
      },
      onSubmitComplete: () => {
        if (interruptId) {
          interruptPersistence.markAsCompleted(interruptId);
          console.log("✅ Interrupt submission completed and persisted");
        }
      },
      onSubmitError: (error: any) => {
        console.error("❌ Interrupt submission failed:", error);
      },
    }),
    [interruptPersistence],
  );

  return { createSubmissionHandlers };
}
