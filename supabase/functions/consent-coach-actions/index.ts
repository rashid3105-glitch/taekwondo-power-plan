// Coach-only actions for parental consent management.
// Actions:
//   - list_missing: list minor athletes in coach's club(s) without granted consent
//   - send_parent_request: create/refresh a consent token + email the parent
//   - remind_me: email the coach a summary of athletes still missing consent
//
// Returns ONLY names + consent status. Never returns health data.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isMinor } from "../_shared/age.ts";

const APP_URL = "https://sportstalent.dk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function invokeSendEmail(
  supabaseUrl: string,
  anonKey: string,
  authHeader: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        apikey: anonKey,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn("send-transactional-email failed", res.status, text);
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    console.warn("send-transactional-email fetch threw", e);
    return { ok: false, status: 0, error: String((e as Error)?.message || e) };
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) return jsonResponse({ error: "unauthorized" }, 401);
    const coachId = userData.user.id;

    // Must have coach or admin app_role.
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", coachId);
    const roleList = (roles || []).map((r: any) => r.role);
    const isCoach = roleList.includes("coach") || roleList.includes("admin");
    if (!isCoach) return jsonResponse({ error: "forbidden" }, 403);

    // Resolve coach's clubs (where they are coach/admin in club_memberships).
    const { data: memberships } = await admin
      .from("club_memberships")
      .select("club_id, role_in_club, status")
      .eq("user_id", coachId)
      .eq("status", "active");
    const coachClubIds = (memberships || [])
      .filter((m: any) => m.role_in_club === "coach" || m.role_in_club === "admin")
      .map((m: any) => m.club_id)
      .filter(Boolean);
    if (coachClubIds.length === 0) return jsonResponse({ error: "no_clubs" }, 403);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action;

    // ─── Helper: load minor athletes in coach's clubs with consent status ───
    async function loadMinorsWithStatus() {
      // All active members of coach's clubs (excluding coach themselves).
      const { data: clubMembers } = await admin
        .from("club_memberships")
        .select("user_id, club_id")
        .in("club_id", coachClubIds)
        .eq("status", "active");
      const athleteIds = Array.from(
        new Set((clubMembers || []).map((m: any) => m.user_id).filter((id: string) => id !== coachId)),
      );
      if (athleteIds.length === 0) return [];

      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, display_name, birth_date, age, club_id")
        .in("user_id", athleteIds);

      const minorProfiles = (profiles || []).filter((p: any) =>
        isMinor(p.birth_date, p.age),
      );
      if (minorProfiles.length === 0) return [];

      const minorIds = minorProfiles.map((p: any) => p.user_id);

      const { data: consents } = await admin
        .from("consent_records")
        .select("athlete_id, status, grace_until")
        .eq("consent_type", "health_data_processing")
        .in("athlete_id", minorIds);
      const consentByAthlete = new Map<string, any>();
      for (const c of consents || []) consentByAthlete.set(c.athlete_id, c);

      const { data: tokens } = await admin
        .from("consent_tokens")
        .select("athlete_id, parent_email, expires_at, created_at")
        .eq("consent_type", "health_data_processing")
        .in("athlete_id", minorIds)
        .order("created_at", { ascending: false });
      const latestTokenByAthlete = new Map<string, any>();
      for (const t of tokens || []) {
        if (!latestTokenByAthlete.has(t.athlete_id)) latestTokenByAthlete.set(t.athlete_id, t);
      }

      return minorProfiles.map((p: any) => {
        const c = consentByAthlete.get(p.user_id);
        const tok = latestTokenByAthlete.get(p.user_id);
        return {
          athlete_id: p.user_id,
          display_name: p.display_name || "",
          club_id: p.club_id,
          status: c?.status || "none",
          grace_until: c?.grace_until || null,
          parent_email_on_token: tok?.parent_email || null,
        };
      });
    }

    // ─── Action: list_missing ───
    if (action === "list_missing") {
      const all = await loadMinorsWithStatus();
      const missing = all.filter((a) => a.status !== "granted");
      return jsonResponse({ missing });
    }

    // ─── Action: send_parent_request ───
    if (action === "send_parent_request") {
      const athleteId: string = body.athlete_id;
      const parentEmail: string = (body.parent_email || "").trim();
      if (!athleteId || !parentEmail || !EMAIL_RE.test(parentEmail)) {
        return jsonResponse({ error: "invalid_input" }, 400);
      }
      // Verify athlete is in one of coach's clubs and is a minor.
      const { data: athleteRow } = await admin
        .from("profiles")
        .select("user_id, display_name, birth_date, age, club_id")
        .eq("user_id", athleteId)
        .maybeSingle();
      if (!athleteRow) return jsonResponse({ error: "not_found" }, 404);

      const { data: athleteMemberships } = await admin
        .from("club_memberships")
        .select("club_id")
        .eq("user_id", athleteId)
        .eq("status", "active");
      const athleteClubs = new Set((athleteMemberships || []).map((m: any) => m.club_id));
      const inCoachClub = coachClubIds.some((cid) => athleteClubs.has(cid));
      if (!inCoachClub) return jsonResponse({ error: "forbidden" }, 403);

      if (!isMinor(athleteRow.birth_date, athleteRow.age)) {
        return jsonResponse({ error: "not_a_minor" }, 400);
      }

      const tokenValue = randomToken(32);
      const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();

      // Ensure pending consent_records exists.
      await admin.from("consent_records").upsert(
        {
          athlete_id: athleteId,
          consent_type: "health_data_processing",
          status: "pending",
          club_id: athleteRow.club_id,
        },
        { onConflict: "athlete_id,consent_type", ignoreDuplicates: false },
      );

      // Insert new token (does not invalidate older ones — most recent wins by created_at).
      await admin.from("consent_tokens").insert({
        token: tokenValue,
        athlete_id: athleteId,
        parent_email: parentEmail,
        consent_type: "health_data_processing",
        expires_at: expiresAt,
      });

      const consentUrl = `${APP_URL}/consent/${tokenValue}`;
      const sendRes = await invokeSendEmail(supabaseUrl, anonKey, authHeader, {
        templateName: "parental-consent-request",
        recipientEmail: parentEmail,
        idempotencyKey: `parental-consent-${athleteId}-${tokenValue.slice(0, 8)}`,
        templateData: {
          athleteName: athleteRow.display_name || "your child",
          consentUrl,
          expiresInDays: 14,
        },
      });
      if (!sendRes.ok) {
        return jsonResponse({ ok: false, queued: false, error: sendRes.error || `status_${sendRes.status}` }, 502);
      }
      return jsonResponse({ ok: true, queued: true });
    }

    // ─── Action: remind_me ───
    if (action === "remind_me") {
      const all = await loadMinorsWithStatus();
      const missing = all.filter((a) => a.status !== "granted");
      if (missing.length === 0) {
        return jsonResponse({ ok: true, queued: false, count: 0 });
      }

      // Coach's email + name
      const { data: coachAuth } = await admin.auth.admin.getUserById(coachId);
      const coachEmail = coachAuth?.user?.email;
      if (!coachEmail) return jsonResponse({ error: "no_coach_email" }, 400);

      const { data: coachProfile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("user_id", coachId)
        .maybeSingle();

      const athleteNames = missing.map((m) => m.display_name).filter(Boolean);

      const sendRes = await invokeSendEmail(supabaseUrl, anonKey, authHeader, {
        templateName: "coach-consent-reminder",
        recipientEmail: coachEmail,
        idempotencyKey: `coach-consent-reminder-${coachId}-${new Date().toISOString().slice(0, 10)}`,
        templateData: {
          coachName: coachProfile?.display_name || "coach",
          athleteNames,
          total: missing.length,
        },
      });
      if (!sendRes.ok) {
        return jsonResponse({ ok: false, queued: false, count: missing.length, error: sendRes.error || `status_${sendRes.status}` }, 502);
      }
      return jsonResponse({ ok: true, queued: true, count: missing.length });
    }

    return jsonResponse({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("consent-coach-actions error:", e);
    return jsonResponse({ error: String((e as Error)?.message || e) }, 500);
  }
});
