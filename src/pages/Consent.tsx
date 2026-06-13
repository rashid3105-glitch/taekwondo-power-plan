import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Info = {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  athlete_name?: string | null;
  consent_type?: string;
  data_items?: string[];
  policy_version?: string;
};

export default function Consent() {
  const { token = "" } = useParams<{ token: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<Info | null>(null);
  const [granting, setGranting] = useState(false);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("consent-confirm", {
          body: { action: "get", token },
        });
        if (cancelled) return;
        if (error) throw error;
        setInfo(data as Info);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const grant = async () => {
    setGranting(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("consent-confirm", {
        body: { action: "grant", token },
      });
      if (error) throw error;
      if ((data as any)?.ok) setGranted(true);
      else throw new Error((data as any)?.error || "error");
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setGranting(false);
    }
  };

  const itemLabel = (k: string) => {
    const map: Record<string, string> = {
      heart_rate: t("consentItemHeartRate"),
      hrv: t("consentItemHrv"),
      sleep: t("consentItemSleep"),
      steps: t("consentItemSteps"),
      weight: t("consentItemWeight"),
      mental_assessments: t("consentItemMental"),
    };
    return map[k] || k;
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{t("consentPageTitle")}</h1>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
          </div>
        )}

        {!loading && granted && (
          <div className="flex items-start gap-3 rounded-md bg-green-50 dark:bg-green-950/30 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">{t("consentGrantedTitle")}</div>
              <p className="text-muted-foreground mt-1">{t("consentGrantedDesc")}</p>
            </div>
          </div>
        )}

        {!loading && !granted && info && !info.valid && (
          <div className="flex items-start gap-3 rounded-md bg-amber-50 dark:bg-amber-950/30 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">
                {info.used ? t("consentAlreadyUsedTitle") : info.expired ? t("consentExpiredTitle") : t("consentInvalidTitle")}
              </div>
              <p className="text-muted-foreground mt-1">
                {info.used ? t("consentAlreadyUsedDesc") : info.expired ? t("consentExpiredDesc") : t("consentInvalidDesc")}
              </p>
            </div>
          </div>
        )}

        {!loading && !granted && info && info.valid && (
          <>
            <p className="text-sm">
              {t("consentIntro").replace("{name}", info.athlete_name || t("yourChild"))}
            </p>
            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                {t("consentDataItemsTitle")}
              </div>
              <ul className="text-sm list-disc list-inside space-y-1">
                {info.data_items?.map((k) => <li key={k}>{itemLabel(k)}</li>)}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("consentPolicyVersion")}: {info.policy_version}.{" "}
              <Link to="/privacy" className="underline">{t("readPrivacyPolicy")}</Link>
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={grant} disabled={granting} className="w-full">
              {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("consentGrantButton")}
            </Button>
          </>
        )}

        {error && !info && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </Card>
    </div>
  );
}
