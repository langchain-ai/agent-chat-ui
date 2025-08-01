import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Location-related types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export interface LocationResult {
  success: boolean;
  data?: LocationData;
  error?: LocationError;
}

/**
 * Reusable function to get user's current location
 * Handles permission requests and location fetching
 * @param options - Geolocation options (optional)
 * @returns Promise<LocationResult> - Location data or error
 */
export async function getUserLocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
  },
): Promise<LocationResult> {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    return {
      success: false,
      error: {
        code: -1,
        message: "Geolocation is not supported by this browser",
      },
    };
  }

  try {
    // Check current permission status
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });

    console.log(`Geolocation permission status: ${permission.state}`);

    // If permission is denied, return error
    if (permission.state === "denied") {
      return {
        success: false,
        error: {
          code: 1,
          message:
            "Location access denied. Please enable location permissions in your browser settings.",
        },
      };
    }

    // Get current position
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      },
    );

    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    console.log("User location obtained:", locationData);

    return {
      success: true,
      data: locationData,
    };
  } catch (error: any) {
    let errorMessage = "Failed to get location";
    let errorCode = 0;

    if (error.code) {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = "Location access denied by user";
          errorCode = 1;
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = "Location information unavailable";
          errorCode = 2;
          break;
        case 3: // TIMEOUT
          errorMessage = "Location request timed out";
          errorCode = 3;
          break;
        default:
          errorMessage = error.message || "Unknown location error";
          errorCode = error.code;
      }
    }

    console.error("Location error:", {
      code: errorCode,
      message: errorMessage,
    });

    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
  }
}
