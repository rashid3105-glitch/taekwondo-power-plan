// Server-side entitlement check for AI generation endpoints.
// Allows: admins, active demo (with full access), and users with an active subscription.
// Returns null when entitled, or a Response (402) when not.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function checkAIEntitlement(
  userId: string,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Admin override
    const { data: roles } = await supa
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roles?.some((r: any) => r.role === "admin")) return null;

    // Active subscription
    const { data: sub } = await supa
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (sub?.status === "active") return null;

    // Demo with full access
    const { data: pf } = await supa.rpc("get_profile_protected_fields", { _user_id: userId });
    const row = Array.isArray(pf) ? pf[0] : pf;
    if (row?.is_demo && row?.demo_full_access) return null;

    return new Response(
      JSON.stringify({ error: "Subscription required", code: "subscription_required" }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (_e) {
    // Fail closed on unexpected errors
    return new Response(
      JSON.stringify({ error: "Entitlement check failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}
