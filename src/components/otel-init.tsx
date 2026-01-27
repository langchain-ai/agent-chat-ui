"use client";

import { useEffect } from "react";
import { initializeOpenTelemetry } from "@/lib/otel-client";

/**
 * Client component to initialize OpenTelemetry on mount.
 * This must be a client component since OpenTelemetry Web SDK only works in the browser.
 */
export function OtelInit() {
  useEffect(() => {
    // Initialize OpenTelemetry when component mounts (browser only)
    console.log('[OTEL] OtelInit: Attempting to initialize OpenTelemetry...');
    initializeOpenTelemetry()
      .then((success) => {
        if (success) {
          console.log('[OTEL] OtelInit: OpenTelemetry initialized successfully');
        } else {
          console.warn('[OTEL] OtelInit: OpenTelemetry initialization returned false');
        }
      })
      .catch((error) => {
        console.error('[OTEL] OtelInit: Failed to initialize OpenTelemetry:', error);
      });
  }, []);

  return null; // This component doesn't render anything
}
