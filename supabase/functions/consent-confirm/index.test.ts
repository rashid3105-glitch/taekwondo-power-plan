// End-to-end test for the parental consent flow.
//
// Creates a throwaway athlete + consent token, walks the guardian flow
// (open link -> grant consent), and asserts that consent_token_events and
// the numbers behind the admin consent funnel match expectations.
//
// Requires SUPABASE_SERVICE_ROLE_KEY (seeding + reading admin-only tables).
// Without it the test is skipped instead of failing.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FN = `${SUPABASE_URL}/functions/v1/consent-confirm`;

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function call(action: string, token: string) {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify({ action, token }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

type Funnel = { sent: number; opened: number; confirmed: number; notMine: number };

// deno-lint-ignore no-explicit-any
async function funnel(admin: any): Promise<Funnel> {
  const { data, error } = await admin
    .from("consent_token_events")
    .select("event");
  if (error) throw error;
  const rows = (data ?? []) as { event: string }[];
  const n = (e: string) => rows.filter((r) => r.event === e).length;
  return {
    sent: n("sent"),
    opened: n("opened"),
    confirmed: n("confirmed"),
    notMine: n("not_my_child"),
  };
}

Deno.test({
  name: "consent token: create -> open -> grant updates events and funnel counts",
  ignore: !SERVICE_ROLE,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const email = `consent-e2e-${crypto.randomUUID()}@example.com`;
    const parentEmail = `parent-${crypto.randomUUID()}@example.com`;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: `Pw${crypto.randomUUID()}`,
      email_confirm: true,
      user_metadata: { display_name: "Consent E2E Athlete" },
    });
    if (createErr) throw createErr;
    const athleteId = created.user!.id;

    const token = randomToken();
    let tokenId: string | null = null;

    try {
      // Wait for the profile row created by the auth trigger.
      for (let i = 0; i < 15; i++) {
        const { data } = await admin.from("profiles").select("user_id")
          .eq("user_id", athleteId).maybeSingle();
        if (data) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      const before = await funnel(admin);

      // 1. Coach sends the request: token + "sent" event.
      const { data: tokenRow, error: tokErr } = await admin
        .from("consent_tokens")
        .insert({
          token,
          athlete_id: athleteId,
          parent_email: parentEmail,
          consent_type: "health_data_processing",
          expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
        })
        .select("id")
        .single();
      if (tokErr) throw tokErr;
      tokenId = tokenRow!.id as string;

      await admin.from("consent_token_events").insert({
        token_id: tokenId,
        athlete_id: athleteId,
        event: "sent",
        meta: { source: "e2e_test" },
      });

      // 2. Guardian opens the link.
      const opened = await call("get", token);
      assertEquals(opened.status, 200);
      assertEquals(opened.body.valid, true);
      assertEquals(opened.body.used, false);
      assertEquals(opened.body.expired, false);
      assertEquals(opened.body.athlete_name, "Consent E2E Athlete");

      // 3. Guardian grants consent.
      const granted = await call("grant", token);
      assertEquals(granted.status, 200);
      assertEquals(granted.body.ok, true);

      // 4. Re-opening the link shows it as used.
      const reopened = await call("get", token);
      assertEquals(reopened.body.valid, false);
      assertEquals(reopened.body.used, true);

      // Granting twice must not double-count.
      const again = await call("grant", token);
      assertEquals(again.status, 409);

      // --- Assertions on stored state -----------------------------------
      const { data: events } = await admin
        .from("consent_token_events")
        .select("event, occurred_at")
        .eq("token_id", tokenId)
        .order("occurred_at", { ascending: true });
      const seq = (events ?? []).map((e: { event: string }) => e.event);
      assertEquals(seq.filter((e) => e === "sent").length, 1);
      assertEquals(seq.filter((e) => e === "confirmed").length, 1);
      // "get" was called twice, so two opens are expected.
      assertEquals(seq.filter((e) => e === "opened").length, 2);
      assertEquals(seq.filter((e) => e === "not_my_child").length, 0);

      const { data: tk } = await admin
        .from("consent_tokens")
        .select("confirmed_at")
        .eq("id", tokenId)
        .single();
      assertEquals(typeof tk!.confirmed_at, "string");

      const { data: record } = await admin
        .from("consent_records")
        .select("status, granted_by_email, granted_by_relation")
        .eq("athlete_id", athleteId)
        .eq("consent_type", "health_data_processing")
        .maybeSingle();
      assertEquals(record!.status, "granted");
      assertEquals(record!.granted_by_email, parentEmail);
      assertEquals(record!.granted_by_relation, "parent");

      // --- Funnel deltas match the flow above ---------------------------
      const after = await funnel(admin);
      assertEquals(after.sent - before.sent, 1);
      assertEquals(after.opened - before.opened, 2);
      assertEquals(after.confirmed - before.confirmed, 1);
      assertEquals(after.notMine - before.notMine, 0);
    } finally {
      if (tokenId) {
        await admin.from("consent_token_events").delete().eq("token_id", tokenId);
        await admin.from("consent_tokens").delete().eq("id", tokenId);
      }
      await admin.from("consent_records").delete().eq("athlete_id", athleteId);
      await admin.auth.admin.deleteUser(athleteId);
    }
  },
});

Deno.test({
  name: 'consent token: "not my child" logs an event and burns the token',
  ignore: !SERVICE_ROLE,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: `consent-e2e-${crypto.randomUUID()}@example.com`,
      password: `Pw${crypto.randomUUID()}`,
      email_confirm: true,
      user_metadata: { display_name: "Consent E2E Wrong Child" },
    });
    if (createErr) throw createErr;
    const athleteId = created.user!.id;

    const token = randomToken();
    let tokenId: string | null = null;

    try {
      for (let i = 0; i < 15; i++) {
        const { data } = await admin.from("profiles").select("user_id")
          .eq("user_id", athleteId).maybeSingle();
        if (data) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      const { data: tokenRow } = await admin
        .from("consent_tokens")
        .insert({
          token,
          athlete_id: athleteId,
          parent_email: `parent-${crypto.randomUUID()}@example.com`,
          consent_type: "health_data_processing",
          expires_at: new Date(Date.now() + 30 * 864e5).toISOString(),
        })
        .select("id")
        .single();
      tokenId = tokenRow!.id as string;

      const res = await call("not_my_child", token);
      assertEquals(res.status, 200);
      assertEquals(res.body.ok, true);

      const { data: events } = await admin
        .from("consent_token_events")
        .select("event")
        .eq("token_id", tokenId);
      assertEquals(
        (events ?? []).filter((e: { event: string }) => e.event === "not_my_child").length,
        1,
      );

      // Token is burned: granting afterwards fails as expired.
      const grant = await call("grant", token);
      assertEquals(grant.status, 410);
    } finally {
      if (tokenId) {
        await admin.from("consent_token_events").delete().eq("token_id", tokenId);
        await admin.from("consent_tokens").delete().eq("id", tokenId);
      }
      await admin.from("consent_records").delete().eq("athlete_id", athleteId);
      await admin.auth.admin.deleteUser(athleteId);
    }
  },
});
