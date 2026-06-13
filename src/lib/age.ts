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

// Effective age — prefer birth_date, fall back to a stored numeric age.
export function effectiveAge(
  birth?: string | null,
  fallbackAge?: number | null,
): number | null {
  const fromBirth = ageFromBirthDate(birth);
  if (fromBirth != null) return fromBirth;
  if (typeof fallbackAge === "number" && fallbackAge >= 0) return fallbackAge;
  return null;
}

// A user is treated as a minor when their effective age is < 18.
// Unknown age is NOT a minor (callers should validate input separately).
export function isMinor(
  birth?: string | null,
  fallbackAge?: number | null,
): boolean {
  const a = effectiveAge(birth, fallbackAge);
  return a != null && a < 18;
}
