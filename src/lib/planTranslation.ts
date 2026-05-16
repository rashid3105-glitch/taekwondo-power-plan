// Best-effort translation of saved plan content (day names, exercise names)
// into the user's current UI locale. Falls back to the original string when
// no translation is known (so AI-generated freeform text like session focus
// or coaching cues passes through unchanged).

// (no default-export import needed)

type Locale = "en" | "da" | "sv" | "de" | "ar" | "no" | "fa";

// ---------- Day-of-week translation ----------

const DAY_NAMES: Record<Locale, string[]> = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  da: ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"],
  no: ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"],
  sv: ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"],
  de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  ar: ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
  fa: ["دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه"],
};

// Build a reverse index: any localized day name → canonical 0..6 index.
const dayIndexByName: Map<string, number> = (() => {
  const m = new Map<string, number>();
  (Object.keys(DAY_NAMES) as Locale[]).forEach((loc) => {
    DAY_NAMES[loc].forEach((name, i) => {
      m.set(name.toLowerCase(), i);
    });
  });
  return m;
})();

export function localizeDayOfWeek(input: string | undefined, locale: Locale): string {
  if (!input) return "";
  const idx = dayIndexByName.get(input.trim().toLowerCase());
  if (idx === undefined) return input;
  return DAY_NAMES[locale]?.[idx] ?? input;
}

// ---------- Exercise-name translation ----------

// Lazy-build the exercise name → canonical key index from src/data/exercises.ts.
// We import the module's internal data via a raw require-style lookup since
// `exercisesData` isn't a named export. Instead we re-derive by calling
// getAllExercises across each locale would be heavy, so we read the underlying
// module directly.
//
// Implementation note: src/data/exercises.ts only exports helpers, not the raw
// `exercisesData` map. We avoid changing that file by reconstructing a
// name-index from the locale-specific helpers it does expose: for each known
// exercise key, in each locale, we resolve the localized exercise once.

import {
  setExerciseLocale,
  getAllExercises,
  type Exercise,
} from "@/data/exercises";

// (no extra suppression needed)
// Map: lowercased exercise name (in any locale) → canonical exercise id
// e.g. "trap bar deadlift" → "trap-bar-deadlift", "trap bar dødløft" → "trap-bar-deadlift"
const nameToCanonicalId: Map<string, string> = new Map();
// Map: canonical exercise id → per-locale name
const idToNamesByLocale: Map<string, Record<Locale, string>> = new Map();

let indexBuilt = false;
function buildIndex() {
  if (indexBuilt) return;
  indexBuilt = true;
  const locales: Locale[] = ["en", "da", "sv", "de", "ar", "no", "fa"];
  const previous = (globalThis as any).__exerciseLocaleSnapshot__;
  for (const loc of locales) {
    setExerciseLocale(loc);
    const list: Exercise[] = getAllExercises();
    for (const ex of list) {
      const key = ex.id;
      const name = ex.name?.trim();
      if (!name) continue;
      nameToCanonicalId.set(name.toLowerCase(), key);
      const bucket = idToNamesByLocale.get(key) ?? ({} as Record<Locale, string>);
      bucket[loc] = name;
      idToNamesByLocale.set(key, bucket);
    }
  }
  // Restore prior locale (best-effort; LanguageContext will set it again on render).
  if (previous) setExerciseLocale(previous);
}

export function localizeExerciseName(input: string | undefined, locale: Locale): string {
  if (!input) return "";
  buildIndex();
  const id = nameToCanonicalId.get(input.trim().toLowerCase());
  if (!id) return input;
  return idToNamesByLocale.get(id)?.[locale] ?? input;
}
