import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Copy, Smartphone, Heart, Wrench, KeyRound, Mail, Activity, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageMeta } from "@/components/PageMeta";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

const SYNC_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-sync-simple`;

const JSON_BODY_TEMPLATE = `{
  "email": "DIN_EMAIL",
  "password": "DIN_ADGANGSKODE",
  "steps": [Skridt-variabel],
  "resting_hr": [Hvilepuls-variabel],
  "hrv": [HRV-variabel],
  "sleep_hours": [Søvn-variabel]
}`;

const TOTAL_STEPS = 8;

export default function HealthSyncSetup() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "timeout">("idle");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/auth?redirect=/health/sync-setup", { replace: true });
        return;
      }
      setEmail(data.user.email ?? "");
    })();
  }, [navigate]);

  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      haptics.tap();
      toast.success(t("healthSetupCopied"));
    } catch {
      toast.error("Copy failed");
    }
  }

  function goNext() {
    haptics.tap();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    haptics.tap();
    if (step === 0) {
      navigate("/health");
    } else {
      setStep((s) => s - 1);
    }
  }

  async function runTest() {
    if (testing) return;
    setTesting(true);
    setTestResult("idle");
    haptics.tap();

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      setTesting(false);
      toast.error("Not signed in");
      return;
    }

    // baseline timestamp
    const since = new Date(Date.now() - 60_000).toISOString();
    const deadline = Date.now() + 30_000;
    let success = false;

    while (Date.now() < deadline) {
      const { data } = await supabase
        .from("wearable_daily_summary")
        .select("summary_date,updated_at")
        .eq("user_id", uid)
        .gte("updated_at", since)
        .limit(1);
      if (data && data.length > 0) {
        success = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    setTesting(false);
    if (success) {
      setTestResult("success");
      haptics.tap();
      toast.success(t("healthSetupTestSuccess"));
    } else {
      setTestResult("timeout");
      toast.error(t("healthSetupTestTimeout"));
    }
  }

  const progressPct = useMemo(() => ((step + 1) / TOTAL_STEPS) * 100, [step]);

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <PageMeta title={`${t("healthSetupTitle")} | Sportstalent`} noindex />

      {/* Header */}
      <header className="px-4 pt-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={goBack}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted/60"
            aria-label={t("healthSetupBack")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("healthSetupStepOf").replace("{n}", String(step + 1))}
            </div>
            <h1 className="text-base font-semibold truncate">{t("healthSetupTitle")}</h1>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-6">
        {step === 0 && (
          <StepCard icon={<Sparkles className="h-6 w-6" />} title={t("healthSetupS1Title")}>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS1Body")}</p>
            <IPhoneFrame>
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                <Heart className="h-12 w-12 text-primary" />
                <div className="text-xs text-muted-foreground">Apple Health → Sportstalent</div>
              </div>
            </IPhoneFrame>
          </StepCard>
        )}

        {step === 1 && (
          <StepCard icon={<Smartphone className="h-6 w-6" />} title={t("healthSetupS2Title")}>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS2Body")}</p>
            <IPhoneFrame>
              <div className="flex items-center justify-center h-full">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="w-4 h-4 rounded bg-white/90" />
                    <div className="w-4 h-4 rounded bg-white/60" />
                    <div className="w-4 h-4 rounded bg-white/60" />
                    <div className="w-4 h-4 rounded bg-white/90" />
                  </div>
                </div>
              </div>
            </IPhoneFrame>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard icon={<Wrench className="h-6 w-6" />} title={t("healthSetupS3Title")}>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS3Body")}</p>
            <ol className="space-y-2 text-sm">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="flex gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">
                    {n}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    {t(`healthSetupS3Step${n}` as any)}
                  </span>
                </li>
              ))}
            </ol>
            <CopyField label={t("healthSetupEndpointLabel")} value={SYNC_ENDPOINT} onCopy={copyValue} />
            <CopyField label={t("healthSetupS3JsonLabel" as any)} value={JSON_BODY_TEMPLATE} onCopy={copyValue} />
            <div className="flex gap-2 items-start rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{t("healthSetupS3SecurityNote" as any)}</span>
            </div>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard icon={<Mail className="h-6 w-6" />} title={t("healthSetupS4Title")}>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS4Body")}</p>
            <CopyField label={t("healthSetupEmailLabel")} value={email || "…"} onCopy={copyValue} />
          </StepCard>
        )}

        {step === 4 && (
          <StepCard icon={<KeyRound className="h-6 w-6" />} title={t("healthSetupS5Title")}>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS5Body")}</p>
            <CopyField label={t("healthSetupEndpointLabel")} value={SYNC_ENDPOINT} onCopy={copyValue} />
          </StepCard>
        )}

        {step === 5 && (
          <StepCard icon={<Heart className="h-6 w-6" />} title={t("healthSetupS6Title")}>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS6Body")}</p>
            <IPhoneFrame>
              <div className="p-4 space-y-2 text-xs">
                {["Steps", "Sleep", "Resting HR", "HRV"].map((l) => (
                  <div key={l} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                    <span>{l}</span>
                    <div className="w-9 h-5 rounded-full bg-primary relative">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
                    </div>
                  </div>
                ))}
              </div>
            </IPhoneFrame>
          </StepCard>
        )}

        {step === 6 && (
          <StepCard icon={<Activity className="h-6 w-6" />} title={t("healthSetupS7Title")}>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS7Body")}</p>
            <Button
              className="w-full h-11"
              onClick={runTest}
              disabled={testing}
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("healthSetupTesting")}
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  {t("healthSetupTestSync")}
                </>
              )}
            </Button>
            {testResult === "success" && (
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {t("healthSetupTestSuccess")}
              </div>
            )}
            {testResult === "timeout" && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t("healthSetupTestTimeout")}
              </div>
            )}
          </StepCard>
        )}

        {step === 7 && (
          <StepCard icon={<Check className="h-6 w-6" />} title={t("healthSetupS8Title")}>
            <div className="flex items-center justify-center py-2">
              <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("healthSetupS8Body")}</p>
            <Button className="w-full h-11" onClick={() => navigate("/health")}>
              {t("healthSetupFinish")}
            </Button>
          </StepCard>
        )}
      </main>

      {/* Footer */}
      {step < 7 && (
        <div className="px-4 pb-4 pt-2 border-t border-border/60 flex gap-3 bg-background">
          <Button variant="outline" className="flex-1 h-11" onClick={goBack}>
            ← {t("healthSetupBack")}
          </Button>
          <Button className="flex-[2] h-11 font-semibold" onClick={goNext}>
            {t("healthSetupNext")} →
          </Button>
        </div>
      )}
    </div>
  );
}

function StepCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left hover:bg-muted/50 active:scale-[0.99] transition"
      >
        <span className="text-sm font-mono truncate">{value}</span>
        <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </div>
  );
}

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[200px] h-[280px] rounded-[2rem] border-[6px] border-foreground/80 bg-background overflow-hidden relative shadow-xl">
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-foreground/80 z-10" />
      <div className="absolute inset-0 pt-6">{children}</div>
    </div>
  );
}
