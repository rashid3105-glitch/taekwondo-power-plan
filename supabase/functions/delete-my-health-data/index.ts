// Lets an athlete whose club membership has ended delete their health data and
// free-text entries immediately, instead of waiting for the retention deadline.
// Same routine as the nightly cleanup — no separate deletion list.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { purgeHealthData } from "../_shared/purge-user.ts";

const CONFIRMATION = "DELETE MY HEALTH DATA";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jsonRes = (o: unknown, status = 200) =>
    new Response(JSON.stringify(o), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return jsonRes({ error: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return jsonRes({ error: "unauthorized" }, 401);

    let body: any = {};
    try { body = await req.json(); } catch { /* empty */ }
    if (body?.confirmation !== CONFIRMATION) {
      return jsonRes({ error: "missing_confirmation" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Only available once the athlete has no active club membership.
    const { count } = await admin
      .from("club_memberships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");
    if ((count ?? 0) > 0) return jsonRes({ error: "still_active_member" }, 409);

    const res = await purgeHealthData(admin, user.id);
    await admin.from("retention_notices").insert({
      category: "left_club_health_data",
      subject_id: user.id,
      notice_type: "purged",
    });

    return jsonRes({ success: true, deleted_rows: res.deleted_rows, errors: res.errors.length });
  } catch {
    return jsonRes({ error: "delete_failed" }, 500);
  }
});
