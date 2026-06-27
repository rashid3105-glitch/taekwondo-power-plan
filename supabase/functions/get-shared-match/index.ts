// Public endpoint to fetch a shared match video + tags by token.
// Returns metadata + a short-lived signed URL for the storage object.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || (await req.json().catch(() => ({})))?.token;
    if (!token || typeof token !== "string" || token.length < 16 || token.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data, error } = await supa.rpc("get_shared_match_video", { _token: token });
    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ error: "Not found or expired" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const video = (data as any).video;
    const tags = (data as any).tags || [];

    // 1-hour signed URL for playback
    const { data: signed, error: signErr } = await supa.storage
      .from("match_videos")
      .createSignedUrl(video.storage_path, 60 * 60);
    if (signErr) throw signErr;

    return new Response(JSON.stringify({
      video: {
        id: video.id,
        title: video.title,
        notes: video.notes,
        discipline: video.discipline,
        opponent_name: video.opponent_name,
        event_name: video.event_name,
        match_date: video.match_date,
        duration_seconds: video.duration_seconds,
      },
      video_url: signed.signedUrl,
      tags,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-shared-match error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
