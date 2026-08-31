// Notifies the platform admin that a newly completed profile awaits approval.
// Called by the authenticated user right after saving their profile setup.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, belt, discipline, is_approved")
      .eq("user_id", user.id)
      .maybeSingle();

    // Only notify while the account is still awaiting approval.
    if (profile && (profile as any).is_approved) return json({ sent: false, reason: "already_approved" });

    const result = await sendTemplateEmail("coach-profile-ready", "", {
      idempotencyKey: `coach-profile-ready-${user.id}`,
      templateData: {
        userName: (profile as any)?.display_name || user.user_metadata?.display_name || user.email,
        userEmail: user.email,
        belt: (profile as any)?.belt ?? null,
        discipline: (profile as any)?.discipline ?? null,
      },
    });

    return json({ sent: result.sent });
  } catch (e: any) {
    console.error("notify-profile-ready failed", e?.message || e);
    return json({ error: "server_error" }, 500);
  }
});
