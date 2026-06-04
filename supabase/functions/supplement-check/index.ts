// supplement-check — anti-doping screening for supplements / medicine.
// Uses Lovable AI Gateway (Gemini) for both text and image analysis.
// Output never uses the word "AI" in user-facing text — it is a knowledge-based screening.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Flag = "green" | "yellow" | "red";
type AgeBand = "under13" | "13_17" | "18plus";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ageBandFor = (age: number | null): AgeBand => {
  if (age == null) return "18plus";
  if (age < 13) return "under13";
  if (age < 18) return "13_17";
  return "18plus";
};

const ageFromBirth = (birth: string | null): number | null => {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
};

const worstFlag = (flags: Flag[]): Flag => {
  if (flags.includes("red")) return "red";
  if (flags.includes("yellow")) return "yellow";
  return "green";
};

const buildSystemPrompt = (band: AgeBand) => {
  const audience =
    band === "under13"
      ? "The athlete is under 13. Use very simple, calm, reassuring Danish. Short sentences. No scary language."
      : band === "13_17"
      ? "The athlete is 13-17. Use clear, concrete Danish that a teenager understands, neither childish nor scary."
      : "The athlete is an adult. Use clear professional Danish.";

  return `You are an anti-doping knowledge assistant for taekwondo athletes. You help screen a supplement or medicine for substances that may be prohibited under WADA / Anti Doping Danmark rules.

${audience}

VERY IMPORTANT RULES:
- This is a SCREENING, NEVER a final ruling. Never say "lovligt" or "tilladt" with certainty.
- Be CONSERVATIVE. If in doubt about a substance, flag it as "yellow" and ask for official verification.
- Common vitamins, minerals and standard food ingredients with no doping concern → "green".
- Anabolic steroids, SARMs, EPO, stimulants on the WADA prohibited list, diuretics, beta-blockers in shooting/archery contexts, hormones, growth factors → "red".
- Caffeine, stimulants, hormone-like herbs, anything ambiguous or unclear → "yellow".
- ALWAYS include in the summary: that this is a vejledende screening (not a guarantee), that they must verify on Anti Doping Danmark (antidoping.dk) and Global DRO (globaldro.com), and that they should talk to a trainer, doctor or a trusted adult before taking it.
- NEVER use the word "AI", "kunstig intelligens", "model", "sprogmodel", "ChatGPT" or "Gemini" in the summary. Refer to it as "et tjek baseret på viden om antidoping".
- All user-facing text MUST be in Danish.

Respond with ONLY a single JSON object (no prose, no markdown fences):
{
  "product_name": string | null,
  "substances": [ { "navn": string, "flag": "green"|"yellow"|"red", "note": string } ],
  "summary": string
}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "missing_api_key" }, 500);

    const body = await req.json().catch(() => null) as {
      input_type?: "text" | "image";
      product_name?: string;
      image_base64?: string;
      athlete_id?: string;
    } | null;
    if (!body) return json({ error: "invalid_body" }, 400);

    const input_type = body.input_type;
    if (input_type !== "text" && input_type !== "image") {
      return json({ error: "invalid_input_type" }, 400);
    }
    const product_name = typeof body.product_name === "string"
      ? body.product_name.trim().slice(0, 300)
      : "";
    const image_base64 = typeof body.image_base64 === "string" ? body.image_base64 : "";

    if (input_type === "text" && !product_name) return json({ error: "missing_product_name" }, 400);
    if (input_type === "image") {
      if (!image_base64 || !image_base64.startsWith("data:image/")) {
        return json({ error: "invalid_image" }, 400);
      }
      if (image_base64.length > 6 * 1024 * 1024) return json({ error: "image_too_large" }, 413);
    }

    const athleteId = (typeof body.athlete_id === "string" && body.athlete_id) || callerId;

    // Service client for authorization + insert (RLS-bypass; we authorize manually).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authorize caller: must be the athlete OR a parent of the athlete.
    if (athleteId !== callerId) {
      const { data: parentRow } = await admin
        .from("parent_athletes")
        .select("athlete_id")
        .eq("parent_user_id", callerId)
        .eq("athlete_id", athleteId)
        .maybeSingle();
      if (!parentRow) return json({ error: "forbidden" }, 403);
    }

    // Load athlete profile for age + club.
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("age, birth_date, club_id")
      .eq("user_id", athleteId)
      .maybeSingle();
    if (profErr) return json({ error: "profile_lookup_failed" }, 500);

    const age = profile?.age ?? ageFromBirth(profile?.birth_date ?? null);
    const band = ageBandFor(age);
    const clubId = profile?.club_id ?? null;

    // Build user message for the gateway.
    const userParts: any[] =
      input_type === "image"
        ? [
            {
              type: "text",
              text:
                "Læs etiketten på dette produkt. Find produktnavn og listen over aktive stoffer / ingredienser. Vurder hvert stof i forhold til antidoping-regler.",
            },
            { type: "image_url", image_url: { url: image_base64 } },
          ]
        : [
            {
              type: "text",
              text:
                `Produktnavn / beskrivelse: ${product_name}\n\nFind de aktive stoffer du kender til i dette produkt, og vurder hvert stof i forhold til antidoping-regler. Hvis du ikke kender produktet med sikkerhed, så gæt IKKE — markér det som "yellow" og bed om officiel verifikation.`,
            },
          ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystemPrompt(band) },
          { role: "user", content: userParts },
        ],
      }),
    });

    if (aiResp.status === 429) return json({ error: "rate_limited" }, 429);
    if (aiResp.status === 402) return json({ error: "payment_required" }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("supplement-check gateway error", aiResp.status, t);
      return json({ error: "screening_error" }, 500);
    }

    const data = await aiResp.json();
    const raw = String(data?.choices?.[0]?.message?.content ?? "").trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const m = clean.match(/\{[\s\S]*\}/);
      if (!m) return json({ error: "parse_error" }, 502);
      parsed = JSON.parse(m[0]);
    }

    const substances = Array.isArray(parsed?.substances)
      ? parsed.substances
          .filter((s: any) => s && typeof s.navn === "string")
          .map((s: any) => ({
            navn: String(s.navn).slice(0, 200),
            flag: (["green", "yellow", "red"].includes(s.flag) ? s.flag : "yellow") as Flag,
            note: typeof s.note === "string" ? s.note.slice(0, 500) : "",
          }))
      : [];

    const flag_status: Flag = substances.length
      ? worstFlag(substances.map((s: any) => s.flag))
      : "yellow"; // if we found nothing, treat as uncertain

    const summary = typeof parsed?.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : "Dette er en vejledende screening, ikke en garanti. Verificér altid produktet på Anti Doping Danmark (antidoping.dk) og Global DRO (globaldro.com), og tal med din træner, læge eller en voksen før du tager det.";

    const finalProductName = (typeof parsed?.product_name === "string" && parsed.product_name.trim())
      ? parsed.product_name.trim().slice(0, 300)
      : (product_name || null);

    const { error: insertErr } = await admin.from("supplement_checks").insert({
      user_id: athleteId,
      club_id: clubId,
      performed_by: callerId,
      input_type,
      product_name: finalProductName,
      extracted_substances: substances,
      flag_status,
      age_band: band,
      result_summary: summary,
    });
    if (insertErr) {
      console.error("supplement-check insert failed", insertErr);
      return json({ error: "save_failed" }, 500);
    }

    return json({
      flag_status,
      substances,
      summary,
      age_band: band,
      product_name: finalProductName,
    });
  } catch (e) {
    console.error("supplement-check error", e);
    return json({ error: "server_error" }, 500);
  }
});
