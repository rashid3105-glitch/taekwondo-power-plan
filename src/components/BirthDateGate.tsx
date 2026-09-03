import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BirthDatePicker } from "@/components/BirthDatePicker";
import { ageFromBirthDate } from "@/lib/age";
import { CalendarDays, Loader2, X } from "lucide-react";
import { toast } from "sonner";

// Routes where the prompt must never appear (public / pre-login / consent flows).
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
const isPublicRoute = (pathname: string) =>
  PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

const SNOOZE_KEY = "birthDateGate:snoozed";

/**
 * Non-blocking prompt asking an athlete for a missing date of birth.
 *
 * It NEVER blocks the app: dismissing it only hides it for the current
 * session, and it comes back on the next one. Consent blocking is owned
 * solely by the grace clock in ConsentGate.
 */
export function BirthDateGate() {
  const location = useLocation();
  const { t } = useLanguage();
  const [needed, setNeeded] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(SNOOZE_KEY) === "1",
  );
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const evaluate = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setNeeded(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, active_role, birth_date")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isAthlete =
        (profile as any)?.active_role === "athlete" ||
        ((profile as any)?.role === "athlete" && !(profile as any)?.active_role);
      // Coaches are never nagged by this gate.
      if (!isAthlete) { setNeeded(false); return; }

      setNeeded(!(profile as any)?.birth_date);
    } catch {
      // Fail silently — this prompt must never break the app.
      setNeeded(false);
    }
  }, []);

  useEffect(() => {
    void evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void evaluate(); });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  const save = async () => {
    const age = ageFromBirthDate(value);
    if (!value || age == null || age < 3 || age > 100) {
      toast.error(t("birthDateInvalid"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.functions.invoke("update-my-profile", {
      body: { birth_date: value, age },
    });
    setSaving(false);
    if (error) { toast.error(t("birthDateInvalid")); return; }
    toast.success(t("birthDateGateSaved"));
    setNeeded(false);
  };

  const snooze = () => {
    sessionStorage.setItem(SNOOZE_KEY, "1");
    setDismissed(true);
  };

  if (!needed || dismissed || isPublicRoute(location.pathname)) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 pb-safe">
      <Card className="w-full max-w-md p-4 space-y-3 shadow-lg border-primary/30">
        <div className="flex items-start gap-3">
          <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold">{t("birthDateGateTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t("birthDateGateBody")}
            </p>
          </div>
          <button
            onClick={snooze}
            aria-label={t("birthDateGateLater")}
            title={t("birthDateGateLater")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <BirthDatePicker value={value} onChange={setValue} />

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !value} className="flex-1 h-11">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("birthDateGateCta")}
          </Button>
          <Button variant="ghost" onClick={snooze} className="h-11">
            {t("birthDateGateLater")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
