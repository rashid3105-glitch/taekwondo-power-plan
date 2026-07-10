// suggest-test-battery — recommend a battery of physical tests from the app catalog
// based on the coach's focus areas + intensity. Returns a validated list of test IDs.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CatalogItem { id: string; category: string; name: string; unit: string; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user?.id) return json({ error: "unauthorized" }, 401);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "missing_api_key" }, 500);

    const body = (await req.json().catch(() => ({}))) as {
      focuses?: string[];
      intensity?: "short" | "full";
      notes?: string;
      catalog?: CatalogItem[];
      count?: number;
    };

    const focuses = Array.isArray(body.focuses) ? body.focuses.slice(0, 8) : [];
    const intensity = body.intensity === "full" ? "full" : "short";
    const notes = String(body.notes ?? "").slice(0, 300);
    const catalog = Array.isArray(body.catalog) ? body.catalog.slice(0, 200) : [];
    const desired = intensity === "full" ? 8 : 5;

    if (catalog.length === 0) return json({ error: "no_catalog" }, 400);
    if (focuses.length === 0) return json({ error: "no_focus" }, 400);

    const catalogText = catalog
      .map((c) => `- ${c.id} [${c.category}] ${c.name} (${c.unit})`)
      .join("\n");

    const sys = `You are a sports-performance testing assistant for a taekwondo club. Pick a compact test battery for a team session.
Rules:
- Choose ONLY from the provided catalog IDs. Never invent a new ID.
- Balance coverage of the requested focus areas.
- Prefer field-friendly tests that can be run on many athletes in one session.
- Return ONLY a JSON object, no prose: {"test_ids": ["id1","id2",...], "rationale": "one short sentence"}
- Return between 3 and ${desired} test IDs total.`;

    const usr = `Focus areas: ${focuses.join(", ")}
Intensity: ${intensity}
Coach notes: ${notes || "(none)"}

Catalog:
${catalogText}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
      }),
    });

    if (resp.status === 429) return json({ error: "rate_limited" }, 429);
    if (resp.status === 402) return json({ error: "payment_required" }, 402);
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("suggest-test-battery gateway error", resp.status, txt);
      return json(fallback(catalog, focuses, desired, "ai_error"), 200);
    }

    const data = await resp.json();
    const raw = String(data?.choices?.[0]?.message?.content ?? "").trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed: any = null;
    try { parsed = JSON.parse(clean); } catch {
      const m = clean.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
    }

    const validIds = new Set(catalog.map((c) => c.id));
    const returned: string[] = Array.isArray(parsed?.test_ids)
      ? parsed.test_ids.map((x: any) => String(x)).filter((x: string) => validIds.has(x))
      : [];
    // Deduplicate, cap
    const seen = new Set<string>();
    const finalIds = returned.filter((id) => (seen.has(id) ? false : (seen.add(id), true))).slice(0, desired);

    if (finalIds.length < 3) {
      return json(fallback(catalog, focuses, desired), 200);
    }

    return json({
      test_ids: finalIds,
      rationale: String(parsed?.rationale ?? "").slice(0, 240),
    });
  } catch (e) {
    console.error("suggest-test-battery error", e);
    return json({ error: "server_error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Deterministic fallback: 1-2 tests per requested focus, in catalog order.
function fallback(catalog: CatalogItem[], focuses: string[], desired: number, reason?: string) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const f of focuses) {
    const picks = catalog.filter((c) => c.category === f).slice(0, 2);
    for (const p of picks) if (!seen.has(p.id)) { seen.add(p.id); out.push(p.id); }
    if (out.length >= desired) break;
  }
  return { test_ids: out.slice(0, desired), rationale: reason || "Deterministic pick", fallback: true };
}
