import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  DIMENSION_CONTENT,
  LEVEL_CONTENT,
  QUESTION_CONTENT_V2,
  PLATFORM_MODULES,
  pointsForQuestion,
} from "../_shared/club-assessment-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { assessmentId } = await req.json();
    if (!assessmentId || typeof assessmentId !== "string") {
      return json({ error: "assessmentId is required" }, 400);
    }

    const { data: row, error: rowError } = await supabase
      .from("club_assessments")
      .select("id, created_at, email, club_name, sport, role, level, scores, answers")
      .eq("id", assessmentId)
      .maybeSingle();
    if (rowError) return json({ error: rowError.message }, 400);
    if (!row) return json({ error: "Besvarelsen findes ikke" }, 404);

    const scores: number[] = Array.isArray(row.scores) ? row.scores : [];
    const answers: number[] = Array.isArray(row.answers) ? row.answers : [];

    const dimensionLines = DIMENSION_CONTENT.map(
      (d, i) => `- ${d.name}: ${scores[i] ?? "?"}/9. Konsekvens ved lav score: ${d.consequence}`,
    ).join("\n");

    const levelName = row.level ? LEVEL_CONTENT[row.level - 1]?.name ?? "" : "ukendt";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY mangler" }, 500);

    const prompt = `Du er erfaren klubudviklingskonsulent i dansk breddeidræt og talentudvikling.
Skriv en skarp, konkret analyse på dansk af nedenstående klub, baseret udelukkende på deres egen selvevaluering.

KLUB
Navn: ${row.club_name ?? "ikke oplyst"}
Sport: ${row.sport ?? "ikke oplyst"}
Respondentens rolle: ${row.role ?? "ikke oplyst"}
Samlet modenhedsniveau: ${row.level ?? "?"} (${levelName})

DIMENSIONSSCORER (0-9)
${dimensionLines}

RÅ SVAR (indeks 0-3 pr. spørgsmål, 0 = svagest)
${answers.join(", ")}

Skriv i markdown med disse afsnit:
## Samlet billede
2-4 sætninger, ærligt og uden smiger.
## Styrker
2-3 punkter forankret i de højeste scorer.
## Kritiske huller
2-3 punkter forankret i de laveste scorer, med den konkrete konsekvens for klubben.
## Handlingsplan 90 dage
3-5 punkter, hver med hvem der gør hvad og hvornår.
## Sådan hjælper Sportstalent
2-3 punkter der kobler klubbens huller til platformens moduler (rød tråd/sæsonplan, trænerkapacitet, data og tests, kultur og dagbog, ledelse og rapporter).
## Spørgsmål til salgssamtalen
3 spørgsmål jeg kan stille klubben.

Hold det under 600 ord. Ingen floskler, ingen omtale af kunstig intelligens.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        input: prompt,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
      }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      if (res.status === 429) return json({ error: "For mange forespørgsler — prøv igen om lidt." }, 429);
      if (res.status === 402) return json({ error: "Der er ikke flere AI-kreditter på arbejdsområdet." }, 402);
      return json({ error: `AI-fejl (${res.status}): ${errText.slice(0, 300)}` }, 500);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        for (const line of part.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
              text += evt.delta;
            } else if (evt.type === "response.completed" && !text) {
              text = evt.response?.output_text ?? "";
            }
          } catch {
            // ignorér ufuldstændige events
          }
        }
      }
    }

    if (!text.trim()) return json({ error: "Analysen kom tom tilbage — prøv igen." }, 502);

    const analysisAt = new Date().toISOString();
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await service
      .from("club_assessments")
      .update({ ai_analysis: text, ai_analysis_at: analysisAt })
      .eq("id", assessmentId);

    return json({ analysis: text, analysis_at: analysisAt });
  } catch (e) {
    console.error("analyze-club-assessment error", e);
    return json({ error: e instanceof Error ? e.message : "Ukendt fejl" }, 500);
  }
});
