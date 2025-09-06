import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  SupportedLanguage,
  loadLocale,
  getCurrentLanguage,
} from "@/utils/i18n";

export function useTranslations(
  widgetName: string,
  language?: SupportedLanguage,
) {
  const pathname = usePathname();
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    language || getCurrentLanguage(),
  );

  useEffect(() => {
    const langToUse = language || getCurrentLanguage();
    setCurrentLanguage(langToUse);
    setIsLoading(true);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Loading translations for ${widgetName} in language: ${langToUse}`,
      );
    }

    loadLocale(widgetName, langToUse)
      .then((locale) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `Successfully loaded translations for ${widgetName}:`,
            locale,
          );
        }
        setTranslations(locale);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(`Failed to load translations for ${widgetName}:`, error);
        setTranslations({});
        setIsLoading(false);
      });
  }, [widgetName, language, pathname]); // Add pathname as dependency to react to URL changes

  /**
   * Get a translation by key path (e.g., 'title.passengerDetails')
   *
   * @param keyPath - Dot-separated path to the translation key
   * @param fallback - Fallback text if translation is not found
   * @returns The translated text or fallback
   */
  const t = (keyPath: string, fallback?: string): string => {
    // If still loading, return fallback or key
    if (isLoading) {
      if (process.env.NODE_ENV === "development") {
        console.log(`Translation loading for key: ${keyPath}`);
      }
      return fallback || keyPath;
    }

    // If no translations loaded, return fallback or key
    if (!translations || Object.keys(translations).length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`No translations available for key: ${keyPath}`);
      }
      return fallback || keyPath;
    }

    const keys = keyPath.split(".");
    let value = translations;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Translation key not found: ${keyPath} (failed at: ${key})`,
          );
        }
        return fallback || keyPath;
      }
    }

    if (typeof value === "string") {
      return value;
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Translation key ${keyPath} is not a string:`, value);
      }
      return fallback || keyPath;
    }
  };

  /**
   * Get a nested object from translations
   *
   * @param keyPath - Dot-separated path to the object
   * @returns The nested object or empty object if not found
   */
  const getObject = (keyPath: string): Record<string, any> => {
    if (isLoading) {
      return {};
    }

    const keys = keyPath.split(".");
    let value = translations;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return {};
      }
    }

    return typeof value === "object" && value !== null ? value : {};
  };

  return {
    t,
    getObject,
    language: currentLanguage,
    isLoading,
    translations,
  };
}