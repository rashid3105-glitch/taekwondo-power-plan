// Active running program enrollment + weekly planned-vs-actual aggregation.
import { supabase } from "@/integrations/supabase/client";
import type { RunProgram, RunWeek } from "@/data/runningPrograms";

export interface RunningEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  goal_km: number;
  goal_seconds: number | null;
  weeks: number;
  per_week: number;
  level: string;
  plan: RunWeek[];
  start_date: string; // YYYY-MM-DD
  is_active: boolean;
}

export interface RunLogRow {
  entry_date: string;
  run_distance_km: number | null;
  run_duration_seconds: number | null;
  run_pace_seconds_per_km: number | null;
  run_calories: number | null;
}

export interface WeekPoint {
  label: string;
  weekStart: string;
  planned: number | null;
  actual: number;
  runs: number;
  isCurrent: boolean;
}

/** Monday-based start of the ISO week containing `d`. */
export function weekStart(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (copy.getDay() + 6) % 7; // Mon = 0
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function toISODate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** 1-based program week index for a given date (clamped to [1, weeks]). */
export function programWeekIndex(startDate: string, weeks: number, today = new Date()): number {
  const s = weekStart(parseDate(startDate)).getTime();
  const t = weekStart(today).getTime();
  const idx = Math.floor((t - s) / (7 * 86400000)) + 1;
  return Math.min(Math.max(idx, 1), weeks);
}

export async function fetchActiveEnrollment(userId: string): Promise<RunningEnrollment | null> {
  const { data } = await supabase
    .from("running_program_enrollments" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as any;
  return { ...row, plan: Array.isArray(row.plan) ? row.plan : [] } as RunningEnrollment;
}

export async function startProgram(userId: string, program: RunProgram): Promise<void> {
  await supabase
    .from("running_program_enrollments" as any)
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  const { error } = await supabase.from("running_program_enrollments" as any).insert({
    user_id: userId,
    program_id: program.id,
    goal_km: program.goalKm,
    weeks: program.weeks,
    per_week: program.perWeek,
    level: program.level,
    plan: program.plan as any,
    start_date: toISODate(new Date()),
    is_active: true,
  });
  if (error) throw error;
}

export async function stopProgram(enrollmentId: string): Promise<void> {
  const { error } = await supabase
    .from("running_program_enrollments" as any)
    .update({ is_active: false })
    .eq("id", enrollmentId);
  if (error) throw error;
}

export async function fetchRunLogs(userId: string, fromISO: string): Promise<RunLogRow[]> {
  const { data } = await supabase
    .from("diary_entries")
    .select("entry_date, run_distance_km, run_duration_seconds, run_pace_seconds_per_km, run_calories")
    .eq("user_id", userId)
    .eq("entry_type", "running")
    .gte("entry_date", fromISO)
    .order("entry_date", { ascending: true });
  return ((data ?? []) as any[]).filter((r) => Number(r.run_distance_km) > 0);
}

/**
 * Build one point per week. When an enrollment is given the series covers the
 * whole program (planned from the stored plan); otherwise the last N weeks of
 * actual data only.
 */
export function buildWeekSeries(
  logs: RunLogRow[],
  enrollment: RunningEnrollment | null,
  fallbackWeeks = 12,
  weekLabel = "W",
): WeekPoint[] {
  const actualByWeek = new Map<string, { km: number; runs: number }>();
  for (const r of logs) {
    const key = toISODate(weekStart(parseDate(r.entry_date)));
    const cur = actualByWeek.get(key) ?? { km: 0, runs: 0 };
    cur.km += Number(r.run_distance_km) || 0;
    cur.runs += 1;
    actualByWeek.set(key, cur);
  }

  const currentKey = toISODate(weekStart(new Date()));
  const points: WeekPoint[] = [];

  if (enrollment) {
    const start = weekStart(parseDate(enrollment.start_date));
    for (let i = 0; i < enrollment.weeks; i++) {
      const ws = new Date(start);
      ws.setDate(ws.getDate() + i * 7);
      const key = toISODate(ws);
      const a = actualByWeek.get(key);
      points.push({
        label: `${weekLabel}${i + 1}`,
        weekStart: key,
        planned: Number(enrollment.plan[i]?.totalKm ?? 0) || null,
        actual: Math.round((a?.km ?? 0) * 10) / 10,
        runs: a?.runs ?? 0,
        isCurrent: key === currentKey,
      });
    }
    return points;
  }

  const base = weekStart(new Date());
  for (let i = fallbackWeeks - 1; i >= 0; i--) {
    const ws = new Date(base);
    ws.setDate(ws.getDate() - i * 7);
    const key = toISODate(ws);
    const a = actualByWeek.get(key);
    points.push({
      label: `${ws.getDate()}/${ws.getMonth() + 1}`,
      weekStart: key,
      planned: null,
      actual: Math.round((a?.km ?? 0) * 10) / 10,
      runs: a?.runs ?? 0,
      isCurrent: key === currentKey,
    });
  }
  return points;
}

export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm) return "—";
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
