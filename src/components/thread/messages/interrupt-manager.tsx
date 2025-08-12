import React, { useRef, useCallback, useEffect } from "react";
import { useStreamContext } from "@/providers/Stream";

interface InterruptManagerProps {
  children: React.ReactNode;
}

export function InterruptManager({ children }: InterruptManagerProps) {
  const stream = useStreamContext();
  const activeInterruptIdRef = useRef<string | null>(null);
  const lastInterruptRef = useRef<any>(null);

  // Handle new interrupts (record id while active)
  useEffect(() => {
    if (stream.interrupt && stream.interrupt !== lastInterruptRef.current) {
      const iv = stream.interrupt.value || stream.interrupt;
      const interruptId = iv?.interrupt_id || iv?.id || null;
      activeInterruptIdRef.current = interruptId;
      lastInterruptRef.current = stream.interrupt;
      if (interruptId) {
        console.log("📌 Active interrupt:", interruptId);
      }
    }
  }, [stream.interrupt]);

  // Handle interrupt cleared: mark as completed in the store timeline
  useEffect(() => {
    if (
      !stream.interrupt &&
      activeInterruptIdRef.current &&
      lastInterruptRef.current
    ) {
      const id = activeInterruptIdRef.current;
      stream.completeInterrupt?.(id);
      console.log("✅ Marked interrupt as completed:", id);
      activeInterruptIdRef.current = null;
      lastInterruptRef.current = null;
    }
  }, [stream.interrupt, stream]);

  return <>{children}</>;
}

// Hook to get interrupt submission handlers with timeline persistence
export function useInterruptSubmission() {
  const stream = useStreamContext();

  const createSubmissionHandlers = useCallback(
    (interruptId?: string) => ({
      onSubmitStart: () => {
        console.log("🔄 Interrupt submission started");
      },
      onSubmitComplete: () => {
        if (interruptId) {
          stream.completeInterrupt?.(interruptId);
          console.log("✅ Interrupt submission completed and persisted");
        }
      },
      onSubmitError: (error: any) => {
        console.error("❌ Interrupt submission failed:", error);
      },
    }),
    [stream],
  );

  return { createSubmissionHandlers };
}
