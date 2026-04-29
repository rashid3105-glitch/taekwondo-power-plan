import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Activity, Watch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageMeta } from "@/components/PageMeta";
import { tap } from "@/lib/haptics";
import {
  getStatus, getSyncStats, getSampleCount, syncSince, clearSyncStats,
  isWearableSupported, wearableProviderForPlatform,
  type WearableStatus, type SyncStats,
} from "@/lib/wearables";

function fmt(ts: number | string | null): string {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleString();
}

export default function WearablesSync() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState<WearableStatus | null>(null);
  const [stats, setStats] = useState<SyncStats>(getSyncStats());
  const [count, setCount] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setStatus(await getStatus());
    setStats(getSyncStats());
    setCount(await getSampleCount());
  }

  async function handleSync() {
    tap();
    setBusy(true);
    try {
      const since = status?.last_sync_at ?? new Date(Date.now() - 86400_000).toISOString();
      const inserted = await syncSince(since);
      if (inserted === 0) {
        toast({
          title: "No new data",
          description: status?.last_sync_at
            ? `Nothing new since ${new Date(status.last_sync_at).toLocaleString()}. Open Apple Health / Health Connect to confirm your watch is syncing, then try again.`
            : "Make sure your watch is paired and syncing to Apple Health / Health Connect, then try again.",
        });
      } else {
        toast({ title: t("wearableSyncDone" as any), description: `+${inserted}` });
      }
    } catch (e: any) {
      toast({ title: t("error" as any), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      await load();
    }
  }

  const supported = isWearableSupported();
  const provider = wearableProviderForPlatform();
  const providerLabel = provider === "apple_health" ? "Apple Health"
    : provider === "health_connect" ? "Health Connect" : "—";

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      <PageMeta title="Wearables Sync · Sportstalent" description="Sync status, last pull and ingest errors." noindex />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (window.history.length > 1) navigate(-1);
          else navigate("/dashboard");
        }}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back" as any) || "Back"}
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Sync status</h1>
          <p className="text-sm text-muted-foreground">Last pull, sample counts, and recent errors.</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Watch className="h-4 w-4" /> Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Provider" value={providerLabel} />
          <Row label="Platform support" value={supported ? "Native" : "Web (read-only)"} />
          <Row label="Status" value={
            status?.connected
              ? <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Active</Badge>
              : <Badge variant="outline">Not connected</Badge>
          } />
          <Row label="Device" value={status?.device_label ?? "—"} />
          <Row label="Server last sync" value={fmt(status?.last_sync_at ?? null)} />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pulls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Last attempt" value={fmt(stats.last_attempt_at)} />
          <Row label="Last successful pull" value={fmt(stats.last_success_at)} />
          <Row label="Last batch size" value={stats.last_inserted ?? "—"} />
          <Row label="Total samples (device)" value={count.toLocaleString()} />
          <Row label="Total inserted (this device)" value={stats.total_inserted.toLocaleString()} />
          <Row label="Attempts" value={stats.attempts} />
          <Row label="Failures" value={stats.failures} />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {stats.last_error
              ? <AlertCircle className="h-4 w-4 text-destructive" />
              : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            Last error
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.last_error ? (
            <pre className="text-xs whitespace-pre-wrap rounded-md bg-muted p-3 text-destructive">
              {stats.last_error}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No errors recorded.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSync} disabled={busy || !status?.connected} className="flex-1">
          <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
          Sync now
        </Button>
        <Button variant="outline" onClick={() => { clearSyncStats(); setStats(getSyncStats()); }}>
          Reset stats
        </Button>
      </div>

      {!supported && (
        <p className="text-xs text-muted-foreground mt-4">
          Native pulls only run inside the iOS / Android app. The web build shows server-side sync state and any queued errors.
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
