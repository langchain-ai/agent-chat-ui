import { getUserLocation, LocationData } from "./utils";

interface CachedLocation {
  data: LocationData;
  timestamp: number;
  expiresAt: number;
}

const LOCATION_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const LOCATION_CACHE_KEY = "flyo:location:cache";

/**
 * Get cached location data if it's still valid, otherwise request fresh location
 */
export async function getCachedLocation(): Promise<LocationData | null> {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return null;
    }

    // Try to get cached location
    const cached = getCachedLocationFromStorage();

    if (cached && isLocationCacheValid(cached)) {
      console.log("Using cached location data:", cached.data);
      return cached.data;
    }

    // Cache is invalid or doesn't exist, get fresh location
    console.log("Cache expired or not found, requesting fresh location...");
    const result = await getUserLocation();

    if (result.success && result.data) {
      // Cache the fresh location
      cacheLocation(result.data);
      console.log("Fresh location obtained and cached:", result.data);
      return result.data;
    } else {
      console.log("Failed to get fresh location:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Error in getCachedLocation:", error);
    return null;
  }
}

/**
 * Get location data from localStorage cache
 */
function getCachedLocationFromStorage(): CachedLocation | null {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error("Error reading cached location:", error);
    return null;
  }
}

/**
 * Check if cached location is still valid (not expired)
 */
function isLocationCacheValid(cached: CachedLocation): boolean {
  const now = Date.now();
  return now < cached.expiresAt;
}

/**
 * Cache location data with expiration timestamp
 */
function cacheLocation(locationData: LocationData): void {
  try {
    const now = Date.now();
    const cachedLocation: CachedLocation = {
      data: locationData,
      timestamp: now,
      expiresAt: now + LOCATION_CACHE_DURATION,
    };

    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cachedLocation));
    console.log(
      "Location cached until:",
      new Date(cachedLocation.expiresAt).toISOString(),
    );
  } catch (error) {
    console.error("Error caching location:", error);
  }
}

/**
 * Clear cached location data
 */
export function clearLocationCache(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      console.log("Location cache cleared");
    }
  } catch (error) {
    console.error("Error clearing location cache:", error);
  }
}

/**
 * Get cache status information
 */
export function getLocationCacheStatus(): {
  hasCache: boolean;
  isValid: boolean;
  expiresAt?: string;
  timeUntilExpiry?: number;
} {
  try {
    if (typeof window === "undefined") {
      return { hasCache: false, isValid: false };
    }

    const cached = getCachedLocationFromStorage();
    if (!cached) {
      return { hasCache: false, isValid: false };
    }

    const now = Date.now();
    const isValid = now < cached.expiresAt;
    const timeUntilExpiry = cached.expiresAt - now;

    return {
      hasCache: true,
      isValid,
      expiresAt: new Date(cached.expiresAt).toISOString(),
      timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : 0,
    };
  } catch (error) {
    console.error("Error getting cache status:", error);
    return { hasCache: false, isValid: false };
  }
}
