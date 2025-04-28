"use client";

import { IntlProvider } from "react-intl";
import en from "../../locales/en.json";
import fr from "../../locales/fr.json";
import nl from "../../locales/nl.json";
import de from "../../locales/de.json";
import es from "../../locales/es.json";
import it from "../../locales/it.json";
import pt from "../../locales/pt.json";
import ru from "../../locales/ru.json";
import { createContext, useContext, useState } from "react";

const messages = {
  en,
  fr,
  nl,
  de,
  es,
  it,
  pt,
  ru,
};

type LocaleContextType = {
  locale: keyof typeof messages;
  setLocale: React.Dispatch<React.SetStateAction<keyof typeof messages>>;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<keyof typeof messages>("en");

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider
        locale={locale}
        messages={messages[locale]}
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
