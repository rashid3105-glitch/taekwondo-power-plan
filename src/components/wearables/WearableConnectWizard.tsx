import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Watch, CheckCircle2, AlertCircle, Smartphone, Apple, ShieldCheck,
  Download, RefreshCw, Settings, ExternalLink, Loader2,
} from "lucide-react";
import {
  preloadHealthPlugin, getDiagnostics, initialBackfill, resetConnection,
  wearableProviderForPlatform, type WearableDiagnostics,
} from "@/lib/wearables";
import { requestWithDetection, type PromptOutcome } from "@/lib/wearables/promptDetection";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { tap, success } from "@/lib/haptics";

interface Props {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

type StepId = 1 | 2 | 3 | 4 | 5;

export function WearableConnectWizard({ open, onClose, onCompleted }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [step, setStep] = useState<StepId>(1);
  const [diag, setDiag] = useState<WearableDiagnostics | null>(null);
  const [busy, setBusy] = useState(false);
  const [promptOutcome, setPromptOutcome] = useState<PromptOutcome | null>(null);
  const [backfillResult, setBackfillResult] = useState<{ inserted: number } | null>(null);

  const provider = wearableProviderForPlatform();
  const isApple = provider === "apple_health";

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPromptOutcome(null);
    setBackfillResult(null);
    void preloadHealthPlugin();
    void getDiagnostics().then((d) => {
      setDiag(d);
      // Auto-advance through any check that already passes.
      if (d.inNativeApp && d.pluginLoaded && d.healthAvailable === true) {
        setStep(4);
      } else if (d.inNativeApp && d.pluginLoaded) {
        setStep(3);
      } else if (d.inNativeApp) {
        setStep(2);
      }
    });
  }, [open]);

  async function recheck() {
    tap();
    setBusy(true);
    const d = await getDiagnostics();
    setDiag(d);
    if (step === 1 && d.inNativeApp) setStep(2);
    else if (step === 2 && d.pluginLoaded) setStep(3);
    else if (step === 3 && d.healthAvailable === true) setStep(4);
    setBusy(false);
  }

  function handleConnectTap() {
    // CRITICAL iOS rule: zero awaits between this tap and requestPermissions.
    tap();
    setBusy(true);
    setPromptOutcome(null);
    requestWithDetection()
      .then((outcome) => {
        setPromptOutcome(outcome);
        if (outcome.kind === "granted") {
          setStep(5);
          // Kick off backfill immediately
          return initialBackfill().then((inserted) => {
            setBackfillResult({ inserted });
            if (inserted > 0) success();
          });
        }
      })
      .catch((e: any) => {
        setPromptOutcome({ kind: "error", message: e?.message || "Failed" });
      })
      .finally(() => setBusy(false));
  }

  async function handleResetAndRestart() {
    tap();
    setBusy(true);
    try {
      await resetConnection();
      setPromptOutcome(null);
      setBackfillResult(null);
      const d = await getDiagnostics();
      setDiag(d);
      setStep(d.inNativeApp ? (d.pluginLoaded ? (d.healthAvailable === true ? 4 : 3) : 2) : 1);
      toast({ title: t("wizardResetDone") });
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function handleRetryBackfill() {
    tap();
    setBusy(true);
    try {
      const inserted = await initialBackfill();
      setBackfillResult({ inserted });
      if (inserted > 0) success();
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  function tryOpenIosHealthSettings() {
    try { window.location.href = "App-Prefs:HEALTH"; } catch { /* ignore */ }
  }

  function finish() {
    success();
    onCompleted?.();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <div className="p-4 border-b border-border bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Watch className="h-4 w-4 text-primary" />
            {t("wizardTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("wizardTitle")}</DialogDescription>
          <Stepper current={step} />
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {step === 1 && (
            <StepCard
              icon={<Smartphone className="h-5 w-5" />}
              title={t("wizardStep1Title")}
              why={t("wizardStep1Why")}
            >
              {diag?.inNativeApp ? (
                <SuccessLine label={t("wizardStep1Pass")} />
              ) : (
                <>
                  {(() => {
                    const s = diag?.signals;
                    const looksNative = !!s && (
                      s.capacitorIsNative || s.healthPluginRegistered ||
                      s.hasHealthHandler || s.hasAnyPluginHandler ||
                      s.userAgentHint || s.schemeHint ||
                      (s.localhostHint && (s.isIosUA || s.isAndroidUA))
                    );
                    if (looksNative) {
                      return (
                        <p className="text-sm text-foreground/80">
                          Native shell detected, but the JS bundle in this build doesn't see the Capacitor bridge. Pull the latest code, then run <code>npm run build &amp;&amp; npx cap sync ios</code> and rebuild from Xcode.
                        </p>
                      );
                    }
                    return <p className="text-sm text-foreground/80">{t("wizardStep1Fail")}</p>;
                  })()}
                  {diag?.signals && (
                    <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] font-mono text-foreground/80 space-y-0.5 break-all">
                      <div>build = {diag.signals.buildMarker}</div>
                      <div>platform = "{diag.signals.capacitorPlatform || "<empty>"}"</div>
                      <div>isNative = {String(diag.signals.capacitorIsNative)}</div>
                      <div>Health registered = {String(diag.signals.healthPluginRegistered)}</div>
                      <div>webkit bridge = {String(diag.signals.hasWebkitBridge)}</div>
                      <div>localhost = {String(diag.signals.localhostHint)}</div>
                      <div>serverUrl = {diag.signals.serverUrl ?? "null"}</div>
                    </div>
                  )}
                  {diag?.signals?.serverUrl ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Hot-reload (<code>server.url</code>) is active in capacitor.config.ts. Remove it, run <code>npm run build && npx cap sync ios</code>, then rebuild from Xcode.
                    </p>
                  ) : (
                    <Button onClick={() => navigate("/install")} className="w-full h-11">
                      <Download className="h-4 w-4 mr-2" />
                      {t("wizardOpenInstallGuide")}
                    </Button>
                  )}
                  <Button variant="outline" onClick={recheck} disabled={busy} className="w-full h-11">
                    <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
                    {t("wizardRecheck")}
                  </Button>
                </>
              )}
            </StepCard>
          )}

          {step === 2 && (
            <StepCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title={t("wizardStep2Title")}
              why={t("wizardStep2Why")}
            >
              {diag?.pluginLoaded ? (
                <SuccessLine label={t("wizardStep2Pass")} />
              ) : (
                <>
                  <p className="text-sm text-foreground/80">{t("wizardStep2Fail")}</p>
                  <Button onClick={() => navigate("/install")} className="w-full h-11">
                    <Download className="h-4 w-4 mr-2" />
                    {t("wizardReinstall")}
                  </Button>
                  <Button variant="outline" onClick={recheck} disabled={busy} className="w-full h-11">
                    <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
                    {t("wizardRecheck")}
                  </Button>
                </>
              )}
            </StepCard>
          )}

          {step === 3 && (
            <StepCard
              icon={isApple ? <Apple className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
              title={t("wizardStep3Title")}
              why={t("wizardStep3Why")}
            >
              {diag?.healthAvailable === true ? (
                <SuccessLine label={t("wizardStep3Pass")} />
              ) : (
                <>
                  <p className="text-sm text-foreground/80">
                    {isApple ? t("wizardStep3FailIos") : t("wizardStep3FailAndroid")}
                  </p>
                  {!isApple && (
                    <Button asChild className="w-full h-11">
                      <a
                        href="https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"
                        target="_blank" rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t("wizardInstallHealthConnect")}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" onClick={recheck} disabled={busy} className="w-full h-11">
                    <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
                    {t("wizardRecheck")}
                  </Button>
                </>
              )}
            </StepCard>
          )}

          {step === 4 && (
            <StepCard
              icon={<Watch className="h-5 w-5" />}
              title={t("wizardStep4Title")}
              why={t("wizardStep4Why")}
            >
              {!promptOutcome && (
                <>
                  <p className="text-sm text-foreground/80">{t("wizardStep4Instruction")}</p>
                  <Button onClick={handleConnectTap} disabled={busy} className="w-full h-11">
                    {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Watch className="h-4 w-4 mr-2" />}
                    {isApple ? t("wizardConnectApple") : t("wizardConnectHealthConnect")}
                  </Button>
                </>
              )}

              {promptOutcome?.kind === "error" && (
                <>
                  <ErrorLine label={promptOutcome.message} />
                  <Button onClick={handleConnectTap} disabled={busy} className="w-full h-11">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("wizardTryAgain")}
                  </Button>
                </>
              )}

              {promptOutcome?.kind === "denied" && (
                <>
                  <p className="text-sm text-foreground/80">{t("wizardStep4Denied")}</p>
                  {isApple && (
                    <Button onClick={tryOpenIosHealthSettings} className="w-full h-11">
                      <Settings className="h-4 w-4 mr-2" />
                      {t("wizardOpenHealthSettings")}
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleConnectTap} disabled={busy} className="w-full h-11">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("wizardTryAgain")}
                  </Button>
                </>
              )}

              {promptOutcome?.kind === "never_shown" && (
                <>
                  <ErrorLine label={t("wizardStep4NeverShown")} />
                  <Button onClick={handleResetAndRestart} disabled={busy} className="w-full h-11">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("wizardResetAndRestart")}
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/install")} className="w-full h-11">
                    <Download className="h-4 w-4 mr-2" />
                    {t("wizardReinstall")}
                  </Button>
                </>
              )}
            </StepCard>
          )}

          {step === 5 && (
            <StepCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              title={t("wizardStep5Title")}
              why={t("wizardStep5Why")}
            >
              {!backfillResult && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("wizardBackfillRunning")}
                </div>
              )}

              {backfillResult && backfillResult.inserted > 0 && (
                <>
                  <SuccessLine label={`${backfillResult.inserted} ${t("wearableSamples")} ✓`} />
                  <p className="text-sm text-foreground/80">{t("wizardStep5Done")}</p>
                  <Button onClick={finish} className="w-full h-11">
                    {t("wizardFinish")}
                  </Button>
                </>
              )}

              {backfillResult && backfillResult.inserted === 0 && (
                <>
                  <p className="text-sm text-foreground/80">{t("wizardStep5Empty")}</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                    <li>{t("wearableMetricSleep")}</li>
                    <li>{t("wearableMetricRhr")}</li>
                    <li>{t("wearableMetricHrv")}</li>
                    <li>{t("wearableMetricSteps")}</li>
                    <li>{t("wearableMetricWorkouts")}</li>
                  </ul>
                  <Button onClick={handleRetryBackfill} disabled={busy} className="w-full h-11">
                    <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
                    {t("wizardRetryBackfill")}
                  </Button>
                  <Button variant="outline" onClick={finish} className="w-full h-11">
                    {t("wizardCloseAnyway")}
                  </Button>
                </>
              )}
            </StepCard>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-foreground mt-4 py-2"
          >
            {t("wizardSkip")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ current }: { current: StepId }) {
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {[1, 2, 3, 4, 5].map((n) => {
        const done = n < current;
        const active = n === current;
        return (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted"
            }`}
            aria-label={`Step ${n} of 5`}
          />
        );
      })}
    </div>
  );
}

function StepCard({
  icon, title, why, children,
}: { icon: React.ReactNode; title: string; why: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{why}</p>
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function SuccessLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4" />
      {label}
    </div>
  );
}

function ErrorLine({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{label}</span>
    </div>
  );
}
