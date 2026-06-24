// scan-food — per-component food identification via Lovable AI Gateway.
// Returns { result: { items: [...], total: {...}, name, portion, confidence } }.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildSystemPrompt = (age: number, weight: number, insist = false) => `You are a sports-nutrition vision assistant. The athlete is ${age} years old and weighs ${weight}kg. Use this to estimate realistic portion sizes.

Identify EACH distinct food component on the plate separately (e.g. chicken, broccoli, rice, sauce, bread, eggs, berries, vegetables). Return ONLY a single JSON object — no prose, no markdown fences.

Schema (all fields required unless noted):
{
  "items": [
    {
      "name": string,                 // Danish food name, e.g. "Kylling", "Broccoli", "Ris"
      "portion_g": number,            // estimated grams of this component
      "calories": number,             // kcal for this component
      "protein": number,              // grams
      "carbs": number,                // grams
      "fat": number,                  // grams
      "bbox": { "x": number, "y": number, "w": number, "h": number }, // normalised 0..1 from top-left of the image
      "confidence": "high" | "medium" | "low"
    }
  ],
  "total": {
    "name": string,
    "portion": string,
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "confidence": "high" | "medium" | "low"
  }
}

Rules:
- bbox coordinates are normalised (0..1) relative to image width/height. x,y is the top-left corner of the bounding box.
- total fields MUST equal the sum of items.
- Be conservative with calories — prefer realistic athletic portions.
- ${insist ? "THE IMAGE DEFINITELY CONTAINS FOOD — identify every visible edible component. DO NOT return an error under any circumstance." : "If you see ANY edible item (bread, fruit, vegetables, meat, eggs, sauce, etc.), identify it. When in doubt, identify components — do not refuse."}
- Only return {"error":"Ingen mad fundet i billedet"} if the image clearly contains NO food at all (e.g. a landscape, a face, a text document, an empty room). A plate, bowl, or any edible item means you MUST return items.`;

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

    const { image, age, weight } = await req.json() as { image?: string; age?: number; weight?: number };
    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "invalid_image" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (image.length > 6 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "image_too_large" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callGateway = async (insist: boolean) => {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: buildSystemPrompt(age ?? 25, weight ?? 70, insist) },
            {
              role: "user",
              content: [
                { type: "text", text: insist
                  ? "Billedet indeholder mad. Identificér ALLE synlige madvarer separat med bounding box — returnér ALDRIG fejl."
                  : "Analysér dette måltid og returnér hver madvare separat med bounding box." },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
        }),
      });
    };

    const parseResp = async (resp: Response): Promise<{ parsed?: any; errorResponse?: Response }> => {
      if (resp.status === 429) {
        return { errorResponse: new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        }) };
      }
      if (resp.status === 402) {
        return { errorResponse: new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        }) };
      }
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("scan-food gateway error", resp.status, txt);
        return { errorResponse: new Response(JSON.stringify({ error: "ai_error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        }) };
      }
      const data = await resp.json();
      const raw = String(data?.choices?.[0]?.message?.content ?? "").trim();
      const clean = raw.replace(/```json|```/g, "").trim();
      try {
        return { parsed: JSON.parse(clean) };
      } catch {
        const m = clean.match(/\{[\s\S]*\}/);
        if (!m) {
          return { errorResponse: new Response(JSON.stringify({ error: "parse_error" }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          }) };
        }
        try { return { parsed: JSON.parse(m[0]) }; } catch {
          return { errorResponse: new Response(JSON.stringify({ error: "parse_error" }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          }) };
        }
      }
    };

    let { parsed, errorResponse } = await parseResp(await callGateway(false));
    if (errorResponse) return errorResponse;

    // Retry once with insisting prompt if model wrongly claims no food.
    if (parsed?.error && (!Array.isArray(parsed?.items) || parsed.items.length === 0)) {
      console.warn("scan-food: model returned error on first pass, retrying with insist prompt");
      const retry = await parseResp(await callGateway(true));
      if (retry.errorResponse) return retry.errorResponse;
      parsed = retry.parsed;
    }

    if (parsed?.error && (!Array.isArray(parsed?.items) || parsed.items.length === 0)) {
      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // Normalise + backward-compat: if model returned single-item legacy shape, wrap it.
    if (!Array.isArray(parsed?.items) && parsed?.name && parsed?.calories != null) {
      parsed = {
        items: [{
          name: parsed.name,
          portion_g: 0,
          calories: Number(parsed.calories) || 0,
          protein: Number(parsed.protein) || 0,
          carbs: Number(parsed.carbs) || 0,
          fat: Number(parsed.fat) || 0,
          bbox: { x: 0.05, y: 0.05, w: 0.9, h: 0.9 },
          confidence: parsed.confidence ?? "medium",
        }],
        total: {
          name: parsed.name,
          portion: parsed.portion ?? "",
          calories: Number(parsed.calories) || 0,
          protein: Number(parsed.protein) || 0,
          carbs: Number(parsed.carbs) || 0,
          fat: Number(parsed.fat) || 0,
          confidence: parsed.confidence ?? "medium",
        },
      };
    }

    // Clamp bbox values and recompute totals as defence-in-depth.
    const items = Array.isArray(parsed?.items) ? parsed.items.map((it: any) => {
      const b = it?.bbox ?? {};
      const clamp = (v: any) => Math.max(0, Math.min(1, Number(v) || 0));
      return {
        name: String(it?.name ?? "?"),
        portion_g: Number(it?.portion_g) || 0,
        calories: Number(it?.calories) || 0,
        protein: Number(it?.protein) || 0,
        carbs: Number(it?.carbs) || 0,
        fat: Number(it?.fat) || 0,
        bbox: { x: clamp(b.x), y: clamp(b.y), w: clamp(b.w), h: clamp(b.h) },
        confidence: (["high","medium","low"].includes(it?.confidence) ? it.confidence : "medium") as "high"|"medium"|"low",
      };
    }) : [];

    const sum = (k: "calories"|"protein"|"carbs"|"fat") =>
      items.reduce((a: number, it: any) => a + (Number(it[k]) || 0), 0);
    const totalGrams = items.reduce((a: number, it: any) => a + (Number(it.portion_g) || 0), 0);
    const total = {
      name: String(parsed?.total?.name ?? items.map((i: any) => i.name).join(", ")),
      portion: String(parsed?.total?.portion ?? (totalGrams > 0 ? `1 tallerken (~${Math.round(totalGrams)}g)` : "1 tallerken")),
      calories: Math.round(sum("calories")),
      protein: Math.round(sum("protein")),
      carbs: Math.round(sum("carbs")),
      fat: Math.round(sum("fat")),
      confidence: parsed?.total?.confidence ?? "medium",
    };

    // Keep legacy top-level fields for older clients.
    const result = {
      items,
      total,
      name: total.name,
      portion: total.portion,
      calories: total.calories,
      protein: total.protein,
      carbs: total.carbs,
      fat: total.fat,
      confidence: total.confidence,
    };

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-food error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
