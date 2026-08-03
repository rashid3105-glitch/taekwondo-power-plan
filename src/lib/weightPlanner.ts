// Pure logic for the weight planner module — no UI, unit-testable.

export interface WeightPoint {
  log_date: string; // YYYY-MM-DD
  weight_kg: number;
}

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "extra";

export const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "high", "extra"];

/** Multiplier applied on top of the training-session based activity factor. */
export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 0.92,
  light: 0.97,
  moderate: 1,
  high: 1.06,
  extra: 1.12,
};

export interface WeightGoal {
  id?: string;
  user_id?: string;
  start_weight_kg: number;
  start_date: string;
  target_weight_kg: number;
  target_date: string | null;
  rate_kg_per_week: number;
  direction: "loss" | "maintain" | "gain";
  set_by?: string | null;
  is_active?: boolean;
  activity_level?: ActivityLevel | null;
  sex?: "female" | "male" | null;
  motivations?: string[];
  challenges?: string[];
  onboarded_at?: string | null;
}

export const KCAL_PER_KG = 7700;
export const SAFE_RATE_KG_PER_WEEK = 0.7;
export const RATE_PRESETS = [0.25, 0.5, 0.7] as const;

const DAY = 86400000;

export function toDate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Ascending-by-date copy of the logs. */
export function sortAsc(logs: WeightPoint[]): WeightPoint[] {
  return [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
}

/** 7-day (default) trailing moving average over calendar days. */
export function movingAverage(logs: WeightPoint[], window = 7): Array<WeightPoint & { avg: number }> {
  const asc = sortAsc(logs);
  return asc.map((p) => {
    const from = toDate(p.log_date).getTime() - (window - 1) * DAY;
    const inWindow = asc.filter((q) => {
      const t = toDate(q.log_date).getTime();
      return t >= from && t <= toDate(p.log_date).getTime();
    });
    const avg = inWindow.reduce((s, q) => s + Number(q.weight_kg), 0) / (inWindow.length || 1);
    return { ...p, avg: Math.round(avg * 100) / 100 };
  });
}

/** Actual kg/week trend from the last `days` of moving-average data. */
export function currentTrendKgPerWeek(logs: WeightPoint[], days = 21): number | null {
  const ma = movingAverage(logs);
  if (ma.length < 2) return null;
  const last = ma[ma.length - 1];
  const cutoff = toDate(last.log_date).getTime() - days * DAY;
  const window = ma.filter((p) => toDate(p.log_date).getTime() >= cutoff);
  if (window.length < 2) return null;
  const first = window[0];
  const spanDays = daysBetween(first.log_date, last.log_date);
  if (spanDays <= 0) return null;
  return ((last.avg - first.avg) / spanDays) * 7;
}

export function inferDirection(startKg: number, targetKg: number): WeightGoal["direction"] {
  const diff = targetKg - startKg;
  if (Math.abs(diff) < 0.3) return "maintain";
  return diff < 0 ? "loss" : "gain";
}

/** Rate implied by target date, in kg/week (absolute value). */
export function rateFromTargetDate(goal: Pick<WeightGoal, "start_weight_kg" | "target_weight_kg" | "start_date" | "target_date">): number | null {
  if (!goal.target_date) return null;
  const days = daysBetween(goal.start_date, goal.target_date);
  if (days <= 0) return null;
  return Math.abs(goal.target_weight_kg - goal.start_weight_kg) / (days / 7);
}

/** Daily calorie delta (negative = deficit) matching the planned rate. */
export function dailyCalorieDelta(goal: Pick<WeightGoal, "rate_kg_per_week" | "direction">): number {
  if (goal.direction === "maintain") return 0;
  const perDay = (goal.rate_kg_per_week * KCAL_PER_KG) / 7;
  return Math.round(goal.direction === "loss" ? -perDay : perDay);
}

/** Mifflin–St Jeor + activity factor. Height is optional; falls back to a TKD-athlete estimate. */
export function estimateMaintenanceCalories(opts: {
  weightKg: number;
  age?: number | null;
  sessionsPerWeek?: number | null;
}): number {
  const { weightKg, age, sessionsPerWeek } = opts;
  const a = age && age > 0 ? age : 20;
  // Height-free approximation: BMR ≈ 24 kcal per kg lean-ish bodyweight, age-adjusted.
  const bmr = weightKg * 24 * (a < 18 ? 1.08 : a > 40 ? 0.94 : 1);
  const sessions = sessionsPerWeek && sessionsPerWeek > 0 ? sessionsPerWeek : 3;
  const activity = 1.35 + Math.min(sessions, 10) * 0.05;
  return Math.round((bmr * activity) / 10) * 10;
}

export interface Projection {
  etaDate: string | null;
  daysRemaining: number | null;
  /** Positive = ahead of plan (in days), negative = behind. */
  aheadDays: number | null;
  trendKgPerWeek: number | null;
  onTrack: boolean | null;
}

export function project(goal: WeightGoal, logs: WeightPoint[]): Projection {
  const ma = movingAverage(logs);
  const currentAvg = ma.length ? ma[ma.length - 1].avg : goal.start_weight_kg;
  const remainingKg = goal.target_weight_kg - currentAvg;
  const trend = currentTrendKgPerWeek(logs);

  let etaDate: string | null = null;
  let daysRemaining: number | null = null;

  if (Math.abs(remainingKg) < 0.15) {
    etaDate = todayISO();
    daysRemaining = 0;
  } else if (trend && Math.sign(trend) === Math.sign(remainingKg) && Math.abs(trend) > 0.02) {
    daysRemaining = Math.round((remainingKg / trend) * 7);
    etaDate = new Date(Date.now() + daysRemaining * DAY).toISOString().slice(0, 10);
  } else if (goal.rate_kg_per_week > 0) {
    const signedRate = goal.direction === "loss" ? -goal.rate_kg_per_week : goal.rate_kg_per_week;
    if (Math.sign(signedRate) === Math.sign(remainingKg)) {
      daysRemaining = Math.round((remainingKg / signedRate) * 7);
      etaDate = new Date(Date.now() + daysRemaining * DAY).toISOString().slice(0, 10);
    }
  }

  let aheadDays: number | null = null;
  if (etaDate && goal.target_date) aheadDays = daysBetween(etaDate, goal.target_date);

  return {
    etaDate,
    daysRemaining,
    aheadDays,
    trendKgPerWeek: trend,
    onTrack: aheadDays === null ? null : aheadDays >= 0,
  };
}

/** Percentage of the way from start weight to target weight (0-100). */
export function progressPercent(goal: WeightGoal, currentKg: number): number {
  const total = goal.target_weight_kg - goal.start_weight_kg;
  if (Math.abs(total) < 0.01) return 100;
  const done = currentKg - goal.start_weight_kg;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

export type SafetyLevel = "ok" | "warn" | "danger";

export interface SafetyCheck {
  level: SafetyLevel;
  /** Translation keys for the messages to show. */
  reasons: Array<"rateTooFast" | "fivePercent" | "minorCaution" | "lessThanWeek">;
}

export function assessSafety(opts: {
  currentKg: number;
  targetKg: number;
  days: number;
  age?: number | null;
}): SafetyCheck {
  const { currentKg, targetKg, days, age } = opts;
  const cutKg = Math.max(0, currentKg - targetKg);
  const reasons: SafetyCheck["reasons"] = [];
  let level: SafetyLevel = "ok";

  if (cutKg > 0 && days > 0) {
    const rate = cutKg / (days / 7);
    if (rate > SAFE_RATE_KG_PER_WEEK) {
      reasons.push("rateTooFast");
      level = "warn";
    }
    if (currentKg > 0 && cutKg / currentKg > 0.05 && days < 14) {
      reasons.push("fivePercent");
      level = "danger";
    }
    if (days < 7 && cutKg > 1.5) {
      reasons.push("lessThanWeek");
      level = "danger";
    }
  }
  if (age != null && age < 18 && cutKg > 0) {
    reasons.push("minorCaution");
    if (level === "ok") level = "warn";
  }
  return { level, reasons };
}

/** Milestones every 0.5 kg toward the target. */
export function milestones(goal: WeightGoal, currentKg: number): Array<{ weight: number; reached: boolean }> {
  const out: Array<{ weight: number; reached: boolean }> = [];
  const down = goal.target_weight_kg < goal.start_weight_kg;
  const step = 0.5 * (down ? -1 : 1);
  const count = Math.min(40, Math.floor(Math.abs(goal.target_weight_kg - goal.start_weight_kg) / 0.5));
  for (let i = 1; i <= count; i++) {
    const w = Math.round((goal.start_weight_kg + step * i) * 10) / 10;
    out.push({ weight: w, reached: down ? currentKg <= w : currentKg >= w });
  }
  return out;
}

/** Straight forecast line from today's moving average to the goal date. */
export function forecastSeries(goal: WeightGoal, logs: WeightPoint[], points = 12): Array<{ log_date: string; forecast: number }> {
  const ma = movingAverage(logs);
  const startKg = ma.length ? ma[ma.length - 1].avg : goal.start_weight_kg;
  const startDate = ma.length ? ma[ma.length - 1].log_date : todayISO();
  const endDate = goal.target_date;
  if (!endDate) return [];
  const totalDays = daysBetween(startDate, endDate);
  if (totalDays <= 0) return [];
  const out: Array<{ log_date: string; forecast: number }> = [];
  for (let i = 0; i <= points; i++) {
    const d = Math.round((totalDays * i) / points);
    const date = new Date(toDate(startDate).getTime() + d * DAY).toISOString().slice(0, 10);
    const w = startKg + ((goal.target_weight_kg - startKg) * i) / points;
    out.push({ log_date: date, forecast: Math.round(w * 100) / 100 });
  }
  return out;
}

/** Count of consecutive days (ending today or yesterday) with a weigh-in. */
export function weighInStreak(logs: WeightPoint[]): number {
  const set = new Set(logs.map((l) => l.log_date));
  let streak = 0;
  const start = set.has(todayISO()) ? 0 : 1;
  for (let i = start; i < 400; i++) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    if (set.has(d)) streak++;
    else if (i > start) break;
    else if (i === start && !set.has(d)) break;
  }
  return streak;
}
