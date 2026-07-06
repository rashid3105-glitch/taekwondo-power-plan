// Called by the athlete client when a diary entry has been created.
// Sends a push to the athlete's coaches (via coach_athletes) in their locale.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { normalizeLocale, t } from "../_shared/pushI18n.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.slice(7).trim();
    const supaUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: uData, error: uErr } = await supaUser.auth.getUser(token);
    if (uErr || !uData?.user) return json({ error: "Unauthorized" }, 401);
    const athleteId = uData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: athlete } = await admin.from("profiles")
      .select("display_name").eq("user_id", athleteId).maybeSingle();
    const name = (athlete as any)?.display_name || "";

    const { data: links } = await admin.from("coach_athletes")
      .select("coach_id").eq("athlete_id", athleteId);
    const coachIds = Array.from(new Set((links || []).map((l: any) => l.coach_id).filter(Boolean)));
    if (!coachIds.length) return json({ sent: 0 });

    const { data: coachProfs } = await admin.from("profiles")
      .select("user_id, default_locale").in("user_id", coachIds);

    const byLocale = new Map<string, string[]>();
    for (const c of coachProfs || []) {
      const loc = normalizeLocale((c as any).default_locale);
      const arr = byLocale.get(loc) || [];
      arr.push((c as any).user_id);
      byLocale.set(loc, arr);
    }

    let sent = 0;
    for (const [loc, ids] of byLocale) {
      const { data: resp } = await admin.functions.invoke("send-push", {
        body: {
          user_ids: ids,
          title: t("diaryNewEntryTitle", loc as any),
          body: t("diaryNewEntry", loc as any, name),
          url: "/coach",
          data: { type: "diary", athlete_id: athleteId },
        },
      });
      sent += Number((resp as any)?.sent || 0);
    }
    return json({ sent });
  } catch (e) {
    console.error("notify-diary-activity error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
