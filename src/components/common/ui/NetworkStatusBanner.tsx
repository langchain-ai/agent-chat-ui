"use client";
import { cn } from "@/lib/utils";
import { WifiOff, Gauge } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function NetworkStatusBanner(props: { className?: string }) {
  const { online, isSlow } = useNetworkStatus();
  if (online && !isSlow) return null;
  const offline = !online;
  return (
    <div
      className={cn(
        offline
          ? "mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
          : "mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800",
        props.className,
      )}
      role="status"
      aria-live="polite"
    >
      {offline ? (
        <WifiOff className="h-4 w-4 shrink-0" />
      ) : (
        <Gauge className="h-4 w-4 shrink-0" />
      )}
      <span>
        {offline
          ? "You’re offline. We’ll reconnect automatically."
          : "Network is slow. Responses may be delayed."}
      </span>
    </div>
  );
}
