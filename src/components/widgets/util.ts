// src/utils/submitInterruptResponse.ts

import { toast } from "sonner";
import { getCachedLocation } from "@/lib/location-cache";

// Mock auth functions for development - replace with actual imports when authService is available
const getJwtToken = (): string | null => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("flyo:jwt:token");
  } catch {
    return null;
  }
};

const GetUserId = (jwtToken: string): string | number => {
  try {
    // Simple mock implementation
    return "mock-user-id";
  } catch (err) {
    console.error("Error getting user ID from JWT:", err);
    return "";
  }
};

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

    // Build submission data with userId and location
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
