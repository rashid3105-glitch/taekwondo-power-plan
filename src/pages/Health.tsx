import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Activity, Footprints, RefreshCw, Info, FileDown, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageMeta } from "@/components/PageMeta";
import {
  Bar, LineChart, Line, ComposedChart,
  ReferenceArea, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { healthNorms, compareToBand } from "@/lib/healthNorms";
import { getAgeNorms, classify } from "@/lib/healthAgeNorms";
import { Moon, HeartPulse, Waves, Heart } from "lucide-react";
import { ManualHealthEntryCard } from "@/components/health/ManualHealthEntryCard";
import { HealthSourceGuide } from "@/components/health/HealthSourceGuide";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import jsPDF from "jspdf";

interface DailyRow {
  summary_date: string;
  steps: number | null;
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  baseline_hr_7d: number | null;
  baseline_hrv_7d: number | null;
}

export default function Health() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const [steps, setSteps] = useState<DailyRow[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [show, setShow] = useState({ steps: true, sleep: true, rhr: true, hrv: true });
  const [whyOpen, setWhyOpen] = useState(false);

  async function runResync({ silent }: { silent: boolean }) {
    if (syncing) return;
    // Require an authenticated session — the edge function rejects anon calls.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (!silent) toast.error(t("healthResyncError"));
      return;
    }
    setSyncing(true);
    if (!silent) haptics.tap();
    try {
      const { data, error } = await supabase.functions.invoke("resync-health", {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (!silent) {
        const n = (data as { days_synced?: number })?.days_synced ?? 0;
        const msg = (t("healthResyncSuccess")).replace("{n}", String(n));
        toast.success(msg);
      }
      try { localStorage.setItem("health:lastAutoSync", String(Date.now())); } catch {}
      await load();
    } catch (e) {
      console.error("resync-health failed", e);
      if (!silent) toast.error(t("healthResyncError"));
    } finally {
      setSyncing(false);
    }
  }

  async function handleResync() {
    await runResync({ silent: false });
  }

  async function downloadAIReport() {
    if (reporting) return;
    if (steps.length === 0) {
      toast.error(t("healthReportNoData"));
      return;
    }
    setReporting(true);
    haptics.tap();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error(t("healthResyncError")); return; }

      // Pull profile age
      const { data: profile } = await supabase
        .from("profiles")
        .select("age, birth_date, display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      let age: number | null = (profile?.age as number | null) ?? null;
      if (age == null && profile?.birth_date) {
        const b = new Date(profile.birth_date as string);
        if (!isNaN(b.getTime())) {
          const diff = Date.now() - b.getTime();
          age = Math.floor(diff / (365.25 * 86400 * 1000));
        }
      }
      const norms = getAgeNorms(age);

      // Last 14 days window
      const cutoff = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
      const last14 = steps.filter(r => r.summary_date >= cutoff);

      const avg = (vals: (number | null)[]) => {
        const ns = vals.filter((v): v is number => v != null && Number.isFinite(v));
        return ns.length ? Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10 : null;
      };
      const last = (vals: (number | null)[]) => {
        for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return Number(vals[i]);
        return null;
      };

      const stepsVals = last14.map(r => r.steps);
      const sleepVals = last14.map(r => r.sleep_minutes != null ? Math.round((r.sleep_minutes / 60) * 10) / 10 : null);
      const rhrVals = last14.map(r => r.resting_hr);
      const hrvVals = last14.map(r => r.hrv_rmssd);

      const stepsAvg = avg(stepsVals);
      const sleepAvg = avg(sleepVals);
      const rhrAvg = avg(rhrVals);
      const hrvAvg = avg(hrvVals);

      const metrics = [
        { name: "Steps", unit: "", avg14: stepsAvg, last: last(stepsVals), daysWithData: stepsVals.filter(v => v != null && v > 0).length, ageNorm: norms.steps, verdict: classify(stepsAvg ?? undefined, norms.steps.bandLow, norms.steps.bandHigh) },
        { name: "Sleep", unit: "h", avg14: sleepAvg, last: last(sleepVals), daysWithData: sleepVals.filter(v => v != null).length, ageNorm: norms.sleep, verdict: classify(sleepAvg ?? undefined, norms.sleep.bandLow, norms.sleep.bandHigh) },
        { name: "Resting HR", unit: " bpm", avg14: rhrAvg, last: last(rhrVals), daysWithData: rhrVals.filter(v => v != null).length, ageNorm: norms.rhr, verdict: classify(rhrAvg ?? undefined, norms.rhr.bandLow, norms.rhr.bandHigh) },
        { name: "HRV (RMSSD)", unit: " ms", avg14: hrvAvg, last: last(hrvVals), daysWithData: hrvVals.filter(v => v != null).length, ageNorm: norms.hrv, verdict: classify(hrvAvg ?? undefined, norms.hrv.bandLow, norms.hrv.bandHigh) },
      ];

      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-health-report", {
        body: { age, ageLabel: norms.ageLabel, metrics, language: locale },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (aiError) throw aiError;
      const report = (aiData as any)?.report || {};

      const pdfLabels = {
        title: t("healthPdfTitle"),
        averages: t("healthPdfAverages"),
        summary: t("recoverySummary" as any) || "Summary",
        keyFindings: t("healthPdfKeyFindings"),
        recommendations: t("healthPdfRecommendations"),
        watchOuts: t("healthPdfWatchOuts"),
      };

      // Build PDF
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxW = pageW - margin * 2;
      let y = 18;
      const ensure = (need: number) => { if (y + need > pageH - 15) { doc.addPage(); y = 18; } };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(pdfLabels.title, margin, y); y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(110);
      const subject = profile?.display_name ? String(profile.display_name) : "Athlete";
      doc.text(`${subject}  •  Age ${age ?? "—"} (peer ${norms.ageLabel})  •  Generated ${new Date().toLocaleDateString(locale)}`, margin, y);
      y += 8;
      doc.setTextColor(0);

      // Metrics table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(pdfLabels.averages, margin, y); y += 6;

      doc.setFontSize(9);
      const cols = [
        { label: "Metric", w: 38 },
        { label: "14-d avg", w: 28 },
        { label: "Latest", w: 24 },
        { label: "Days", w: 14 },
        { label: "Peer norm (band / target)", w: 60 },
        { label: "Status", w: 16 },
      ];
      let x = margin;
      doc.setFillColor(240, 240, 240); doc.rect(margin, y - 4, maxW, 6, "F");
      cols.forEach(c => { doc.text(c.label, x + 1, y); x += c.w; });
      y += 4;
      doc.setFont("helvetica", "normal");

      const fmt = (v: number | null, unit: string) => v == null ? "—" : `${v}${unit}`;
      const verdictLabel: Record<string, string> = { in: "OK", low: "Low", high: "High" };
      metrics.forEach(m => {
        ensure(8);
        x = margin;
        doc.setTextColor(0);
        const norm = `${m.ageNorm.bandLow}–${m.ageNorm.bandHigh}${m.unit} / ${m.ageNorm.target}${m.unit}`;
        const row = [m.name, fmt(m.avg14, m.unit), fmt(m.last, m.unit), String(m.daysWithData), norm, m.verdict ? verdictLabel[m.verdict] : "—"];
        if (m.verdict === "in") doc.setTextColor(20, 130, 60);
        else if (m.verdict) doc.setTextColor(190, 90, 30);
        row.forEach((cell, i) => {
          if (i !== 5) doc.setTextColor(0);
          doc.text(cell, x + 1, y + 4);
          x += cols[i].w;
        });
        y += 6;
        doc.setDrawColor(230); doc.line(margin, y, margin + maxW, y);
        y += 1;
      });
      doc.setTextColor(0);
      y += 4;

      const writeSection = (title: string, body: string | string[]) => {
        ensure(14);
        doc.setFont("helvetica", "bold"); doc.setFontSize(12);
        doc.text(title, margin, y); y += 5;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        const items = Array.isArray(body) ? body : [body];
        items.filter(Boolean).forEach(item => {
          const lines = doc.splitTextToSize(`• ${item}`, maxW);
          ensure(lines.length * 5 + 2);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 1;
        });
        y += 3;
      };

      if (report.summary) writeSection(pdfLabels.summary, [report.summary]);
      if (Array.isArray(report.highlights) && report.highlights.length) writeSection(pdfLabels.keyFindings, report.highlights);
      if (Array.isArray(report.recommendations) && report.recommendations.length) writeSection(pdfLabels.recommendations, report.recommendations);
      if (Array.isArray(report.watchOuts) && report.watchOuts.length) writeSection(pdfLabels.watchOuts, report.watchOuts);

      ensure(10);
      doc.setFontSize(8); doc.setTextColor(130);
      const disclaimer = "Norms are general-population reference ranges (NSF sleep, AHA resting HR, RMSSD HRV literature). Trained athletes often sit below the RHR band and above the HRV band — that is usually a positive sign. This report is informational, not medical advice.";
      doc.text(doc.splitTextToSize(disclaimer, maxW), margin, y);

      doc.save(`health-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t("healthReportReady"));
    } catch (e) {
      console.error("downloadAIReport failed", e);
      toast.error(t("healthReportError"));
    } finally {
      setReporting(false);
    }
  }

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    // Read both sources in parallel: summary table (manual + mirrored)
    // and the raw iPhone health_data table (in case the mirror trigger
    // is briefly behind).
    const [summaryRes, healthRes] = await Promise.all([
      supabase.from("wearable_daily_summary")
        .select("summary_date,steps,sleep_minutes,resting_hr,hrv_rmssd,baseline_hr_7d,baseline_hrv_7d")
        .eq("user_id", user.id)
        .gte("summary_date", since)
        .order("summary_date", { ascending: true }),
      supabase.from("health_data")
        .select("date,steps,sleep_hours,heart_rate_avg,hrv")
        .eq("user_id", user.id)
        .gte("date", since)
        .order("date", { ascending: true }),
    ]);

    // Merge by date. Priority rule: a real (non-null, non-zero for steps/sleep)
    // value from `health_data` wins over a 0/null in `wearable_daily_summary`,
    // because the iPhone is the source of truth and the summary table can lag
    // (or have been wiped by an old recompute).
    const byDate = new Map<string, DailyRow>();

    function nonZeroOrNull(v: number | null | undefined): number | null {
      if (v == null) return null;
      const n = Number(v);
      return n > 0 ? n : null;
    }

    for (const r of summaryRes.data ?? []) {
      byDate.set(r.summary_date, {
        summary_date: r.summary_date,
        steps: nonZeroOrNull(r.steps as number | null),
        sleep_minutes: nonZeroOrNull(r.sleep_minutes as number | null),
        resting_hr: r.resting_hr as number | null,
        hrv_rmssd: r.hrv_rmssd as number | null,
        baseline_hr_7d: r.baseline_hr_7d as number | null,
        baseline_hrv_7d: r.baseline_hrv_7d as number | null,
      });
    }
    for (const h of healthRes.data ?? []) {
      const existing = byDate.get(h.date) ?? {
        summary_date: h.date,
        steps: null, sleep_minutes: null, resting_hr: null, hrv_rmssd: null,
        baseline_hr_7d: null, baseline_hrv_7d: null,
      };
      const hSteps = h.steps != null ? Number(h.steps) : null;
      const hSleepMin = h.sleep_hours != null ? Math.round(Number(h.sleep_hours) * 60) : null;
      byDate.set(h.date, {
        ...existing,
        // Prefer the bigger of the two so a fresher iPhone value never gets
        // hidden behind a stale 0 in the summary table.
        steps: Math.max(existing.steps ?? 0, hSteps && hSteps > 0 ? hSteps : 0) || null,
        sleep_minutes: existing.sleep_minutes ?? (hSleepMin && hSleepMin > 0 ? hSleepMin : null),
        resting_hr: existing.resting_hr ?? (h.heart_rate_avg as number | null),
        hrv_rmssd: existing.hrv_rmssd ?? (h.hrv as number | null),
      });
    }

    // Only render days that have at least one real metric — no walls of zeros.
    const merged = Array.from(byDate.values())
      .filter(
        (r) =>
          (r.steps != null && r.steps > 0) ||
          (r.sleep_minutes != null && r.sleep_minutes > 0) ||
          r.resting_hr != null ||
          r.hrv_rmssd != null,
      )
      .sort((a, b) => a.summary_date.localeCompare(b.summary_date));
    setSteps(merged);
    setLoaded(true);
  }

  useEffect(() => { void load(); }, []);

  // Auto-sync from iPhone on page open, throttled to once / 15 min per device
  useEffect(() => {
    let cancelled = false;
    const THROTTLE_MS = 15 * 60 * 1000;
    try {
      const last = Number(localStorage.getItem("health:lastAutoSync") || 0);
      if (Date.now() - last < THROTTLE_MS) return;
    } catch {}
    const timer = setTimeout(() => {
      if (cancelled) return;
      void runResync({ silent: true });
    }, 800);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepData = useMemo(() => steps.map(r => ({
    date: r.summary_date.slice(5),
    steps: r.steps ?? 0,
  })), [steps]);

  const stepsTotals = useMemo(() => {
    const last7 = steps.slice(-7).map(r => r.steps ?? 0);
    const today = last7[last7.length - 1] ?? 0;
    const yday = last7[last7.length - 2] ?? 0;
    const avg7 = last7.length ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;
    const total7 = last7.reduce((a, b) => a + b, 0);
    return { today, yday, avg7, delta: today - yday, total7 };
  }, [steps]);

  const sleepData = useMemo(
    () => steps.map(r => ({
      date: r.summary_date.slice(5),
      hours: r.sleep_minutes != null ? Math.round((r.sleep_minutes / 60) * 10) / 10 : null,
    })),
    [steps],
  );
  const rhrData = useMemo(
    () => steps.map(r => ({
      date: r.summary_date.slice(5),
      rhr: r.resting_hr != null ? Math.round(Number(r.resting_hr)) : null,
      baseline: r.baseline_hr_7d != null ? Math.round(Number(r.baseline_hr_7d)) : null,
    })),
    [steps],
  );
  const hrvData = useMemo(
    () => steps.map(r => ({
      date: r.summary_date.slice(5),
      hrv: r.hrv_rmssd != null ? Math.round(Number(r.hrv_rmssd) * 10) / 10 : null,
      baseline: r.baseline_hrv_7d != null ? Math.round(Number(r.baseline_hrv_7d) * 10) / 10 : null,
    })),
    [steps],
  );

  function lastNonNull<T extends keyof DailyRow>(field: T): number | null {
    for (let i = steps.length - 1; i >= 0; i--) {
      const v = steps[i][field];
      if (v != null) return Number(v);
    }
    return null;
  }
  function avgLast7(field: keyof DailyRow): number | null {
    const vals = steps.slice(-7).map(r => r[field]).filter(v => v != null).map(Number);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  const sleepLast = lastNonNull("sleep_minutes");
  const rhrLast = lastNonNull("resting_hr");
  const hrvLast = lastNonNull("hrv_rmssd");
  const sleepAvg7 = avgLast7("sleep_minutes");
  const rhrAvg7 = avgLast7("resting_hr");
  const hrvAvg7 = avgLast7("hrv_rmssd");
  const rhrBase = lastNonNull("baseline_hr_7d");
  const hrvBase = lastNonNull("baseline_hrv_7d");
  const hasSleep = steps.some(r => r.sleep_minutes != null);
  const hasRhr = steps.some(r => r.resting_hr != null);
  const hasHrv = steps.some(r => r.hrv_rmssd != null);
  const hasSteps = steps.some(r => r.steps != null && r.steps > 0);

  // Build normalized 7-day overview chart data (0-100 per metric)
  const last7 = useMemo(() => steps.slice(-7), [steps]);
  const overviewData = useMemo(() => {
    const max = (vals: (number | null)[]) => {
      const nums = vals.filter((v): v is number => v != null && Number.isFinite(v));
      return nums.length ? Math.max(...nums) : 0;
    };
    const stepsMax = Math.max(max(last7.map(r => r.steps)), 1);
    const sleepMax = Math.max(max(last7.map(r => r.sleep_minutes)), 1);
    const rhrMax = Math.max(max(last7.map(r => r.resting_hr)), 1);
    const hrvMax = Math.max(max(last7.map(r => r.hrv_rmssd)), 1);
    return last7.map(r => ({
      date: r.summary_date.slice(5),
      Steps: r.steps != null ? Math.round((r.steps / stepsMax) * 100) : null,
      Sleep: r.sleep_minutes != null ? Math.round((r.sleep_minutes / sleepMax) * 100) : null,
      RHR: r.resting_hr != null ? Math.round((Number(r.resting_hr) / rhrMax) * 100) : null,
      HRV: r.hrv_rmssd != null ? Math.round((Number(r.hrv_rmssd) / hrvMax) * 100) : null,
    }));
  }, [last7]);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto">
      <PageMeta title="Health · Sportstalent" description="Log sleep, resting HR, HRV and steps to track recovery." noindex />
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
      </Button>

      <div className="flex items-start gap-3 mb-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{t("healthPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("healthPageSubtitleManual")}
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResync}
            disabled={syncing}
            className="h-11 sm:h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {t("healthResyncButton")}
          </Button>
          <Button
            size="sm"
            onClick={downloadAIReport}
            disabled={reporting || steps.length === 0}
            className="h-11 sm:h-9"
          >
            <FileDown className={`h-4 w-4 mr-2 ${reporting ? "animate-pulse" : ""}`} />
            {reporting ? t("healthReportLoading") : t("healthReportButton")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        {t("healthResyncHint")}
      </p>

      {/* Why these metrics matter */}
      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {t("healthWhyTitle" as any) || "Why these numbers matter"}
          </h3>
          <ul className="space-y-2.5">
            {[
              { icon: Moon, label: t("recoverySleep"), text: "Sleep is when your body repairs muscles and stores energy. 7–9 hours helps you train harder tomorrow." },
              { icon: Heart, label: t("recoveryRhr"), text: "A lower resting heart rate means your heart is working efficiently. Seeing it drop over time is a great sign of improving fitness." },
              { icon: Activity, label: "HRV", text: "HRV measures how well your body recovers from stress. A higher number means you're ready to perform." },
              { icon: Footprints, label: "Steps", text: "Daily movement outside training keeps your body active and supports recovery." },
            ].map(({ icon: Icon, label, text }) => (
              <li key={label} className="flex gap-2.5 items-start">
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-bold">{label}</span>
                  <span className="text-muted-foreground"> — {text}</span>
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Manual entry */}
      <ManualHealthEntryCard onSaved={() => void load()} />


      {/* 7-day overview with per-metric toggles */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("healthChart7dTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {([
              { key: "steps", color: "hsl(var(--primary))", label: t("healthStepsTitle") },
              { key: "sleep", color: "hsl(220, 70%, 55%)", label: t("healthSleepTitle") },
              { key: "rhr", color: "hsl(0, 75%, 55%)", label: t("healthRhrTitle") },
              { key: "hrv", color: "hsl(160, 75%, 45%)", label: t("healthHrvTitle") },
            ] as const).map(m => {
              const active = show[m.key];
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setShow(s => ({ ...s, [m.key]: !s[m.key] }))}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    active ? "bg-foreground/5 border-border" : "opacity-40 border-dashed border-border"
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: m.color }} />
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overviewData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                <RTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {show.steps && <Line type="monotone" dataKey="Steps" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />}
                {show.sleep && <Line type="monotone" dataKey="Sleep" stroke="hsl(220, 70%, 55%)" strokeWidth={2} dot={false} connectNulls />}
                {show.rhr && <Line type="monotone" dataKey="RHR" stroke="hsl(0, 75%, 55%)" strokeWidth={2} dot={false} connectNulls />}
                {show.hrv && <Line type="monotone" dataKey="HRV" stroke="hsl(160, 75%, 45%)" strokeWidth={2} dot={false} connectNulls />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Values normalized 0–100% within the 7-day window so all metrics share one axis.
          </p>
        </CardContent>
      </Card>


      {/* Steps */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Footprints className="h-4 w-4 text-primary" /> {t("healthStepsTitle")}
            <MetricInfo text={t("healthTooltipSteps")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasSteps ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <Stat label={t("healthStepsToday")} value={stepsTotals.today.toLocaleString()} />
                <Stat label={t("healthStepsAvg7")} value={stepsTotals.avg7.toLocaleString()} />
                <Stat label={t("healthStepsWeekTotal")} value={stepsTotals.total7.toLocaleString()} />
                <Stat
                  label={t("healthStepsDelta")}
                  value={`${stepsTotals.delta >= 0 ? "+" : ""}${stepsTotals.delta.toLocaleString()}`}
                  tone={stepsTotals.delta >= 0 ? "good" : "bad"}
                />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stepData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }}
                      formatter={(v: any) => {
                        const n = Number(v);
                        const verdict = compareToBand(n, healthNorms.steps.bandLow, healthNorms.steps.bandHigh);
                        const label = verdict === "below" ? t("healthVsNormBelow") : verdict === "above" ? t("healthVsNormAbove") : t("healthVsNormIn");
                        return [`${n.toLocaleString()} (${label})`, t("healthStepsTitle")];
                      }}
                    />
                    <ReferenceArea y1={healthNorms.steps.bandLow} y2={healthNorms.steps.bandHigh} fill="hsl(var(--primary))" fillOpacity={0.06} />
                    <ReferenceLine y={healthNorms.steps.target} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.7} />
                    <Bar dataKey="steps" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <NormLegend
                bandLabel={`${t("healthNormBand")}: ${healthNorms.steps.bandLow.toLocaleString()}–${healthNorms.steps.bandHigh.toLocaleString()}`}
                targetLabel={`${t("healthNormTarget")}: ${healthNorms.steps.target.toLocaleString()}`}
              />
            </>
          ) : (
            <EmptyMetric label={t("healthStepsEmpty")} />
          )}
        </CardContent>
      </Card>

      {/* Sleep */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" /> {t("healthSleepTitle")}
            <MetricInfo text={t("healthTooltipSleep")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasSleep ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat
                  label={t("healthSleepLast")}
                  value={sleepLast != null ? `${(sleepLast / 60).toFixed(1)}h` : "—"}
                />
                <Stat
                  label={t("healthSleepAvg7")}
                  value={sleepAvg7 != null ? `${(sleepAvg7 / 60).toFixed(1)}h` : "—"}
                />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sleepData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="h" domain={[0, 12]} />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }}
                      formatter={(v: any) => {
                        if (v == null) return ["—", t("healthSleepTitle")];
                        const verdict = compareToBand(Number(v), healthNorms.sleep.bandLow, healthNorms.sleep.bandHigh);
                        const label = verdict === "below" ? t("healthVsNormBelow") : verdict === "above" ? t("healthVsNormAbove") : t("healthVsNormIn");
                        return [`${v}h (${label})`, t("healthSleepTitle")];
                      }}
                    />
                    <ReferenceArea y1={healthNorms.sleep.bandLow} y2={healthNorms.sleep.bandHigh} fill="hsl(220, 70%, 55%)" fillOpacity={0.08} />
                    <ReferenceLine y={healthNorms.sleep.target} stroke="hsl(220, 70%, 55%)" strokeDasharray="4 4" strokeOpacity={0.7} />
                    <Bar dataKey="hours" fill="hsl(220, 70%, 55%)" radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <NormLegend
                bandLabel={`${t("healthNormBand")}: ${healthNorms.sleep.bandLow}–${healthNorms.sleep.bandHigh}h`}
                targetLabel={`${t("healthNormTarget")}: ${healthNorms.sleep.target}h`}
              />
            </>
          ) : (
            <EmptyMetric label={t("healthSleepEmptyManual")} />
          )}
        </CardContent>
      </Card>

      {/* Resting HR */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" /> {t("healthRhrTitle")}
            <MetricInfo text={t("healthTooltipRhr")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasRhr ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label={t("healthRhrLast")} value={rhrLast != null ? `${Math.round(rhrLast)} bpm` : "—"} />
                <Stat label={t("healthRhrAvg7")} value={rhrAvg7 != null ? `${Math.round(rhrAvg7)} bpm` : "—"} />
                <Stat
                  label={t("healthRhrDelta")}
                  value={rhrLast != null && rhrBase != null ? `${rhrLast - rhrBase >= 0 ? "+" : ""}${Math.round(rhrLast - rhrBase)}` : "—"}
                  tone={rhrLast != null && rhrBase != null ? (rhrLast - rhrBase <= 0 ? "good" : "bad") : undefined}
                />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={rhrData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[40, 90]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit=" bpm" />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }}
                      formatter={(v: any, name: any) => {
                        if (v == null) return ["—", name];
                        if (name === "baseline") return [`${v} bpm`, "7d baseline"];
                        const verdict = compareToBand(Number(v), healthNorms.rhr.bandLow, healthNorms.rhr.bandHigh);
                        const label = verdict === "below" ? t("healthVsNormBelow") : verdict === "above" ? t("healthVsNormAbove") : t("healthVsNormIn");
                        return [`${v} bpm (${label})`, t("healthRhrTitle")];
                      }}
                    />
                    <ReferenceArea y1={healthNorms.rhr.bandLow} y2={healthNorms.rhr.bandHigh} fill="hsl(0, 75%, 55%)" fillOpacity={0.07} />
                    <ReferenceLine y={healthNorms.rhr.target} stroke="hsl(0, 75%, 55%)" strokeDasharray="4 4" strokeOpacity={0.7} />
                    <Line type="monotone" dataKey="rhr" stroke="hsl(0, 75%, 55%)" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <NormLegend
                bandLabel={`${t("healthNormBand")}: ${healthNorms.rhr.bandLow}–${healthNorms.rhr.bandHigh} bpm`}
                targetLabel={`${t("healthNormTarget")}: ${healthNorms.rhr.target} bpm`}
              />
            </>
          ) : (
            <EmptyMetric label={t("healthRhrEmptyManual")} />
          )}
        </CardContent>
      </Card>

      {/* HRV */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Waves className="h-4 w-4 text-primary" /> {t("healthHrvTitle")}
            <MetricInfo text={t("healthTooltipHrv")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasHrv ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label={t("healthHrvLast")} value={hrvLast != null ? `${Math.round(hrvLast)} ms` : "—"} />
                <Stat label={t("healthHrvAvg7")} value={hrvAvg7 != null ? `${Math.round(hrvAvg7)} ms` : "—"} />
                <Stat
                  label={t("healthHrvDelta")}
                  value={hrvLast != null && hrvBase != null ? `${hrvLast - hrvBase >= 0 ? "+" : ""}${Math.round(hrvLast - hrvBase)}` : "—"}
                  tone={hrvLast != null && hrvBase != null ? (hrvLast - hrvBase >= 0 ? "good" : "bad") : undefined}
                />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={hrvData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 120]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit=" ms" />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }}
                      formatter={(v: any, name: any) => {
                        if (v == null) return ["—", name];
                        if (name === "baseline") return [`${v} ms`, "7d baseline"];
                        const verdict = compareToBand(Number(v), healthNorms.hrv.bandLow, healthNorms.hrv.bandHigh);
                        const label = verdict === "below" ? t("healthVsNormBelow") : verdict === "above" ? t("healthVsNormAbove") : t("healthVsNormIn");
                        return [`${v} ms (${label})`, t("healthHrvTitle")];
                      }}
                    />
                    <ReferenceArea y1={healthNorms.hrv.bandLow} y2={healthNorms.hrv.bandHigh} fill="hsl(160, 75%, 45%)" fillOpacity={0.08} />
                    <ReferenceLine y={healthNorms.hrv.target} stroke="hsl(160, 75%, 45%)" strokeDasharray="4 4" strokeOpacity={0.7} />
                    <Line type="monotone" dataKey="hrv" stroke="hsl(160, 75%, 45%)" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <NormLegend
                bandLabel={`${t("healthNormBand")}: ${healthNorms.hrv.bandLow}–${healthNorms.hrv.bandHigh} ms`}
                targetLabel={`${t("healthNormTarget")}: ${healthNorms.hrv.target} ms`}
              />
            </>
          ) : (
            <EmptyMetric label={t("healthHrvEmptyManual")} />
          )}
        </CardContent>
      </Card>

      {!loaded && <p className="text-center text-sm text-muted-foreground py-6">Loading…</p>}
    </div>
    </TooltipProvider>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-500" : tone === "bad" ? "text-rose-500" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function EmptyMetric({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border px-3 py-3">
      {label}
    </p>
  );
}

function MetricInfo({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" aria-label="info">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function NormLegend({ bandLabel, targetLabel }: { bandLabel: string; targetLabel: string }) {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-2 rounded-sm bg-foreground/10 border border-border" />
        {bandLabel}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-4 border-t-2 border-dashed border-foreground/40" />
        {targetLabel}
      </span>
    </div>
  );
}
