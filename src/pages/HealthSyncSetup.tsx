import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, Smartphone, Heart, Zap, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sync-health-data`;

export default function HealthSyncSetup() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setToken(session.access_token);
    });
  }, []);

  const copy = async (text: string, which: "token" | "url" | "key") => {
    await navigator.clipboard.writeText(text);
    if (which === "token") { setTokenCopied(true); setTimeout(() => setTokenCopied(false), 3000); }
    if (which === "url") { setUrlCopied(true); setTimeout(() => setUrlCopied(false), 3000); }
    if (which === "key") { setKeyCopied(true); setTimeout(() => setKeyCopied(false), 3000); }
    toast.success(t("healthSyncTokenCopied" as any));
  };

  const STEPS = [
    { num: 1, title: t("healthSyncStep1Label" as any), icon: Copy },
    { num: 2, title: t("healthSyncStep2Label" as any), icon: ExternalLink },
    { num: 3, title: t("healthSyncStep3Label" as any), icon: Zap },
    { num: 4, title: t("healthSyncStep4Label" as any), icon: Smartphone },
    { num: 5, title: t("healthSyncStep5Label" as any), icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pt-safe border-b border-border mb-6">
        <div className="flex items-center gap-3 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/health")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-base">{t("healthSyncSetupTitle" as any)}</h1>
            <p className="text-xs text-muted-foreground">{t("healthSyncSetupSubtitle" as any)}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s) => (
          <div key={s.num} className="flex items-center gap-1 flex-1">
            <div className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              step > s.num ? "bg-primary" : step === s.num ? "bg-primary/50" : "bg-muted"
            )} />
          </div>
        ))}
      </div>

      {/* Step 1 — Copy token */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Copy className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{t("healthSyncStep1Title" as any).replace("{n}", "1")}</h2>
            <p className="text-muted-foreground text-sm">{t("healthSyncStep1Desc" as any)}</p>
          </div>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{t("healthSyncYourToken" as any)}</p>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                  {token ? `${token.slice(0, 20)}...` : t("loading" as any)}
                </p>
              </div>
              <Button
                onClick={() => token && copy(token, "token")}
                disabled={!token}
                variant={tokenCopied ? "default" : "outline"}
                className="gap-2 shrink-0"
              >
                {tokenCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {tokenCopied ? t("healthSyncCopied" as any) : t("healthSyncCopy" as any)}
              </Button>
            </div>
          </Card>
          <p className="text-xs text-muted-foreground text-center">{t("healthSyncTokenWarning" as any)}</p>
          <Button className="w-full" onClick={() => setStep(2)} disabled={!tokenCopied}>
            {t("healthSyncNext" as any)} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {!tokenCopied && <p className="text-xs text-center text-muted-foreground">{t("healthSyncCopyToContinue" as any)}</p>}
        </div>
      )}

      {/* Step 2 — Copy endpoint URL */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
              <ExternalLink className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">{t("healthSyncStep2Title" as any).replace("{n}", "2")}</h2>
            <p className="text-muted-foreground text-sm">{t("healthSyncStep2Desc" as any)}</p>
          </div>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{t("healthSyncEndpointUrl" as any)}</p>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                  {FUNCTION_URL.replace("https://", "").slice(0, 30)}...
                </p>
              </div>
              <Button
                onClick={() => copy(FUNCTION_URL, "url")}
                variant={urlCopied ? "default" : "outline"}
                className="gap-2 shrink-0"
              >
                {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {urlCopied ? t("healthSyncCopied" as any) : t("healthSyncCopy" as any)}
              </Button>
            </div>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{t("healthSyncBack" as any)}</Button>
            <Button className="flex-1" onClick={() => setStep(3)} disabled={!urlCopied}>
              {t("healthSyncNext" as any)} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Copy API key */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold">{t("healthSyncStep3Title" as any).replace("{n}", "3")}</h2>
            <p className="text-muted-foreground text-sm">{t("healthSyncStep3Desc" as any)}</p>
          </div>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{t("healthSyncApiKey" as any)}</p>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                  {SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.slice(0, 20)}...` : t("loading" as any)}
                </p>
              </div>
              <Button
                onClick={() => SUPABASE_ANON_KEY && copy(SUPABASE_ANON_KEY, "key")}
                disabled={!SUPABASE_ANON_KEY}
                variant={keyCopied ? "default" : "outline"}
                className="gap-2 shrink-0"
              >
                {keyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {keyCopied ? t("healthSyncCopied" as any) : t("healthSyncCopy" as any)}
              </Button>
            </div>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">{t("healthSyncBack" as any)}</Button>
            <Button className="flex-1" onClick={() => setStep(4)} disabled={!keyCopied}>
              {t("healthSyncNext" as any)} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Build Shortcut */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Smartphone className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold">{t("healthSyncStep4Title" as any).replace("{n}", "4")}</h2>
            <p className="text-muted-foreground text-sm">{t("healthSyncStep4Desc" as any)}</p>
          </div>

          <div className="space-y-3">
            {[
              { num: 1, title: t("healthSyncShortcutStep1" as any), desc: t("healthSyncShortcutStep1Desc" as any) },
              { num: 2, title: t("healthSyncShortcutStep2" as any), desc: t("healthSyncShortcutStep2Desc" as any) },
              { num: 3, title: t("healthSyncShortcutStep3" as any), desc: t("healthSyncShortcutStep3Desc" as any) },
              { num: 4, title: t("healthSyncShortcutStep4" as any), desc: t("healthSyncShortcutStep4Desc" as any) },
              { num: 5, title: t("healthSyncShortcutStep5" as any), desc: t("healthSyncShortcutStep5Desc" as any) },
            ].map(item => (
              <Card key={item.num} className="p-3 flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.num}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* JSON template */}
          <Card className="p-4 bg-muted/30">
            <p className="text-xs font-bold mb-2">{t("healthSyncJsonTemplate" as any)}</p>
            <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">{`{"records":[
  {"metric_type":"StepCount",
   "value":<<Steps.Quantity>>,
   "unit":"count",
   "start_date":"<<Steps.StartDate>>"},
  {"metric_type":"RestingHeartRate",
   "value":<<RestingHR.Quantity>>,
   "unit":"count/min",
   "start_date":"<<RestingHR.StartDate>>"},
  {"metric_type":"HeartRateVariabilitySDNN",
   "value":<<HRV.Quantity>>,
   "unit":"ms",
   "start_date":"<<HRV.StartDate>>"},
  {"metric_type":"SleepAnalysis",
   "value":<<Sleep.Quantity>>,
   "unit":"hr",
   "start_date":"<<Sleep.StartDate>>"}
]}`}</pre>
          </Card>

          {/* Headers reminder */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-xs font-bold text-primary mb-2">{t("healthSyncHeadersTitle" as any)}</p>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <p><span className="text-foreground font-semibold">Authorization:</span> Bearer [sync key]</p>
              <p><span className="text-foreground font-semibold">Content-Type:</span> application/json</p>
              <p><span className="text-foreground font-semibold">apikey:</span> [API key]</p>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)} className="flex-1">{t("healthSyncBack" as any)}</Button>
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={() => setStep(5)}>
              {t("healthSyncDone" as any)} <Check className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5 — Done */}
      {step === 5 && (
        <div className="space-y-6 text-center">
          <div className="h-24 w-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <Heart className="h-12 w-12 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">{t("healthSyncStep5Title" as any)}</h2>
            <p className="text-muted-foreground text-sm">
              {t("healthSyncStep5Desc" as any)}
            </p>
          </div>
          <Card className="p-4 text-left space-y-2">
            <p className="text-sm font-semibold">{t("healthSyncSyncedItems" as any)}</p>
            {[
              { icon: "👟", label: t("healthSyncItemSteps" as any) },
              { icon: "💤", label: t("healthSyncItemRhr" as any) },
              { icon: "📈", label: t("healthSyncItemHrv" as any) },
              { icon: "🌙", label: t("healthSyncItemSleep" as any) },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </Card>
          <div className="space-y-2">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => navigate("/health")}>
              {t("healthSyncSeeHealthData" as any)}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
              {t("healthSyncGoDashboard" as any)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
