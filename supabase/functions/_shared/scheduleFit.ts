// Deterministic schedule fitting + load guardrails for generated training plans.
// Keeps gym work anchored to the athlete's real club-session week and prevents
// programs that would make a fighter heavy or slow.

export const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_ALIASES: Record<string, string> = {
  mon: "Monday", man: "Monday", mandag: "Monday", montag: "Monday", lunes: "Monday",
  tue: "Tuesday", tir: "Tuesday", tirsdag: "Tuesday", tisdag: "Tuesday", dienstag: "Tuesday", martes: "Tuesday",
  wed: "Wednesday", ons: "Wednesday", onsdag: "Wednesday", mittwoch: "Wednesday", miercoles: "Wednesday",
  thu: "Thursday", tor: "Thursday", torsdag: "Thursday", donnerstag: "Thursday", jueves: "Thursday",
  fri: "Friday", fre: "Friday", fredag: "Friday", freitag: "Friday", viernes: "Friday",
  sat: "Saturday", lor: "Saturday", lørdag: "Saturday", lordag: "Saturday", samstag: "Saturday", sabado: "Saturday",
  sun: "Sunday", son: "Sunday", søndag: "Sunday", sondag: "Sunday", sonntag: "Sunday", domingo: "Sunday",
};

export function normalizeDay(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  const direct = DAY_ORDER.find((d) => d.toLowerCase() === v);
  if (direct) return direct;
  if (DAY_ALIASES[v]) return DAY_ALIASES[v];
  const key = Object.keys(DAY_ALIASES).find((k) => v.startsWith(k));
  return key ? DAY_ALIASES[key] : null;
}

export type SessionType = "tkd" | "gym" | "selftraining" | "recovery";

export interface DayPlanShape {
  day: string;
  types: SessionType[];
}

export interface ScheduleAnalysis {
  hasSchedule: boolean;
  days: DayPlanShape[];
  clubDays: string[];
  gymDays: string[];
  selfDays: string[];
  restDays: string[];
  /** Gym days that share the same calendar day with a club session. */
  doubleDays: string[];
  /** Days immediately followed by a club session — keep the load light. */
  dayBeforeClub: string[];
  clubSessionCount: number;
  gymSessionCount: number;
}

function sessionTypes(entry: any): SessionType[] {
  const raw: string[] = Array.isArray(entry?.sessions) && entry.sessions.length
    ? entry.sessions.map((s: any) => s?.type)
    : [entry?.type];
  const out: SessionType[] = [];
  for (const r of raw) {
    const v = typeof r === "string" ? r.toLowerCase() : "";
    if (v === "tkd" || v === "club" || v === "sport") out.push("tkd");
    else if (v === "gym" || v === "strength") out.push("gym");
    else if (v === "selftraining" || v === "self") out.push("selftraining");
    else if (v) out.push("recovery");
  }
  return out.length ? out : ["recovery"];
}

export function analyzeSchedule(weeklySchedule: unknown): ScheduleAnalysis {
  const list = Array.isArray(weeklySchedule) ? weeklySchedule : [];
  const byDay = new Map<string, SessionType[]>();
  for (const entry of list) {
    const day = normalizeDay((entry as any)?.day);
    if (!day) continue;
    const types = sessionTypes(entry);
    const existing = byDay.get(day) ?? [];
    byDay.set(day, Array.from(new Set([...existing, ...types])));
  }

  const days: DayPlanShape[] = DAY_ORDER.filter((d) => byDay.has(d)).map((d) => ({
    day: d,
    types: byDay.get(d)!,
  }));

  const clubDays = days.filter((d) => d.types.includes("tkd")).map((d) => d.day);
  const gymDays = days.filter((d) => d.types.includes("gym")).map((d) => d.day);
  const selfDays = days.filter((d) => d.types.includes("selftraining")).map((d) => d.day);
  const restDays = days
    .filter((d) => !d.types.some((t) => t !== "recovery"))
    .map((d) => d.day);
  const doubleDays = days
    .filter((d) => d.types.includes("tkd") && d.types.includes("gym"))
    .map((d) => d.day);

  const dayBeforeClub = days
    .filter((d) => {
      const idx = DAY_ORDER.indexOf(d.day);
      const next = DAY_ORDER[(idx + 1) % 7];
      return clubDays.includes(next) && !d.types.includes("tkd");
    })
    .map((d) => d.day);

  return {
    hasSchedule: days.length > 0,
    days,
    clubDays,
    gymDays,
    selfDays,
    restDays,
    doubleDays,
    dayBeforeClub,
    clubSessionCount: clubDays.length,
    gymSessionCount: gymDays.length,
  };
}

/** Prompt block that forces the generated week onto the athlete's real week. */
export function buildScheduleConstraints(a: ScheduleAnalysis, sportName: string, sessionLabel: string): string {
  if (!a.hasSchedule) {
    return `\n\nSCHEDULE FITTING: The athlete has not saved a weekly schedule. Assume 3-4 ${sessionLabel.toLowerCase()} per week in the evening and place at most 2 gym sessions on separate days, never the day before a club session.`;
  }
  const line = (label: string, arr: string[]) => `- ${label}: ${arr.length ? arr.join(", ") : "none"}`;
  return `\n\nSCHEDULE FITTING (HARD RULES — the plan must fit this exact week):
${line(`${sportName} club sessions`, a.clubDays)}
${line("Gym days", a.gymDays)}
${line("Self-training days", a.selfDays)}
${line("Rest days", a.restDays)}
${line("Days with both a club session and gym on the same day", a.doubleDays)}
${line("Days immediately before a club session", a.dayBeforeClub)}

1. Output exactly these days with exactly these session types — never move, add or remove a training day.
2. Never program gym work on a rest day. Rest days stay a single "recovery" session with an empty exercises array.
3. On double days (club + gym), the gym session is short: maximum 4 exercises, no leg-heavy grinding, and it goes BEFORE the club session in the day's session order.
4. On days immediately before a club session, keep lower-body load light so the athlete arrives fresh — mobility, trunk work, low-volume upper body.
5. The hardest lower-body session of the week goes on the day with the longest gap to the next club session.
6. Total gym exercises across the whole week must not exceed ${Math.max(8, a.gymSessionCount * 6 + a.selfDays.length * 5)}.`;
}

/** Prompt block that keeps the athlete fast, not bulky. */
export function buildLoadGuardrails(sportName: string, weightKg?: number | null): string {
  const weightLine = weightKg
    ? `\n- The athlete weighs about ${Math.round(weightKg)} kg and competes in a weight class: bodyweight must stay stable. Never program a mass-gain block.`
    : "";
  return `\n\nWEIGHT & SPEED GUARDRAILS (non-negotiable):
- The goal is power-to-weight, not size. Every gym session must make the athlete faster, not bigger.${weightLine}
- Main strength lifts: 2-5 sets of 2-5 reps at high speed intent, always stopping 2-3 reps short of failure. Never "to failure", never drop sets, never burnout finishers.
- No bodybuilding-style isolation volume (no 4x12 curls, no chest fly circuits, no dedicated arm or calf hypertrophy blocks).
- Maximum 6 exercises in a gym session and maximum 3 sets for anything that is not a main lift.
- At least one third of every gym session is speed, jumping, throwing or mobility work rather than loaded strength.
- Total weekly heavy lower-body sets (squat/deadlift pattern) must not exceed 8 across the whole week — the club ${sportName} sessions already load the legs hard.
- Keep sessions under 60 minutes and always end with mobility for kicking range.
- If the athlete's goals mention weight loss or making weight, add conditioning that is short and sharp (intervals) rather than long slow cardio, and say so in whyItMatters.`;
}

/** Post-generation reconciliation: force the model output back onto the real week. */
export function reconcilePlan(plan: any, a: ScheduleAnalysis): any {
  if (!plan || typeof plan !== "object" || !a.hasSchedule) return plan;
  const generated = Array.isArray(plan.weeklySchedule) ? plan.weeklySchedule : [];
  const genByDay = new Map<string, any>();
  for (const d of generated) {
    const day = normalizeDay(d?.dayOfWeek ?? d?.day);
    if (day && !genByDay.has(day)) genByDay.set(day, d);
  }

  const rebuilt = a.days.map((shape) => {
    const src = genByDay.get(shape.day);
    const srcSessions: any[] = Array.isArray(src?.sessions) ? src.sessions : [];
    const isDouble = shape.types.includes("tkd") && shape.types.includes("gym");
    const isPreClub = a.dayBeforeClub.includes(shape.day);

    const wanted: SessionType[] = shape.types.some((t) => t !== "recovery")
      ? shape.types.filter((t) => t !== "recovery")
      : ["recovery"];
    // Gym goes first on double days so the club session is never pre-fatigued last.
    wanted.sort((x, y) => (x === "gym" ? -1 : y === "gym" ? 1 : 0));

    const sessions = wanted.map((type) => {
      const match =
        srcSessions.find((s: any) => s?.type === type) ??
        (type === "recovery" ? null : srcSessions.find((s: any) => Array.isArray(s?.exercises) && s.exercises.length));
      const base = match ?? { type, label: null, focus: null, exercises: [] };
      let exercises: any[] = Array.isArray(base.exercises) ? base.exercises : [];

      if (type === "recovery" || type === "tkd") {
        exercises = type === "tkd" ? exercises.slice(0, 0) : [];
      } else {
        const cap = type === "gym" ? (isDouble ? 4 : 6) : 5;
        if (isPreClub && type === "gym") {
          // Drop the heaviest lower-body work the day before a club session.
          exercises = exercises.filter(
            (e: any) => !(e?.category === "strength" && /squat|deadlift|lunge|leg press|hip thrust|knæbøj|dødløft|udfald/i.test(String(e?.name ?? ""))),
          );
        }
        exercises = exercises.slice(0, cap).map((e: any) => ({
          ...e,
          sets: typeof e?.sets === "number" ? Math.min(e.sets, 5) : e?.sets,
        }));
      }

      return { ...base, type, exercises };
    });

    return { dayOfWeek: shape.day, sessions };
  });

  return { ...plan, weeklySchedule: rebuilt };
}
