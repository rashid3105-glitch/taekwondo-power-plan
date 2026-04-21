import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim();
    if (!code || code.length > 32) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the athlete and check is_public
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, is_public")
      .ilike("athlete_code", code)
      .maybeSingle();

    if (!profile || !profile.is_public || !profile.avatar_url) {
      return new Response(JSON.stringify({ url: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the storage path
    const marker = "/object/public/avatars/";
    let path = profile.avatar_url;
    const idx = path.indexOf(marker);
    if (idx !== -1) path = path.substring(idx + marker.length);
    path = path.split("?")[0];

    const { data: signed, error: signErr } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 3600);

    if (signErr) {
      return new Response(JSON.stringify({ url: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: signed?.signedUrl ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
