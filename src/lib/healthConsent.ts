import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchOwnHealthConsent } from "@/lib/diaryHealth";

/**
 * True when a write was rejected because the athlete lacks health-data
 * consent (RLS 42501 on readiness_checkins/weight_logs, or the
 * submit-readiness function's `consent_required`).
 */
export function isHealthConsentError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42501") return true;
  const msg = String(e.message ?? err).toLowerCase();
  return msg.includes("consent_required") || msg.includes("row-level security");
}

/** Health-data consent for a user (defaults to the signed-in user). null = loading. */
export function useHealthConsent(userId?: string | null) {
  const [consent, setConsent] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let id = userId ?? null;
      if (!id) {
        const { data } = await supabase.auth.getUser();
        id = data.user?.id ?? null;
      }
      if (!id) { if (!cancelled) setConsent(false); return; }
      const ok = await fetchOwnHealthConsent(id);
      if (!cancelled) setConsent(ok);
    })();
    return () => { cancelled = true; };
  }, [userId]);
  return consent;
}

export const GUARDIAN_CONSENT_EVENT = "sportstalent:open-guardian-consent";

/**
 * "Go to consent" link target. A minor using the app while waiting for
 * parental consent gets the guardian-request dialog (ConsentGate handles the
 * event and cancels it); everyone else goes to the adult consent on /profile.
 */
export function openHealthConsent(navigate: (to: string) => void) {
  const ev = new CustomEvent(GUARDIAN_CONSENT_EVENT, { cancelable: true });
  const notHandled = window.dispatchEvent(ev);
  if (notHandled) navigate("/profile");
}
