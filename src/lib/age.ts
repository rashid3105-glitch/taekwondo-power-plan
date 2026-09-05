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

// ── Country-aware consent age (GDPR Art. 8) ────────────────────────────────
// The applicable age is resolved in the database (club country > athlete
// residence > platform default). On ANY failure we fall back to the platform
// default (18) — never lower — so a network error can never silently reduce
// the protection applied to a minor.
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, number>();

export async function fetchConsentAge(athleteId: string): Promise<number> {
  const hit = cache.get(athleteId);
  if (hit != null) return hit;
  try {
    const { data, error } = await supabase.rpc("consent_age_for_athlete", {
      _athlete_id: athleteId,
    });
    const age = typeof data === "number" ? data : null;
    if (error || age == null || age < 1 || age > 25) return DEFAULT_CONSENT_AGE;
    cache.set(athleteId, age);
    return age;
  } catch {
    return DEFAULT_CONSENT_AGE;
  }
}

export async function fetchConsentAges(
  athleteIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (athleteIds.length === 0) return out;
  try {
    const { data, error } = await supabase.rpc("consent_ages_for_athletes", {
      _ids: athleteIds,
    });
    if (error) throw error;
    for (const row of (data as any[]) || []) {
      const age = row?.applicable_age;
      if (typeof age === "number" && age >= 1 && age <= 25) {
        out.set(row.athlete_id, age);
        cache.set(row.athlete_id, age);
      }
    }
  } catch {
    // fall through — callers use DEFAULT_CONSENT_AGE for missing entries
  }
  return out;
}

