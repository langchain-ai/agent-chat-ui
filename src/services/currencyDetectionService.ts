/**
 * Currency Detection Service
 * Automatically detects user's currency based on IP geolocation
 * Integrates IP detection, country-to-currency mapping, and localStorage persistence
 */

import {
  getUserGeolocation,
  type GeolocationResult,
} from "./ipGeolocationService";
import {
  getCurrencyForCountry,
  isCurrencySupported,
} from "../utils/country-currency-mapping";
import {
  setSelectedCurrency,
  getSelectedCurrency,
  getCurrencyDetails,
} from "../utils/currency-storage";
import {
  setSelectedCountry,
  getSelectedCountry,
  updateCountryPreference,
} from "../utils/country-storage";

export interface CurrencyDetectionResult {
  success: boolean;
  currency: string; // The final currency code to use
  country: string; // The detected/used country code
  source: "ip_detection" | "localStorage" | "fallback";
  data?: {
    detectedCountry?: string;
    detectedCurrency?: string;
    ipAddress?: string;
    wasUpdated: boolean; // Whether localStorage was updated
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Detect and set user currency based on IP geolocation
 * This is the main function that orchestrates the entire detection process
 */
export async function detectAndSetUserCurrency(): Promise<CurrencyDetectionResult> {
  try {
    console.log("🌍 Starting automatic currency detection...");

    // First, check if we already have a stored currency preference
    const storedCurrency = getSelectedCurrency();
    const storedCountry = getSelectedCountry();

    // If we have both stored currency and country (and currency is not default INR), use them
    if (
      storedCurrency !== "INR" &&
      storedCountry !== "" &&
      storedCountry !== "IN"
    ) {
      console.log(
        `💰 Using stored currency: ${storedCurrency} for country: ${storedCountry}`,
      );
      return {
        success: true,
        currency: storedCurrency,
        country: storedCountry,
        source: "localStorage",
        data: {
          wasUpdated: false,
        },
      };
    }

    // Attempt IP-based geolocation
    console.log("🔍 Attempting IP-based geolocation...");
    const geolocationResult: GeolocationResult = await getUserGeolocation();

    if (!geolocationResult.success || !geolocationResult.data) {
      console.warn(
        "❌ IP geolocation failed:",
        geolocationResult.error?.message,
      );

      // Fallback: use INR for currency and empty string for country when detection fails
      return {
        success: true,
        currency: "INR", // Always use INR as currency fallback
        country: "", // Always use empty string as country fallback when detection fails
        source: "fallback",
        data: {
          wasUpdated: false,
        },
        error: {
          code: "GEOLOCATION_FAILED",
          message:
            geolocationResult.error?.message || "Failed to detect location",
        },
      };
    }

    const { country: detectedCountry, ip } = geolocationResult.data;
    console.log(
      `🎯 Detected country: ${detectedCountry || "(empty)"} from IP: ${ip}`,
    );

    // If no country was detected, use fallback values
    if (!detectedCountry || detectedCountry === "") {
      console.log("🔄 No country detected, using fallback values");
      return {
        success: true,
        currency: "INR", // Use INR as currency fallback
        country: "", // Use empty string as country fallback
        source: "fallback",
        data: {
          detectedCountry: "",
          detectedCurrency: "INR",
          ipAddress: ip,
          wasUpdated: false,
        },
        error: {
          code: "NO_COUNTRY_DETECTED",
          message: "No country was detected from IP address",
        },
      };
    }

    // Map country to currency
    const detectedCurrency = getCurrencyForCountry(detectedCountry);
    console.log(
      `💱 Mapped currency: ${detectedCurrency} for country: ${detectedCountry}`,
    );

    // Validate that the currency is supported in our system
    if (!isCurrencySupported(detectedCurrency)) {
      console.warn(
        `⚠️ Currency ${detectedCurrency} not supported, falling back to INR`,
      );

      return {
        success: true,
        currency: "INR",
        country: "", // Use empty string for country when currency not supported
        source: "fallback",
        data: {
          detectedCountry,
          detectedCurrency,
          ipAddress: ip,
          wasUpdated: false,
        },
        error: {
          code: "CURRENCY_NOT_SUPPORTED",
          message: `Detected currency ${detectedCurrency} is not supported`,
        },
      };
    }

    // Update localStorage with detected values
    let wasUpdated = false;

    try {
      // Update country preference
      if (updateCountryPreference(detectedCountry, "ip_detection")) {
        console.log(`✅ Updated stored country to: ${detectedCountry}`);
        wasUpdated = true;
      }

      // Update currency preference
      setSelectedCurrency(detectedCurrency);
      console.log(`✅ Updated stored currency to: ${detectedCurrency}`);
      wasUpdated = true;
    } catch (error) {
      console.error("❌ Failed to update localStorage:", error);
      // Continue anyway, we can still return the detected values
    }

    // Verify the currency details exist
    const currencyDetails = getCurrencyDetails(detectedCurrency);
    if (!currencyDetails) {
      console.warn(
        `⚠️ Currency details not found for ${detectedCurrency}, falling back to INR`,
      );

      return {
        success: true,
        currency: "INR",
        country: "", // Use empty string for country when currency details not found
        source: "fallback",
        data: {
          detectedCountry,
          detectedCurrency,
          ipAddress: ip,
          wasUpdated: false,
        },
        error: {
          code: "CURRENCY_DETAILS_NOT_FOUND",
          message: `Currency details not found for ${detectedCurrency}`,
        },
      };
    }

    console.log(
      `🎉 Successfully detected and set currency: ${detectedCurrency} (${currencyDetails.symbol}) for ${detectedCountry}`,
    );

    return {
      success: true,
      currency: detectedCurrency,
      country: detectedCountry,
      source: "ip_detection",
      data: {
        detectedCountry,
        detectedCurrency,
        ipAddress: ip,
        wasUpdated,
      },
    };
  } catch (error) {
    console.error("💥 Unexpected error in currency detection:", error);

    // Fallback to INR currency and empty string country on unexpected errors
    return {
      success: false,
      currency: "INR", // Always use INR as currency fallback
      country: "", // Always use empty string as country fallback on errors
      source: "fallback",
      data: {
        wasUpdated: false,
      },
      error: {
        code: "UNEXPECTED_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    };
  }
}

/**
 * Get current currency and country information
 * Useful for checking current state without triggering detection
 */
export function getCurrentCurrencyInfo(): {
  currency: string;
  country: string;
  currencyDetails?: {
    code: string;
    name: string;
    symbol: string;
  };
  countryName?: string;
} {
  const currency = getSelectedCurrency();
  const country = getSelectedCountry();
  const currencyDetails = getCurrencyDetails(currency);

  // Get country name
  let countryName: string | undefined;
  try {
    if (typeof window !== "undefined") {
      const isoCountries = require("i18n-iso-countries");
      if (!isoCountries.getNames("en")) {
        isoCountries.registerLocale(
          require("i18n-iso-countries/langs/en.json"),
        );
      }
      countryName = isoCountries.getName(country, "en");
    }
  } catch (error) {
    console.error("Error getting country name:", error);
  }

  return {
    currency,
    country,
    currencyDetails,
    countryName,
  };
}

/**
 * Force refresh currency detection
 * Clears caches and re-runs detection
 */
export async function refreshCurrencyDetection(): Promise<CurrencyDetectionResult> {
  try {
    // Clear geolocation cache to force fresh detection
    const { clearGeolocationCache } = await import("./ipGeolocationService");
    clearGeolocationCache();

    console.log("🔄 Forcing fresh currency detection...");
    return await detectAndSetUserCurrency();
  } catch (error) {
    console.error("Error in refreshCurrencyDetection:", error);

    return {
      success: false,
      currency: getSelectedCurrency(),
      country: getSelectedCountry(),
      source: "fallback",
      data: {
        wasUpdated: false,
      },
      error: {
        code: "REFRESH_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Failed to refresh detection",
      },
    };
  }
}

/**
 * Initialize currency detection on app startup
 * Should be called once when the app loads
 */
export async function initializeCurrencyDetection(): Promise<void> {
  try {
    console.log("🚀 Initializing currency detection...");
    const result = await detectAndSetUserCurrency();

    if (result.success) {
      console.log(
        `✅ Currency detection initialized: ${result.currency} (${result.source})`,
      );
    } else {
      console.warn(
        `⚠️ Currency detection initialization failed, using fallback: ${result.currency}`,
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize currency detection:", error);
  }
}
