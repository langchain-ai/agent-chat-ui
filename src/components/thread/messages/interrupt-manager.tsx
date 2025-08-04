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

      // Only persist interrupts with type "widgets"
      const interruptData = stream.interrupt.value || stream.interrupt;
      const interruptType = interruptData?.type || interruptData?.value?.type;

      if (interruptType === "widgets") {
        const interruptId = interruptPersistence.addInterrupt(
          interruptData,
          currentMessageId,
        );

        activeInterruptIdRef.current = interruptId;
        lastInterruptRef.current = stream.interrupt;

        console.log("📌 Persisted widget interrupt:", interruptId);
      } else {
        console.log(
          "🔍 Skipping interrupt persistence for type:",
          interruptType,
        );
        // Still track the interrupt but don't persist it
        lastInterruptRef.current = stream.interrupt;
      }
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
