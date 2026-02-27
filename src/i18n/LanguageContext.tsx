import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import translations, { type Locale, type TranslationKey } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("tkd-lang");
    return (saved === "da" || saved === "en") ? saved : "en";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("tkd-lang", l);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return translations[locale][key] || translations.en[key] || key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
