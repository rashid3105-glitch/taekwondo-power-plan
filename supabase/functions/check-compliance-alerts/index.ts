// Daily compliance scan: GAL license, MyFightBook and anti-doping course.
// Creates in-app alerts (compliance_alerts) and queues emails for the athlete
// and their coaches. Triggered by pg_cron.
import { createClient } from "npm:@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { TEMPLATES } from "../_shared/transactional-email-templates/registry.ts";
import { checkCronAuth } from "../_shared/cronAuth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_NAME = "Sportstalent";
const SENDER_DOMAIN = "notify.sportstalent.dk";
const FROM_DOMAIN = "sportstalent.dk";
const APP_URL = "https://sportstalent.dk";

const ITEM_LABELS: Record<string, string> = {
  gal_license: "GAL license",
  myfightbook: "MyFightBook",
  antidoping: "Anti-doping course",
};

type Severity = "warning" | "expired" | "missing";

interface Finding {
  athleteId: string;
  athleteName: string;
  clubId: string | null;
  alertType: "gal_license" | "myfightbook" | "antidoping";
  severity: Severity;
  dueDate: string | null;
  periodKey: string;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function daysUntil(dateStr: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  const target = new Date(dateStr.slice(0, 10) + "T00:00:00Z").getTime();
  return Math.round((target - today) / 86400000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const unauthorized = checkCronAuth(req, cors);
  if (unauthorized) return unauthorized;

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);
    const monthKey = today.slice(0, 7);

    const { data: athletes, error: profileErr } = await admin
      .from("profiles")
      .select("user_id, display_name, club_id, gal_license_expires_at, has_myfightbook, myfightbook_expires_at, antidoping_course_date")
      .eq("is_approved", true)
      .eq("is_parent", false)
      .not("club_id", "is", null);
    if (profileErr) throw profileErr;

    const findings: Finding[] = [];

    for (const p of athletes ?? []) {
      const base = {
        athleteId: (p as any).user_id as string,
        athleteName: ((p as any).display_name as string) || "Athlete",
        clubId: ((p as any).club_id as string) ?? null,
      };

      // GAL license
      const gal = (p as any).gal_license_expires_at as string | null;
      if (gal) {
        const d = daysUntil(gal);
        if (d <= 30) {
          findings.push({
            ...base,
            alertType: "gal_license",
            severity: d < 0 ? "expired" : "warning",
            dueDate: gal,
            periodKey: `${gal}|${d < 0 ? "expired" : "warning"}`,
          });
        }
      }

      // MyFightBook
      const mfb = (p as any).myfightbook_expires_at as string | null;
      if ((p as any).has_myfightbook && mfb) {
        const d = daysUntil(mfb);
        if (d <= 30) {
          findings.push({
            ...base,
            alertType: "myfightbook",
            severity: d < 0 ? "expired" : "warning",
            dueDate: mfb,
            periodKey: `${mfb}|${d < 0 ? "expired" : "warning"}`,
          });
        }
      }

      // Anti-doping course: missing or older than 1 year
      const anti = (p as any).antidoping_course_date as string | null;
      if (!anti) {
        findings.push({
          ...base,
          alertType: "antidoping",
          severity: "missing",
          dueDate: null,
          periodKey: `missing|${monthKey}`,
        });
      } else {
        const expiry = new Date(anti.slice(0, 10) + "T00:00:00Z");
        expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
        const expiryStr = expiry.toISOString().slice(0, 10);
        const d = daysUntil(expiryStr);
        if (d <= 30) {
          findings.push({
            ...base,
            alertType: "antidoping",
            severity: d < 0 ? "expired" : "warning",
            dueDate: expiryStr,
            periodKey: `${expiryStr}|${d < 0 ? "expired" : "warning"}`,
          });
        }
      }
    }

    if (findings.length === 0) {
      return new Response(JSON.stringify({ findings: 0, alerts: 0, emails: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Resolve coaches per athlete
    const athleteIds = Array.from(new Set(findings.map((f) => f.athleteId)));
    const { data: coachRows } = await admin
      .from("coach_athletes")
      .select("coach_id, athlete_id")
      .in("athlete_id", athleteIds);

    const coachesByAthlete = new Map<string, string[]>();
    for (const r of coachRows ?? []) {
      const list = coachesByAthlete.get((r as any).athlete_id) ?? [];
      if ((r as any).coach_id) list.push((r as any).coach_id);
      coachesByAthlete.set((r as any).athlete_id, list);
    }

    const nameCache = new Map<string, string>();
    const emailCache = new Map<string, string | null>();
    async function emailFor(userId: string): Promise<string | null> {
      if (emailCache.has(userId)) return emailCache.get(userId)!;
      const { data } = await admin.auth.admin.getUserById(userId);
      const email = data?.user?.email ?? null;
      emailCache.set(userId, email);
      return email;
    }
    async function nameFor(userId: string): Promise<string> {
      if (nameCache.has(userId)) return nameCache.get(userId)!;
      const { data } = await admin.from("profiles")
        .select("display_name").eq("user_id", userId).maybeSingle();
      const name = ((data as any)?.display_name as string) || "";
      nameCache.set(userId, name);
      return name;
    }

    const templateEntry = TEMPLATES["compliance-alert"];
    let alertsCreated = 0;
    let emailsQueued = 0;

    for (const f of findings) {
      const recipients = Array.from(new Set([f.athleteId, ...(coachesByAthlete.get(f.athleteId) ?? [])]));

      for (const recipientId of recipients) {
        // In-app alert (unique constraint dedupes repeated daily runs)
        const { data: inserted, error: insertErr } = await admin
          .from("compliance_alerts")
          .insert({
            recipient_id: recipientId,
            athlete_id: f.athleteId,
            club_id: f.clubId,
            alert_type: f.alertType,
            severity: f.severity,
            due_date: f.dueDate,
            period_key: f.periodKey,
          })
          .select("id")
          .maybeSingle();

        if (insertErr || !inserted) continue; // duplicate → already notified
        alertsCreated++;

        // Email
        const recipientEmail = await emailFor(recipientId);
        if (!recipientEmail || !templateEntry) continue;
        const normalizedEmail = recipientEmail.toLowerCase();

        const { data: suppressed } = await admin
          .from("suppressed_emails").select("id").eq("email", normalizedEmail).maybeSingle();
        if (suppressed) continue;

        const isSelf = recipientId === f.athleteId;
        const templateData = {
          recipientName: isSelf ? f.athleteName : (await nameFor(recipientId)) || "Coach",
          athleteName: f.athleteName,
          isSelf,
          itemLabel: ITEM_LABELS[f.alertType],
          severity: f.severity,
          dueDate: f.dueDate,
          actionUrl: isSelf ? `${APP_URL}/profile-setup` : `${APP_URL}/coach/athlete/${f.athleteId}?tab=manage`,
        };

        const html = await renderAsync(React.createElement(templateEntry.component, templateData));
        const plainText = await renderAsync(
          React.createElement(templateEntry.component, templateData), { plainText: true },
        );
        const subject = typeof templateEntry.subject === "function"
          ? templateEntry.subject(templateData)
          : templateEntry.subject;

        let unsubToken: string;
        const { data: existingToken } = await admin
          .from("email_unsubscribe_tokens").select("token, used_at").eq("email", normalizedEmail).maybeSingle();
        if (existingToken && !(existingToken as any).used_at) {
          unsubToken = (existingToken as any).token;
        } else {
          unsubToken = generateToken();
          await admin.from("email_unsubscribe_tokens").upsert(
            { token: unsubToken, email: normalizedEmail },
            { onConflict: "email", ignoreDuplicates: true },
          );
          const { data: stored } = await admin
            .from("email_unsubscribe_tokens").select("token").eq("email", normalizedEmail).maybeSingle();
          if (stored) unsubToken = (stored as any).token;
        }

        const messageId = crypto.randomUUID();
        await admin.from("email_send_log").insert({
          message_id: messageId,
          template_name: "compliance-alert",
          recipient_email: recipientEmail,
          status: "pending",
          metadata: {
            athlete_user_id: f.athleteId,
            recipient_user_id: recipientId,
            alert_type: f.alertType,
            severity: f.severity,
          },
        }).then(() => {}, () => {});

        const { error: enqueueErr } = await admin.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: recipientEmail,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text: plainText,
            purpose: "transactional",
            label: "compliance-alert",
            idempotency_key: `compliance-${f.alertType}-${f.athleteId}-${recipientId}-${f.periodKey}`,
            unsubscribe_token: unsubToken,
            queued_at: new Date().toISOString(),
          },
        });
        if (!enqueueErr) emailsQueued++;
        else console.error("enqueue_email error", enqueueErr);
      }
    }

    return new Response(
      JSON.stringify({ findings: findings.length, alerts: alertsCreated, emails: emailsQueued }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("check-compliance-alerts failed", e);
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
