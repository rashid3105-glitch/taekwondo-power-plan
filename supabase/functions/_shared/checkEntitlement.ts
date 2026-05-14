// Server-side entitlement check for AI generation endpoints.
// Allows: admins, active demo (with full access), users with an active subscription
// in the local subscriptions table, or users with an active Stripe subscription
// (live fallback in case the local table hasn't been synced yet).
// Returns null when entitled, or a Response (402) when not.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

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

    // Active subscription (local mirror)
    const { data: sub } = await supa
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    if (sub?.status === "active") return null;

    // Demo with full access (must not be expired)
    const { data: pf } = await supa.rpc("get_profile_protected_fields", { _user_id: userId });
    const row = Array.isArray(pf) ? pf[0] : pf;
    const today = new Date().toISOString().slice(0, 10);
    if (
      row?.is_demo &&
      row?.demo_full_access &&
      (!row?.demo_expires_at || row.demo_expires_at >= today)
    ) {
      return null;
    }

    // Live Stripe fallback — local subscriptions table may be stale
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const { data: userRes } = await supa.auth.admin.getUserById(userId);
        const email = userRes?.user?.email;
        if (email) {
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          const customers = await stripe.customers.list({ email, limit: 1 });
          if (customers.data.length > 0) {
            const subs = await stripe.subscriptions.list({
              customer: customers.data[0].id,
              status: "active",
              limit: 1,
            });
            if (subs.data.length > 0) {
              // Sync local mirror so future checks are fast
              await supa.from("subscriptions").upsert({
                user_id: userId,
                status: "active",
                stripe_customer_id: customers.data[0].id,
                stripe_subscription_id: subs.data[0].id,
                current_period_end: new Date(subs.data[0].current_period_end * 1000).toISOString(),
                cancel_at_period_end: subs.data[0].cancel_at_period_end ?? false,
              }, { onConflict: "user_id" });
              return null;
            }
          }
        }
      } catch (e) {
        console.error("Stripe fallback check failed:", e);
      }
    }

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
