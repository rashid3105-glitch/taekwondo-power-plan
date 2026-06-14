// Authenticated endpoint — records a self-consent for the currently signed-in
// user. The caller can ONLY consent for themselves (athlete_id = auth.uid()).
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

    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch club_id for stamping (best-effort).
    const { data: prof } = await admin
      .from("profiles")
      .select("club_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from("consent_records")
      .select("id")
      .eq("athlete_id", user.id)
      .eq("consent_type", "health_data_processing")
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
      const { error } = await admin.from("consent_records").update(patch).eq("id", existing.id);
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
