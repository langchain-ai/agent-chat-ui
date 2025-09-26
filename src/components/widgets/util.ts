// src/utils/submitInterruptResponse.ts

import { toast } from "sonner";
import { getCachedLocation } from "@/lib/location-cache";
import { getJwtToken, GetUserId } from "@/services/authService";
import { getSelectedCurrency } from "@/utils/currency-storage";
import { getSelectedCountry } from "@/utils/country-storage";
import { getCurrentLanguage } from "@/utils/i18n";
import { detectAndSetUserCurrency } from "@/services/currencyDetectionService";

export async function submitInterruptResponse(
  thread: any, // Replace with proper type from your stream context
  type: string,
  data: Record<string, any>,
  options?: { interruptId?: string; frozenValue?: any },
): Promise<void> {
  try {
    // Get user ID from JWT token
    const jwtToken = getJwtToken();
    const userId = jwtToken ? GetUserId(jwtToken) : null;

    // Get location data from cache
    const locationData = await getCachedLocation();

    // Perform automatic currency detection based on IP
    // This will update localStorage if a better currency is detected
    try {
      await detectAndSetUserCurrency();
    } catch (error) {
      console.warn(
        "Currency detection failed, using stored/default values:",
        error,
      );
    }

    // Get user currency and country preferences (potentially updated by detection)
    const userCurrency = getSelectedCurrency();
    const userCountry = getSelectedCountry();

    // Build submission data with userId, location, currency, and country
    const submissionData: any = {};
    if (userId) {
      submissionData.userId = userId;
    }
    if (locationData) {
      submissionData.userLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
      };
    }
    if (userCurrency) {
      submissionData.userCurrency = userCurrency;
    }
    // Always include userCountry, even if it's an empty string
    submissionData.userCountry = userCountry;

    const userLanguage = getCurrentLanguage();
    if (userLanguage) {
      submissionData.userLanguage = userLanguage;
    }

    await thread.submit(submissionData, {
      streamSubgraphs: true,
      command: {
        resume: [
          {
            type,
            data,
          },
        ],
      },
    });

    // On success, if an interrupt id was provided, complete it to freeze UI values
    if (typeof thread.completeInterrupt === "function") {
      try {
        // Prefer explicit id
        let activeId = options?.interruptId;
        if (!activeId) {
          // Find the latest non-completed interrupt block in the current timeline
          const blocks = (thread.values?.blocks ?? []) as Array<{
            kind: string;
            data?: any;
          }>;
          const interrupts = Array.isArray(blocks)
            ? blocks.filter((b) => b.kind === "interrupt")
            : [];
          if (interrupts.length) {
            const last =
              [...interrupts].reverse().find((b) => !b.data?.completed) ??
              interrupts[interrupts.length - 1];
            activeId =
              last?.data?.interrupt_id ||
              last?.data?.value?.interrupt_id ||
              last?.data?.id;
          }
        }
        if (activeId) {
          thread.completeInterrupt(activeId, options?.frozenValue);
        }
      } catch (e) {
        console.warn("Failed to mark interrupt complete:", e);
      }
    }
  } catch (error) {
    console.error("Error submitting response:", error);
    toast.error("Error", {
      description: "Failed to submit response.",
      richColors: true,
      closeButton: true,
      duration: 5000,
    });
    throw error; // rethrow if the calling function needs to handle it
  }
}
