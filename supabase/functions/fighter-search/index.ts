import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const Body = z.object({
  firstname: z.string().trim().max(60).default(""),
  surname: z.string().trim().max(60).default(""),
  nation: z.string().regex(/^(\d{3}|ALLNATIONS)$/).default("ALLNATIONS"),
}).refine((b) => b.firstname.length + b.surname.length >= 2, { message: "name_required" });

const BASE = "https://www.taekwondodata.com/";
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<[^>]+>/g, "").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const { firstname, surname, nation } = parsed.data;

    const form = new URLSearchParams({ surname, firstname, nation, "find-fighter": "1", submit: "search" });
    const res = await fetch(BASE + "person_searchresult.html", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Sportstalent/1.0" },
      body: form,
    });
    if (!res.ok) return json({ error: "source_unavailable" }, 502);
    const html = await res.text();

    const rows = html.split(/<tr[^>]*>/i).slice(1);
    const results = [];
    for (const row of rows) {
      const link = row.match(/<a href="([a-z0-9-]+\.[a-z0-9]+\.html)">([^<]+)<\/a>\s*\(([^)]+)\)/i);
      if (!link) continue;
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      results.push({
        name: decode(link[2]),
        role: decode(link[3]),
        country: cells[4] ? decode(cells[4]) : null,
        profileUrl: BASE + link[1],
      });
      if (results.length >= 30) break;
    }
    return json({ results });
  } catch (e) {
    console.error("fighter-search", e);
    return json({ error: "server_error" }, 500);
  }
});
