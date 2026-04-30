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
  preloadHealthPlugin, getDiagnostics, resetConnection,
  type WearableStatus, type WearableDiagnostics,
} from "@/lib/wearables";
import { WearableConnectWizard } from "@/components/wearables/WearableConnectWizard";
import { PageMeta } from "@/components/PageMeta";
import { tap, success } from "@/lib/haptics";

export default function WearablesSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState<WearableStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [ownsWearable, setOwnsWearable] = useState<boolean | null>(null);
  const [diag, setDiag] = useState<WearableDiagnostics | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    void load();
    // Preload the native health plugin so the Connect tap can call
    // requestPermissions() with NO awaits between the gesture and the
    // HealthKit prompt — required on iOS or the sheet is silently denied.
    void preloadHealthPlugin();
    void getDiagnostics().then(setDiag);
  }, []);

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

  function handleConnect() {
    // CRITICAL iOS rule: do NOT await anything before requestPermissions().
    // Any await here breaks the user-gesture chain and HealthKit silently
    // denies the prompt. We fire the request synchronously, then chain the
    // backfill afterwards.
    tap();
    setBusy(true);
    const promptPromise = requestPermissions();
    promptPromise
      .then(() => initialBackfill())
      .then((inserted) => {
        success();
        toast({ title: t("wearableConnected"), description: `${inserted} ${t("wearableSamples")}` });
        return load();
      })
      .catch((e: any) => {
        toast({ title: t("error"), description: e?.message || "Connect failed", variant: "destructive" });
      })
      .finally(() => setBusy(false));
  }

  async function handleSync() {
    tap();
    setBusy(true);
    try {
      // Always pull at least the last 14 days when the user taps Sync —
      // a tighter window often returns 0 samples and looks broken.
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86400_000).toISOString();
      const since = status?.last_sync_at && status.last_sync_at > fourteenDaysAgo
        ? status.last_sync_at
        : fourteenDaysAgo;
      const inserted = await syncSince(since);
      if (inserted > 0) {
        success();
        toast({ title: t("wearableSyncDone"), description: `+${inserted} ${t("wearableSamples")}` });
      } else {
        toast({
          title: "No new data received",
          description: "Your watch returned 0 new samples. Open the Sync status page for details and a permissions check.",
        });
      }
      await load();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  function handleReRequestPermissions() {
    // Same iOS gesture rule — call requestPermissions synchronously.
    tap();
    setBusy(true);
    requestPermissions()
      .then(() => {
        toast({
          title: "Permission sheet shown",
          description: "Make sure every metric (Sleep, Resting Heart Rate, HRV, Steps, Workouts) is enabled, then tap Sync now.",
        });
      })
      .catch((e: any) => {
        toast({ title: t("error"), description: e?.message || "Failed", variant: "destructive" });
      })
      .finally(() => setBusy(false));
  }

  async function handleResetConnection() {
    tap();
    setBusy(true);
    try {
      await resetConnection();
      toast({
        title: "Connection reset",
        description: "Local connection cleared. Tap Connect Apple Health again to start fresh.",
      });
      await load();
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message || "Reset failed", variant: "destructive" });
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
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("home")}
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Watch className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("wearablesTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("wearablesSubtitle")}</p>
        </div>
      </div>

      {/* Live connection pill */}
      {(() => {
        const grant = (typeof window !== "undefined")
          ? (() => { try { return JSON.parse(localStorage.getItem("wearable_last_grant") || "null"); } catch { return null; } })()
          : null;
        const recentGrant = grant && !grant.error && (Date.now() - Number(grant.at || 0) < 10 * 60_000);
        const pending = !status?.connected && diag?.inNativeApp && recentGrant;
        const stateClass = status?.connected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : pending
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-muted bg-muted/30";
        const dotClass = status?.connected
          ? "bg-emerald-500"
          : pending
            ? "bg-amber-500"
            : "bg-muted-foreground/40";
        return (
          <div className={`mb-6 flex items-center gap-3 rounded-lg border px-3 py-2 ${stateClass}`} aria-live="polite">
            <span className="relative flex h-3 w-3">
              {(status?.connected || pending) && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${status?.connected ? "bg-emerald-400" : "bg-amber-400"}`} />
              )}
              <span className={`relative inline-flex h-3 w-3 rounded-full ${dotClass}`} />
            </span>
            <div className="flex-1 text-sm">
              <span className="font-medium">
                {status?.connected ? "Connected" : pending ? "Syncing first data…" : "Not connected"}
              </span>
              {status?.connected && (
                <span className="text-muted-foreground">
                  {" · "}{providerLabel}
                  {status.last_sync_at
                    ? ` · last data ${new Date(status.last_sync_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : " · waiting for first data"}
                </span>
              )}
              {pending && (
                <span className="text-muted-foreground">
                  {" · "}{providerLabel} · permission granted, pulling samples
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Native diagnostics strip — helps explain why no permission prompt shows. */}
      {diag && <DeviceReadiness diag={diag} />}

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
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {t("wearableInstallAppTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground/90 font-medium">
              iPhone Health and Health Connect can only be read from inside the Sportstalent app.
            </p>
            <p className="text-sm text-muted-foreground">
              You're currently viewing Sportstalent in a web browser. Apple's iPhone Health database (where your watch, AirPods, and other apps write their data) and Android's Health Connect can't be accessed from the browser — install the native app to connect.
            </p>
            <ul className="text-sm space-y-1 text-foreground/80 list-disc pl-5">
              <li><span className="font-medium">iPhone:</span> install the iOS app, sign in, then come back to this page.</li>
              <li><span className="font-medium">Android:</span> install the Android app + Health Connect, then return here.</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Until then you can still log workouts, readiness and diary entries manually — they all flow into the same recovery picture.
            </p>
            <Button onClick={() => navigate("/install")} className="w-full h-11">
              {t("wearableHowToInstall")}
            </Button>
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
                : <span className="text-amber-600">Waiting for first data — tap Sync now</span>}
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleReRequestPermissions}
                disabled={busy}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Re-request permissions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleResetConnection}
                disabled={busy}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset connection
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate("/health")}>
                Open health stats
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate("/wearables/sync")}>
                Sync status & errors
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("wearableConnect")} {providerLabel}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("wearableMetricsList")}</p>
            <ul className="text-sm space-y-1 text-foreground/80 list-disc pl-5">
              <li>{t("wearableMetricSleep")}</li>
              <li>{t("wearableMetricRhr")}</li>
              <li>{t("wearableMetricHrv")}</li>
              <li>{t("wearableMetricSteps")}</li>
              <li>{t("wearableMetricWorkouts")}</li>
            </ul>

            {/* Step-by-step help */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                {provider === "apple_health" ? (
                  <Apple className="h-4 w-4 text-primary" />
                ) : (
                  <Smartphone className="h-4 w-4 text-primary" />
                )}
                How to connect
              </div>
              <ol className="text-sm space-y-1.5 text-foreground/80 list-decimal pl-5">
                {provider === "apple_health" ? (
                  <>
                    <li>Make sure your Apple Watch (or any other device) is syncing into the Health app on this iPhone.</li>
                    <li>Tap <span className="font-medium">Connect iPhone Health</span> below.</li>
                    <li>iOS will show a permission sheet — tap <span className="font-medium">Turn On All</span> for Sleep, Heart Rate, HRV, Steps and Workouts.</li>
                    <li>Wait a few seconds for the first 14-day backfill to finish — the dot above turns green when ready.</li>
                  </>
                ) : provider === "health_connect" ? (
                  <>
                    <li>Install <span className="font-medium">Health Connect</span> from the Play Store if you don't have it yet.</li>
                    <li>Open your watch app (Garmin, Fitbit, Samsung Health, etc.) and enable Health Connect sync.</li>
                    <li>Tap <span className="font-medium">Connect Health Connect</span> below and allow read access to all 5 metrics.</li>
                    <li>Wait a few seconds for the first 14-day backfill — the dot above turns green when ready.</li>
                  </>
                ) : (
                  <>
                    <li>Open this app on your phone (iOS or Android) — health sync runs on-device only.</li>
                    <li>iPhone Health (or Health Connect on Android) is where your watch and apps store their data.</li>
                    <li>Return here and tap Connect.</li>
                  </>
                )}
              </ol>
              <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                We never write to your Health data. You can disconnect any time.
              </p>
            </div>

            <Button onClick={() => { tap(); setWizardOpen(true); }} disabled={busy} className="w-full h-11">
              <Watch className="h-4 w-4 mr-2" />
              {t("wizardOpenSetupCta")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleConnect}
              disabled={busy}
            >
              {t("wearableConnect")} {providerLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleResetConnection}
              disabled={busy}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Reset previous connection
            </Button>
            <p className="text-xs text-muted-foreground">{t("wearablePrivacyNote")}</p>
          </CardContent>
        </Card>
      )}

      <WearableConnectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCompleted={() => { void load(); }}
      />
    </div>
  );
}

function DiagRow({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
  const color = ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-1 inline-block h-2 w-2 rounded-full ${color} shrink-0`} />
      <span className="text-foreground/85">{label}</span>
    </div>
  );
}

function DeviceReadiness({ diag }: { diag: WearableDiagnostics }) {
  const [showDetails, setShowDetails] = useState(false);
  const s = diag.signals;

  const hotReloadActive = !!s.serverUrl;
  const nativeSignals =
    s.capacitorIsNative ||
    s.healthPluginRegistered ||
    s.hasHealthHandler ||
    s.hasAnyPluginHandler ||
    s.userAgentHint ||
    s.schemeHint ||
    (s.localhostHint && (s.isIosUA || s.isAndroidUA));
  const looksNativeButDetectionFailed = !diag.inNativeApp && nativeSignals;
  const provider = diag.provider;
  const isApple = provider === "apple_health";

  // Hide the whole panel when everything is healthy — the green status pill
  // above already conveys "ready".
  const allGood =
    diag.inNativeApp &&
    diag.pluginLoaded &&
    diag.healthPluginAvailable &&
    diag.healthAvailable === true &&
    !hotReloadActive;
  if (allGood) return null;

  return (
    <div className="mb-4 rounded-lg border bg-muted/20 p-3 text-xs space-y-1.5">
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium text-foreground/90">Connection check</div>
        <button
          type="button"
          onClick={() => setShowDetails(v => !v)}
          className="text-[11px] underline text-muted-foreground hover:text-foreground"
        >
          {showDetails ? "Hide technical details" : "Show technical details"}
        </button>
      </div>

      <DiagRow
        ok={diag.inNativeApp}
        warn={looksNativeButDetectionFailed}
        label={
          diag.inNativeApp
            ? "Sportstalent app detected"
            : looksNativeButDetectionFailed
              ? "App is starting up — tap Connect to retry"
              : "Open this from the Sportstalent app on your phone"
        }
      />
      <DiagRow
        ok={diag.pluginLoaded || diag.healthPluginAvailable}
        warn={!diag.inNativeApp}
        label={
          diag.pluginLoaded || diag.healthPluginAvailable
            ? (isApple ? "iPhone Health module ready" : "Health Connect module ready")
            : (isApple
                ? "iPhone Health module not loaded yet"
                : "Health Connect module not loaded yet")
        }
      />
      <DiagRow
        ok={diag.healthAvailable === true}
        warn={diag.healthAvailable === null || !diag.inNativeApp}
        label={
          diag.healthAvailable === true
            ? (isApple ? "iPhone Health is available" : "Health Connect is available")
            : diag.healthAvailable === false
              ? (isApple
                  ? "iPhone Health unavailable on this device"
                  : "Health Connect not installed — install it from Play Store")
              : (isApple
                  ? "iPhone Health status: checking…"
                  : "Health Connect status: checking…")
        }
      />

      {diag.availabilityError && (
        <div className="text-destructive">Error: {diag.availabilityError}</div>
      )}

      {hotReloadActive && (
        <p className="mt-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-foreground/90">
          <span className="font-medium">Development hot-reload is active.</span>{" "}
          iPhone Health can't bridge in this mode. The next production build will fix it automatically.
        </p>
      )}

      {!diag.inNativeApp && !hotReloadActive && !nativeSignals && (
        <p className="mt-2 text-muted-foreground">
          iPhone Health and Health Connect aren't accessible from a web browser. Install Sportstalent on your phone, then open this page from inside the app.
        </p>
      )}

      {showDetails && (
        <div className="mt-2 space-y-0.5 rounded bg-background/60 p-2 font-mono text-[10px] text-foreground/80 break-all">
          <div>build = {s.buildMarker}</div>
          <div>capacitor.getPlatform() = "{s.capacitorPlatform || "<empty>"}"</div>
          <div>capacitor.isNativePlatform() = {String(s.capacitorIsNative)}</div>
          <div>window.Capacitor.getPlatform() = "{s.windowCapacitorPlatform || "<empty>"}"</div>
          <div>isPluginAvailable("Health") = {String(diag.healthPluginAvailable)}</div>
          <div>webkit.messageHandlers = {String(s.hasWebkitBridge)}</div>
          <div>webkit.messageHandlers.Health = {String(s.hasHealthHandler)}</div>
          <div>any plugin handler = {String(s.hasAnyPluginHandler)}</div>
          <div>UA hint (CapacitorWebView) = {String(s.userAgentHint)}</div>
          <div>scheme hint (capacitor://) = {String(s.schemeHint)}</div>
          <div>localhost hint = {String(s.localhostHint)}</div>
          <div>isIosUA = {String(s.isIosUA)} / isAndroidUA = {String(s.isAndroidUA)}</div>
          <div>serverUrl = {s.serverUrl ?? "null"}</div>
          <div>UA = {s.userAgent}</div>
          <div>href = {s.href}</div>
        </div>
      )}
    </div>
  );
}
