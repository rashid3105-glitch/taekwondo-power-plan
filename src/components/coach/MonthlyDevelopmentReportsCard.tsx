import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Download, Loader2, Sparkles, Trash2 } from "lucide-react";

interface Props {
  athleteId: string;
  athleteName: string;
}

interface ReportRow {
  id: string;
  period_year: number;
  period_month: number;
  summary_text: string | null;
  metrics: any;
  locale: string | null;
  generated_at: string;
}

const MONTH_LABEL_KEYS = [
  "monthJanuary", "monthFebruary", "monthMarch", "monthApril",
  "monthMay", "monthJune", "monthJuly", "monthAugust",
  "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
] as const;

export function MonthlyDevelopmentReportsCard({ athleteId, athleteName }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState<ReportRow | null>(null);

  useEffect(() => {
    void load();
    // Clear the unread badge for this coach
    void supabase.rpc("mark_monthly_reports_seen" as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("monthly_development_reports" as any)
      .select("id, period_year, period_month, summary_text, metrics, locale, generated_at")
      .eq("athlete_user_id", athleteId)
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });
    setRows((data as any[]) || []);
    setLoading(false);
  }

  async function generateLastMonth() {
    setGenerating(true);
    try {
      const now = new Date();
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const { data, error } = await supabase.functions.invoke("generate-monthly-report", {
        body: { athlete_user_id: athleteId, year, month, force: true },
      });
      if (error) throw error;
      toast({ title: t("monthlyDevReportReady") });
      await load();
      if ((data as any)?.id) {
        const r = rows.find((x) => x.id === (data as any).id);
        if (r) setOpen(r);
      }
    } catch (e: any) {
      toast({ title: t("error"), description: String(e?.message || e), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function deleteReport(r: ReportRow) {
    if (!confirm(t("monthlyDevReportDeleteConfirm"))) return;
    const { error } = await supabase
      .from("monthly_development_reports" as any)
      .delete()
      .eq("id", r.id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("monthlyDevReportDeleted") });
    setOpen(null);
    await load();
  }

  function monthLabel(m: number) {
    return t(MONTH_LABEL_KEYS[m - 1]);
  }

  async function exportPdf(r: ReportRow) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(t("monthlyDevReportsTitle"), margin, y);
    y += 22;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${athleteName} — ${monthLabel(r.period_month)} ${r.period_year}`, margin, y);
    y += 18;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${t("monthlyReportGeneratedAt")}: ${new Date(r.generated_at).toLocaleString(locale)}`, margin, y);
    y += 18;
    doc.setTextColor(0);
    doc.setFontSize(11);
    const text = r.summary_text || "";
    const lines = doc.splitTextToSize(text, width);
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 15;
    }
    doc.save(`${athleteName.replace(/\s+/g, "_")}-${r.period_year}-${String(r.period_month).padStart(2, "0")}.pdf`);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-sm flex items-center gap-2 text-card-foreground">
          <ClipboardList className="h-4 w-4 text-primary" /> {t("monthlyDevReportsTitle")}
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={generateLastMonth}
          disabled={generating}
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
          {t("monthlyDevReportGenerate")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("monthlyDevReportsEmpty")}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpen(r)}
                className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors p-3 text-xs flex items-center justify-between gap-2"
              >
                <span className="font-medium text-card-foreground">
                  {monthLabel(r.period_month)} {r.period_year}
                </span>
                <span className="text-muted-foreground">
                  {new Date(r.generated_at).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {athleteName} — {open && `${monthLabel(open.period_month)} ${open.period_year}`}
            </DialogTitle>
          </DialogHeader>
          {open && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                {t("monthlyReportGeneratedAt")}: {new Date(open.generated_at).toLocaleString(locale)}
              </div>
              {open.summary_text && (
                <div className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">
                  {open.summary_text}
                </div>
              )}
              {open.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <MetricBlock label={t("metricsTraining")} value={open.metrics?.training?.sessions_completed ?? 0} suffix="" />
                  <MetricBlock label={t("metricsDiary")} value={open.metrics?.diary?.entries ?? 0} suffix="" />
                  <MetricBlock
                    label={t("metricsMental")}
                    value={open.metrics?.mental?.total_score ?? "—"}
                    suffix={open.metrics?.mental?.delta_vs_previous != null ? ` (${open.metrics.mental.delta_vs_previous > 0 ? "+" : ""}${open.metrics.mental.delta_vs_previous.toFixed(1)})` : ""}
                  />
                  <MetricBlock label={t("metricsPhysical")} value={Array.isArray(open.metrics?.physical_tests) ? open.metrics.physical_tests.length : 0} suffix="" />
                  {open.metrics?.wearable && (
                    <MetricBlock
                      label={t("metricsWearable")}
                      value={open.metrics.wearable.days_with_data || 0}
                      suffix={` ${t("days") || "d"}`}
                    />
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => exportPdf(open)}>
                  <Download className="h-4 w-4 mr-1" /> {t("monthlyDevReportExportPdf")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricBlock({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-card-foreground">
        {typeof value === "number" ? value : value}
        {suffix}
      </div>
    </div>
  );
}
