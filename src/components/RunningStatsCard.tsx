// Last-30-days running summary card shown at the bottom of the progress dashboard.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Footprints } from "lucide-react";

interface RunRow {
  run_distance_km: number | null;
  run_duration_seconds: number | null;
  run_pace_seconds_per_km: number | null;
  run_calories: number | null;
  entry_date: string;
}

function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RunningStatsCard() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("diary_entries")
        .select("run_distance_km, run_duration_seconds, run_pace_seconds_per_km, run_calories, entry_date")
        .eq("user_id", user.id)
        .eq("entry_type", "running")
        .gte("entry_date", from)
        .order("entry_date", { ascending: true });
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, []);

  if (loading || rows.length === 0) return null;

  const totalKm = rows.reduce((sum, r) => sum + (Number(r.run_distance_km) || 0), 0);
  const totalRuns = rows.length;
  const totalCalories = rows.reduce((sum, r) => sum + (Number(r.run_calories) || 0), 0);
  const paces = rows
    .map((r) => Number(r.run_pace_seconds_per_km))
    .filter((p) => p > 0);
  const bestPace = paces.length ? Math.min(...paces) : 0;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <Footprints className="h-5 w-5 text-emerald-500" />
        <h3 className="font-bold text-foreground">{t("diaryTypeRunning")}</h3>
        <span className="ml-auto text-[10px] font-bold text-muted-foreground uppercase tracking-wide">30d</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-card border border-border p-3 text-center">
          <div className="text-lg font-bold text-foreground">{totalKm.toFixed(1)} km</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runTotalDistance")}</div>
        </div>
        <div className="rounded-lg bg-card border border-border p-3 text-center">
          <div className="text-lg font-bold text-foreground">{totalRuns}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runTotalRuns")}</div>
        </div>
        <div className="rounded-lg bg-card border border-border p-3 text-center">
          <div className="text-lg font-bold text-foreground">{bestPace ? `${formatPace(bestPace)}/km` : "—"}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runBestPace")}</div>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
          <div className="text-lg font-bold text-emerald-600">{totalCalories} kcal</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runTotalCalories")}</div>
        </div>
      </div>
    </div>
  );
}
