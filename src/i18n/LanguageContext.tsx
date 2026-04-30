import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import translations, { type Locale, type TranslationKey } from "./translations";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey | (string & {})) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const SUPPORTED: Locale[] = ["en", "da", "sv", "de", "ar", "no"];
const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (SUPPORTED as string[]).includes(v);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("tkd-lang");
    return isLocale(saved) ? saved : "en";
  });

  // Track the session for which we already applied the user's default_locale,
  // so we re-apply it once per fresh session (login / page reload after auth).
  const appliedForSessionRef = useRef<string | null>(null);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("tkd-lang", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);

  // Set initial dir and lang on mount
  useEffect(() => {
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  // On every fresh session (sign-in or app load while signed in), reset to
  // the user's saved default_locale. Mid-session changes via the switcher
  // remain in effect until the next reload / new session.
  useEffect(() => {
    const applyDefault = async (userId: string) => {
      if (appliedForSessionRef.current === userId) return;
      appliedForSessionRef.current = userId;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("default_locale")
          .eq("user_id", userId)
          .maybeSingle();
        const dl = (data as any)?.default_locale;
        if (isLocale(dl)) {
          setLocaleState(dl);
          localStorage.setItem("tkd-lang", dl);
          document.documentElement.dir = dl === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = dl;
        }
      } catch {
        // Non-critical
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) applyDefault(session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        appliedForSessionRef.current = null;
        return;
      }
      if (session?.user) {
        // Defer to avoid running supabase calls inside the auth callback.
        setTimeout(() => applyDefault(session.user!.id), 0);
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
