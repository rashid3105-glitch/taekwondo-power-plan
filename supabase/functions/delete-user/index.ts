import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DELETED_USER_ID } from "../_shared/deletion-lists.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Pick an admin key. Prefer the new "secret key" (sb_secret_...) issued by
    // Supabase's signing-keys system; fall back to legacy service-role JWT.
    let adminKey = "";
    if (secretKeysRaw) {
      const trimmed = secretKeysRaw.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            adminKey = (parsed[0]?.secret ?? parsed[0]?.key ?? parsed[0]) ?? "";
          } else if (typeof parsed === "object" && parsed) {
            const first = Object.values(parsed)[0] as any;
            adminKey = (first?.secret ?? first?.key ?? first) ?? "";
          }
        } catch {
          adminKey = trimmed;
        }
      } else {
        adminKey = trimmed;
      }
    }
    if (!adminKey) adminKey = serviceRoleKey;
    if (!adminKey) throw new Error("No admin key configured (SUPABASE_SECRET_KEYS / SUPABASE_SERVICE_ROLE_KEY)");

    // Verify calling user is admin
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, adminKey);

    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) throw new Error("Not an admin");

    const { user_id } = await req.json();
    if (!user_id) throw new Error("Missing user_id");
    if (user_id === DELETED_USER_ID) throw new Error("cannot_delete_system_user");
    if (user_id === user.id) throw new Error("Cannot delete yourself");

    // Direct call to GoTrue admin API so we get the real status/body if it fails
    // (auth-js wraps fetch errors as empty AuthRetryableFetchError).
    const delRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
      method: "DELETE",
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
      },
    });
    if (!delRes.ok) {
      const body = await delRes.text();
      console.error("GoTrue admin deleteUser failed", delRes.status, body);
      return new Response(
        JSON.stringify({
          error: "auth admin deleteUser failed",
          status: delRes.status,
          body,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      await delRes.text().catch(() => {});
    }

    // Clean up any remaining data without FK cascades
    await Promise.all([
      adminClient.from("diary_entries").delete().eq("user_id", user_id),
      adminClient.from("physical_test_results").delete().eq("user_id", user_id),
      adminClient.from("mental_assessments").delete().eq("user_id", user_id),
      adminClient.from("user_recipes").delete().eq("user_id", user_id),
      adminClient.from("user_exercises").delete().eq("user_id", user_id),
      adminClient.from("workout_logs").delete().eq("user_id", user_id),
      adminClient.from("profiles").delete().eq("user_id", user_id),
      adminClient.from("user_roles").delete().eq("user_id", user_id),
      adminClient.from("coach_athletes").delete().eq("athlete_id", user_id),
      adminClient.from("coach_athletes").delete().eq("coach_id", user_id),
      adminClient.from("training_plans").delete().eq("user_id", user_id),
      adminClient.from("rehab_plans").delete().eq("user_id", user_id),
    ]);


    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("delete-user error:", err);
    const message =
      err?.message ||
      err?.error_description ||
      err?.msg ||
      (typeof err === "string" ? err : JSON.stringify(err)) ||
      "Unknown error";
    return new Response(
      JSON.stringify({ error: message, details: err?.code || err?.status || null }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
