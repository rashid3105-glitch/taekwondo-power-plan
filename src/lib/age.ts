// Compute age (years) from an ISO birth_date string (YYYY-MM-DD).
// Returns null if value is not a valid date.
export function ageFromBirthDate(birth?: string | null): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// Effective age — DISPLAY ONLY. `profiles.age` is a static field that decays,
// so it must never resolve a consent decision. Use `isBelowConsentAge` for that.
export function effectiveAge(
  birth?: string | null,
  fallbackAge?: number | null,
): number | null {
  const fromBirth = ageFromBirthDate(birth);
  if (fromBirth != null) return fromBirth;
  if (typeof fallbackAge === "number" && fallbackAge >= 0) return fallbackAge;
  return null;
}

// Default digital-consent age until the configurable threshold ships (Release B).
export const DEFAULT_CONSENT_AGE = 18;

export type ConsentAgeVerdict = true | false | "unknown";

// Consent decisions use birth date ONLY. Missing birth date is a genuine third
// state ("unknown") that every caller must handle explicitly.
export function isBelowConsentAge(
  birth?: string | null,
  threshold: number = DEFAULT_CONSENT_AGE,
): ConsentAgeVerdict {
  const a = ageFromBirthDate(birth);
  if (a == null) return "unknown";
  return a < threshold;
}
