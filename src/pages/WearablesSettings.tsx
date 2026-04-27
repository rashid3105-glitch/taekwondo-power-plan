import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Watch, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Unlink, Apple, Smartphone, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  getStatus, requestPermissions, initialBackfill, syncSince, disconnect,
  isWearableSupported, wearableProviderForPlatform,
  type WearableStatus,
} from "@/lib/wearables";
import { PageMeta } from "@/components/PageMeta";
import { tap, success } from "@/lib/haptics";

export default function WearablesSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState<WearableStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [ownsWearable, setOwnsWearable] = useState<boolean | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const { data: prof } = await supabase
      .from("profiles")
      .select("owns_wearable")
      .eq("user_id", user.id)
      .maybeSingle();
    setOwnsWearable(!!(prof as any)?.owns_wearable);
    setStatus(await getStatus());
  }

  async function handleConnect() {
    tap();
    setBusy(true);
    try {
      await requestPermissions();
      const inserted = await initialBackfill();
      success();
      toast({ title: t("wearableConnected"), description: `${inserted} ${t("wearableSamples")}` });
      await load();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function handleSync() {
    tap();
    setBusy(true);
    try {
      const since = status?.last_sync_at ?? new Date(Date.now() - 86400_000).toISOString();
      const inserted = await syncSince(since);
      success();
      toast({ title: t("wearableSyncDone"), description: `${inserted} ${t("wearableSamples")}` });
      await load();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function handleDisconnect() {
    tap();
    setBusy(true);
    try {
      await disconnect();
      toast({ title: t("wearableDisconnected") });
      await load();
    } finally { setBusy(false); }
  }

  const supported = isWearableSupported();
  const provider = wearableProviderForPlatform();
  const providerLabel = provider === "apple_health"
    ? "Apple Health"
    : provider === "health_connect" ? "Health Connect" : null;

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      <PageMeta title="Wearables · Sportstalent" description="Connect your watch for automatic recovery data." noindex />
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("home")}
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Watch className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("wearablesTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("wearablesSubtitle")}</p>
        </div>
      </div>

      {ownsWearable === false && (
        <Card className="border-amber-500/30 bg-amber-500/5 mb-4">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium">{t("wearableNotEnabled")}</p>
              <p className="text-muted-foreground mt-1">{t("wearableEnableInProfile")}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/profile-setup")}>
                {t("openProfile")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!supported ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("wearableInstallAppTitle")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{t("wearableInstallAppDesc")}</p>
            <Button onClick={() => navigate("/install")}>{t("wearableHowToInstall")}</Button>
          </CardContent>
        </Card>
      ) : status?.connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              {t("wearableConnectedTo")} {providerLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {t("wearableLastSync")}: {status.last_sync_at
                ? new Date(status.last_sync_at).toLocaleString()
                : "—"}
            </div>
            {status.device_label && (
              <div className="text-sm text-muted-foreground">
                {t("wearableDevice")}: {status.device_label}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSync} disabled={busy} className="flex-1">
                <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
                {t("wearableSyncNow")}
              </Button>
              <Button variant="outline" onClick={handleDisconnect} disabled={busy}>
                <Unlink className="h-4 w-4 mr-2" />
                {t("wearableDisconnect")}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/wearables/sync")}>
              View sync status & errors
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("wearableConnect")} {providerLabel}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("wearableMetricsList")}</p>
            <ul className="text-sm space-y-1 text-foreground/80 list-disc pl-5">
              <li>{t("wearableMetricSleep")}</li>
              <li>{t("wearableMetricRhr")}</li>
              <li>{t("wearableMetricHrv")}</li>
              <li>{t("wearableMetricSteps")}</li>
              <li>{t("wearableMetricWorkouts")}</li>
            </ul>
            <Button onClick={handleConnect} disabled={busy} className="w-full">
              <Watch className="h-4 w-4 mr-2" />
              {t("wearableConnect")} {providerLabel}
            </Button>
            <p className="text-xs text-muted-foreground">{t("wearablePrivacyNote")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
