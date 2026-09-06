import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Club licences (2026). DKK only, yearly billing, prices incl. VAT.
const PRICE_IDS: Record<string, Record<string, string>> = {
  club: {
    yearly: "price_1U57F2CrYQiZxdDXfWfVxoXF", // 7.500 DKK/år — op til 50 medlemmer
  },
  club_plus: {
    yearly: "price_1U57F3CrYQiZxdDX3TuxuGvu", // 12.000 DKK/år — 51-100 medlemmer
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data.user?.email) throw new Error("User not authenticated");

    const user = data.user;
    const { tier } = await req.json();

    // Club licences are yearly and DKK-only.
    const billingCycle = "yearly";
    if (!tier) throw new Error("Missing tier");
    if (!PRICE_IDS[tier]?.[billingCycle]) throw new Error("Invalid tier");

    const priceId = PRICE_IDS[tier][billingCycle];
    const checkoutCurrency = "dkk";

    // The webhook needs club_id to activate the licence.
    const supabaseAsUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const { data: profileRows } = await supabaseAsUser
      .from("profiles")
      .select("club_id")
      .eq("user_id", user.id)
      .limit(1);
    const clubId: string | null = profileRows?.[0]?.club_id ?? null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or reference existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // SECURITY: never trust the inbound Origin header for post-payment redirects.
    // Pick from a server-side allowlist so an attacker cannot point success_url
    // at a phishing site by forging Origin in a direct HTTP call.
    const ALLOWED_ORIGINS = new Set([
      "https://sportstalent.dk",
      "https://www.sportstalent.dk",
      "https://taekwondo-power-plan.lovable.app",
    ]);
    const requestedOrigin = req.headers.get("origin") || "";
    const origin = ALLOWED_ORIGINS.has(requestedOrigin)
      ? requestedOrigin
      : "https://sportstalent.dk";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      currency: checkoutCurrency,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/payment-success`,
      cancel_url: `${origin}/priser`,
      metadata: { tier, billingCycle, user_id: user.id, currency: checkoutCurrency },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
