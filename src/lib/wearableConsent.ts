// Session-scoped stop flag for wearable sync when the server rejects the
// upload because health-data consent is missing (HTTP 403 consent_required).
// Kept in memory only: a fresh app session tries once more, never in a loop.
// The user-facing explanation is ConsentGate's existing screen.

let consentBlocked = false;

export function isWearableConsentBlocked(): boolean {
  return consentBlocked;
}

/** Returns true (and sets the session flag) if the invoke error is a 403 consent_required. */
export async function detectConsentRequired(error: any): Promise<boolean> {
  const res: Response | undefined = error?.context;
  if (!res || typeof res.status !== "number" || res.status !== 403) return false;
  try {
    const body = await res.clone().json();
    if (body?.error !== "consent_required") return false;
  } catch {
    return false;
  }
  consentBlocked = true;
  console.info("[wearable] sync stopped for this session: consent_required");
  return true;
}
