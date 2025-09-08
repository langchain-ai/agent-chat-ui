/**
 * Local storage utilities for language preference management
 * Provides language preference storage and retrieval functionality
 */

import { SupportedLanguage, DEFAULT_LANGUAGE } from "@/utils/i18n";

const LANGUAGE_STORAGE_KEY = "flyo:user:language";

export interface Language {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

// Available languages with their display information
export const languages: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English"
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية"
  },
];

/**
 * Get selected language from local storage
 * Returns default language if no language is stored
 */
export function getSelectedLanguage(): SupportedLanguage {
  try {
    if (typeof window === "undefined") return DEFAULT_LANGUAGE;
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (stored as SupportedLanguage) || DEFAULT_LANGUAGE;
  } catch (error) {
    console.error("Failed to get selected language:", error);
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Store selected language in local storage
 */
export function setSelectedLanguage(languageCode: SupportedLanguage): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    console.log("Language stored:", languageCode);
  } catch (error) {
    console.error("Failed to store language:", error);
  }
}

/**
 * Get language details by code
 */
export function getLanguageDetails(
  code: SupportedLanguage,
): Language | undefined {
  return languages.find((language) => language.code === code);
}

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return languages.some((language) => language.code === code);
}

/**
 * Get the current language from URL or localStorage
 * Priority: URL > localStorage > Default
 */
export function getCurrentLanguageFromContext(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  // Check URL first
  const pathname = window.location.pathname;
  const urlLang = pathname.split("/")[1];

  if (urlLang && isSupportedLanguage(urlLang)) {
    return urlLang;
  }

  // Fall back to localStorage
  return getSelectedLanguage();
}

/**
 * Check if emoji flags are supported by the browser/platform
 */
export function isEmojiFlagSupported(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // Create a test canvas to check if emoji flags render properly
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    canvas.width = 20;
    canvas.height = 20;
    ctx.font = "16px Arial";
    ctx.fillText("🇺🇸", 0, 16);

    // Check if the emoji was rendered (not just empty boxes)
    const imageData = ctx.getImageData(0, 0, 20, 20);
    const data = imageData.data;

    // If all pixels are transparent/empty, emoji flags are not supported
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true; // Found non-transparent pixel
    }

    return false;
  } catch (error) {
    console.warn("Failed to detect emoji flag support:", error);
    return false;
  }
}

/**
 * Navigate to a specific language URL
 */
export function navigateToLanguage(languageCode: SupportedLanguage): void {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  const currentLang = currentPath.split("/")[1];

  let newPath: string;

  if (currentLang && isSupportedLanguage(currentLang)) {
    // Replace existing language in URL
    newPath = currentPath.replace(
      `/${currentLang}`,
      languageCode === DEFAULT_LANGUAGE ? "" : `/${languageCode}`,
    );
  } else {
    // Add language to URL
    newPath =
      languageCode === DEFAULT_LANGUAGE
        ? currentPath
        : `/${languageCode}${currentPath}`;
  }

  // Remove double slashes and ensure proper format
  newPath = newPath.replace(/\/+/g, "/");
  if (newPath !== "/" && newPath.endsWith("/")) {
    newPath = newPath.slice(0, -1);
  }
  if (newPath === "") {
    newPath = "/";
  }

  // Store preference and navigate
  setSelectedLanguage(languageCode);
  window.location.href = newPath;
}
