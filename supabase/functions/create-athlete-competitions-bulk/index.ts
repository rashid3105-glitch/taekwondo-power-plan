// Coach bulk competition creation: assigns the same competition to multiple
// managed athletes in one call. Each athlete gets an independent row in
// `competitions` so they can later edit, generate plans, or reflect
// independently.
//
// Authorization: caller must be admin OR the coach of EVERY supplied
// athlete_id (via coach_athletes). Uses the service role for inserts.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATHLETES_PER_CALL = 100;

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

    const raw = await req.text();
    if (raw.length > 20000) return j({ error: "Request too large" }, 400);
    const {
      athlete_ids,
      name,
      event_date,
      priority,
      location,
      default_weight_class_kg,
      weight_overrides,
      invitation_pdf_url,
    } = JSON.parse(raw);

    // ---- Validate shared fields ----
    if (!Array.isArray(athlete_ids) || athlete_ids.length === 0) {
      return j({ error: "athlete_ids required" }, 400);
    }
    if (athlete_ids.length > MAX_ATHLETES_PER_CALL) {
      return j({ error: `Max ${MAX_ATHLETES_PER_CALL} athletes per call` }, 400);
    }
    const ids = Array.from(new Set(athlete_ids.map(String)));
    for (const id of ids) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return j({ error: "Bad athlete id" }, 400);
    }
    if (!name || typeof name !== "string" || name.length > 120) {
      return j({ error: "Bad name" }, 400);
    }
    if (typeof event_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return j({ error: "Bad date" }, 400);
    }
    if (priority && !["A", "B", "C"].includes(priority)) return j({ error: "Bad priority" }, 400);
    if (location && (typeof location !== "string" || location.length > 200)) {
      return j({ error: "Bad location" }, 400);
    }
    const defaultWc =
      default_weight_class_kg == null || default_weight_class_kg === ""
        ? null
        : Number(default_weight_class_kg);
    if (defaultWc != null && (!Number.isFinite(defaultWc) || defaultWc < 20 || defaultWc > 200)) {
      return j({ error: "Bad default weight class" }, 400);
    }
    const overrides: Record<string, number | null> = {};
    if (weight_overrides && typeof weight_overrides === "object") {
      for (const [k, v] of Object.entries(weight_overrides)) {
        if (!ids.includes(k)) continue;
        if (v == null || v === "") { overrides[k] = null; continue; }
        const n = Number(v);
        if (!Number.isFinite(n) || n < 20 || n > 200) {
          return j({ error: `Bad weight override for ${k}` }, 400);
        }
        overrides[k] = n;
      }
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Authorization ----
    const [{ data: roles }, { data: links }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id),
      admin.from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", user.id)
        .in("athlete_id", ids),
    ]);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    const linked = new Set((links || []).map((l: any) => l.athlete_id));
    if (!isAdmin) {
      const unauthorized = ids.filter((id) => !linked.has(id));
      if (unauthorized.length > 0) {
        return j(
          { error: "Forbidden — not the coach for one or more athletes", unauthorized },
          403,
        );
      }
    }

    // ---- Insert one row per athlete ----
    const cleanName = name.slice(0, 120);
    const cleanLocation = location ? location.slice(0, 200) : null;
    const cleanPriority = priority || "A";
    const cleanInvitationUrl =
      typeof invitation_pdf_url === "string" && invitation_pdf_url.length <= 1024
        ? invitation_pdf_url
        : null;
    const rows = ids.map((athlete_id) => ({
      user_id: athlete_id,
      name: cleanName,
      event_date,
      weight_class_kg: athlete_id in overrides ? overrides[athlete_id] : defaultWc,
      priority: cleanPriority,
      location: cleanLocation,
      invitation_pdf_url: cleanInvitationUrl,
    }));

    const { data: inserted, error } = await admin
      .from("competitions")
      .insert(rows)
      .select("id, user_id");

    if (error) {
      // Insert failed entirely — try one-by-one so partial success is possible.
      const created: { athlete_id: string; competition_id: string }[] = [];
      const failed: { athlete_id: string; error: string }[] = [];
      for (const row of rows) {
        const { data: one, error: e } = await admin
          .from("competitions")
          .insert(row)
          .select("id")
          .single();
        if (e || !one) failed.push({ athlete_id: row.user_id, error: e?.message || "Insert failed" });
        else created.push({ athlete_id: row.user_id, competition_id: one.id });
      }
      return j({ created, failed });
    }

    return j({
      created: (inserted || []).map((r: any) => ({
        athlete_id: r.user_id,
        competition_id: r.id,
      })),
      failed: [],
    });
  } catch (e: any) {
    console.error("create-athlete-competitions-bulk error:", e);
    return j({ error: e?.message || "Unknown error" }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
