import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  isRTLMirrorRequiredFromPathname,
  isCurrentLanguageRTLMirrorRequired,
  isWidgetRTLMirrorSupported,
} from "@/utils/i18n";

/**
 * SSR-safe hook for RTL mirror detection that prevents FOUC (Flash of Unstyled Content)
 *
 * This hook provides:
 * 1. Immediate RTL detection on first render using pathname (SSR-safe)
 * 2. Hydration-safe state management
 * 3. Loading state to prevent layout shifts
 * 4. Widget-specific RTL support checking
 */
export function useRTLMirror(widgetName?: string) {
  const pathname = usePathname();

  // Initialize with SSR-safe detection from pathname
  const [isRTLMirrorRequired, setIsRTLMirrorRequired] = useState(() => {
    // On server-side or initial client render, use pathname-based detection
    return isRTLMirrorRequiredFromPathname(pathname || "/");
  });

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mark as hydrated and perform client-side verification
    setIsHydrated(true);

    try {
      // Double-check with client-side language detection
      const clientSideRTLRequired = isCurrentLanguageRTLMirrorRequired();

      // Update state if there's a mismatch (rare edge case)
      if (clientSideRTLRequired !== isRTLMirrorRequired) {
        setIsRTLMirrorRequired(clientSideRTLRequired);
      }

      // Check widget support if widget name is provided
      if (widgetName && !isWidgetRTLMirrorSupported(widgetName)) {
        console.warn(`Widget "${widgetName}" does not support RTL mirroring`);
      }
    } catch (error) {
      console.warn("Failed to verify RTL mirror requirement:", error);
    } finally {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoading(false), 50);
    }
  }, [pathname, isRTLMirrorRequired, widgetName]);

  return {
    /**
     * Whether RTL mirroring is required for the current language
     */
    isRTLMirrorRequired,

    /**
     * Whether the component has been hydrated on the client
     */
    isHydrated,

    /**
     * Whether the RTL detection is still loading
     * Use this to show a loading state if needed
     */
    isLoading,

    /**
     * Whether the widget supports RTL mirroring (if widgetName provided)
     */
    isWidgetSupported: widgetName
      ? isWidgetRTLMirrorSupported(widgetName)
      : true,

    /**
     * CSS classes for RTL mirroring
     */
    mirrorClasses: {
      container: isRTLMirrorRequired ? "rtl-mirror" : "",
      content: isRTLMirrorRequired ? "rtl-content" : "",
    },

    /**
     * Inline styles for RTL mirroring
     */
    mirrorStyles: {
      container: isRTLMirrorRequired
        ? {
            transform: "scaleX(-1)",
            direction: "rtl" as const,
          }
        : {},
      content: isRTLMirrorRequired
        ? {
            transform: "scaleX(-1)",
          }
        : {},
    },
  };
}

/**
 * Simplified hook for basic RTL mirror detection without widget-specific features
 */
export function useSimpleRTLMirror() {
  const { isRTLMirrorRequired, isLoading } = useRTLMirror();
  return { isRTLMirrorRequired, isLoading };
}

/**
 * Hook specifically for SearchCriteria widget with optimized settings
 */
export function useSearchCriteriaRTL() {
  return useRTLMirror("searchCriteriaWidget");
}

/**
 * Hook specifically for FlightOptions widget with optimized settings
 */
export function useFlightOptionsRTL() {
  return useRTLMirror("flightOptionsWidget");
}

/**
 * Hook specifically for Review widget with optimized settings
 */
export function useReviewWidgetRTL() {
  return useRTLMirror("reviewWidget");
}

/**
 * Hook for flight-related components (flight cards, sheets, etc.)
 */
export function useFlightComponentRTL() {
  return useRTLMirror("flightOptionsWidget"); // Use flightOptionsWidget config for flight components
}

/**
 * Hook specifically for CheckInOptIn widget with optimized settings
 */
export function useCheckInOptInRTL() {
  return useRTLMirror("checkInOptInWidget");
}
