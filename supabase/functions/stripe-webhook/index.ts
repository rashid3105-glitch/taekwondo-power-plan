import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { tierForProduct } from "../_shared/stripeTiers.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    console.error("[STRIPE-WEBHOOK] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response(JSON.stringify({ error: "not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    // Deno requires the async variant (WebCrypto).
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    // Never log the payload itself.
    console.error("[STRIPE-WEBHOOK] Signature verification failed:", err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Idempotency: Stripe re-sends events.
  const { error: insertError } = await supabase.from("stripe_webhook_events").insert({
    event_id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
  if (insertError) {
    if (insertError.code === "23505") {
      log("Duplicate event ignored", { id: event.id, type: event.type });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("[STRIPE-WEBHOOK] Failed to store event:", insertError.message);
    // Ask Stripe to retry — we could not persist the event.
    return new Response(JSON.stringify({ error: "storage failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!HANDLED.has(event.type)) {
    log("Unhandled event type", { type: event.type });
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // From here on: always answer 200, log failures.
  try {
    await handleEvent(event, stripe, supabase);
  } catch (err) {
    console.error(
      `[STRIPE-WEBHOOK] Processing failed for ${event.type} (${event.id}):`,
      err instanceof Error ? err.message : String(err)
    );
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

type Supa = ReturnType<typeof createClient>;

async function notifyAdmin(payload: {
  eventType: string;
  clubName: string;
  tier: string;
  amount: string;
  customerEmail: string;
  status: string;
  note?: string;
}) {
  try {
    await sendTemplateEmail("stripe-subscription-notification", "", {
      templateData: { ...payload, occurredAt: new Date().toISOString() },
      idempotencyKey: `stripe-${payload.eventType}-${payload.customerEmail}-${Date.now()}`,
    });
  } catch (err) {
    // Notification failures must never affect the webhook response.
    console.error("[STRIPE-WEBHOOK] Admin notification failed:", err instanceof Error ? err.message : String(err));
  }
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "—";
  return `${(amount / 100).toLocaleString("da-DK", { minimumFractionDigits: 2 })} ${(currency || "dkk").toUpperCase()}`;
}

async function resolveUserId(
  supabase: Supa,
  metadata: Record<string, string> | null | undefined,
  customerId: string | null,
  email: string | null
): Promise<string | null> {
  if (metadata?.user_id) return metadata.user_id;
  if (customerId) {
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .limit(1);
    if (data?.[0]?.user_id) return data[0].user_id as string;
  }
  if (email) {
    const { data } = await supabase.from("profiles").select("user_id").ilike("email", email).limit(1);
    if (data?.[0]?.user_id) return data[0].user_id as string;
  }
  return null;
}

async function resolveClubId(
  supabase: Supa,
  metadata: Record<string, string> | null | undefined,
  userId: string | null
): Promise<string | null> {
  if (metadata?.club_id) return metadata.club_id;
  if (userId) {
    const { data } = await supabase.from("profiles").select("club_id").eq("user_id", userId).limit(1);
    if (data?.[0]?.club_id) return data[0].club_id as string;
  }
  return null;
}

async function activate(
  supabase: Supa,
  opts: {
    userId: string | null;
    clubId: string | null;
    tier: string;
    maxAthletes: number;
    customerId: string | null;
    subscriptionId: string | null;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }
) {
  const { userId, clubId, tier, maxAthletes } = opts;

  if (userId) {
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        tier_id: tier,
        status: "active",
        stripe_customer_id: opts.customerId,
        stripe_subscription_id: opts.subscriptionId,
        current_period_end: opts.currentPeriodEnd,
        cancel_at_period_end: opts.cancelAtPeriodEnd,
      },
      { onConflict: "user_id" }
    );
    await supabase
      .from("profiles")
      .update({ payment_status: "paid", payment_date: new Date().toISOString().split("T")[0] })
      .eq("user_id", userId);
  } else {
    log("No user_id resolved — subscriptions row not written");
  }

  if (clubId) {
    const update: Record<string, unknown> = { license_active: true };
    if (maxAthletes >= 5) update.max_athletes = maxAthletes;
    await supabase.from("clubs").update(update).eq("id", clubId);
    // Same pattern as check-subscription: paid state follows the licence.
    await supabase
      .from("profiles")
      .update({ payment_status: "paid", payment_date: new Date().toISOString().split("T")[0] })
      .eq("club_id", clubId);
    log("Club licensed", { clubId, tier, maxAthletes });
  } else {
    log("No club_id in metadata — licence not activated");
  }
}

async function clubName(supabase: Supa, clubId: string | null): Promise<string> {
  if (!clubId) return "—";
  const { data } = await supabase.from("clubs").select("name").eq("id", clubId).limit(1);
  return (data?.[0]?.name as string) || "—";
}

async function handleEvent(event: Stripe.Event, stripe: Stripe, supabase: Supa) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") return;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
      const productId = (subscription?.items.data[0]?.price.product as string) ?? null;
      const info = tierForProduct(productId);
      const metadata = (session.metadata ?? {}) as Record<string, string>;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const email = session.customer_details?.email ?? session.customer_email ?? null;
      const userId = metadata.user_id || session.client_reference_id || (await resolveUserId(supabase, metadata, customerId, email));
      const clubId = await resolveClubId(supabase, metadata, userId);

      await activate(supabase, {
        userId,
        clubId,
        tier: info.tier,
        maxAthletes: info.maxAthletes,
        customerId,
        subscriptionId,
        status: "active",
        currentPeriodEnd: subscription ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      });

      await notifyAdmin({
        eventType: event.type,
        clubName: await clubName(supabase, clubId),
        tier: info.tier,
        amount: formatAmount(session.amount_total, session.currency),
        customerEmail: email || "—",
        status: "active",
      });
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const metadata = (subscription.metadata ?? {}) as Record<string, string>;
      const productId = (subscription.items.data[0]?.price.product as string) ?? null;
      const info = tierForProduct(productId);
      const userId = await resolveUserId(supabase, metadata, customerId, null);

      if (status === "active" || status === "trialing") {
        const clubId = await resolveClubId(supabase, metadata, userId);
        await activate(supabase, {
          userId,
          clubId,
          tier: info.tier,
          maxAthletes: info.maxAthletes,
          customerId,
          subscriptionId: subscription.id,
          status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        await notifyAdmin({
          eventType: event.type,
          clubName: await clubName(supabase, clubId),
          tier: info.tier,
          amount: formatAmount(subscription.items.data[0]?.price.unit_amount, subscription.items.data[0]?.price.currency),
          customerEmail: "—",
          status,
        });
      } else if (userId) {
        await supabase
          .from("subscriptions")
          .update({ status, cancel_at_period_end: subscription.cancel_at_period_end })
          .eq("user_id", userId);
        log("Subscription not active", { status, userId });
      }
      return;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const metadata = (subscription.metadata ?? {}) as Record<string, string>;
      const userId = await resolveUserId(supabase, metadata, customerId, null);
      if (userId) {
        await supabase.from("subscriptions").update({ status: "canceled" }).eq("user_id", userId);
      }
      const clubId = await resolveClubId(supabase, metadata, userId);
      // Deliberately NOT touching clubs.license_active — a lapsed payment must
      // never lock a club out without a human decision.
      log("Subscription canceled — licence left untouched", { userId, clubId });
      await notifyAdmin({
        eventType: event.type,
        clubName: await clubName(supabase, clubId),
        tier: tierForProduct(subscription.items.data[0]?.price.product as string).tier,
        amount: "—",
        customerEmail: "—",
        status: "canceled",
        note: "Klublicensen er IKKE deaktiveret automatisk. Tag manuelt stilling.",
      });
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
      const email = invoice.customer_email ?? null;
      const userId = await resolveUserId(supabase, null, customerId, email);
      if (userId) {
        await supabase.from("subscriptions").update({ status: "past_due" }).eq("user_id", userId);
      }
      const clubId = await resolveClubId(supabase, null, userId);
      log("Payment failed — licence left untouched", { userId, clubId });
      await notifyAdmin({
        eventType: event.type,
        clubName: await clubName(supabase, clubId),
        tier: "—",
        amount: formatAmount(invoice.amount_due, invoice.currency),
        customerEmail: email || "—",
        status: "past_due",
        note: "Klublicensen er IKKE deaktiveret automatisk. Tag manuelt stilling.",
      });
      return;
    }
  }
}
