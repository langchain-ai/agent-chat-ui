"use client";

import { useLocale } from "./I18nProvider";

const availableLocales = {
  en: "English",
  fr: "Français",
  nl: "Nederlands",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
};

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as keyof typeof availableLocales);
  };

  return (
    <div className="flex items-center space-x-2">
      <label
        htmlFor="language-select"
        className="text-sm font-medium"
      >
        Language:
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={handleChange}
        className="rounded border p-1 text-sm"
      >
        {Object.entries(availableLocales).map(([code, name]) => (
          <option
            key={code}
            value={code}
          >
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
