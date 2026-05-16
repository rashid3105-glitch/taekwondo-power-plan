import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_IDS: Record<string, Record<string, string>> = {
  // 2026 DKK pricing
  athlete: {
    monthly: "price_1TS2U1CrYQiZxdDX324WQLGt", // 49 DKK/md
    yearly: "price_1TS2UYCrYQiZxdDXV6YlDmMh",  // 470 DKK/år
  },
  coach_solo: {
    monthly: "price_1TS2U4CrYQiZxdDXDlVynkBK", // 99 DKK/md
    yearly: "price_1TS2UhCrYQiZxdDXT0x1eJIJ",  // 950 DKK/år
  },
  team_small: {
    monthly: "price_1TS2U4CrYQiZxdDXFXl0NoY3", // 399 DKK/md
    yearly: "price_1TS2UjCrYQiZxdDXsSbn1ORg",  // 3.830 DKK/år
  },
  team_medium: {
    monthly: "price_1TS2U5CrYQiZxdDXIRq2hIlv", // 699 DKK/md
    yearly: "price_1TS2UkCrYQiZxdDX9yv9l5jB",  // 6.710 DKK/år
  },
  team_large: {
    monthly: "price_1TS2U6CrYQiZxdDX8tM6AoTK", // 999 DKK/md
    yearly: "price_1TS2UlCrYQiZxdDXuqRP67fU",  // 9.590 DKK/år
  },
  // Legacy aliases for grandfathered references
  personal: {
    monthly: "price_1TJuy5CrYQiZxdDX3rAwzI9Q",
    yearly: "price_1TJuyKCrYQiZxdDXbXV54djF",
  },
  coach: {
    monthly: "price_1TJuyLCrYQiZxdDX4r06jyr6",
    yearly: "price_1TJuyMCrYQiZxdDX8pFtww0n",
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
    const { tier, billingCycle, currency } = await req.json();

    if (!tier || !billingCycle) throw new Error("Missing tier or billingCycle");
    if (!PRICE_IDS[tier]?.[billingCycle]) throw new Error("Invalid tier or billing cycle");

    const priceId = PRICE_IDS[tier][billingCycle];

    // Validate currency. Default to DKK if missing/unknown.
    const allowedCurrencies = new Set(["dkk", "nok", "sek", "eur"]);
    const checkoutCurrency = allowedCurrencies.has((currency || "").toLowerCase())
      ? (currency as string).toLowerCase()
      : "dkk";

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
      cancel_url: `${origin}/pricing`,
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
