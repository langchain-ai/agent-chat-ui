export type SupportedLanguage = "en" | "ar";

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

// RTL languages configuration
export const RTL_LANGUAGES: SupportedLanguage[] = ["ar"];

// RTL Mirror Configuration - defines which languages/scenarios require container-level mirroring
export const RTL_MIRROR_CONFIG = {
  // Languages that require complete mirror image transformation
  MIRROR_LANGUAGES: ["ar"] as SupportedLanguage[],

  // Widgets that support RTL mirroring
  MIRROR_SUPPORTED_WIDGETS: [
    "searchCriteriaWidget",
    "reviewWidget",
    "flightOptionsWidget",
  ],

  // Additional scenarios that might require mirroring (for future expansion)
  MIRROR_CONDITIONS: {
    // Could add conditions like user preferences, specific regions, etc.
    forceRTL: false,
    respectSystemPreference: true,
  },
};

export const LANGUAGE_CONFIG = {
  // Languages with complete translations
  COMPLETE_LANGUAGES: ["en", "ar"] as SupportedLanguage[],

  // Widgets that have been internationalized
  SUPPORTED_WIDGETS: [
    "searchCriteriaWidget",
    "reviewWidget",
    "flightOptionsWidget",
  ],

  // Directory mapping for locale files
  LOCALE_DIRECTORIES: {
    en: "english",
    ar: "arabic",
  } as Record<SupportedLanguage, string>,
};

export function getCurrentLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const pathname = window.location.pathname;
  return getLanguageFromPathname(pathname);
}

export function isWidgetSupported(widgetName: string): boolean {
  return LANGUAGE_CONFIG.SUPPORTED_WIDGETS.includes(widgetName);
}

export function getLanguageDirectory(language: SupportedLanguage): string {
  return (
    LANGUAGE_CONFIG.LOCALE_DIRECTORIES[language] ||
    LANGUAGE_CONFIG.LOCALE_DIRECTORIES[DEFAULT_LANGUAGE]
  );
}

/**
 * Check if a language is RTL (Right-to-Left)
 */
export function isRTLLanguage(language: SupportedLanguage): boolean {
  return RTL_LANGUAGES.includes(language);
}

/**
 * Get the text direction for a language
 */
export function getTextDirection(language: SupportedLanguage): "ltr" | "rtl" {
  return isRTLLanguage(language) ? "rtl" : "ltr";
}

/**
 * Check if the current language is RTL
 */
export function isCurrentLanguageRTL(): boolean {
  return isRTLLanguage(getCurrentLanguage());
}

/**
 * Get the current text direction
 */
export function getCurrentTextDirection(): "ltr" | "rtl" {
  return getTextDirection(getCurrentLanguage());
}

/**
 * Check if RTL mirroring is required for a given language
 */
export function isRTLMirrorRequired(language: SupportedLanguage): boolean {
  return RTL_MIRROR_CONFIG.MIRROR_LANGUAGES.includes(language);
}

/**
 * Check if RTL mirroring is required for the current language
 */
export function isCurrentLanguageRTLMirrorRequired(): boolean {
  return isRTLMirrorRequired(getCurrentLanguage());
}

/**
 * Check if a widget supports RTL mirroring
 */
export function isWidgetRTLMirrorSupported(widgetName: string): boolean {
  return RTL_MIRROR_CONFIG.MIRROR_SUPPORTED_WIDGETS.includes(widgetName);
}

/**
 * SSR-safe function to get language from pathname without window dependency
 */
export function getLanguageFromPathname(pathname: string): SupportedLanguage {
  // Handle exact matches for language routes
  if (pathname === "/en") return "en";
  if (pathname === "/ar") return "ar";

  // Handle paths that start with language prefix
  if (pathname.startsWith("/en/")) return "en";
  if (pathname.startsWith("/ar/")) return "ar";

  // Default to English for root path or any other path
  return DEFAULT_LANGUAGE;
}

/**
 * SSR-safe function to check if RTL mirroring is required based on pathname
 */
export function isRTLMirrorRequiredFromPathname(pathname: string): boolean {
  const language = getLanguageFromPathname(pathname);
  return isRTLMirrorRequired(language);
}

export async function loadLocale(
  widgetName: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE,
): Promise<Record<string, any>> {
  // Check if the widget is supported
  if (!isWidgetSupported(widgetName)) {
    console.warn(
      `Widget ${widgetName} is not internationalized. Available widgets:`,
      LANGUAGE_CONFIG.SUPPORTED_WIDGETS,
    );
    return {};
  }

  // Use the configured directory for the language
  const languageDir = getLanguageDirectory(language);

  try {
    // Dynamically import the locale file using the correct directory structure
    const locale = await import(`@/locales/${languageDir}/${widgetName}.json`);
    const translations = locale.default || locale;

    console.log(
      `Successfully loaded ${languageDir}/${widgetName}.json:`,
      translations,
    );
    return translations;
  } catch (error) {
    console.warn(
      `Failed to load locale ${languageDir}/${widgetName}.json, falling back to English:`,
      error,
    );

    // Fallback to English if the requested locale fails
    if (language !== DEFAULT_LANGUAGE) {
      try {
        const fallbackDir = getLanguageDirectory(DEFAULT_LANGUAGE);
        const fallbackLocale = await import(
          `@/locales/${fallbackDir}/${widgetName}.json`
        );
        const fallbackTranslations = fallbackLocale.default || fallbackLocale;

        console.log(
          `Loaded fallback translations from ${fallbackDir}/${widgetName}.json:`,
          fallbackTranslations,
        );
        return fallbackTranslations;
      } catch (fallbackError) {
        console.error(
          `Failed to load fallback locale ${getLanguageDirectory(DEFAULT_LANGUAGE)}/${widgetName}.json:`,
          fallbackError,
        );
        return {};
      }
    }

    return {};
  }
}
