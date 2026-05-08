// Shared helper to gate cron-triggered edge functions.
// Accepts requests where the Authorization header carries the project's
// service role key (used by pg_cron + pg_net) or a configured CRON_SECRET.
// Returns null when authorized, or a Response (401) when not.

export function checkCronAuth(req: Request, corsHeaders: Record<string, string>): Response | null {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const headerSecret = req.headers.get("x-cron-secret") ?? "";

  const ok =
    (serviceKey && token && token === serviceKey) ||
    (cronSecret && (headerSecret === cronSecret || token === cronSecret));

  if (ok) return null;
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
