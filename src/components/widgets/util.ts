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
