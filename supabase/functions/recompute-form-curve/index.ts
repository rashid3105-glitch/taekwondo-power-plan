// Recompute form curve for the current authenticated user (or all users if cron-triggered with service role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkCronAuth } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const allMode: boolean = body?.all === true;
    const weeks: number = Math.min(Math.max(parseInt(body?.weeks ?? 12), 1), 52);

    if (allMode) {
      const unauthorized = checkCronAuth(req, corsHeaders);
      if (unauthorized) return unauthorized;
      // Cron mode: compute for every athlete
      const { data: profiles } = await supa.from("profiles").select("user_id").eq("is_approved", true);
      let count = 0;
      for (const p of profiles || []) {
        await supa.rpc("compute_form_curve", { _user_id: p.user_id, _weeks: weeks });
        count++;
      }
      return new Response(JSON.stringify({ ok: true, processed: count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single-user mode: requires auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUserId: string = body?.user_id || userRes.user.id;

    // If targeting another user, must be coach for them
    if (targetUserId !== userRes.user.id) {
      const { data: link } = await userClient
        .from("coach_athletes")
        .select("id")
        .eq("coach_id", userRes.user.id)
        .eq("athlete_id", targetUserId)
        .maybeSingle();
      if (!link) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    await supa.rpc("compute_form_curve", { _user_id: targetUserId, _weeks: weeks });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
