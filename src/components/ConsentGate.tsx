import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ageFromBirthDate, clearConsentAgeCache, fetchConsentAge, isBelowConsentAge } from "@/lib/age";
import { BirthDatePicker } from "@/components/BirthDatePicker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Loader2, AlertTriangle, X } from "lucide-react";

// Routes where the gate must never appear (public / pre-login / consent flows).
const PUBLIC_PREFIXES = [
  "/auth", "/reset-password", "/consent/", "/privacy", "/unsubscribe",
  "/parent-join/", "/join/", "/invite/", "/signup",
  "/features/", "/platform/", "/match/share/", "/athlete/",
];
const PUBLIC_EXACT = new Set([
  "/", "/v1", "/v2", "/pricing", "/about", "/contact",
  "/methodology", "/programs", "/signup/coach", "/traeningsprogram",
  "/tekniktraening", "/staevneforberedelse", "/fysiske-test", "/poomsae",
  "/payment-success",
]);


const isPublicRoute = (pathname: string) => {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
};

type State =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "banner"; graceUntil: string; clubName: string | null }
  | { kind: "minor"; clubName: string | null; guardianEmail: string | null; guardianLinked: boolean }
  | { kind: "blocking"; clubName: string | null }
  | { kind: "needsBirthDate" }
  | { kind: "warn" }
  | { kind: "error" };


function fillPlaceholders(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? `{${key}}`);
}

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // GDPR requires unambiguous, active consent — checkbox starts UNCHECKED
  // and the submit button stays disabled until the user ticks it.
  const [checked, setChecked] = useState(false);
  const [guardianLink, setGuardianLink] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");


  const evaluate = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setState({ kind: "ok" });
        return;
      }
      const uid = session.user.id;

      const [
        { data: profile, error: profileErr },
        { data: consent, error: consentErr },
        { data: parents, error: parentsErr },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, active_role, birth_date, age, guardian_email, club_id, clubs:club_id(name)")
          .eq("user_id", uid)
          .maybeSingle(),
        supabase
          .from("consent_records")
          .select("status, grace_until")
          .eq("athlete_id", uid)
          .eq("consent_type", "health_data_processing")
          .maybeSingle(),
        supabase
          .from("parent_athletes" as any)
          .select("id")
          .eq("athlete_id", uid)
          .limit(1),
      ]);

      // An authorization/query failure is exactly the case that must close the
      // gate: `{ data: null, error }` is never treated as "no row / not an
      // athlete". Only "no error, no row" is a legitimate non-athlete.
      if (profileErr || consentErr || parentsErr) {
        console.warn("ConsentGate query error; failing closed:", profileErr || consentErr || parentsErr);
        setState({ kind: "error" });
        return;
      }

      const isAthlete =
        (profile as any)?.role === "athlete" ||
        (profile as any)?.active_role === "athlete";
      if (!isAthlete) {
        setState({ kind: "ok" });
        return;
      }

      const clubName: string | null = (profile as any)?.clubs?.name ?? null;
      const status = (consent as any)?.status;
      const grace = (consent as any)?.grace_until as string | null | undefined;
      const inGrace = !!grace && new Date(grace).getTime() > Date.now();

      // Consent decisions use birth_date ONLY — profiles.age is a decaying
      // static field and must never resolve consent status.
      // The threshold is country-aware (GDPR Art. 8) and resolved server side;
      // it falls back to 18 on any failure.
      // Unknown age (no birth_date) must NOT hit the guardian wall: it falls
      // through to the adult flow, and BirthDateGate nags for the missing date.
      const threshold = await fetchConsentAge(uid);
      const verdict = isBelowConsentAge((profile as any)?.birth_date ?? null, threshold);

      // Unknown age must never fall through to the adult self-consent screen:
      // a minor without a registered birth date could otherwise consent for
      // themselves. Ask the athlete for the date first, then re-evaluate.
      if (verdict === "unknown") {
        setState({ kind: "needsBirthDate" });
        return;
      }

      if (verdict === true) {
        if (status === "granted") {
          setState({ kind: "ok" });
          return;
        }
        if (inGrace) {
          setState({ kind: "banner", graceUntil: grace as string, clubName });
          return;
        }
        setState({
          kind: "minor",
          clubName,
          guardianEmail: ((profile as any)?.guardian_email as string | null) ?? null,
          guardianLinked: Array.isArray(parents) && parents.length > 0,
        });
        return;
      }

      if (status === "granted") {
        setState({ kind: "ok" });
        return;
      }

      if (inGrace) {
        setState({ kind: "banner", graceUntil: grace as string, clubName });
        return;
      }
      setState({ kind: "blocking", clubName });

    } catch (e) {
      // Thrown errors here are availability problems (network, timeout,
      // consent-age lookup), not consent problems — fail OPEN: the app renders
      // with a warning banner and a retry, instead of a full-screen block.
      // Authorization failures are surfaced as query `error` above and DO fail
      // closed (kind: "error").
      console.warn("ConsentGate evaluation failed; failing open with warning:", e);
      setState({ kind: "warn" });
    }
  }, []);

  useEffect(() => {
    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setState({ kind: "loading" });
      setChecked(false);
      evaluate();
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  const grant = async () => {
    if (!checked && state.kind === "blocking") return; // safety net
    setSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("consent-self", { body: { action: "grant" } });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error((data as any)?.error || "error");
      setState({ kind: "ok" });
    } catch (e: any) {
      setError(e.message || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const saveBirthDate = async () => {
    const age = ageFromBirthDate(birthDate);
    if (!birthDate || age == null || age < 3 || age > 100) {
      toast.error(t("birthDateInvalid"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error: fnErr } = await supabase.functions.invoke("update-my-profile", {
        body: { birth_date: birthDate, age },
      });
      if (fnErr) throw fnErr;
      toast.success(t("birthDateGateSaved"));
      if (session?.user?.id) clearConsentAgeCache(session.user.id);
      setBirthDate("");
      setState({ kind: "loading" });
      await evaluate();
    } catch (e: any) {
      setError(e.message || t("birthDateInvalid"));
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  // Minor flow: create (or reuse) a guardian invite link the athlete can share.
  const createGuardianInvite = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error("no session");
      const { data: existing } = await supabase
        .from("parent_invites" as any)
        .select("code")
        .eq("athlete_id", uid)
        .order("created_at", { ascending: false })
        .limit(1);
      let code = (existing as any)?.[0]?.code as string | undefined;
      if (!code) {
        code = Array.from({ length: 8 }, () =>
          "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
        ).join("");
        const { error: insErr } = await supabase
          .from("parent_invites" as any)
          .insert({ athlete_id: uid, code });
        if (insErr) throw insErr;
      }
      setGuardianLink(`${window.location.origin}/parent-join/${code}`);
    } catch (e: any) {
      setError(e.message || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const onPublic = isPublicRoute(location.pathname);

  // Compute placeholder vars — only meaningful inside banner/blocking states.
  const clubName =
    (state.kind === "blocking" || state.kind === "banner" || state.kind === "minor")
      ? (state.clubName?.trim() || t("privacyConsentYourClub"))
      : t("privacyConsentYourClub");
  const vars = useMemo(() => ({ clubName }), [clubName]);


  // Always render children on public routes; never block sign-in flow.
  if (onPublic) return <>{children}</>;
  if (state.kind === "loading" || state.kind === "ok") return <>{children}</>;

  if (state.kind === "banner") {
    return (
      <>
        {!bannerDismissed && (
          <div className="sticky top-0 z-50 w-full bg-amber-100 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800">
            <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0" />
              <span className="flex-1 text-amber-900 dark:text-amber-100">
                {t("selfConsentBannerText")}
              </span>
              <Button size="sm" onClick={grant} disabled={submitting}>
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : t("selfConsentBannerCta")}
              </Button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-amber-900/70 dark:text-amber-100/70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {error && <div className="px-3 pb-2 text-xs text-destructive max-w-5xl mx-auto">{error}</div>}
          </div>
        )}
        {children}
      </>
    );
  }

  if (state.kind === "minor") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6 space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">{t("privacyConsentMinorTitle")}</h1>
          </div>
          <p className="text-sm leading-relaxed">
            {fillPlaceholders(t("privacyConsentMinorBody"), vars)}
          </p>

          {state.guardianLinked ? (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed">
              {t("privacyConsentMinorWaiting")}
            </div>
          ) : (
            <div className="space-y-3">
              {state.guardianEmail && (
                <p className="text-xs text-muted-foreground">{state.guardianEmail}</p>
              )}
              {guardianLink ? (
                <div className="space-y-2">
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-xs break-all">
                    {guardianLink}
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigator.clipboard?.writeText(guardianLink)}
                  >
                    {t("privacyConsentMinorCopyLink")}
                  </Button>
                </div>
              ) : (
                <Button onClick={createGuardianInvite} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("privacyConsentMinorInviteBtn")}
                </Button>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            <Link to="/privacy" className="underline">{t("privacyConsentPolicyLink")}</Link>
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-2">
            <Button onClick={() => { setState({ kind: "loading" }); evaluate(); }} variant="secondary" className="w-full">
              {t("privacyConsentMinorRefresh")}
            </Button>
            <Button onClick={logout} variant="ghost" className="w-full">
              {t("selfConsentLogout")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (state.kind === "needsBirthDate") {
    return (
      <>
        {!bannerDismissed && (
          <div className="sticky top-0 z-50 w-full bg-amber-100 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800">
            <div className="max-w-5xl mx-auto px-3 py-2 space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0" />
                <span className="flex-1 text-amber-900 dark:text-amber-100">
                  {t("consentBirthDateBannerText")}
                </span>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="text-amber-900/70 dark:text-amber-100/70 hover:opacity-100"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <BirthDatePicker value={birthDate} onChange={setBirthDate} />
                </div>
                <Button size="sm" onClick={saveBirthDate} disabled={submitting || !birthDate}>
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : t("consentBirthDateBannerCta")}
                </Button>
              </div>
              {error && <div className="text-xs text-destructive">{error}</div>}
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  if (state.kind === "warn") {
    return (
      <>
        {!bannerDismissed && (
          <div className="sticky top-0 z-50 w-full bg-amber-100 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800">
            <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0" />
              <span className="flex-1 text-amber-900 dark:text-amber-100">
                {t("consentWarnBannerText")}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setState({ kind: "loading" }); evaluate(); }}
              >
                {t("consentWarnBannerRetry")}
              </Button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-amber-900/70 dark:text-amber-100/70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6 space-y-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <h1 className="text-xl font-semibold">{t("consentCheckFailedTitle")}</h1>
          </div>
          <p className="text-sm leading-relaxed">{t("consentCheckFailedBody")}</p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => { setState({ kind: "loading" }); evaluate(); }}
              className="w-full"
            >
              {t("consentCheckFailedRetry")}
            </Button>
            <Button onClick={logout} variant="ghost" className="w-full">
              {t("selfConsentLogout")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Blocking

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{t("privacyConsentAdultTitle")}</h1>
        </div>
        <p className="text-sm leading-relaxed">{t("privacyConsentAdultBody")}</p>

        <div className="rounded-md border border-border p-3 text-sm leading-relaxed bg-muted/30">
          {fillPlaceholders(t("privacyConsentAdultDeclaration"), vars)}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("privacyConsentVoluntary")}
        </p>

        <p className="text-xs text-muted-foreground">
          <Link to="/privacy" className="underline">{t("privacyConsentPolicyLink")}</Link>
        </p>

        <label className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
            aria-describedby="adult-consent-checkbox-label"
          />
          <span id="adult-consent-checkbox-label" className="text-sm leading-relaxed">
            {t("privacyConsentAdultCheckbox")}
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Button onClick={grant} disabled={submitting || !checked} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("privacyConsentGrantBtn")}
          </Button>
          <Button onClick={logout} variant="ghost" className="w-full">
            {t("selfConsentLogout")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
