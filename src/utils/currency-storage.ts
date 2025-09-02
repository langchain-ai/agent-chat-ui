/**
 * Local storage utilities for currency preferences
 * Provides currency selection persistence across sessions
 */

const CURRENCY_STORAGE_KEY = "flyo:user:currency";
const DEFAULT_CURRENCY = "INR";

export interface Currency {
  code: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "ALL", name: "Albanian Lek" },
  { code: "DZD", name: "Algerian Dinar" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "AMD", name: "Armenian Dram" },
  { code: "AWG", name: "Aruban Florin" },
  { code: "AZN", name: "Azerbaijani Manat" },
  { code: "BSD", name: "Bahamian Dollar" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "BMD", name: "Bermudan Dollar" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "XPF", name: "CFP Franc" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "CUP", name: "Cuban Peso" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DKK", name: "Danish Krone" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "GEL", name: "Georgian Lari" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "ISK", name: "Icelandic Króna" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "IRR", name: "Iranian Rial" },
  { code: "ILS", name: "Israeli New Shekel" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "LBP", name: "Lebanese Pound" },
  { code: "MKD", name: "Macedonian Denar" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MDL", name: "Moldovan Leu" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "OMR", name: "Omani Rial" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "RON", name: "Romanian Leu" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "ZAR", name: "South African Rand" },
  { code: "KRW", name: "South Korean Won" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "THB", name: "Thai Baht" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "AED", name: "United Arab Emirates Dirham" },
  { code: "VND", name: "Vietnamese Dong" },
];

/**
 * Get selected currency from local storage
 * Returns INR as default if no currency is stored
 */
export function getSelectedCurrency(): string {
  try {
    if (typeof window === "undefined") return DEFAULT_CURRENCY;
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return stored || DEFAULT_CURRENCY;
  } catch (error) {
    console.error("Failed to get selected currency:", error);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Store selected currency in local storage
 */
export function setSelectedCurrency(currencyCode: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
    console.log("Currency stored:", currencyCode);
  } catch (error) {
    console.error("Failed to store currency:", error);
  }
}

/**
 * Get currency details by code
 */
export function getCurrencyDetails(code: string): Currency | undefined {
  return currencies.find((currency) => currency.code === code);
}

/**
 * Clear stored currency preference
 */
export function clearStoredCurrency(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CURRENCY_STORAGE_KEY);
    console.log("Stored currency cleared");
  } catch (error) {
    console.error("Failed to clear stored currency:", error);
  }
}
