// Allows a coach to create a competition for one of their managed athletes.
// Uses the service role to bypass the user-scoped RLS on `competitions`,
// but only after explicitly verifying the caller is the athlete's coach
// (via coach_athletes) OR an admin.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return j({ error: "Unauthorized" }, 401);

    const body = await req.text();
    if (body.length > 4000) return j({ error: "Request too large" }, 400);
    const { athlete_id, name, event_date, weight_class_kg, priority, location } = JSON.parse(body);

    if (!athlete_id || !name || !event_date) {
      return j({ error: "athlete_id, name and event_date are required" }, 400);
    }
    if (typeof name !== "string" || name.length > 120) return j({ error: "Bad name" }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return j({ error: "Bad date" }, 400);
    if (priority && !["A", "B", "C"].includes(priority)) return j({ error: "Bad priority" }, 400);
    if (location && (typeof location !== "string" || location.length > 200)) return j({ error: "Bad location" }, 400);
    const wc = weight_class_kg == null ? null : Number(weight_class_kg);
    if (wc != null && (!Number.isFinite(wc) || wc < 20 || wc > 200)) return j({ error: "Bad weight class" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authorization: caller must be admin OR have a coach_athletes row
    const [{ data: roles }, { data: link }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id),
      admin.from("coach_athletes").select("id").eq("coach_id", user.id).eq("athlete_id", athlete_id).maybeSingle(),
    ]);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    if (!isAdmin && !link) return j({ error: "Forbidden — not this athlete's coach" }, 403);

    const { data: inserted, error } = await admin
      .from("competitions")
      .insert({
        user_id: athlete_id,
        name: name.slice(0, 120),
        event_date,
        weight_class_kg: wc,
        priority: priority || "A",
        location: location?.slice(0, 200) || null,
      })
      .select()
      .single();
    if (error) return j({ error: error.message }, 500);

    return j({ success: true, competition: inserted });
  } catch (e: any) {
    console.error("create-athlete-competition error:", e);
    return j({ error: e?.message || "Unknown error" }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
