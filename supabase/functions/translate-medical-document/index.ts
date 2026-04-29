import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
]);

const LANG_MAP: Record<string, string> = {
  en: "English",
  da: "Danish",
  sv: "Swedish",
  de: "German",
  ar: "Arabic",
  no: "Norwegian (Bokmål)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.text();
    if (raw.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Request too large (max ~10MB file)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { text?: string; fileBase64?: string; mimeType?: string; language?: string };
    try {
      body = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, fileBase64, mimeType, language } = body;

    if (!text && !fileBase64) {
      return new Response(JSON.stringify({ error: "Provide text or a file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text && text.length > 15_000) {
      return new Response(JSON.stringify({ error: "Text too long (max 15,000 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fileBase64 && (!mimeType || !ALLOWED_MIMES.has(mimeType))) {
      return new Response(JSON.stringify({ error: "Unsupported file type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fileBase64 && fileBase64.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang = LANG_MAP[language || "en"] || "English";

    const systemPrompt = `You are a medical communicator helping a martial arts (taekwondo) athlete understand a medical document such as an MRI report, X-ray, doctor's note, or discharge summary.

Your job:
- Translate medical jargon into clear, simple ${lang}.
- Be calm, factual, and supportive.
- NEVER diagnose, prescribe, or give medication dosing.
- NEVER suggest stopping or changing prescribed treatment.
- If the document does not appear to be medical, set summary to a polite note in ${lang} explaining that and leave other fields empty arrays / empty strings.
- ALL output text MUST be in ${lang}.

Always respond by calling the explain_medical_document tool.`;

    const userParts: any[] = [];
    if (text && text.trim()) {
      userParts.push({ type: "text", text: `Document text:\n\n${text.trim()}` });
    }
    if (fileBase64 && mimeType) {
      if (mimeType === "text/plain") {
        try {
          const decoded = atob(fileBase64);
          userParts.push({ type: "text", text: `Document text:\n\n${decoded.slice(0, 15000)}` });
        } catch {
          // ignore
        }
      } else {
        // Gemini accepts images and PDFs as image_url with data URI
        userParts.push({
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${fileBase64}` },
        });
        userParts.push({
          type: "text",
          text: "Please read this medical document image/PDF and explain it.",
        });
      }
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "explain_medical_document",
          description: "Return a plain-language explanation of a medical document.",
          parameters: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "2-3 sentence plain-language overview.",
              },
              keyFindings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string", description: "The medical term as it appears." },
                    explanation: { type: "string", description: "Plain-language explanation." },
                  },
                  required: ["term", "explanation"],
                  additionalProperties: false,
                },
              },
              trainingImplications: {
                type: "string",
                description: "What this likely means for taekwondo training; cautious and general.",
              },
              questionsForDoctor: {
                type: "array",
                items: { type: "string" },
                description: "3-5 follow-up questions to ask the doctor or physiotherapist.",
              },
            },
            required: ["summary", "keyFindings", "trainingImplications", "questionsForDoctor"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userParts },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "explain_medical_document" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args:", e);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-medical-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
