import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { tap, success } from "@/lib/haptics";
import {
  ALL_METRIC_KEYS,
  HEALTH_METRICS,
  downloadFile,
  formatAsCsv,
  formatAsText,
  preloadQuickExport,
  queryLast7DaysMulti,
  requestPermissionsFor,
  todayStamp,
  type MetricKey,
  type MetricResults,
} from "@/lib/wearables/quickExport";
import { isWearableSupported } from "@/lib/wearables";

const METRIC_I18N_KEY: Record<MetricKey, string> = {
  stepCount: "metricStepCount",
  heartRate: "metricHeartRate",
  activeEnergy: "metricActiveEnergy",
  restingHr: "metricRestingHr",
  hrv: "metricHrv",
  sleep: "metricSleep",
};

export function QuickExportCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<MetricKey>>(new Set(["stepCount"]));
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<MetricResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void preloadQuickExport(); }, []);

  const supported = isWearableSupported();
  const selectedMetrics = useMemo(
    () => ALL_METRIC_KEYS.filter(k => selected.has(k)).map(k => HEALTH_METRICS[k]),
    [selected],
  );

  function metricLabel(k: MetricKey): string {
    const v = t(METRIC_I18N_KEY[k] as any);
    if (v && v !== METRIC_I18N_KEY[k]) return v;
    return HEALTH_METRICS[k].displayName;
  }

  function toggle(k: MetricKey) {
    tap();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }

  function selectAll() { tap(); setSelected(new Set(ALL_METRIC_KEYS)); }
  function clearAll() { tap(); setSelected(new Set()); }

  function handleLoad() {
    // CRITICAL iOS rule: zero awaits between user tap and requestPermissions.
    if (!selectedMetrics.length) return;
    tap();
    setBusy(true);
    setError(null);
    setResults(null);
    requestPermissionsFor(selectedMetrics)
      .then(() => queryLast7DaysMulti(selectedMetrics))
      .then((r) => {
        setResults(r);
        const total = Object.values(r).reduce((s, rows) => s + rows.length, 0);
        if (total > 0) success();
      })
      .catch((e: any) => {
        const msg = e?.message || String(e);
        setError(msg);
        toast({
          title: t("quickExportPermissionDenied" as any) || "Permission denied",
          description: msg,
          variant: "destructive",
        });
      })
      .finally(() => setBusy(false));
  }

  function handleDownloadTxt() {
    if (!results) return;
    tap();
    downloadFile(
      `iphone-health-export-${todayStamp()}.txt`,
      formatAsText(results, selectedMetrics),
      "text/plain",
    );
  }

  function handleDownloadCsv() {
    if (!results) return;
    tap();
    downloadFile(
      `iphone-health-export-${todayStamp()}.csv`,
      formatAsCsv(results, selectedMetrics),
      "text/csv",
    );
  }

  const hasAnyData = !!results && Object.values(results).some(rows => rows.length > 0);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("quickExportTitle" as any) || "Quick export from iPhone Health"}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {t("quickExportSubtitle" as any) || "Pick one or more metrics. We'll fetch the last 7 days and let you download them."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metric checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_METRIC_KEYS.map((k) => {
            const checked = selected.has(k);
            return (
              <label
                key={k}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors min-h-11 ${
                  checked ? "border-primary bg-primary/10" : "border-border bg-background/50"
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(k)}
                  aria-label={metricLabel(k)}
                />
                <span className="text-sm font-medium flex-1">{metricLabel(k)}</span>
              </label>
            );
          })}
        </div>

        {/* Helpers */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll} disabled={busy}>
            {t("quickExportSelectAll" as any) || "Select all"}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={busy || selected.size === 0}>
            {t("quickExportClear" as any) || "Clear"}
          </Button>
        </div>

        {/* Action */}
        <Button
          onClick={handleLoad}
          disabled={busy || selectedMetrics.length === 0 || !supported}
          className="w-full h-11"
        >
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {busy
            ? (t("quickExportLoading" as any) || "Loading…")
            : (t("quickExportLoad" as any) || "Grant access & load 7 days")}
        </Button>

        {!supported && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {t("quickExportUnsupported" as any) || "Open this page from inside the Sportstalent iPhone or Android app to use quick export."}
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3 pt-2">
            {selectedMetrics.map((m) => {
              const rows = results[m.key] ?? [];
              return (
                <div key={m.key} className="rounded-lg border border-border overflow-hidden">
                  <div className="px-3 py-2 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-foreground">
                    {metricLabel(m.key)}
                  </div>
                  {rows.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {t("quickExportEmpty" as any) || "No data in the last 7 days."}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {rows.map((r) => (
                        <div key={`${m.key}-${r.date}`} className="flex items-center justify-between px-3 py-1.5 text-sm">
                          <span className="text-muted-foreground tabular-nums">{r.date}</span>
                          <span className="font-medium tabular-nums">
                            {r.value.toLocaleString()} <span className="text-muted-foreground text-xs">{r.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {hasAnyData && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleDownloadTxt} className="h-11">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("quickExportDownloadTxt" as any) || "Download .txt"}
                </Button>
                <Button variant="outline" onClick={handleDownloadCsv} className="h-11">
                  <Download className="h-4 w-4 mr-2" />
                  {t("quickExportDownloadCsv" as any) || "Download .csv"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
