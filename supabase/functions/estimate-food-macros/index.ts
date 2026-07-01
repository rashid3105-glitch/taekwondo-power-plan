// estimate-food-macros — text-based food macro estimation via Lovable AI Gateway.
// Input: { description: string, meal_name?: string }
// Output: { result: { items: [...], total: {...} } }
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildSystemPrompt = (age: number, weight: number) => `You are a sports-nutrition assistant. The athlete is ${age} years old and weighs ${weight}kg.

Given a Danish/English free-text description of a meal (e.g. "150g kylling og 200g kogte ris med lidt olivenolie"), estimate calories and macros per component and in total.

Return ONLY a single JSON object — no prose, no markdown fences.

Schema:
{
  "items": [
    {
      "name": string,              // Danish food name, e.g. "Kylling"
      "portion_g": number,         // estimated grams
      "calories": number,          // kcal
      "protein": number,           // g
      "carbs": number,             // g
      "fat": number                // g
    }
  ],
  "total": {
    "name": string,                // short summary name
    "portion": string,             // e.g. "~450g"
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}

Rules:
- total fields MUST equal the sum of items.
- If the user gave grams, respect them; otherwise use realistic athletic portions.
- Use standard Danish food composition tables.
- If the text has no food at all, return {"error":"Ingen mad fundet"}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({})) as {
      description?: string; meal_name?: string; age?: number; weight?: number;
    };
    const description = String(body.description ?? "").trim();
    if (!description || description.length < 2) {
      return new Response(JSON.stringify({ error: "invalid_description" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (description.length > 500) {
      return new Response(JSON.stringify({ error: "description_too_long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mealName = String(body.meal_name ?? "").trim().slice(0, 100);

    // Load profile weight/age if not provided
    let age = Number.isFinite(body.age) ? Number(body.age) : 25;
    let weight = Number.isFinite(body.weight) ? Number(body.weight) : 70;
    try {
      const { data: profile } = await userClient
        .from("profiles")
        .select("weight_kg, birth_date")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      const p = profile as { weight_kg?: number | null; birth_date?: string | null } | null;
      if (p?.weight_kg != null) weight = Number(p.weight_kg);
      if (p?.birth_date) {
        age = Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }
    } catch { /* ignore */ }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystemPrompt(age, weight) },
          { role: "user", content: `Måltid: ${mealName || "(uden navn)"}\nBeskrivelse: ${description}` },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "payment_required" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("estimate-food-macros gateway error", resp.status, txt);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = String(data?.choices?.[0]?.message?.content ?? "").trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(clean); }
    catch {
      const m = clean.match(/\{[\s\S]*\}/);
      if (!m) {
        return new Response(JSON.stringify({ error: "parse_error" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try { parsed = JSON.parse(m[0]); } catch {
        return new Response(JSON.stringify({ error: "parse_error" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (parsed?.error && !Array.isArray(parsed?.items)) {
      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items = Array.isArray(parsed?.items) ? parsed.items.map((it: any) => ({
      name: String(it?.name ?? "?"),
      portion_g: Math.max(0, Number(it?.portion_g) || 0),
      calories: Math.max(0, Number(it?.calories) || 0),
      protein: Math.max(0, Number(it?.protein) || 0),
      carbs: Math.max(0, Number(it?.carbs) || 0),
      fat: Math.max(0, Number(it?.fat) || 0),
    })) : [];

    const sum = (k: "calories"|"protein"|"carbs"|"fat") =>
      items.reduce((a: number, it: any) => a + (Number(it[k]) || 0), 0);
    const totalGrams = items.reduce((a: number, it: any) => a + (Number(it.portion_g) || 0), 0);

    const total = {
      name: String(parsed?.total?.name ?? mealName ?? items.map((i: any) => i.name).join(", ")),
      portion: String(parsed?.total?.portion ?? (totalGrams > 0 ? `~${Math.round(totalGrams)}g` : "")),
      calories: Math.round(sum("calories")),
      protein: Math.round(sum("protein")),
      carbs: Math.round(sum("carbs")),
      fat: Math.round(sum("fat")),
    };

    return new Response(JSON.stringify({ result: { items, total } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate-food-macros error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
