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
import { POLICY_VERSION } from "../_shared/age.ts";

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
    const action: "grant" | "withdraw" =
      body?.action === "withdraw" ? "withdraw" : "grant";

    const admin = createClient(supabaseUrl, serviceKey);
    const now = new Date().toISOString();

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
      .select("club_id")
      .eq("user_id", user.id)
      .maybeSingle();

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
    return json({ error: String(e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

