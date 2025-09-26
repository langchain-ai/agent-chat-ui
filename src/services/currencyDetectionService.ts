/**
 * Simplified Currency Detection Service
 * Detects user's currency and country based on IP geolocation
 * Stores data in localStorage without TTL mechanisms
 * Triggers on successful login and when data is missing on app load
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
 * Detect and set user currency and country based on IP geolocation
 * Used for both login success and missing data scenarios
 */
export async function detectAndSetUserCurrencyAndCountry(): Promise<CurrencyDetectionResult> {
  try {
    console.log("🌍 Starting IP-based currency and country detection...");

    // Attempt IP-based geolocation
    const geolocationResult: GeolocationResult = await getUserGeolocation();

    if (!geolocationResult.success || !geolocationResult.data) {
      console.warn(
        "❌ IP geolocation failed:",
        geolocationResult.error?.message,
      );

      // Fallback: use INR for currency and IN for country when detection fails
      return {
        success: true,
        currency: "INR",
        country: "IN",
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
        currency: "INR",
        country: "IN",
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
        country: "IN",
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

    // Verify the currency details exist
    const currencyDetails = getCurrencyDetails(detectedCurrency);
    if (!currencyDetails) {
      console.warn(
        `⚠️ Currency details not found for ${detectedCurrency}, falling back to INR`,
      );

      return {
        success: true,
        currency: "INR",
        country: "IN",
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

    // Fallback to INR currency and IN country on unexpected errors
    return {
      success: false,
      currency: "INR",
      country: "IN",
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
 * Detect currency and country on successful login
 * Always runs IP detection and stores results in localStorage
 */
export async function detectOnLogin(): Promise<CurrencyDetectionResult> {
  console.log("🔑 Detecting currency and country after successful login...");
  return await detectAndSetUserCurrencyAndCountry();
}

/**
 * Check and detect currency/country on app load
 * Only runs detection if either country or currency is missing from localStorage
 */
export async function detectOnAppLoad(): Promise<CurrencyDetectionResult | null> {
  const currentCurrency = getSelectedCurrency();
  const currentCountry = getSelectedCountry();

  // Check if both exist in localStorage
  const hasCurrency = currentCurrency && currentCurrency !== "";
  const hasCountry = currentCountry && currentCountry !== "";

  if (hasCurrency && hasCountry) {
    console.log(
      "✅ Both currency and country exist in localStorage, skipping detection",
    );
    return {
      success: true,
      currency: currentCurrency,
      country: currentCountry,
      source: "localStorage",
      data: {
        wasUpdated: false,
      },
    };
  }

  console.log("🔍 Missing currency or country data, running detection...");
  console.log(
    `Current currency: ${currentCurrency}, Current country: ${currentCountry}`,
  );

  return await detectAndSetUserCurrencyAndCountry();
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

// Legacy function for backward compatibility - now uses new logic
export async function detectAndSetUserCurrency(): Promise<CurrencyDetectionResult> {
  console.log(
    "⚠️ Using legacy detectAndSetUserCurrency - consider using detectOnAppLoad or detectOnLogin",
  );
  return await detectAndSetUserCurrencyAndCountry();
}

// Legacy function for backward compatibility - now uses new logic
export async function refreshCurrencyDetection(): Promise<CurrencyDetectionResult> {
  console.log(
    "⚠️ Using legacy refreshCurrencyDetection - consider using detectOnLogin",
  );
  return await detectAndSetUserCurrencyAndCountry();
}

// Legacy function for backward compatibility - now uses new logic
export async function initializeCurrencyDetection(): Promise<void> {
  console.log(
    "⚠️ Using legacy initializeCurrencyDetection - consider using detectOnAppLoad",
  );
  try {
    const result = await detectOnAppLoad();
    if (result) {
      console.log(
        `✅ Currency detection initialized: ${result.currency} (${result.source})`,
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize currency detection:", error);
  }
}
