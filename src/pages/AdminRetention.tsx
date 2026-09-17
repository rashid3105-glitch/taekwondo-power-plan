import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash2, Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Policy = {
  category: string;
  retention_days: number;
  warn_days: number;
  batch_limit: number;
  enabled: boolean;
  dry_run: boolean;
};

type CategoryResult = {
  category: string;
  dry_run: boolean;
  candidates: number;
  processed: number;
  warned: number;
  errors: string[];
};

type JobRun = {
  id: string;
  started_at: string;
  status: string;
  considered: number;
  sent: number;
  meta: { categories?: CategoryResult[]; warned?: number } | null;
};

const CATEGORY_KEYS: Record<string, string> = {
  inactive_accounts: "retentionCatInactiveAccounts",
  left_club_health_data: "retentionCatLeftClubHealthData",
  terminated_club_data: "retentionCatTerminatedClubData",
  soft_deleted_chat_messages: "retentionCatSoftDeletedChatMessages",
  inactive_chat_threads: "retentionCatInactiveChatThreads",
  match_videos: "retentionCatMatchVideos",
  operational_logs: "retentionCatOperationalLogs",
  consent_documentation: "retentionCatConsentDocumentation",
};

export default function AdminRetention() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [runs, setRuns] = useState<JobRun[]>([]);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

  const load = async () => {
    const [{ data: pol }, { data: jobRuns }] = await Promise.all([
      supabase.from("retention_policies" as any).select("*").order("category"),
      supabase
        .from("scheduled_job_runs")
        .select("id, started_at, status, considered, sent, meta")
        .eq("job_name", "retention-cleanup")
        .order("started_at", { ascending: false })
        .limit(10),
    ]);
    setPolicies((pol ?? []) as unknown as Policy[]);
    setRuns((jobRuns ?? []) as unknown as JobRun[]);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!isAdmin) { navigate("/dashboard"); return; }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePolicy = async (category: string, patch: Partial<Policy>) => {
    const previous = policies;
    setPolicies((prev) => prev.map((p) => (p.category === category ? { ...p, ...patch } : p)));
    const { error } = await supabase
      .from("retention_policies" as any)
      .update(patch as any)
      .eq("category", category);
    if (error) {
      setPolicies(previous);
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("retentionSaved") });
  };

  const runNow = async () => {
    setRunning(true);
    const { error } = await supabase.functions.invoke("retention-cleanup", { body: { source: "admin" } });
    setRunning(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={t("back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              {t("retentionTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("retentionSubtitle")}</p>
          </div>
        </div>

        <Card className="p-4 text-sm text-muted-foreground">{t("retentionDryRunNotice")}</Card>

        <div className="space-y-3">
          {policies.map((p) => (
            <Card key={p.category} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{t(CATEGORY_KEYS[p.category] as any) || p.category}</div>
                  <div className="text-xs text-muted-foreground">{p.category}</div>
                </div>
                {p.dry_run && <Badge variant="secondary">{t("retentionDryRun")}</Badge>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="text-xs text-muted-foreground space-y-1 block">
                  {t("retentionPeriod")}
                  <Input
                    className="h-11"
                    type="number"
                    min={1}
                    defaultValue={p.retention_days}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isFinite(v) && v > 0 && v !== p.retention_days) {
                        savePolicy(p.category, { retention_days: v });
                      }
                    }}
                  />
                </label>
                <label className="text-xs text-muted-foreground space-y-1 block">
                  {t("retentionWarning")}
                  <Input
                    className="h-11"
                    type="number"
                    min={0}
                    defaultValue={p.warn_days}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isFinite(v) && v >= 0 && v !== p.warn_days) {
                        savePolicy(p.category, { warn_days: v });
                      }
                    }}
                  />
                </label>
                <label className="text-xs text-muted-foreground space-y-1 block">
                  {t("retentionLimit")}
                  <Input
                    className="h-11"
                    type="number"
                    min={1}
                    defaultValue={p.batch_limit}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isFinite(v) && v > 0 && v !== p.batch_limit) {
                        savePolicy(p.category, { batch_limit: v });
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.enabled}
                    onCheckedChange={(v) => savePolicy(p.category, { enabled: v })}
                  />
                  <span className="text-sm">{t("retentionEnabled")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.dry_run}
                    onCheckedChange={(v) => savePolicy(p.category, { dry_run: v })}
                  />
                  <span className="text-sm">{t("retentionDryRun")}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <Button onClick={runNow} disabled={running} className="h-11">
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {t("retentionRunNow")}
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("retentionLastRuns")}
          </h2>
          {runs.length === 0 && <p className="text-sm text-muted-foreground">{t("retentionNoRuns")}</p>}
          {runs.map((run) => (
            <Card key={run.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {format(new Date(run.started_at), "dd.MM.yyyy HH:mm")}
                </span>
                <Badge variant={run.status === "ok" ? "secondary" : "destructive"}>{run.status}</Badge>
              </div>
              <div className="space-y-1">
                {(run.meta?.categories ?? []).map((c) => (
                  <div key={c.category} className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    <span className="text-foreground">{t(CATEGORY_KEYS[c.category] as any) || c.category}</span>
                    <span>{t("retentionCandidates")}: {c.candidates}</span>
                    <span>{t("retentionDeleted")}: {c.processed}</span>
                    <span>{t("retentionWarned")}: {c.warned}</span>
                    {c.dry_run && <span>({t("retentionDryRun")})</span>}
                    {c.errors.length > 0 && <span className="text-destructive">{c.errors.join(", ")}</span>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
