import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  CheckCircle2, AlertCircle, Loader2, ShieldCheck, HeartPulse, Moon, Brain,
  ChevronDown, Clock, Undo2, Lock,
} from "lucide-react";
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
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
  const [showDetails, setShowDetails] = useState(false);
  const [notMine, setNotMine] = useState(false);

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

  const declineNotMine = async () => {
    setGranting(true);
    setError(null);
    try {
      const { error } = await supabase.functions.invoke("consent-confirm", {
        body: { action: "not_my_child", token },
      });
      if (error) throw error;
      setNotMine(true);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setGranting(false);
    }
  };

  const athleteName = info?.athlete_name?.trim() || t("yourChild");
  const clubName = info?.club_name?.trim() || t("privacyConsentYourClub");
  const vars = useMemo(
    () => ({ athleteName, clubName, name: athleteName }),
    [athleteName, clubName],
  );

  const bullets = [
    { icon: HeartPulse, text: t("consentBulletHeart") },
    { icon: Moon, text: t("consentBulletSleepSteps") },
    { icon: Brain, text: t("consentBulletMental") },
  ];

  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10">
        {/* Brand bar — makes the page recognisable, not phishing-like */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-black tracking-tight">
            SPORTS<span className="text-primary">TALENT</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> sportstalent.dk
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
          </div>
        )}

        {!loading && granted && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-xl font-bold">{t("consentGrantedTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("consentGrantedDesc")}</p>
            <p className="mt-4 text-sm text-muted-foreground">{t("consentReceiptSent")}</p>
            <ul className="mt-5 space-y-2 rounded-xl bg-muted/30 p-4 text-left text-sm">
              {bullets.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{t("consentQuickWithdraw")}</p>
          </div>
        )}

        {!loading && notMine && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-sm">{t("consentNotMyChildDone")}</p>
          </div>
        )}

        {!loading && !granted && !notMine && info && !info.valid && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div className="text-sm">
              <div className="font-semibold">
                {info.used ? t("consentAlreadyUsedTitle") : info.expired ? t("consentExpiredTitle") : t("consentInvalidTitle")}
              </div>
              <p className="mt-1 text-muted-foreground">
                {info.used ? t("consentAlreadyUsedDesc") : info.expired ? t("consentExpiredDesc") : t("consentInvalidDesc")}
              </p>
            </div>
          </div>
        )}

        {!loading && !granted && !notMine && info && info.valid && (
          <>
            {/* 1. Instant recognition: photo, child, club */}
            <div className="mt-2 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary ring-2 ring-primary/40">
                {initials(athleteName)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-bold leading-tight">{athleteName}</div>
                <div className="truncate text-sm text-muted-foreground">{clubName}</div>
              </div>
            </div>

            {/* 2. What happens without action */}
            <h1 className="mt-5 text-xl font-bold leading-snug">
              {t("privacyConsentParentTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {fillPlaceholders(t("consentDeadlineNotice"), vars)}
            </p>

            {/* 3. Checkbox + button inside the first viewport */}
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
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

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <Button
              onClick={grant}
              disabled={granting || !checked}
              className="mt-3 h-12 w-full text-base font-semibold"
            >
              {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("privacyConsentGrantBtn")}
            </Button>

            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {t("consentQuickTime")}
            </p>

            {/* Below the fold */}
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              className="mt-6 flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t("consentWhatCoversTitle")}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>

            {showDetails && (
              <div className="mt-2 space-y-4 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
                <ul className="space-y-2">
                  {bullets.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground">
                  {fillPlaceholders(t("privacyConsentParentBody"), vars)}
                </p>
                <p className="text-muted-foreground">
                  {fillPlaceholders(t("privacyConsentParentDeclaration"), vars)}
                </p>
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Undo2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {t("consentQuickWithdraw")}
                </p>
                <p className="text-xs text-muted-foreground">{t("privacyConsentVoluntary")}</p>
                <p className="text-xs text-muted-foreground">
                  <Link to="/privacy" className="underline">{t("privacyConsentPolicyLink")}</Link>
                  {info.policy_version ? <> · {t("consentPolicyVersion")}: {info.policy_version}</> : null}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={declineNotMine}
              disabled={granting}
              className="mt-6 w-full text-center text-sm text-muted-foreground underline underline-offset-4"
            >
              {t("consentNotMyChild")}
            </button>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              {t("consentSecureNote")}
            </p>
          </>
        )}

        {error && !info && <p className="mt-6 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
