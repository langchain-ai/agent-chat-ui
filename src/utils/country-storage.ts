/**
 * Local storage utilities for user country preferences
 * Provides country selection persistence across sessions
 */

const COUNTRY_STORAGE_KEY = "flyo:user:country";
const DEFAULT_COUNTRY = ""; // Default to empty string when no country detected

export interface Country {
  code: string; // ISO 3166-1 alpha-2 country code
  name: string; // Full country name
}

/**
 * Get selected country from local storage
 * Returns empty string as default if no country is stored
 */
export function getSelectedCountry(): string {
  try {
    if (typeof window === "undefined") return DEFAULT_COUNTRY;
    const stored = localStorage.getItem(COUNTRY_STORAGE_KEY);
    return stored || DEFAULT_COUNTRY;
  } catch (error) {
    console.error("Failed to get selected country:", error);
    return DEFAULT_COUNTRY;
  }
}

/**
 * Store selected country in local storage
 */
export function setSelectedCountry(countryCode: string): void {
  try {
    if (typeof window === "undefined") return;

    // Validate and normalize country code
    const normalizedCode = countryCode?.toUpperCase().trim();
    if (!normalizedCode || normalizedCode.length !== 2) {
      console.warn("Invalid country code provided:", countryCode);
      return;
    }

    localStorage.setItem(COUNTRY_STORAGE_KEY, normalizedCode);
    console.log("Country stored:", normalizedCode);
  } catch (error) {
    console.error("Failed to store country:", error);
  }
}

/**
 * Get country name from country code using i18n-iso-countries
 * Falls back to country code if name lookup fails
 */
export function getCountryName(countryCode: string): string {
  try {
    // Dynamic import to avoid issues with SSR
    if (typeof window !== "undefined") {
      const isoCountries = require("i18n-iso-countries");
      // Ensure English locale is registered
      if (!isoCountries.getNames("en")) {
        isoCountries.registerLocale(
          require("i18n-iso-countries/langs/en.json"),
        );
      }

      const name = isoCountries.getName(countryCode, "en");
      return name || countryCode;
    }
    return countryCode;
  } catch (error) {
    console.error("Failed to get country name:", error);
    return countryCode;
  }
}

/**
 * Get country details by code
 */
export function getCountryDetails(code: string): Country | undefined {
  try {
    const normalizedCode = code?.toUpperCase().trim();
    if (!normalizedCode || normalizedCode.length !== 2) {
      return undefined;
    }

    const name = getCountryName(normalizedCode);
    return {
      code: normalizedCode,
      name,
    };
  } catch (error) {
    console.error("Failed to get country details:", error);
    return undefined;
  }
}

/**
 * Validate if a country code is valid (2-letter ISO format)
 */
export function isValidCountryCode(countryCode: string): boolean {
  if (!countryCode || typeof countryCode !== "string") {
    return false;
  }

  const normalized = countryCode.toUpperCase().trim();

  // Basic format validation
  if (normalized.length !== 2 || !/^[A-Z]{2}$/.test(normalized)) {
    return false;
  }

  // Try to get country name to validate it's a real country code
  try {
    if (typeof window !== "undefined") {
      const isoCountries = require("i18n-iso-countries");
      if (!isoCountries.getNames("en")) {
        isoCountries.registerLocale(
          require("i18n-iso-countries/langs/en.json"),
        );
      }

      const name = isoCountries.getName(normalized, "en");
      return !!name;
    }
    return true; // Assume valid in SSR context
  } catch (error) {
    console.error("Error validating country code:", error);
    return true; // Assume valid if validation fails
  }
}

/**
 * Clear stored country preference
 */
export function clearStoredCountry(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(COUNTRY_STORAGE_KEY);
    console.log("Stored country cleared");
  } catch (error) {
    console.error("Failed to clear stored country:", error);
  }
}

/**
 * Get user country with fallback detection
 * Tries localStorage first, then browser locale detection, then default
 */
export function getUserCountryWithFallback(): string {
  try {
    // First try localStorage
    const storedCountry = getSelectedCountry();
    if (storedCountry !== DEFAULT_COUNTRY && storedCountry !== "") {
      return storedCountry;
    }

    // Try to detect from browser locale
    if (typeof window !== "undefined") {
      try {
        // Try navigator.language first
        const primary = navigator.languages?.[0] || navigator.language;
        const match = primary?.match(/-([A-Z]{2})/i);
        let detectedCountry = match ? match[1].toUpperCase() : "";

        if (!detectedCountry) {
          // Try Intl.DateTimeFormat as fallback
          const locale = Intl.DateTimeFormat().resolvedOptions().locale;
          const localeMatch = locale?.match(/-([A-Z]{2})/i);
          detectedCountry = localeMatch ? localeMatch[1].toUpperCase() : "";
        }

        if (detectedCountry && isValidCountryCode(detectedCountry)) {
          console.log("Detected country from browser locale:", detectedCountry);
          return detectedCountry;
        }
      } catch (error) {
        console.error("Error detecting country from browser locale:", error);
      }
    }

    // Fallback to default
    return DEFAULT_COUNTRY;
  } catch (error) {
    console.error("Error in getUserCountryWithFallback:", error);
    return DEFAULT_COUNTRY;
  }
}

/**
 * Update country preference and log the change
 */
export function updateCountryPreference(
  countryCode: string,
  source: string = "manual",
): boolean {
  try {
    if (!isValidCountryCode(countryCode)) {
      console.warn(`Invalid country code provided: ${countryCode}`);
      return false;
    }

    const normalizedCode = countryCode.toUpperCase().trim();
    const previousCountry = getSelectedCountry();

    setSelectedCountry(normalizedCode);

    console.log(
      `Country preference updated from ${previousCountry} to ${normalizedCode} (source: ${source})`,
    );
    return true;
  } catch (error) {
    console.error("Failed to update country preference:", error);
    return false;
  }
}

/**
 * Get country storage status information
 */
export function getCountryStorageStatus(): {
  hasStoredCountry: boolean;
  storedCountry?: string;
  countryName?: string;
  isDefault: boolean;
} {
  try {
    const storedCountry = getSelectedCountry();
    const isDefault = storedCountry === DEFAULT_COUNTRY || storedCountry === "";

    return {
      hasStoredCountry: !isDefault,
      storedCountry,
      countryName: getCountryName(storedCountry),
      isDefault,
    };
  } catch (error) {
    console.error("Error getting country storage status:", error);
    return {
      hasStoredCountry: false,
      isDefault: true,
    };
  }
}
