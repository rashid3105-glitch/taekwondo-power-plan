import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type Run = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  considered: number;
  sent: number;
  skipped: number;
  error: string | null;
};

const JOB_NAME = "send-consent-reminders";

/** Daily run log for the guardian-consent reminder job (admin only). */
export function JobRunsCard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("scheduled_job_runs")
        .select("id, started_at, finished_at, status, considered, sent, skipped, error")
        .eq("job_name", JOB_NAME)
        .order("started_at", { ascending: false })
        .limit(14);
      setRuns((data || []) as Run[]);
      setLoading(false);
    })();
  }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const icon = (status: string) => {
    if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-primary" />;
    if (status === "error") return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        {t("jobLogTitle")}
      </h2>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("jobLogNever")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {runs.map((r) => (
            <li key={r.id} className="py-2 flex items-start gap-3">
              <span className="mt-0.5">{icon(r.status)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{fmt(r.started_at)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t("jobLogSent")}: {r.sent} · {t("jobLogSkipped")}: {r.skipped} ·{" "}
                  {t("jobLogConsidered")}: {r.considered}
                  {!r.finished_at ? ` · ${t("jobLogRunning")}` : ""}
                </p>
                {r.error && (
                  <p className="text-[11px] text-destructive break-words">
                    {t("jobLogFailed")}: {r.error}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
