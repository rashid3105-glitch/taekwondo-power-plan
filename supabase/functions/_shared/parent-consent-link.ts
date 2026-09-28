// Sends the guardian consent link for records flagged by
// public.recompute_consent_requirement (parent_link_needed = true).
// If no guardian email is known the record is marked parent_email_missing so
// coaches see it in the consent panel.
import { CONSENT_TOKEN_DAYS } from "./age.ts";
import { sendTemplateEmail } from "./transactional-email-templates/send-email.ts";

const APP_URL = "https://sportstalent.dk";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
export async function processPendingParentLinks(admin: any, athleteIds: string[], source: string) {
  const result = { sent: 0, missing_email: 0 };
  if (athleteIds.length === 0) return result;

  const { data: recs } = await admin
    .from("consent_records")
    .select("id, athlete_id, club_id")
    .eq("consent_type", "health_data_processing")
    .eq("status", "pending")
    .eq("parent_link_needed", true)
    .in("athlete_id", athleteIds);

  for (const rec of recs || []) {
    const { data: prof } = await admin
      .from("profiles")
      .select("display_name, club_id, parent_email, guardian_email, default_locale")
      .eq("user_id", rec.athlete_id)
      .maybeSingle();
    let email: string | null = (prof?.parent_email || prof?.guardian_email || "").trim() || null;
    if (!email) {
      const { data: tok } = await admin
        .from("consent_tokens")
        .select("parent_email")
        .eq("athlete_id", rec.athlete_id)
        .eq("consent_type", "health_data_processing")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      email = tok?.parent_email?.trim() || null;
    }

    if (!email || !EMAIL_RE.test(email)) {
      await admin.from("consent_records")
        .update({ parent_email_missing: true, parent_link_needed: false })
        .eq("id", rec.id);
      result.missing_email++;
      continue;
    }

    const clubId = rec.club_id || prof?.club_id || null;
    const tokenValue = randomToken(32);
    const expiresAt = new Date(Date.now() + CONSENT_TOKEN_DAYS * 24 * 3600 * 1000).toISOString();
    const { data: tokenRow } = await admin.from("consent_tokens").insert({
      token: tokenValue,
      athlete_id: rec.athlete_id,
      parent_email: email,
      consent_type: "health_data_processing",
      expires_at: expiresAt,
    }).select("id").maybeSingle();

    const { data: club } = clubId
      ? await admin.from("clubs").select("name").eq("id", clubId).maybeSingle()
      : { data: null };

    let sent = false;
    try {
      const r = await sendTemplateEmail("parental-consent-request", email, {
        idempotencyKey: `parental-consent-${rec.athlete_id}-${tokenValue.slice(0, 8)}`,
        fromName: club?.name || undefined,
        templateData: {
          athleteName: prof?.display_name || "your child",
          consentUrl: `${APP_URL}/consent/${tokenValue}`,
          expiresInDays: CONSENT_TOKEN_DAYS,
          clubName: club?.name || null,
          coachName: null,
          locale: prof?.default_locale || "da",
          reminderNumber: 0,
        },
      });
      sent = !!r.sent;
    } catch (e) {
      console.warn("parent link send failed", e);
    }

    if (tokenRow?.id) {
      await admin.from("consent_token_events").insert({
        token_id: tokenRow.id,
        athlete_id: rec.athlete_id,
        club_id: clubId,
        event: sent ? "sent" : "send_failed",
        meta: { source },
      });
    }
    if (sent) {
      await admin.from("consent_records")
        .update({ parent_link_needed: false, parent_email_missing: false })
        .eq("id", rec.id);
      result.sent++;
    }
  }
  return result;
}
