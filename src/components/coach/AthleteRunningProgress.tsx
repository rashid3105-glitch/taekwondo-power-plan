import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Footprints } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart, Bar, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  buildWeekSeries, fetchActiveEnrollment, fetchRunLogs, programWeekIndex, toISODate, weekStart,
  type RunningEnrollment, type WeekPoint,
} from "@/lib/runningProgram";

interface RunEntry {
  entry_date: string;
  run_distance_km: number;
  run_pace_seconds_per_km: number;
  run_calories: number;
}

type Metric = "distance" | "pace" | "calories";

const formatPace = (s: number) => {
  if (!s) return "-";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

interface Props {
  athleteId: string;
}

export function AthleteRunningProgress({ athleteId }: Props) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<RunEntry[]>([]);
  const [metric, setMetric] = useState<Metric>("distance");
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<RunningEnrollment | null>(null);
  const [series, setSeries] = useState<WeekPoint[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("diary_entries")
        .select("entry_date, run_distance_km, run_pace_seconds_per_km, run_calories")
        .eq("user_id", athleteId)
        .eq("entry_type", "running")
        .not("run_distance_km", "is", null)
        .order("entry_date", { ascending: true })
        .limit(60);
      setEntries(((data ?? []) as any[]).filter((e) => e.run_distance_km > 0));

      const enr = await fetchActiveEnrollment(athleteId);
      setEnrollment(enr);
      if (enr) {
        const logs = await fetchRunLogs(athleteId, enr.start_date);
        setSeries(buildWeekSeries(logs, enr, 12, "U"));
      } else {
        const back = new Date();
        back.setDate(back.getDate() - 12 * 7);
        const logs = await fetchRunLogs(athleteId, toISODate(weekStart(back)));
        setSeries(buildWeekSeries(logs, null, 12, "U"));
      }
      setLoading(false);
    })();
  }, [athleteId]);

  if (loading || (entries.length === 0 && !enrollment)) return null;

  const totalDistance = entries.reduce((a, e) => a + (e.run_distance_km ?? 0), 0);
  const totalCalories = entries.reduce((a, e) => a + (e.run_calories ?? 0), 0);
  const bestPace = entries
    .map((e) => e.run_pace_seconds_per_km)
    .filter(Boolean)
    .reduce((a, b) => (b < a ? b : a), Infinity);

  const chartData = entries.map((e) => ({
    date: new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    distance: e.run_distance_km ?? 0,
    pace: e.run_pace_seconds_per_km ?? 0,
    calories: e.run_calories ?? 0,
  }));

  const METRICS: { key: Metric; label: string; color: string; format: (v: number) => string }[] = [
    { key: "distance", label: t("runDistanceKm") || "Distance", color: "#10b981", format: (v) => `${v.toFixed(1)} km` },
    { key: "pace", label: t("runPace") || "Pace", color: "var(--accent-hex)", format: (v) => `${formatPace(v)}/km` },
    { key: "calories", label: t("runCalories") || "Kalorier", color: "#f59e0b", format: (v) => `${v} kcal` },
  ];

  const active = METRICS.find((m) => m.key === metric)!;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Footprints className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold">{t("runningProgress") || "Løbefremgang"}</h3>
        {enrollment && (
          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-600">
            {enrollment.goal_km} km · {t("runningWeekLabel")} {programWeekIndex(enrollment.start_date, enrollment.weeks)}/{enrollment.weeks}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{entries.length} {t("runTotalRuns") || "løb"}</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center">
          <div className="text-sm font-bold text-emerald-600">{totalDistance.toFixed(1)} km</div>
          <div className="text-[10px] text-muted-foreground">{t("runTotalDistance") || "Total distance"}</div>
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5 text-center">
          <div className="text-sm font-bold text-primary">{bestPace !== Infinity ? formatPace(bestPace) : "-"}/km</div>
          <div className="text-[10px] text-muted-foreground">{t("runBestPace") || "Bedste pace"}</div>
        </div>
        <div className="rounded-lg bg-amber-500/10 p-2.5 text-center">
          <div className="text-sm font-bold text-amber-600">{totalCalories.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">{t("runTotalCalories") || "Kalorier"}</div>
        </div>
      </div>

      {/* Planned vs actual per week */}
      {series.length > 0 && (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number, name: string) => [`${v} km`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="actual" name={t("runProgActual")} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              {enrollment && (
                <Line type="monotone" dataKey="planned" name={t("runProgPlanned")} stroke="#0ea5e9" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2 }} connectNulls />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metric toggle */}
      <div className="flex gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "flex-1 text-[11px] font-semibold rounded-lg py-1.5 border transition-colors",
              metric === m.key
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
            style={metric === m.key ? { background: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => metric === "pace" ? formatPace(v) : String(v)}
              reversed={metric === "pace"} // lower pace = better
            />
            <Tooltip
              formatter={(v: number) => [active.format(v), active.label]}
              labelStyle={{ fontSize: 11 }}
              contentStyle={{ fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={active.color}
              strokeWidth={2}
              dot={{ r: 3, fill: active.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
