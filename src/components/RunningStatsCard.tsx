// Running progress panel on the athlete progress dashboard:
// planned (program) vs. actual km per week + quick run logging.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Footprints, Plus, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { LogRunDialog } from "@/components/running/LogRunDialog";
import {
  buildWeekSeries, fetchActiveEnrollment, fetchRunLogs, formatPace, programWeekIndex,
  stopProgram, toISODate, weekStart,
  type RunLogRow, type RunningEnrollment, type WeekPoint,
} from "@/lib/runningProgram";

export function RunningStatsCard() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<RunLogRow[]>([]);
  const [enrollment, setEnrollment] = useState<RunningEnrollment | null>(null);
  const [series, setSeries] = useState<WeekPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const enr = await fetchActiveEnrollment(user.id);
    const fallbackFrom = new Date();
    fallbackFrom.setDate(fallbackFrom.getDate() - 12 * 7);
    const from = enr ? enr.start_date : toISODate(weekStart(fallbackFrom));
    const rows = await fetchRunLogs(user.id, from);
    setEnrollment(enr);
    setLogs(rows);
    setSeries(buildWeekSeries(rows, enr, 12, `${t("runningWeekLabel")?.[0] ?? "W"}`));
    setLoading(false);
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return null;

  const hasData = logs.length > 0 || !!enrollment;
  if (!hasData) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-emerald-500" />
          <h3 className="font-bold text-card-foreground">{t("diaryTypeRunning")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("runProgNoProgram")}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />{t("runLogTitle")}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/library/running"><BookOpen className="h-4 w-4 mr-1" />{t("runProgChoose")}</Link>
          </Button>
        </div>
        <LogRunDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
      </div>
    );
  }

  const totalKm = logs.reduce((sum, r) => sum + (Number(r.run_distance_km) || 0), 0);
  const paces = logs.map((r) => Number(r.run_pace_seconds_per_km)).filter((p) => p > 0);
  const bestPace = paces.length ? Math.min(...paces) : 0;
  const longest = logs.reduce((m, r) => Math.max(m, Number(r.run_distance_km) || 0), 0);

  const weekIdx = enrollment ? programWeekIndex(enrollment.start_date, enrollment.weeks) : 0;
  const currentPoint = series.find((p) => p.isCurrent);
  const plannedTotal = series.reduce((s, p) => s + (p.planned ?? 0), 0);
  const completionPct = plannedTotal > 0 ? Math.min(100, Math.round((totalKm / plannedTotal) * 100)) : 0;
  const currentWeekPlan = enrollment?.plan?.[weekIdx - 1];

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Footprints className="h-5 w-5 text-emerald-500" />
        <h3 className="font-bold text-card-foreground">{t("diaryTypeRunning")}</h3>
        {enrollment && (
          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-600">
            {enrollment.goal_km} km · {t("runningWeekLabel")} {weekIdx}/{enrollment.weeks}
          </span>
        )}
        <div className="ml-auto flex gap-1.5">
          <Button size="sm" variant="outline" className="h-8" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />{t("runLogTitle")}
          </Button>
        </div>
      </div>

      {enrollment && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("runProgCompletion")}: {completionPct}% · {totalKm.toFixed(1)} / {plannedTotal.toFixed(0)} km
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-card border border-border p-3 text-center">
          <div className="text-lg font-bold text-card-foreground">{(currentPoint?.actual ?? 0).toFixed(1)} km</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runProgThisWeek")}</div>
        </div>
        <div className="rounded-lg bg-card border border-border p-3 text-center">
          <div className="text-lg font-bold text-card-foreground">{currentPoint?.planned ? `${currentPoint.planned} km` : "—"}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runProgPlanned")}</div>
        </div>
        <div className="rounded-lg bg-card border border-border p-3 text-center">
          <div className="text-lg font-bold text-card-foreground">{bestPace ? `${formatPace(bestPace)}/km` : "—"}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runBestPace")}</div>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
          <div className="text-lg font-bold text-emerald-600">{longest.toFixed(1)} km</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runProgLongest")}</div>
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} unit="" />
            <Tooltip
              contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              formatter={(v: number, name: string) => [`${v} km`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="actual" name={t("runProgActual")} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
            {enrollment && (
              <Line
                type="monotone"
                dataKey="planned"
                name={t("runProgPlanned")}
                stroke="#0ea5e9"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 2 }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {enrollment && currentWeekPlan && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-card-foreground">
              {t("runningWeekLabel")} {weekIdx} — {t("runProgSessions")}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {currentPoint?.runs ?? 0}/{currentWeekPlan.sessions.length} {t("runProgSessionsDone")}
            </span>
          </div>
          <ul className="space-y-1">
            {currentWeekPlan.sessions.map((s, i) => (
              <li key={i} className="text-[12px] text-card-foreground/85 flex gap-2">
                <span className="font-semibold text-emerald-600 shrink-0 w-16">{s.focus}</span>
                <span className="flex-1">{s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {enrollment && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/library/running"><BookOpen className="h-4 w-4 mr-1" />{t("runProgChoose")}</Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={async () => { await stopProgram(enrollment.id); void load(); }}
          >
            {t("runProgStop")}
          </Button>
        </div>
      )}

      <LogRunDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
    </div>
  );
}
