import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/i18n/LanguageContext";
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Info = {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  athlete_name?: string | null;
  club_name?: string | null;
  consent_type?: string;
  data_items?: string[];
  policy_version?: string;
};

// Replace every {name} / {athleteName} / {clubName} placeholder in a
// translated string. Falls back to safe defaults if a value is missing.
function fillPlaceholders(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? `{${key}}`);
}

export default function Consent() {
  const { token = "" } = useParams<{ token: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<Info | null>(null);
  const [granting, setGranting] = useState(false);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // GDPR requires unambiguous, active consent — checkbox starts UNCHECKED
  // and the submit button stays disabled until the parent ticks it.
  const [checked, setChecked] = useState(false);

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
    if (!checked) return; // safety net — should also be disabled via UI
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

  const athleteName = info?.athlete_name?.trim() || t("yourChild");
  const clubName = info?.club_name?.trim() || t("privacyConsentYourClub");
  const vars = useMemo(() => ({ athleteName, clubName, name: athleteName }), [athleteName, clubName]);

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{t("privacyConsentParentTitle")}</h1>
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
            <p className="text-sm leading-relaxed">
              {fillPlaceholders(t("privacyConsentParentBody"), vars)}
            </p>

            <div className="rounded-md border border-border p-3 text-sm leading-relaxed bg-muted/30">
              {fillPlaceholders(t("privacyConsentParentDeclaration"), vars)}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("privacyConsentVoluntary")}
            </p>

            <p className="text-xs text-muted-foreground">
              <Link to="/privacy" className="underline">{t("privacyConsentPolicyLink")}</Link>
              {info.policy_version ? <> · {t("consentPolicyVersion")}: {info.policy_version}</> : null}
            </p>

            <label className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
                className="mt-0.5"
                aria-describedby="parent-consent-checkbox-label"
              />
              <span id="parent-consent-checkbox-label" className="text-sm leading-relaxed">
                {fillPlaceholders(t("privacyConsentParentCheckbox"), vars)}
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={grant}
              disabled={granting || !checked}
              className="w-full"
            >
              {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("privacyConsentGrantBtn")}
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
