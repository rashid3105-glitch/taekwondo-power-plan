/**
 * Compute per-week exercise progression based on periodization phase.
 * Pure, deterministic — no AI, no DB. Used by PlanProgramGrid to render
 * a multi-week view from a single base weeklySchedule.
 */

export interface PeriodizationPhase {
  phase: string;
  startWeek: number;
  endWeek: number;
  volumePercent?: number;
  intensityPercent?: number;
}

export type PhaseKind =
  | "accumulation"
  | "intensification"
  | "peaking"
  | "deload"
  | "adaptation"
  | "competition"
  | "recovery"
  | "other";

export function classifyPhase(phaseName: string): PhaseKind {
  const k = (phaseName || "").toLowerCase();
  if (k.includes("deload")) return "deload";
  if (k.includes("recovery")) return "recovery";
  if (k.includes("peak")) return "peaking";
  if (k.includes("competition")) return "competition";
  if (k.includes("intensif")) return "intensification";
  if (k.includes("adaptation")) return "adaptation";
  if (k.includes("accumul")) return "accumulation";
  return "other";
}

export const PHASE_TONE: Record<PhaseKind, string> = {
  accumulation: "bg-primary/10 text-primary border-primary/30",
  intensification: "bg-accent/10 text-accent border-accent/30",
  peaking: "bg-explosive/10 text-explosive border-explosive/30",
  deload: "bg-speed/10 text-speed border-speed/30",
  adaptation: "bg-muted text-muted-foreground border-muted",
  competition: "bg-explosive/10 text-explosive border-explosive/30",
  recovery: "bg-speed/10 text-speed border-speed/30",
  other: "bg-secondary text-foreground border-border",
};

export function findPhaseForWeek(
  periodization: PeriodizationPhase[] | undefined,
  weekIndex: number // 0-based
): { phase: PeriodizationPhase | null; kind: PhaseKind; weekInPhase: number } {
  const w = weekIndex + 1;
  const phase = periodization?.find((p) => w >= p.startWeek && w <= p.endWeek) || null;
  return {
    phase,
    kind: phase ? classifyPhase(phase.phase) : "other",
    weekInPhase: phase ? w - phase.startWeek + 1 : 1,
  };
}

export interface ProgressionVariant {
  sets: number;
  repsLabel: string;
  /** load delta % vs base week. Positive = heavier, negative = lighter. */
  loadDeltaPct: number;
  /** Compact chip text shown on the cell, or null if base week. */
  chip: string | null;
}

function parseFirstNumber(s: any): number | null {
  if (s == null) return null;
  const m = String(s).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/**
 * Derive sets/reps/load for an exercise on a given week.
 * Week 0 = base, returned as-is with chip = null.
 */
export function computeWeekVariant(
  exercise: { sets?: number; reps?: string | number; category?: string },
  weekIndex: number,
  periodization?: PeriodizationPhase[]
): ProgressionVariant {
  const baseSets = Number(exercise.sets ?? 3);
  const baseReps = parseFirstNumber(exercise.reps) ?? 0;
  const repsStr = exercise.reps != null ? String(exercise.reps) : String(baseReps);

  if (weekIndex === 0) {
    return { sets: baseSets, repsLabel: repsStr, loadDeltaPct: 0, chip: null };
  }

  const { kind, weekInPhase } = findPhaseForWeek(periodization, weekIndex);
  let sets = baseSets;
  let reps = baseReps;
  let loadDeltaPct = 0;

  switch (kind) {
    case "accumulation":
    case "adaptation":
      loadDeltaPct = Math.min(weekInPhase * 2.5, 7.5);
      break;
    case "intensification":
      sets = baseSets + 1;
      reps = Math.max(1, Math.round(baseReps * 0.7));
      loadDeltaPct = 7.5 + Math.min(weekInPhase * 1.5, 5);
      break;
    case "peaking":
    case "competition":
      reps = Math.max(1, Math.round(baseReps * 0.5));
      loadDeltaPct = 12 + Math.min(weekInPhase * 1.5, 5);
      break;
    case "deload":
    case "recovery":
      sets = Math.max(1, baseSets - 1);
      loadDeltaPct = -20;
      break;
    default:
      loadDeltaPct = weekIndex * 2;
  }

  const repsLabel = baseReps > 0 ? String(reps) : repsStr;

  // Chip: prefer load delta if exercise looks loaded; else show reps/sets delta
  const cat = (exercise.category || "").toLowerCase();
  const isBodyweight = cat === "mobility" || cat === "plyometric";

  let chip: string | null = null;
  if (!isBodyweight && loadDeltaPct !== 0) {
    chip = `${loadDeltaPct > 0 ? "+" : ""}${Math.round(loadDeltaPct)}%`;
  } else if (sets !== baseSets) {
    const d = sets - baseSets;
    chip = `${d > 0 ? "+" : ""}${d} set${Math.abs(d) === 1 ? "" : "s"}`;
  } else if (reps !== baseReps) {
    const d = reps - baseReps;
    chip = `${d > 0 ? "+" : ""}${d} rep${Math.abs(d) === 1 ? "" : "s"}`;
  }

  return { sets, repsLabel, loadDeltaPct, chip };
}
