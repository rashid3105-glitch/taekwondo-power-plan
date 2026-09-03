// Shared age helper for edge functions (mirrors src/lib/age.ts).
// Consent decisions use birth_date ONLY — `profiles.age` is a decaying
// static field and must never resolve a consent decision.

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

// DISPLAY ONLY — may fall back to the stored numeric age.
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

export function isBelowConsentAge(
  birth?: string | null,
  threshold: number = DEFAULT_CONSENT_AGE,
): ConsentAgeVerdict {
  const a = ageFromBirthDate(birth);
  if (a == null) return "unknown";
  return a < threshold;
}

// Guardian-consent token lifetime (days). Reminders are scheduled around this.
export const CONSENT_TOKEN_DAYS = 30;
export const CONSENT_REMINDER_DAYS = [3, 10, 21] as const;
export const CONSENT_EXPIRY_WARNING_DAY = 27;

// Single source of truth for the consent policy version.
export const POLICY_VERSION = "2026-06-13";
