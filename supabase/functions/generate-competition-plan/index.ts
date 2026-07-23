// Generate a peaking + weight-cut plan using Lovable AI Gateway.
// Safety rails enforced server-side: max 0.7 kg/week cut, no >5% body weight in <14 days.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { checkAIEntitlement } from "../_shared/checkEntitlement.ts";
import { sanitizePromptText } from "../_shared/sanitizePrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({ competition_id: z.string().uuid(), locale: z.string().max(5).optional() });

const LANG_NAMES: Record<string, string> = {
  da: "Danish", en: "English", sv: "Swedish", no: "Norwegian",
  de: "German", ar: "Arabic", es: "Spanish",
};

function warnCutTooFast(locale: string, cutKg: number, days: number): string {
  const cut = cutKg.toFixed(1);
  switch (locale) {
    case "da": return `At tabe ${cut} kg på ${days} dage overstiger den sikre rate på 0,7 kg/uge. Overvej at rykke op i en højere vægtklasse.`;
    case "sv": return `Att gå ner ${cut} kg på ${days} dagar överstiger den säkra takten på 0,7 kg/vecka. Överväg att gå upp en viktklass.`;
    case "no": return `Å gå ned ${cut} kg på ${days} dager overstiger den trygge raten på 0,7 kg/uke. Vurder å rykke opp en vektklasse.`;
    case "de": return `${cut} kg in ${days} Tagen abzunehmen überschreitet die sichere Rate von 0,7 kg/Woche. Erwäge, in eine höhere Gewichtsklasse zu wechseln.`;
    case "es": return `Perder ${cut} kg en ${days} días supera la tasa segura de 0,7 kg/semana. Considera subir de categoría de peso.`;
    case "ar": return `فقدان ${cut} كجم في ${days} يومًا يتجاوز المعدل الآمن 0.7 كجم/أسبوع. فكّر في الانتقال إلى فئة وزن أعلى.`;
    default: return `Cutting ${cut} kg in ${days} days exceeds the safe rate of 0.7 kg/week. Consider moving up a weight class.`;
  }
}
function warnFivePercent(locale: string): string {
  switch (locale) {
    case "da": return "Vægttabet overstiger 5% af kropsvægten på under 14 dage — høj risiko for præstationstab og dehydrering.";
    case "sv": return "Viktnedgången överstiger 5% av kroppsvikten på under 14 dagar — hög risk för prestationsförlust och uttorkning.";
    case "no": return "Vekttapet overstiger 5% av kroppsvekten på under 14 dager — høy risiko for prestasjonstap og dehydrering.";
    case "de": return "Der Gewichtsverlust überschreitet 5% des Körpergewichts in unter 14 Tagen — hohes Risiko für Leistungsverlust und Dehydration.";
    case "es": return "La bajada supera el 5% del peso corporal en menos de 14 días — alto riesgo de pérdida de rendimiento y deshidratación.";
    case "ar": return "خفض الوزن يتجاوز 5٪ من وزن الجسم في أقل من 14 يومًا — خطر مرتفع لفقدان الأداء والجفاف.";
    default: return "Cut exceeds 5% bodyweight in <14 days — high risk of performance loss and dehydration.";
  }
}
function warnLessThanWeek(locale: string): string {
  switch (locale) {
    case "da": return "Mindre end 1 uge til stævnet: undgå aggressive vægttab.";
    case "sv": return "Mindre än 1 vecka kvar: undvik aggressiva viktnedgångar.";
    case "no": return "Mindre enn 1 uke igjen: unngå aggressive vekttap.";
    case "de": return "Weniger als 1 Woche bis zum Wettkampf: vermeide aggressive Gewichtsreduktionen.";
    case "es": return "Menos de 1 semana para la competición: evita bajadas agresivas.";
    case "ar": return "أقل من أسبوع على البطولة: تجنّب خفض الوزن الحاد.";
    default: return "Less than 1 week out: avoid aggressive cuts.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const notEntitled = await checkAIEntitlement(user.id, corsHeaders);
    if (notEntitled) return notEntitled;

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Bad input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: comp } = await supa.from("competitions").select("*").eq("id", parsed.data.competition_id).eq("user_id", user.id).single();
    if (!comp) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: prof } = await supa.from("profiles").select("weight_kg, age, belt_level, discipline").eq("user_id", user.id).single();
    const { data: latestWeight } = await supa.from("weight_logs").select("weight_kg, log_date").eq("user_id", user.id).order("log_date", { ascending: false }).limit(1).maybeSingle();

    const currentKg = Number(latestWeight?.weight_kg ?? prof?.weight_kg ?? 0);
    const targetKg = Number(comp.weight_class_kg ?? currentKg);
    const daysToEvent = Math.max(0, Math.round((new Date(comp.event_date).getTime() - Date.now()) / 86400000));
    const cutKg = Math.max(0, currentKg - targetKg);
    const safeRatePerWeek = 0.7;
    const maxSafeCut = (daysToEvent / 7) * safeRatePerWeek;

    const locale = (parsed.data.locale || "en").toLowerCase();
    const langName = LANG_NAMES[locale] || "English";

    const warnings: string[] = [];
    if (cutKg > maxSafeCut) warnings.push(warnCutTooFast(locale, cutKg, daysToEvent));
    if (currentKg > 0 && cutKg / currentKg > 0.05 && daysToEvent < 14) warnings.push(warnFivePercent(locale));
    if (daysToEvent < 7 && cutKg > 1.5) warnings.push(warnLessThanWeek(locale));

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const prompt = `You are a TKD performance coach. Generate a JSON peaking and weight-cut plan.
Athlete: age ${prof?.age ? Number(prof.age) : "?"}, ${sanitizePromptText(prof?.belt_level ?? "?", 30)} belt, discipline ${sanitizePromptText(prof?.discipline ?? "sparring", 30)}.
Current weight: ${currentKg} kg. Target: ${targetKg} kg. Days to event: ${daysToEvent}. Priority: ${sanitizePromptText(comp.priority, 20)}.
IMPORTANT: All human-readable strings (taperSummary, focus, volumeChange, intensity, calorieAdjustment, fluid, carbCycling, hydration, peakDayProtocol) MUST be written in ${langName}. JSON keys stay in English.
Return strict JSON: { "taperSummary": string (2-3 sentences), "weeklyTaper": [{"week": number, "focus": string, "volumeChange": string, "intensity": string}], "weightCut": [{"day": number, "targetKg": number, "calorieAdjustment": string, "fluid": string}], "nutritionAdjustments": { "dailyCalories": number, "carbCycling": string, "hydration": string }, "peakDayProtocol": string }.
Keep it concise. No markdown, only JSON.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: txt.slice(0, 200) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const aiJson = await aiRes.json();
    let plan: any = {};
    try { plan = JSON.parse(aiJson.choices?.[0]?.message?.content || "{}"); } catch { plan = {}; }
    plan.warnings = warnings;
    plan.meta = { currentKg, targetKg, cutKg, daysToEvent, generatedAt: new Date().toISOString() };

    const { error: upErr } = await supa.from("competitions").update({ plan_data: plan }).eq("id", comp.id);
    if (upErr) {
      console.error("generate-competition-plan upsert error", upErr);
      return new Response(JSON.stringify({ error: "server_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-competition-plan error", e);
    return new Response(JSON.stringify({ error: "server_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
