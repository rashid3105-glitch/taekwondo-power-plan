// Public endpoint (no auth required) — token-protected.
// Actions:
//   action="get"   → returns minimal info to render the consent page
//   action="grant" → marks token used + sets consent_records to granted
//   action="not_my_child" → guardian says this request is not theirs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { POLICY_VERSION } from "../_shared/age.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEALTH_DATA_ITEMS = [
  "heart_rate", "hrv", "sleep", "steps", "weight", "mental_assessments",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { action, token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 16 || token.length > 200) {
      return json({ error: "invalid_token" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tk } = await admin
      .from("consent_tokens")
      .select("id, athlete_id, parent_email, consent_type, expires_at, confirmed_at")
      .eq("token", token)
      .maybeSingle();

    if (!tk) return json({ valid: false, reason: "invalid" });

    const expired = new Date(tk.expires_at).getTime() < Date.now();
    const used = !!tk.confirmed_at;

    if (action === "get") {
      // Minimal, non-sensitive info to render the page.
      // We expose the athlete's display name AND the club name (the
      // data controller) so the parent can verify *who* is asking for
      // consent. No health-data values are returned — only metadata.
      let athleteName: string | null = null;
      let clubName: string | null = null;
      let locale: string | null = null;
      if (tk.athlete_id) {
        const { data: p } = await admin
          .from("profiles")
          .select("display_name, default_locale, club_id, clubs:club_id(name)")
          .eq("user_id", tk.athlete_id)
          .maybeSingle();
        athleteName = (p as any)?.display_name || null;
        clubName = (p as any)?.clubs?.name || null;
        locale = (p as any)?.default_locale || null;
      }
      // Funnel instrumentation: guardian opened the link.
      await admin.from("consent_token_events").insert({
        token_id: tk.id,
        athlete_id: tk.athlete_id,
        event: "opened",
        meta: {},
      });

      return json({
        valid: !expired && !used,
        expires_at: tk.expires_at,
        expired,
        used,
        athlete_name: athleteName,
        club_name: clubName,
        locale,
        consent_type: tk.consent_type,
        data_items: HEALTH_DATA_ITEMS,
        policy_version: POLICY_VERSION,
      });
    }

    if (action === "grant") {
      if (expired) return json({ ok: false, error: "expired" }, 410);
      if (used) return json({ ok: false, error: "already_used" }, 409);

      const now = new Date().toISOString();

      // Mark token consumed
      const { error: tokErr } = await admin
        .from("consent_tokens")
        .update({ confirmed_at: now })
        .eq("id", tk.id);
      if (tokErr) return json({ ok: false, error: tokErr.message }, 500);

      // Upsert consent record
      const { data: existing } = await admin
        .from("consent_records")
        .select("id")
        .eq("athlete_id", tk.athlete_id)
        .eq("consent_type", tk.consent_type)
        .maybeSingle();

      const patch = {
        status: "granted",
        granted_at: now,
        granted_by_email: tk.parent_email,
        granted_by_relation: "parent",
        policy_version: POLICY_VERSION,
        withdrawn_at: null,
      };

      if (existing) {
        await admin.from("consent_records").update(patch).eq("id", existing.id);
      } else {
        const { data: athProf } = await admin
          .from("profiles")
          .select("club_id")
          .eq("user_id", tk.athlete_id)
          .maybeSingle();
        await admin.from("consent_records").insert({
          athlete_id: tk.athlete_id,
          consent_type: tk.consent_type,
          club_id: (athProf as any)?.club_id ?? null,
          ...patch,
        });
      }

      await admin.from("consent_token_events").insert({
        token_id: tk.id,
        athlete_id: tk.athlete_id,
        event: "confirmed",
        meta: {},
      });

      // Emailed receipt of what was consented to (best effort — never blocks).
      try {
        const { data: rp } = await admin
          .from("profiles")
          .select("display_name, default_locale, club_id, clubs:club_id(name)")
          .eq("user_id", tk.athlete_id)
          .maybeSingle();
        const receiptClub = (rp as any)?.clubs?.name || null;
        if (tk.parent_email) {
          await sendTemplateEmail("consent-receipt", tk.parent_email, {
            idempotencyKey: `consent-receipt-${tk.id}`,
            fromName: receiptClub || undefined,
            templateData: {
              athleteName: (rp as any)?.display_name || null,
              clubName: receiptClub,
              grantedAt: now,
              policyVersion: POLICY_VERSION,
              locale: (rp as any)?.default_locale || "da",
            },
          });
        }
      } catch (e) {
        console.warn("consent receipt not sent", e);
      }

      return json({ ok: true });
    }

    if (action === "not_my_child") {
      await admin.from("consent_token_events").insert({
        token_id: tk.id,
        athlete_id: tk.athlete_id,
        event: "not_my_child",
        meta: {},
      });
      // Burn the token so it cannot be used later.
      await admin.from("consent_tokens")
        .update({ expires_at: new Date().toISOString() })
        .eq("id", tk.id);
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("consent-confirm error", e);
    return json({ error: "server_error" }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
