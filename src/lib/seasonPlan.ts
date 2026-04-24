/**
 * Season periodization phase types and helpers.
 * A season plan is a sequence of dated phases that together cover the year.
 */

export type PhaseType =
  | "general_prep"
  | "specific_prep"
  | "competition"
  | "peak"
  | "deload"
  | "transition";

export interface SeasonPhase {
  id: string;
  type: PhaseType;
  label: string;
  start_date: string; // ISO yyyy-mm-dd
  end_date: string;
  focus: string;
  volume_pct: number; // 0-100
  intensity_pct: number; // 0-100
}

export interface SeasonMilestone {
  id: string;
  date: string;
  label: string;
  competition_id?: string | null;
  priority?: "A" | "B" | "C";
}

export const PHASE_META: Record<PhaseType, { labelKey: string; short: string; colorClass: string; defaults: { volume: number; intensity: number } }> = {
  general_prep:  { labelKey: "phaseGeneralPrep",  short: "GPP", colorClass: "bg-primary/20 text-primary border-primary/40",       defaults: { volume: 80, intensity: 50 } },
  specific_prep: { labelKey: "phaseSpecificPrep", short: "SPP", colorClass: "bg-accent/20 text-accent border-accent/40",          defaults: { volume: 65, intensity: 70 } },
  competition:   { labelKey: "phaseCompetition",  short: "COMP",colorClass: "bg-explosive/25 text-explosive border-explosive/50", defaults: { volume: 45, intensity: 90 } },
  peak:          { labelKey: "phasePeak",         short: "PEAK",colorClass: "bg-explosive/15 text-explosive border-explosive/30", defaults: { volume: 35, intensity: 95 } },
  deload:        { labelKey: "phaseDeload",       short: "DEL", colorClass: "bg-speed/20 text-speed border-speed/40",             defaults: { volume: 40, intensity: 50 } },
  transition:    { labelKey: "phaseTransition",   short: "TRN", colorClass: "bg-muted text-muted-foreground border-muted",        defaults: { volume: 30, intensity: 30 } },
};

export const PHASE_TYPES = Object.keys(PHASE_META) as PhaseType[];

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function weeksBetween(a: string, b: string) {
  return Math.max(1, Math.round(daysBetween(a, b) / 7));
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Auto-generate a sensible default macrocycle:
 * - 6 wk General Prep → 4 wk Specific Prep → competition block around each A event → 1 wk transition at end.
 * If competitions are passed, peak weeks are placed before each A-priority event.
 */
export function generateDefaultPhases(
  seasonStart: string,
  seasonEnd: string,
  aEvents: { date: string; label: string }[] = []
): SeasonPhase[] {
  const out: SeasonPhase[] = [];
  let cursor = seasonStart;
  const totalWeeks = weeksBetween(seasonStart, seasonEnd);

  if (totalWeeks < 6) {
    out.push(makePhase("general_prep", cursor, seasonEnd, "Build a broad base of conditioning, technique volume, and resilience."));
    return out;
  }

  // GPP: first 6 weeks (or 40% of season, whichever shorter)
  const gppWeeks = Math.min(6, Math.floor(totalWeeks * 0.4));
  const gppEnd = addDays(cursor, gppWeeks * 7 - 1);
  out.push(makePhase("general_prep", cursor, gppEnd, "Build aerobic base, foundational strength, and high-volume technique work."));
  cursor = addDays(gppEnd, 1);

  // SPP: next 4 weeks (or 30% of remaining)
  const remaining = weeksBetween(cursor, seasonEnd);
  const sppWeeks = Math.min(4, Math.max(2, Math.floor(remaining * 0.3)));
  const sppEnd = addDays(cursor, sppWeeks * 7 - 1);
  out.push(makePhase("specific_prep", cursor, sppEnd, "Sport-specific intensity, sparring volume, and competition-pace drills."));
  cursor = addDays(sppEnd, 1);

  // For each A event, a 2-week peak before, 1-week deload after
  const sortedA = [...aEvents].sort((a, b) => a.date.localeCompare(b.date));
  for (const ev of sortedA) {
    const peakStart = addDays(ev.date, -14);
    if (peakStart > cursor && peakStart < seasonEnd) {
      // Fill gap with competition prep
      out.push(makePhase("competition", cursor, addDays(peakStart, -1), `Sharpen for ${ev.label}: combinations, scenarios, weight management.`));
      out.push(makePhase("peak", peakStart, ev.date, `Final peak for ${ev.label}: low volume, high specificity, full recovery.`));
      const deloadEnd = addDays(ev.date, 7);
      if (deloadEnd <= seasonEnd) {
        out.push(makePhase("deload", addDays(ev.date, 1), deloadEnd, "Active recovery, mobility, mental reset after competition."));
        cursor = addDays(deloadEnd, 1);
      } else cursor = addDays(ev.date, 1);
    }
  }

  // Fill remaining as competition or transition
  if (cursor < seasonEnd) {
    const remainingWeeks = weeksBetween(cursor, seasonEnd);
    if (remainingWeeks <= 2) {
      out.push(makePhase("transition", cursor, seasonEnd, "Off-season decompression, cross-training, mental break."));
    } else {
      const compEnd = addDays(seasonEnd, -7);
      out.push(makePhase("competition", cursor, compEnd, "Maintain competition readiness."));
      out.push(makePhase("transition", addDays(compEnd, 1), seasonEnd, "Active recovery and reflection."));
    }
  }

  return out;
}

function makePhase(type: PhaseType, start: string, end: string, focus: string): SeasonPhase {
  const meta = PHASE_META[type];
  return {
    id: uid(),
    type,
    label: meta.label,
    start_date: start,
    end_date: end,
    focus,
    volume_pct: meta.defaults.volume,
    intensity_pct: meta.defaults.intensity,
  };
}

/** Currently-active phase given today's date */
export function currentPhase(phases: SeasonPhase[], iso = todayISO()): SeasonPhase | null {
  return phases.find((p) => iso >= p.start_date && iso <= p.end_date) ?? null;
}
