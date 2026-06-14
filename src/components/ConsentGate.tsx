import { useEffect, useState, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { effectiveAge } from "@/lib/age";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Loader2, AlertTriangle, X } from "lucide-react";

// Routes where the gate must never appear (public / pre-login / consent flows).
const PUBLIC_PREFIXES = [
  "/auth", "/reset-password", "/consent/", "/privacy", "/unsubscribe",
  "/parent-join/", "/join/", "/invite/", "/signup",
  "/features/", "/platform/", "/match/share/", "/athlete/",
];
const PUBLIC_EXACT = new Set([
  "/", "/v1", "/v2", "/pricing", "/help", "/about", "/contact",
  "/methodology", "/programs", "/signup/coach", "/taekwondo-training-program",
  "/payment-success",
]);

const isPublicRoute = (pathname: string) => {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
};

type State =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "banner"; graceUntil: string }
  | { kind: "blocking" };

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const evaluate = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setState({ kind: "ok" });
        return;
      }
      const uid = session.user.id;

      const [{ data: profile }, { data: consent }] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, active_role, birth_date, age")
          .eq("user_id", uid)
          .maybeSingle(),
        supabase
          .from("consent_records")
          .select("status, grace_until")
          .eq("athlete_id", uid)
          .eq("consent_type", "health_data_processing")
          .maybeSingle(),
      ]);

      const isAthlete =
        (profile as any)?.role === "athlete" ||
        (profile as any)?.active_role === "athlete";
      if (!isAthlete) {
        setState({ kind: "ok" });
        return;
      }

      const age = effectiveAge(
        (profile as any)?.birth_date ?? null,
        (profile as any)?.age ?? null,
      );
      // Minor → handled separately (parental consent flow).
      if (age != null && age < 18) {
        setState({ kind: "ok" });
        return;
      }

      const status = (consent as any)?.status;
      if (status === "granted") {
        setState({ kind: "ok" });
        return;
      }

      const grace = (consent as any)?.grace_until as string | null | undefined;
      if (grace && new Date(grace).getTime() > Date.now()) {
        setState({ kind: "banner", graceUntil: grace });
        return;
      }
      setState({ kind: "blocking" });
    } catch (e) {
      // Fail open — never lock users out on a network/RLS error.
      console.warn("ConsentGate evaluation failed; failing open:", e);
      setState({ kind: "ok" });
    }
  }, []);

  useEffect(() => {
    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setState({ kind: "loading" });
      evaluate();
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  const grant = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("consent-self", { body: {} });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error((data as any)?.error || "error");
      setState({ kind: "ok" });
    } catch (e: any) {
      setError(e.message || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const onPublic = isPublicRoute(location.pathname);

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

  // Blocking
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{t("selfConsentTitle")}</h1>
        </div>
        <p className="text-sm">{t("selfConsentIntro")}</p>
        <div className="rounded-md border border-border p-3 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">
            {t("consentDataItemsTitle")}
          </div>
          <ul className="text-sm list-disc list-inside space-y-1">
            <li>{t("consentItemHeartRate")}</li>
            <li>{t("consentItemHrv")}</li>
            <li>{t("consentItemSleep")}</li>
            <li>{t("consentItemSteps")}</li>
            <li>{t("consentItemWeight")}</li>
            <li>{t("consentItemMental")}</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          <Link to="/privacy" className="underline">{t("readPrivacyPolicy")}</Link>
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Button onClick={grant} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("selfConsentGrantBtn")}
          </Button>
          <Button onClick={logout} variant="ghost" className="w-full">
            {t("selfConsentLogout")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
