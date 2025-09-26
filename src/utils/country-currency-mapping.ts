/**
 * Country to Currency Mapping
 * Maps ISO 3166-1 alpha-2 country codes to ISO 4217 currency codes
 * Only includes currencies that exist in our currencies array from currency-storage.ts
 */

import { currencies } from "./currency-storage";

/**
 * Get all available currency codes from our currencies array
 */
const getAvailableCurrencies = (): Set<string> => {
  return new Set(currencies.map(currency => currency.code));
};

/**
 * Comprehensive country to currency mapping
 * Only includes currencies that are available in our system
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Europe
  "AD": "EUR", // Andorra
  "AT": "EUR", // Austria
  "BE": "EUR", // Belgium
  "BG": "BGN", // Bulgaria
  "CH": "CHF", // Switzerland
  "CY": "EUR", // Cyprus
  "CZ": "CZK", // Czech Republic
  "DE": "EUR", // Germany
  "DK": "DKK", // Denmark
  "EE": "EUR", // Estonia
  "ES": "EUR", // Spain
  "FI": "EUR", // Finland
  "FR": "EUR", // France
  "GB": "GBP", // United Kingdom
  "GR": "EUR", // Greece
  "HR": "EUR", // Croatia
  "HU": "HUF", // Hungary
  "IE": "EUR", // Ireland
  "IS": "ISK", // Iceland
  "IT": "EUR", // Italy
  "LI": "CHF", // Liechtenstein
  "LT": "EUR", // Lithuania
  "LU": "EUR", // Luxembourg
  "LV": "EUR", // Latvia
  "MC": "EUR", // Monaco
  "MD": "MDL", // Moldova
  "ME": "EUR", // Montenegro
  "MK": "MKD", // North Macedonia
  "MT": "EUR", // Malta
  "NL": "EUR", // Netherlands
  "NO": "NOK", // Norway
  "PL": "PLN", // Poland
  "PT": "EUR", // Portugal
  "RO": "RON", // Romania
  "RS": "RSD", // Serbia
  "RU": "RUB", // Russia
  "SE": "SEK", // Sweden
  "SI": "EUR", // Slovenia
  "SK": "EUR", // Slovakia
  "SM": "EUR", // San Marino
  "TR": "TRY", // Turkey
  "UA": "UAH", // Ukraine
  "VA": "EUR", // Vatican City

  // North America
  "CA": "CAD", // Canada
  "MX": "MXN", // Mexico
  "US": "USD", // United States

  // Central America & Caribbean
  "BS": "BSD", // Bahamas
  "JM": "JMD", // Jamaica
  "PA": "PAB", // Panama

  // South America
  "AR": "ARS", // Argentina
  "BR": "BRL", // Brazil
  "CL": "CLP", // Chile
  "CO": "COP", // Colombia
  "PE": "PEN", // Peru

  // Asia
  "AE": "AED", // United Arab Emirates
  "AM": "AMD", // Armenia
  "AZ": "AZN", // Azerbaijan
  "BH": "BHD", // Bahrain
  "CN": "CNY", // China
  "GE": "GEL", // Georgia
  "HK": "HKD", // Hong Kong
  "ID": "IDR", // Indonesia
  "IL": "ILS", // Israel
  "IN": "INR", // India
  "IR": "IRR", // Iran
  "JP": "JPY", // Japan
  "JO": "JOD", // Jordan
  "KR": "KRW", // South Korea
  "KW": "KWD", // Kuwait
  "KZ": "KZT", // Kazakhstan
  "LB": "LBP", // Lebanon
  "MY": "MYR", // Malaysia
  "OM": "OMR", // Oman
  "PH": "PHP", // Philippines
  "PK": "PKR", // Pakistan
  "QA": "QAR", // Qatar
  "SA": "SAR", // Saudi Arabia
  "SG": "SGD", // Singapore
  "TH": "THB", // Thailand
  "TW": "TWD", // Taiwan
  "VN": "VND", // Vietnam

  // Oceania
  "AU": "AUD", // Australia
  "NZ": "NZD", // New Zealand

  // Africa
  "ZA": "ZAR", // South Africa
  "EG": "EGP", // Egypt
  "MA": "MAD", // Morocco

  // Additional countries using major currencies
  "AL": "ALL", // Albania
  "DZ": "DZD", // Algeria
  "AW": "AWG", // Aruba
  "BY": "BYN", // Belarus
  "BM": "BMD", // Bermuda
  "BA": "BAM", // Bosnia and Herzegovina
  "CR": "CRC", // Costa Rica
  "CU": "CUP", // Cuba
  "DO": "DOP", // Dominican Republic
  "NC": "XPF", // New Caledonia
  "PF": "XPF", // French Polynesia
  "WF": "XPF", // Wallis and Futuna
};

/**
 * Get currency code for a given country code
 * Returns the mapped currency if available in our system, otherwise returns default (INR)
 */
export function getCurrencyForCountry(countryCode: string): string {
  if (!countryCode || typeof countryCode !== "string") {
    return "INR"; // Default fallback
  }

  const normalizedCountryCode = countryCode.toUpperCase().trim();
  const mappedCurrency = COUNTRY_TO_CURRENCY[normalizedCountryCode];

  if (!mappedCurrency) {
    console.log(`No currency mapping found for country: ${normalizedCountryCode}, using default INR`);
    return "INR";
  }

  // Verify the currency exists in our available currencies
  const availableCurrencies = getAvailableCurrencies();
  if (!availableCurrencies.has(mappedCurrency)) {
    console.warn(`Currency ${mappedCurrency} for country ${normalizedCountryCode} not available in our system, using default INR`);
    return "INR";
  }

  return mappedCurrency;
}

/**
 * Check if a currency is supported in our system
 */
export function isCurrencySupported(currencyCode: string): boolean {
  if (!currencyCode || typeof currencyCode !== "string") {
    return false;
  }

  const availableCurrencies = getAvailableCurrencies();
  return availableCurrencies.has(currencyCode.toUpperCase());
}

/**
 * Get all supported country codes that have currency mappings
 */
export function getSupportedCountryCodes(): string[] {
  return Object.keys(COUNTRY_TO_CURRENCY);
}

/**
 * Get all unique currencies used in country mappings
 */
export function getMappedCurrencies(): string[] {
  const uniqueCurrencies = new Set(Object.values(COUNTRY_TO_CURRENCY));
  return Array.from(uniqueCurrencies).sort();
}

/**
 * Validate that all mapped currencies exist in our currency system
 * This is useful for development/testing to ensure data consistency
 */
export function validateCurrencyMappings(): {
  isValid: boolean;
  missingCurrencies: string[];
  validMappings: number;
  totalMappings: number;
} {
  const availableCurrencies = getAvailableCurrencies();
  const mappedCurrencies = getMappedCurrencies();
  const missingCurrencies: string[] = [];

  for (const currency of mappedCurrencies) {
    if (!availableCurrencies.has(currency)) {
      missingCurrencies.push(currency);
    }
  }

  return {
    isValid: missingCurrencies.length === 0,
    missingCurrencies,
    validMappings: mappedCurrencies.length - missingCurrencies.length,
    totalMappings: mappedCurrencies.length,
  };
}

/**
 * Get countries that use a specific currency
 */
export function getCountriesForCurrency(currencyCode: string): string[] {
  if (!currencyCode || typeof currencyCode !== "string") {
    return [];
  }

  const normalizedCurrency = currencyCode.toUpperCase();
  const countries: string[] = [];

  for (const [country, currency] of Object.entries(COUNTRY_TO_CURRENCY)) {
    if (currency === normalizedCurrency) {
      countries.push(country);
    }
  }

  return countries.sort();
}
