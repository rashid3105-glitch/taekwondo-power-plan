// Structured running programs. Sessions use compact neutral notation
// (distance / interval terms) so they read across languages. Localized
// scaffolding (labels, week header, level) lives in translations.

export type RunLevel = "beginner" | "intermediate" | "advanced";

export interface RunSession {
  day: number; // 1..7
  focus: string; // short focus label, e.g. "Easy", "Intervals", "Long"
  detail: string; // description of the workout
}

export interface RunWeek {
  week: number;
  totalKm: number;
  sessions: RunSession[];
}

export interface RunProgram {
  id: string;
  goalKm: number;
  titleKey: string; // used only for lookup fallback; actual label built in component
  weeks: number;
  perWeek: number;
  level: RunLevel;
  overview: string;
  plan: RunWeek[];
  goalSeconds?: number; // optional target finish time for the goal distance
}

// --- Helpers used by the custom builder -------------------------------------

/** mm:ss formatting of a pace/duration in seconds. */
export function fmtPace(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** hh:mm:ss (or mm:ss) formatting of a total duration in seconds. */
export function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Parses "50", "50:00" or "1:22:30" into seconds. Returns null when empty/invalid. */
export function parseGoalTime(input: string): number | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  const parts = raw.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  let sec = 0;
  if (nums.length === 1) sec = nums[0] * 60; // plain minutes
  else if (nums.length === 2) sec = nums[0] * 60 + nums[1];
  else if (nums.length === 3) sec = nums[0] * 3600 + nums[1] * 60 + nums[2];
  else return null;
  return sec > 0 ? sec : null;
}

export interface PaceZones {
  goal: number;
  easy: number;
  tempo: number;
  interval: number;
  long: number;
}

/** Derives training pace zones (sec/km) from a goal time over a goal distance. */
export function paceZones(goalKm: number, goalSeconds: number): PaceZones | null {
  if (!goalKm || !goalSeconds) return null;
  const goal = goalSeconds / goalKm;
  return {
    goal,
    easy: goal + 75,
    tempo: goal + 10,
    interval: Math.max(120, goal - 18),
    long: goal + 55,
  };
}

export function buildCustomProgram(
  goalKm: number,
  weeks: number,
  currentLongestKm: number,
  goalSeconds?: number | null,
): RunProgram {
  const w = Math.max(3, Math.min(20, Math.round(weeks)));
  const target = Math.max(1, goalKm);
  const start = Math.max(1, Math.min(target * 0.6, currentLongestKm || Math.max(1, target * 0.25)));
  const taperWeeks = target >= 30 ? 3 : target >= 15 ? 2 : 1;
  const buildWeeks = w - taperWeeks;
  const zones = goalSeconds ? paceZones(target, goalSeconds) : null;
  const z = (sec: number) => (zones ? ` @ ~${fmtPace(sec)}/km` : "");

  const plan: RunWeek[] = [];
  for (let i = 1; i <= w; i++) {
    let longRun: number;
    if (i <= buildWeeks) {
      const progress = (i - 1) / Math.max(1, buildWeeks - 1);
      longRun = start + progress * (target * 0.9 - start);
      // every 4th week = recovery
      if (i % 4 === 0) longRun *= 0.7;
    } else {
      const t = i - buildWeeks;
      longRun = target * (t === taperWeeks ? 0.35 : 0.65 - 0.1 * (t - 1));
    }
    longRun = Math.max(1, Math.round(longRun * 10) / 10);
    const easy = Math.max(1, Math.round(longRun * 0.5 * 10) / 10);
    const tempo = Math.max(1, Math.round(longRun * 0.4 * 10) / 10);
    const sessions: RunSession[] = [
      { day: 2, focus: "Easy", detail: `${easy} km easy conversational pace${z(zones?.easy ?? 0)}` },
      {
        day: 4,
        focus: target < 5 ? "Intervals" : "Tempo",
        detail: target < 5
          ? `Warm-up 1 km · 6×200 m fast${z(zones?.interval ?? 0)} / 200 m walk · 1 km easy`
          : `${tempo} km at comfortably hard pace${z(zones?.tempo ?? 0)}`,
      },
      { day: 6, focus: "Long", detail: `${longRun} km long run (relaxed pace)${z(zones?.long ?? 0)}` },
    ];
    if (target >= 10 && i <= buildWeeks) {
      sessions.splice(2, 0, { day: 5, focus: "Easy", detail: `${easy} km recovery jog${z(zones?.easy ?? 0)}` });
    }
    const totalKm = Math.round(sessions.reduce((acc, s) => acc + (parseFloat(s.detail) || 0), 0) * 10) / 10;
    plan.push({ week: i, totalKm, sessions });
  }

  return {
    id: `custom-${target}km-${w}w${goalSeconds ? `-${goalSeconds}s` : ""}`,
    goalKm: target,
    titleKey: "runningCustomTitle",
    weeks: w,
    perWeek: plan[0]?.sessions.length ?? 3,
    level: currentLongestKm >= target * 0.5 ? "intermediate" : "beginner",
    overview: goalSeconds
      ? `Custom progression toward ${target} km in ${w} weeks — target time ${fmtDuration(goalSeconds)} (${fmtPace(goalSeconds / target)}/km).`
      : `Custom progression toward ${target} km in ${w} weeks.`,
    plan,
    goalSeconds: goalSeconds ?? undefined,
  };
}


// --- Curated preset programs ------------------------------------------------

export const RUNNING_PROGRAMS: RunProgram[] = [
  // 1 km — Couch to 1 km
  {
    id: "run-1k",
    goalKm: 1,
    titleKey: "run1kTitle",
    weeks: 3,
    perWeek: 3,
    level: "beginner",
    overview: "From walking to running 1 km continuously in 3 weeks.",
    plan: [
      { week: 1, totalKm: 3, sessions: [
        { day: 1, focus: "Walk/Jog", detail: "8×(1 min jog / 2 min walk) — ~1.5 km" },
        { day: 3, focus: "Walk/Jog", detail: "8×(1 min jog / 2 min walk) — ~1.5 km" },
        { day: 5, focus: "Walk", detail: "20 min brisk walk" },
      ]},
      { week: 2, totalKm: 4, sessions: [
        { day: 1, focus: "Walk/Jog", detail: "6×(2 min jog / 1 min walk)" },
        { day: 3, focus: "Walk/Jog", detail: "5×(3 min jog / 1 min walk)" },
        { day: 5, focus: "Continuous", detail: "500 m continuous jog + walk finish" },
      ]},
      { week: 3, totalKm: 4, sessions: [
        { day: 1, focus: "Continuous", detail: "600 m jog + 400 m walk + 400 m jog" },
        { day: 3, focus: "Continuous", detail: "800 m jog continuous" },
        { day: 5, focus: "Goal run", detail: "1 km continuous — celebrate 🎉" },
      ]},
    ],
  },

  // 5 km — 8 week beginner-friendly
  {
    id: "run-5k",
    goalKm: 5,
    titleKey: "run5kTitle",
    weeks: 8,
    perWeek: 3,
    level: "beginner",
    overview: "Build up to a confident 5 km in 8 weeks.",
    plan: Array.from({ length: 8 }, (_, i) => {
      const week = i + 1;
      const long = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5][i];
      const easy = [1.5, 2, 2, 2.5, 3, 3, 3, 2][i];
      const speed = [1.5, 2, 2, 2.5, 3, 3, 3, 2][i];
      return {
        week,
        totalKm: Math.round((long + easy + speed) * 10) / 10,
        sessions: [
          { day: 2, focus: "Easy", detail: `${easy} km easy jog` },
          { day: 4, focus: "Intervals", detail: `Warm-up 1 km · 4-6×400 m fast / 200 m walk · cool-down 1 km` },
          { day: 6, focus: "Long", detail: `${long} km continuous` },
        ],
      };
    }),
  },

  // 10 km — 10 week intermediate
  {
    id: "run-10k",
    goalKm: 10,
    titleKey: "run10kTitle",
    weeks: 10,
    perWeek: 4,
    level: "intermediate",
    overview: "Ten weeks to a strong 10 km finish. Assumes you can jog 3 km continuously.",
    plan: Array.from({ length: 10 }, (_, i) => {
      const week = i + 1;
      const long = [4, 5, 6, 7, 6, 8, 9, 10, 7, 5][i];
      const tempo = [2, 2.5, 3, 3.5, 3, 4, 4.5, 5, 4, 3][i];
      const easy1 = 3;
      const easy2 = 3;
      return {
        week,
        totalKm: Math.round((long + tempo + easy1 + easy2) * 10) / 10,
        sessions: [
          { day: 2, focus: "Easy", detail: `${easy1} km easy` },
          { day: 3, focus: "Tempo", detail: `${tempo} km at comfortably hard pace` },
          { day: 5, focus: "Easy", detail: `${easy2} km recovery jog` },
          { day: 7, focus: "Long", detail: `${long} km long run` },
        ],
      };
    }),
  },

  // Half marathon — 12 weeks
  {
    id: "run-hm",
    goalKm: 21.1,
    titleKey: "runHmTitle",
    weeks: 12,
    perWeek: 4,
    level: "intermediate",
    overview: "Twelve weeks to half-marathon (21.1 km). Assumes ~10 km base fitness.",
    plan: [8, 10, 12, 10, 14, 16, 13, 18, 20, 16, 12, 8].map((long, i) => {
      const week = i + 1;
      const tempo = Math.round(long * 0.35 * 10) / 10;
      const easy1 = Math.round(long * 0.35 * 10) / 10;
      const easy2 = Math.round(long * 0.4 * 10) / 10;
      return {
        week,
        totalKm: Math.round((long + tempo + easy1 + easy2) * 10) / 10,
        sessions: [
          { day: 2, focus: "Easy", detail: `${easy1} km easy` },
          { day: 4, focus: "Tempo/Intervals", detail: `${tempo} km tempo or 6×800 m at 10K pace` },
          { day: 5, focus: "Easy", detail: `${easy2} km relaxed` },
          { day: 7, focus: "Long", detail: `${long} km long run` },
        ],
      };
    }),
  },

  // Marathon — 16 weeks
  {
    id: "run-marathon",
    goalKm: 42.2,
    titleKey: "runMarathonTitle",
    weeks: 16,
    perWeek: 4,
    level: "advanced",
    overview: "Sixteen weeks to marathon (42.2 km). Assumes half-marathon base fitness.",
    plan: [14, 16, 18, 14, 20, 22, 18, 24, 26, 20, 28, 30, 22, 18, 12, 8].map((long, i) => {
      const week = i + 1;
      const tempo = Math.round(long * 0.35 * 10) / 10;
      const easy1 = Math.round(long * 0.4 * 10) / 10;
      const easy2 = Math.round(long * 0.5 * 10) / 10;
      return {
        week,
        totalKm: Math.round((long + tempo + easy1 + easy2) * 10) / 10,
        sessions: [
          { day: 2, focus: "Easy", detail: `${easy1} km easy` },
          { day: 4, focus: "Tempo/Intervals", detail: `${tempo} km tempo or 5×1 km at HM pace` },
          { day: 5, focus: "Easy", detail: `${easy2} km recovery` },
          { day: 7, focus: "Long", detail: `${long} km long run` },
        ],
      };
    }),
  },
];
