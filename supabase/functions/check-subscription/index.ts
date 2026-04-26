import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    const user = userData.user;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let tier: string | null = null;
    let maxAthletes = 0;

    // Map Stripe product IDs to our internal tier + athlete cap.
    // New tiers + grandfathered legacy products.
    const PRODUCT_TIER_MAP: Record<string, { tier: string; maxAthletes: number }> = {
      // New
      prod_UNmxepUc1kEm0x: { tier: "athlete", maxAthletes: 1 },
      prod_UNmxvBF3VPxR8F: { tier: "athlete", maxAthletes: 1 },
      prod_UNmxLjXYQZjVx8: { tier: "coach_solo", maxAthletes: 0 },
      prod_UNmx6gu55G7X61: { tier: "coach_solo", maxAthletes: 0 },
      prod_UNmxNDy5xrs57e: { tier: "team_small", maxAthletes: 5 },
      prod_UNmxmSA5vcR8YF: { tier: "team_small", maxAthletes: 5 },
      prod_UNmx2hMlzBk4lQ: { tier: "team_medium", maxAthletes: 15 },
      prod_UNmxCljnNNwjAE: { tier: "team_medium", maxAthletes: 15 },
      prod_UNmxTKbskuXAIB: { tier: "team_large", maxAthletes: 25 },
      prod_UNmxyBA46pSNcK: { tier: "team_large", maxAthletes: 25 },
    };

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      const mapped = PRODUCT_TIER_MAP[productId];
      if (mapped) {
        tier = mapped.tier;
        maxAthletes = mapped.maxAthletes;
      } else {
        // Legacy fallback: assume single-athlete entitlement
        tier = "athlete";
        maxAthletes = 1;
      }
    }

    // Sync payment_status in profiles
    const newStatus = hasActiveSub ? "paid" : "unpaid";
    await supabaseClient
      .from("profiles")
      .update({
        payment_status: newStatus,
        payment_date: hasActiveSub ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("user_id", user.id);

    // If a coach is subscribed to a team tier, update their club's max_athletes.
    if (hasActiveSub && maxAthletes >= 5) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.club_id) {
        await supabaseClient
          .from("clubs")
          .update({ max_athletes: maxAthletes })
          .eq("id", profile.club_id);
      }
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        product_id: productId,
        subscription_end: subscriptionEnd,
        tier,
        max_athletes: maxAthletes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
