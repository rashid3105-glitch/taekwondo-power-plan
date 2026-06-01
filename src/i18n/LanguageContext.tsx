import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import translations, { type Locale, type TranslationKey } from "./translations";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey | (string & {})) => string;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

const SUPPORTED: Locale[] = ["en", "da", "sv", "de", "ar", "no", "es"];
const RTL_LOCALES: Locale[] = ["ar"];
const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (SUPPORTED as string[]).includes(v);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("tkd-lang");
    return isLocale(saved) ? saved : "en";
  });

  // Track which user IDs we've already seeded so a different account signing
  // in on the same browser gets their default_locale applied once.
  const seededUsersRef = useRef<Set<string>>(new Set());

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("tkd-lang", l);
    document.documentElement.dir = RTL_LOCALES.includes(l) ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);

  // Set initial dir and lang on mount
  useEffect(() => {
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  // Seed locale from profiles.default_locale ONLY when the user has no saved
  // selection in localStorage. The switcher selection is authoritative once
  // it exists — we never overwrite it on subsequent sessions. Final fallback
  // is English.
  useEffect(() => {
    const seedDefault = async (userId: string) => {
      if (seededUsersRef.current.has(userId)) return;
      seededUsersRef.current.add(userId);
      // Respect existing switcher selection — do not override.
      if (localStorage.getItem("tkd-lang")) return;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("default_locale")
          .eq("user_id", userId)
          .maybeSingle();
        const dl = (data as any)?.default_locale;
        const next: Locale = isLocale(dl) ? dl : "en";
        setLocaleState(next);
        localStorage.setItem("tkd-lang", next);
        document.documentElement.dir = RTL_LOCALES.includes(next) ? "rtl" : "ltr";
        document.documentElement.lang = next;
      } catch {
        // Non-critical
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) seedDefault(session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        seededUsersRef.current.clear();
        return;
      }
      if (session?.user) {
        setTimeout(() => seedDefault(session.user!.id), 0);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const t = useCallback((key: TranslationKey | (string & {})) => {
    const k = key as TranslationKey;
    return translations[locale][k] || translations.en[k] || key;
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
