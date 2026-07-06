// Server-side translations for push notifications. Kept intentionally small.
// Locales: en, da, sv, de, ar, no, es. Fallback: da.
export type PushLocale = "en" | "da" | "sv" | "de" | "ar" | "no" | "es";

const STRINGS = {
  chatNewMessage: {
    en: "New message", da: "Ny besked", sv: "Nytt meddelande",
    de: "Neue Nachricht", ar: "رسالة جديدة", no: "Ny melding", es: "Nuevo mensaje",
  },
  diaryNewEntry: {
    en: (n: string) => `New diary entry from ${n}`,
    da: (n: string) => `Ny dagbogsindførsel fra ${n}`,
    sv: (n: string) => `Nytt dagboksinlägg från ${n}`,
    de: (n: string) => `Neuer Tagebucheintrag von ${n}`,
    ar: (n: string) => `مذكرة جديدة من ${n}`,
    no: (n: string) => `Ny dagbokoppføring fra ${n}`,
    es: (n: string) => `Nueva entrada de diario de ${n}`,
  },
  diaryNewEntryTitle: {
    en: "Athlete diary", da: "Atlet-dagbog", sv: "Atlet-dagbok",
    de: "Athleten-Tagebuch", ar: "مذكرة الرياضي", no: "Utøver-dagbok", es: "Diario del atleta",
  },
} as const;

export function normalizeLocale(l: string | null | undefined): PushLocale {
  const v = (l || "da").toLowerCase();
  if (["en","da","sv","de","ar","no","es"].includes(v)) return v as PushLocale;
  return "da";
}

export function t(key: keyof typeof STRINGS, locale: PushLocale, arg?: string): string {
  const entry = STRINGS[key] as any;
  const val = entry[locale] ?? entry.da;
  return typeof val === "function" ? val(arg ?? "") : val;
}
