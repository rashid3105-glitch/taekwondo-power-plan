// Authenticated endpoint — records or withdraws the signed-in user's
// self-consent. The caller can ONLY operate on themselves
// (athlete_id = auth.uid()).
//
// Request body:
//   { }                       → defaults to "grant" (back-compat)
//   { action: "grant" }       → set consent to granted
//   { action: "withdraw" }    → set consent to withdrawn (status='withdrawn',
//                               withdrawn_at=now, granted_at=null)
//
// TODO(parent-withdraw): we also need a parallel public/token-based
// endpoint that lets a parent withdraw consent they previously granted
// on a minor's behalf, without going through the club. The wording shown
// to parents already promises this, but for now they need to contact the
// club (the data controller) to action it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  POLICY_VERSION,
  isBelowConsentAge,
  DEFAULT_CONSENT_AGE,
  CONSENT_TOKEN_DAYS,
} from "../_shared/age.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const APP_URL = "https://sportstalent.dk";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}


const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    // Parse the body defensively — old callers send `{}` for grant.
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const rawAction = body?.action;
    const action: "grant" | "withdraw" | "guardian_status" | "request_guardian" =
      rawAction === "withdraw" || rawAction === "guardian_status" || rawAction === "request_guardian"
        ? rawAction
        : "grant";

    const admin = createClient(supabaseUrl, serviceKey);
    const now = new Date().toISOString();

    // ─── Guardian flow: report the ACTUAL state of the request ───
    // The screen shown to a minor must never claim we are waiting for a
    // guardian when no token and no pending record exist.
    if (action === "guardian_status" || action === "request_guardian") {
      const { data: rec } = await admin
        .from("consent_records")
        .select("id, status")
        .eq("athlete_id", user.id)
        .eq("consent_type", "health_data_processing")
        .maybeSingle();

      const { data: prof0 } = await admin
        .from("profiles")
        .select("display_name, club_id, birth_date, guardian_email, default_locale")
        .eq("user_id", user.id)
        .maybeSingle();

      const loadToken = async () => {
        const { data: toks } = await admin
          .from("consent_tokens")
          .select("created_at, expires_at, confirmed_at")
          .eq("athlete_id", user.id)
          .eq("consent_type", "health_data_processing")
          .order("created_at", { ascending: false })
          .limit(1);
        const tok = (toks || [])[0] as any;
        if (!tok) return null;
        return {
          sent_at: tok.created_at,
          expires_at: tok.expires_at,
          expired: new Date(tok.expires_at).getTime() < Date.now(),
        };
      };

      if (action === "guardian_status") {
        return json({
          ok: true,
          record_status: (rec as any)?.status ?? null,
          guardian_email: (prof0 as any)?.guardian_email ?? null,
          token: await loadToken(),
        });
      }

      // action === "request_guardian" — the athlete supplies the guardian's
      // email so the existing token-based consent flow can actually start.
      const guardianEmail = String(body?.guardian_email || "").trim();
      if (!EMAIL_RE.test(guardianEmail) || guardianEmail.length > 200) {
        return json({ ok: false, error: "invalid_email" }, 400);
      }
      if (!prof0?.birth_date) return json({ ok: false, error: "birth_date_required" }, 400);

      let reqConsentAge = DEFAULT_CONSENT_AGE;
      try {
        const { data: ageData, error: ageErr } = await admin.rpc(
          "consent_age_for_athlete",
          { _athlete_id: user.id },
        );
        if (!ageErr && typeof ageData === "number") reqConsentAge = ageData;
      } catch (_e) { /* fail-safe: keep default */ }
      if (isBelowConsentAge(prof0.birth_date, reqConsentAge) !== true) {
        return json({ ok: false, error: "not_a_minor" }, 400);
      }
      if ((rec as any)?.status === "granted") {
        return json({ ok: false, error: "already_granted" }, 400);
      }

      await admin
        .from("profiles")
        .update({ guardian_email: guardianEmail })
        .eq("user_id", user.id);

      const tokenValue = randomToken(32);
      const expiresAt = new Date(Date.now() + CONSENT_TOKEN_DAYS * 24 * 3600 * 1000).toISOString();

      if (rec?.id) {
        if ((rec as any).status !== "pending") {
          await admin.from("consent_records")
            .update({ status: "pending" })
            .eq("id", rec.id)
            .eq("athlete_id", user.id);
        }
      } else {
        await admin.from("consent_records").insert({
          athlete_id: user.id,
          consent_type: "health_data_processing",
          status: "pending",
          club_id: prof0?.club_id ?? null,
        });
      }

      const { data: tokenRow } = await admin.from("consent_tokens").insert({
        token: tokenValue,
        athlete_id: user.id,
        parent_email: guardianEmail,
        consent_type: "health_data_processing",
        expires_at: expiresAt,
      }).select("id").maybeSingle();

      if (tokenRow?.id) {
        await admin.from("consent_token_events").insert({
          token_id: tokenRow.id,
          athlete_id: user.id,
          club_id: prof0?.club_id ?? null,
          event: "sent",
          meta: { source: "athlete_guardian_request" },
        });
      }

      let clubNameForEmail: string | null = null;
      if (prof0?.club_id) {
        const { data: clubRow } = await admin
          .from("clubs").select("name").eq("id", prof0.club_id).maybeSingle();
        clubNameForEmail = (clubRow as any)?.name ?? null;
      }

      try {
        const sent = await sendTemplateEmail("parental-consent-request", guardianEmail, {
          idempotencyKey: `parental-consent-${user.id}-${tokenValue.slice(0, 8)}`,
          fromName: clubNameForEmail || undefined,
          templateData: {
            athleteName: (prof0 as any)?.display_name || "",
            consentUrl: `${APP_URL}/consent/${tokenValue}`,
            expiresInDays: CONSENT_TOKEN_DAYS,
            clubName: clubNameForEmail,
            coachName: null,
            locale: (prof0 as any)?.default_locale || "da",
            reminderNumber: 0,
          },
        });
        if (!sent?.sent) return json({ ok: false, error: "email_not_sent" }, 502);
      } catch (_e) {
        console.warn("consent-self guardian email failed");
        return json({ ok: false, error: "email_not_sent" }, 502);
      }

      return json({ ok: true, sent_at: now, expires_at: expiresAt });
    }

    // Find the existing consent row for this user, if any. We always
    // scope both the lookup and any mutation by athlete_id = user.id —
    // the caller can never touch another user's consent.
    const { data: existing } = await admin
      .from("consent_records")
      .select("id")
      .eq("athlete_id", user.id)
      .eq("consent_type", "health_data_processing")
      .maybeSingle();


    if (action === "withdraw") {
      if (!existing) {
        // Nothing to withdraw — treat as a no-op success so the UI can
        // safely re-show the consent screen.
        return json({ ok: true, withdrawn: false });
      }
      const { error } = await admin
        .from("consent_records")
        .update({
          status: "withdrawn",
          withdrawn_at: now,
          granted_at: null,
          grace_until: null,
        })
        .eq("id", existing.id)
        .eq("athlete_id", user.id);
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, withdrawn: true });
    }

    // action === "grant"
    // Best-effort: stamp the user's current club so coaches can scope by club.
    const { data: prof } = await admin
      .from("profiles")
      .select("club_id, birth_date, country")
      .eq("user_id", user.id)
      .maybeSingle();

    // Server-side age guard — a minor can never self-grant health consent.
    if (!prof?.birth_date) {
      return json({ error: "birth_date_required" }, 400);
    }

    let consentAge = DEFAULT_CONSENT_AGE;
    try {
      const { data: ageData, error: ageErr } = await admin.rpc(
        "consent_age_for_athlete",
        { _athlete_id: user.id },
      );
      if (!ageErr && typeof ageData === "number") consentAge = ageData;
    } catch (_e) {
      // fail-safe: keep DEFAULT_CONSENT_AGE
    }

    if (isBelowConsentAge(prof.birth_date, consentAge) !== false) {
      return json({ error: "guardian_consent_required" }, 403);
    }


    const patch = {
      status: "granted",
      granted_at: now,
      granted_by_relation: "self",
      granted_by_email: user.email ?? null,
      policy_version: POLICY_VERSION,
      withdrawn_at: null,
    };

    if (existing) {
      const { error } = await admin
        .from("consent_records")
        .update(patch)
        .eq("id", existing.id)
        .eq("athlete_id", user.id);
      if (error) return json({ ok: false, error: error.message }, 500);
    } else {
      const { error } = await admin.from("consent_records").insert({
        athlete_id: user.id,
        consent_type: "health_data_processing",
        club_id: prof?.club_id ?? null,
        ...patch,
      });
      if (error) return json({ ok: false, error: error.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("consent-self error", e);
    return json({ error: "server_error" }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

