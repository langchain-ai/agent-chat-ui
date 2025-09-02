/**
 * Local storage utilities for currency preferences
 * Provides currency selection persistence across sessions
 */

const CURRENCY_STORAGE_KEY = "flyo:user:currency";
const DEFAULT_CURRENCY = "INR";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const currencies: Currency[] = [
  { code: "ALL", name: "Albanian Lek", symbol: "L" },
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏" },
  { code: "AWG", name: "Aruban Florin", symbol: "ƒ" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
  { code: "BSD", name: "Bahamian Dollar", symbol: "B$" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب" },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br" },
  { code: "BMD", name: "Bermudan Dollar", symbol: "$" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark", symbol: "KM" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "XPF", name: "CFP Franc", symbol: "₣" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡" },
  { code: "CUP", name: "Cuban Peso", symbol: "₱" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "ISK", name: "Icelandic Króna", symbol: "kr" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "IRR", name: "Iranian Rial", symbol: "﷼" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل" },
  { code: "MKD", name: "Macedonian Denar", symbol: "ден" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "MDL", name: "Moldovan Leu", symbol: "L" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م." },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع." },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/." },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س" },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин." },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
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

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = getCurrencyDetails(currencyCode);
  return currency?.symbol || currencyCode;
};

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
