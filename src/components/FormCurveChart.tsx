import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from "recharts";
import { Activity, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface FormCurveRow {
  user_id: string;
  week_start: string;
  load: number;
  strain: number;
  output: number;
  composite_score: number;
  overtraining_flag: boolean;
}

interface FormCurveChartProps {
  userId?: string; // defaults to authed user
}

const COLOR_LOAD = "hsl(190, 95%, 50%)";
const COLOR_STRAIN = "hsl(0, 80%, 55%)";
const COLOR_OUTPUT = "hsl(160, 80%, 45%)";
const COLOR_COMPOSITE = "hsl(280, 70%, 60%)";

export function FormCurveChart({ userId }: FormCurveChartProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [data, setData] = useState<FormCurveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [userId]);

  async function load() {
    setLoading(true);
    let target = userId;
    if (!target) {
      const { data: { user } } = await supabase.auth.getUser();
      target = user?.id;
    }
    if (!target) { setLoading(false); return; }
    setResolvedUserId(target);

    const { data: rows } = await supabase
      .from("form_curve_weekly")
      .select("*")
      .eq("user_id", target)
      .order("week_start", { ascending: true })
      .limit(12);
    setData((rows || []) as FormCurveRow[]);
    setLoading(false);
  }

  async function recompute() {
    if (!resolvedUserId) return;
    setRecomputing(true);
    try {
      const { error } = await supabase.functions.invoke("recompute-form-curve", {
        body: { user_id: resolvedUserId, weeks: 12 },
      });
      if (error) throw error;
      await load();
      toast({ title: t("formCurveRecomputed") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setRecomputing(false);
    }
  }

  const chartData = data.map((r) => ({
    week: new Date(r.week_start).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weekStart: r.week_start,
    Load: Math.round(r.load),
    Strain: Math.round(r.strain * 10) / 10,
    Output: Math.round(r.output),
    Form: Math.round(r.composite_score),
    Risk: r.overtraining_flag,
  }));

  const latest = data[data.length - 1];
  const atRisk = !!latest?.overtraining_flag;
  const latestForm = latest ? Math.round(latest.composite_score) : 0;

  // Find risk windows for visual highlight
  const riskBands: { x1: string; x2: string }[] = [];
  let bandStart: string | null = null;
  for (const row of chartData) {
    if (row.Risk && !bandStart) bandStart = row.week;
    else if (!row.Risk && bandStart) {
      riskBands.push({ x1: bandStart, x2: row.week });
      bandStart = null;
    }
  }
  if (bandStart) riskBands.push({ x1: bandStart, x2: chartData[chartData.length - 1].week });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              {t("formCurveTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t("formCurveDescription")}</p>
          </div>
          <div className="flex items-center gap-2">
            {latest && (
              <div className="text-right">
                <div className="text-xl font-extrabold text-foreground">{latestForm}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("formCurveForm")}</div>
              </div>
            )}
            {atRisk && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t("formCurveAtRisk")}
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={recompute} disabled={recomputing}>
              {recomputing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        ) : chartData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t("formCurveNoData")}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={recompute} disabled={recomputing}>
              {recomputing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              {t("formCurveCompute")}
            </Button>
          </div>
        ) : (
          <>
            {atRisk && (
              <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">{t("formCurveOvertrainingTitle")}</div>
                  <div className="text-destructive/80">{t("formCurveOvertrainingBody")}</div>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {riskBands.map((b, i) => (
                  <ReferenceArea key={i} x1={b.x1} x2={b.x2} strokeOpacity={0} fill="hsl(0, 80%, 55%)" fillOpacity={0.08} />
                ))}
                <Area type="monotone" dataKey="Form" stroke={COLOR_COMPOSITE} fill={COLOR_COMPOSITE} fillOpacity={0.18} strokeWidth={2} />
                <Line type="monotone" dataKey="Load" stroke={COLOR_LOAD} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Strain" stroke={COLOR_STRAIN} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Output" stroke={COLOR_OUTPUT} strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[10px] uppercase tracking-wider">
              <div className="text-muted-foreground"><span className="font-bold text-foreground" style={{ color: COLOR_LOAD }}>{Math.round(latest?.load || 0)}</span> {t("formCurveLoad")}</div>
              <div className="text-muted-foreground"><span className="font-bold" style={{ color: COLOR_STRAIN }}>{Math.round((latest?.strain || 0) * 10) / 10}</span> {t("formCurveStrain")}</div>
              <div className="text-muted-foreground"><span className="font-bold" style={{ color: COLOR_OUTPUT }}>{Math.round(latest?.output || 0)}</span> {t("formCurveOutput")}</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
