// AI Assistant chat — proxies user messages to Lovable AI Gateway.
// Uses LOVABLE_API_KEY server-side so no client secret is exposed.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sanitizePromptText } from "../_shared/sanitizePrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a friendly taekwondo training assistant built into the Sportstalent.dk app.
You ONLY answer questions about:
1. Taekwondo training, techniques, sparring, poomsae
2. Sports injuries — first aid, RICE method, when to see a doctor, recovery
3. Sports taping — how to tape common injuries (ankle, knee, wrist, fingers, shoulder), kinesio tape vs rigid tape, basic technique guidance and safety notes
4. How to use the Sportstalent app (training plans, diary, competitions, season calendar, mental assessment)
5. General sports nutrition and recovery relevant to taekwondo athletes

If asked about anything else, politely redirect: "I can only help with taekwondo training, injuries, taping and the Sportstalent app."

When taping or technique demonstrations would benefit from a visual, you MAY include relevant YouTube links (prefer well-known physio/sports-medicine channels). Format as plain URLs (https://www.youtube.com/...) or YouTube search links (https://www.youtube.com/results?search_query=...). Always add a short safety note that taping does not replace medical advice for serious injuries.

Keep answers short, practical and in plain everyday language — no jargon.
Always respond in the same language the user writes in.`;

interface Msg { role: "user" | "assistant"; content: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json() as { messages: Msg[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "invalid_messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Truncate per message + total history to keep prompts small
    const safe = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 2000),
    }));

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safe],
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
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant-chat error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
