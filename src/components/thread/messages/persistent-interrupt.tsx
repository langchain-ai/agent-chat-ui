import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersistedInterrupt } from "@/hooks/use-interrupt-persistence";
import { DynamicRenderer } from "./generic-interrupt";
import { useStreamContext } from "@/providers/Stream";

interface PersistentInterruptWidgetProps {
  persistedInterrupt: PersistedInterrupt;
  className?: string;
}

export function PersistentInterruptWidget({
  persistedInterrupt,
  className,
}: PersistentInterruptWidgetProps) {
  const { interrupt, isCompleted, timestamp } = persistedInterrupt;
  const stream = useStreamContext();

  // Don't render if this interrupt is currently active (to avoid duplicates)
  const isCurrentlyActive =
    stream.interrupt &&
    JSON.stringify(stream.interrupt.value || stream.interrupt) ===
      JSON.stringify(interrupt);

  if (isCurrentlyActive) {
    return null;
  }

  // Extract interrupt object and type
  const interruptObj = Array.isArray(interrupt) ? interrupt[0] : interrupt;
  const interruptType = interruptObj.type || interruptObj.value?.type;

  // Create a modified interrupt object for read-only rendering
  const readOnlyInterrupt = {
    ...interruptObj,
    _readOnly: true, // Flag to indicate this is a persistent/read-only widget
    _isCompleted: isCompleted,
    _timestamp: timestamp,
  };

  // Try to render dynamic widget
  const dynamicWidget = interruptType ? (
    <DynamicRenderer
      interruptType={interruptType}
      interrupt={readOnlyInterrupt}
    />
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("relative mb-4", className)}
    >
      {/* Status indicator - icon only */}
      <div className="absolute -top-1 -right-1 z-10">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full shadow-sm",
            isCompleted
              ? "border border-green-200 bg-green-100 text-green-700"
              : "border border-yellow-200 bg-yellow-100 text-yellow-700",
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
        </div>
      </div>

      {/* Widget content with overlay for completed state */}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border",
          isCompleted
            ? "border-green-200 bg-green-50/50"
            : "border-yellow-200 bg-yellow-50/50",
        )}
      >
        {/* Subtle overlay for completed widgets */}
        {isCompleted && (
          <div className="pointer-events-none absolute inset-0 z-[1] bg-white/10" />
        )}

        {/* Widget content */}
        <div className={cn("relative", isCompleted && "opacity-90")}>
          {dynamicWidget || (
            <div className="p-4">
              <div className="text-sm text-gray-600">
                <strong>Interrupt Widget:</strong> {interruptType || "Unknown"}
              </div>
              <pre className="mt-2 max-h-32 overflow-auto text-xs text-gray-500">
                {JSON.stringify(interrupt, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="mt-1 text-xs text-gray-400">
        {new Date(timestamp).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}

interface PersistentInterruptListProps {
  interrupts: PersistedInterrupt[];
  className?: string;
}

export function PersistentInterruptList({
  interrupts,
  className,
}: PersistentInterruptListProps) {
  if (interrupts.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {interrupts.map((persistedInterrupt) => (
        <PersistentInterruptWidget
          key={persistedInterrupt.id}
          persistedInterrupt={persistedInterrupt}
        />
      ))}
    </div>
  );
}
