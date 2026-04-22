// Generate or revoke a 90-day share token for a match video.
// Auth required: only the owning coach can share their own video.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function genToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });

    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const videoId: string | undefined = body?.video_id;
    const action: string = body?.action || "create"; // "create" | "revoke"
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Missing video_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership via RLS-respecting client
    const { data: video, error: fetchErr } = await userClient
      .from("match_videos")
      .select("id, coach_id")
      .eq("id", videoId)
      .maybeSingle();
    if (fetchErr || !video || video.coach_id !== userRes.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const { error } = await userClient
        .from("match_videos")
        .update({ share_token: null, share_expires_at: null })
        .eq("id", videoId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, share_token: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = genToken();
    const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    const { error } = await userClient
      .from("match_videos")
      .update({ share_token: token, share_expires_at: expiresAt })
      .eq("id", videoId);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, share_token: token, share_expires_at: expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
