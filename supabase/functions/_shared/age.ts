// Shared age helper for edge functions (mirrors src/lib/age.ts).
// Treats a user as a minor when computed age is < 18.

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

export function effectiveAge(
  birth?: string | null,
  fallbackAge?: number | null,
): number | null {
  const fromBirth = ageFromBirthDate(birth);
  if (fromBirth != null) return fromBirth;
  if (typeof fallbackAge === "number" && fallbackAge >= 0) return fallbackAge;
  return null;
}

export function isMinor(
  birth?: string | null,
  fallbackAge?: number | null,
): boolean {
  const a = effectiveAge(birth, fallbackAge);
  return a != null && a < 18;
}

// Single source of truth for the consent policy version.
export const POLICY_VERSION = "2026-06-13";
