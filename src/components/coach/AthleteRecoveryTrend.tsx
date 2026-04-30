import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Watch } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface RecoveryTrendDay {
  summary_date: string;
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  steps: number | null;
  baseline_hr_7d: number | null;
  baseline_hrv_7d: number | null;
}

async function getAthleteRecoveryTrend(athleteId: string, days: number): Promise<RecoveryTrendDay[]> {
  const { data, error } = await supabase.rpc("get_athlete_recovery_trend", {
    _athlete_id: athleteId,
    _days: days,
  });
  if (error) return [];
  return (data ?? []) as RecoveryTrendDay[];
}

interface Props { athleteId: string }

/**
 * Compact 7-day sparkline trio (Sleep / RHR / HRV) for a coach. Renders nothing
 * when the athlete has no wearable data, so it stays out of the way for the
 * majority of athletes who haven't connected a watch.
 */
export function AthleteRecoveryTrend({ athleteId }: Props) {
  const { t } = useLanguage();
  const [days, setDays] = useState<RecoveryTrendDay[] | null>(null);

  useEffect(() => {
    (async () => setDays(await getAthleteRecoveryTrend(athleteId, 7)))();
  }, [athleteId]);

  if (!days || days.length === 0) return null;

  const sleepData = days.map((d) => ({ x: d.summary_date, y: d.sleep_minutes ? d.sleep_minutes / 60 : null }));
  const rhrData = days.map((d) => ({ x: d.summary_date, y: d.resting_hr }));
  const hrvData = days.map((d) => ({ x: d.summary_date, y: d.hrv_rmssd }));

  const last = days[days.length - 1];
  const lowRecovery = !!(
    (last.resting_hr && last.baseline_hr_7d && last.resting_hr - last.baseline_hr_7d > 5) ||
    (last.hrv_rmssd && last.baseline_hrv_7d && last.baseline_hrv_7d - last.hrv_rmssd > 8) ||
    (last.sleep_minutes && last.sleep_minutes < 6 * 60)
  );

  const Mini = ({ data, color }: { data: any[]; color: string }) => (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11, padding: 4 }}
          formatter={(v: any) => (v == null ? "—" : Number(v).toFixed(0))}
          labelFormatter={(l) => new Date(l as string).toLocaleDateString()}
        />
        <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {t("coachRecoveryTrendTitle")}
          <Watch className="h-3 w-3 text-muted-foreground ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lowRecovery && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-2">
            <AlertTriangle className="h-3.5 w-3.5" /> {t("coachRecoveryLowFlag")}
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t("recoverySleep")}</div>
            <div className="text-sm font-bold">{last.sleep_minutes ? (last.sleep_minutes / 60).toFixed(1) + "h" : "—"}</div>
            <Mini data={sleepData} color="hsl(var(--primary))" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t("recoveryRhr")}</div>
            <div className="text-sm font-bold">{last.resting_hr ? Math.round(last.resting_hr) : "—"}</div>
            <Mini data={rhrData} color="hsl(var(--destructive))" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">HRV</div>
            <div className="text-sm font-bold">{last.hrv_rmssd ? Math.round(last.hrv_rmssd) : "—"}</div>
            <Mini data={hrvData} color="hsl(var(--accent-foreground))" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
