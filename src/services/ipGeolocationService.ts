/**
 * IP Geolocation Service
 * Detects user's country from their IP address using free IP geolocation APIs
 * Provides caching and fallback mechanisms for reliability
 */

export interface GeolocationData {
  country: string; // 2-letter country code (e.g., "US", "IN")
  countryName: string; // Full country name (e.g., "United States", "India")
  ip: string; // User's IP address
  timestamp: number; // When the data was fetched
}

export interface GeolocationResult {
  success: boolean;
  data?: GeolocationData;
  error?: {
    code: string;
    message: string;
  };
}

interface CachedGeolocation {
  data: GeolocationData;
  timestamp: number;
  expiresAt: number;
}

// Cache duration: 24 hours (IP-based location doesn't change frequently)
const GEOLOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000;
const GEOLOCATION_CACHE_KEY = "flyo:geolocation:cache";

/**
 * Free IP geolocation APIs with fallback support
 * Using multiple services to ensure reliability
 */
const GEOLOCATION_APIS = [
  {
    name: "ipapi.co",
    url: "https://ipapi.co/json/",
    parseResponse: (data: any): GeolocationData => ({
      country: data.country_code || "",
      countryName: data.country_name || "",
      ip: data.ip || "",
      timestamp: Date.now(),
    }),
  },
  {
    name: "ip-api.com",
    url: "http://ip-api.com/json/",
    parseResponse: (data: any): GeolocationData => ({
      country: data.countryCode || "",
      countryName: data.country || "",
      ip: data.query || "",
      timestamp: Date.now(),
    }),
  },
  {
    name: "ipinfo.io",
    url: "https://ipinfo.io/json",
    parseResponse: (data: any): GeolocationData => ({
      country: data.country || "",
      countryName: data.country || "", // ipinfo.io doesn't provide full country name
      ip: data.ip || "",
      timestamp: Date.now(),
    }),
  },
];

/**
 * Get cached geolocation data if it's still valid
 */
function getCachedGeolocation(): CachedGeolocation | null {
  try {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem(GEOLOCATION_CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedGeolocation = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() < parsedCache.expiresAt) {
      return parsedCache;
    }

    // Cache expired, remove it
    localStorage.removeItem(GEOLOCATION_CACHE_KEY);
    return null;
  } catch (error) {
    console.error("Error reading geolocation cache:", error);
    return null;
  }
}

/**
 * Cache geolocation data with expiration
 */
function cacheGeolocation(data: GeolocationData): void {
  try {
    if (typeof window === "undefined") return;

    const cachedData: CachedGeolocation = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + GEOLOCATION_CACHE_DURATION,
    };

    localStorage.setItem(GEOLOCATION_CACHE_KEY, JSON.stringify(cachedData));
    console.log(
      "Geolocation cached until:",
      new Date(cachedData.expiresAt).toISOString(),
    );
  } catch (error) {
    console.error("Error caching geolocation:", error);
  }
}

/**
 * Fetch geolocation data from a specific API
 */
async function fetchFromAPI(
  api: (typeof GEOLOCATION_APIS)[0],
): Promise<GeolocationData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch(api.url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return api.parseResponse(data);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get user's geolocation data from IP address
 * Uses caching and multiple API fallbacks for reliability
 */
export async function getUserGeolocation(): Promise<GeolocationResult> {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return {
        success: false,
        error: {
          code: "NO_BROWSER",
          message: "Geolocation detection requires browser environment",
        },
      };
    }

    // Try to get cached data first
    const cached = getCachedGeolocation();
    if (cached) {
      console.log("Using cached geolocation data:", cached.data);
      return {
        success: true,
        data: cached.data,
      };
    }

    console.log("Cache expired or not found, fetching fresh geolocation...");

    // Try each API in sequence until one succeeds
    let lastError: any = null;

    for (const api of GEOLOCATION_APIS) {
      try {
        console.log(`Trying geolocation API: ${api.name}`);
        const data = await fetchFromAPI(api);

        // Validate the response - accept valid 2-letter country codes or empty string
        if (
          (data.country && data.country.length === 2) ||
          data.country === ""
        ) {
          console.log(`Successfully got geolocation from ${api.name}:`, data);

          // Cache the successful result
          cacheGeolocation(data);

          return {
            success: true,
            data,
          };
        } else {
          throw new Error("Invalid country code in response");
        }
      } catch (error) {
        console.warn(`Geolocation API ${api.name} failed:`, error);
        lastError = error;
        continue; // Try next API
      }
    }

    // All APIs failed
    return {
      success: false,
      error: {
        code: "ALL_APIS_FAILED",
        message: `All geolocation APIs failed. Last error: ${lastError?.message || "Unknown error"}`,
      },
    };
  } catch (error) {
    console.error("Unexpected error in getUserGeolocation:", error);
    return {
      success: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    };
  }
}

/**
 * Clear cached geolocation data
 */
export function clearGeolocationCache(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(GEOLOCATION_CACHE_KEY);
      console.log("Geolocation cache cleared");
    }
  } catch (error) {
    console.error("Error clearing geolocation cache:", error);
  }
}

/**
 * Get geolocation cache status
 */
export function getGeolocationCacheStatus(): {
  hasCache: boolean;
  isValid: boolean;
  expiresAt?: string;
  timeUntilExpiry?: number;
} {
  try {
    if (typeof window === "undefined") {
      return { hasCache: false, isValid: false };
    }

    const cached = getCachedGeolocation();
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
    console.error("Error getting geolocation cache status:", error);
    return { hasCache: false, isValid: false };
  }
}
