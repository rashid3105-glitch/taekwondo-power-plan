// Nightly retention cleanup. Driven entirely by public.retention_policies:
// each category has a retention period, an optional warning period, a batch
// limit, an enabled flag and a dry_run flag. dry_run = count only, delete
// nothing. Results are written to public.scheduled_job_runs.
//
// Auth: service role key (called by pg_cron via pg_net) or a platform admin
// JWT (manual run from the admin page).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { purgeUser, purgeHealthData } from "../_shared/purge-user.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JOB_NAME = "retention-cleanup";
const LOCK_NAME = "retention-cleanup";
const LOCK_MINUTES = 30;

interface Policy {
  category: string;
  retention_days: number;
  warn_days: number;
  batch_limit: number;
  enabled: boolean;
  dry_run: boolean;
}

interface CategoryResult {
  category: string;
  dry_run: boolean;
  candidates: number;
  processed: number;
  warned: number;
  errors: string[];
}

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

function dateIn(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // ---- authorisation -------------------------------------------------
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  let manual = false;
  if (!token) return json({ error: "unauthorized" }, 401);
  if (token !== serviceKey) {
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ error: "forbidden" }, 403);
    manual = true;
  }

  // ---- single flight -------------------------------------------------
  const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
  const { data: lockRow } = await admin
    .from("retention_locks")
    .select("locked_until")
    .eq("lock_name", LOCK_NAME)
    .maybeSingle();

  if (lockRow && new Date(lockRow.locked_until).getTime() > Date.now()) {
    return json({ skipped: "already_running" }, 200);
  }
  await admin.from("retention_locks").upsert({
    lock_name: LOCK_NAME,
    locked_until: lockUntil,
    locked_at: new Date().toISOString(),
  });

  const startedAt = new Date().toISOString();
  const results: CategoryResult[] = [];

  try {
    const { data: policyRows, error: policyErr } = await admin
      .from("retention_policies")
      .select("*");
    if (policyErr) throw policyErr;
    const policies = (policyRows ?? []) as Policy[];
    const byCategory = new Map(policies.map((p) => [p.category, p]));

    for (const category of [
      "inactive_accounts",
      "left_club_health_data",
      "terminated_club_data",
      "soft_deleted_chat_messages",
      "inactive_chat_threads",
      "match_videos",
      "operational_logs",
      "consent_documentation",
    ]) {
      const policy = byCategory.get(category);
      if (!policy || !policy.enabled) continue;
      try {
        results.push(await runCategory(admin, policy));
      } catch (e) {
        results.push({
          category,
          dry_run: policy.dry_run,
          candidates: 0,
          processed: 0,
          warned: 0,
          errors: [String((e as Error)?.message ?? e)],
        });
      }
    }

    const totals = results.reduce(
      (acc, r) => ({
        candidates: acc.candidates + r.candidates,
        processed: acc.processed + r.processed,
        warned: acc.warned + r.warned,
        errors: acc.errors + r.errors.length,
      }),
      { candidates: 0, processed: 0, warned: 0, errors: 0 },
    );

    await admin.from("scheduled_job_runs").insert({
      job_name: JOB_NAME,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: totals.errors > 0 ? "completed_with_errors" : "completed",
      considered: totals.candidates,
      sent: totals.processed,
      skipped: totals.candidates - totals.processed,
      meta: { manual, warned: totals.warned, categories: results },
    });

    return json({ ok: true, manual, totals, categories: results });
  } catch (e) {
    await admin.from("scheduled_job_runs").insert({
      job_name: JOB_NAME,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: "failed",
      considered: 0,
      sent: 0,
      skipped: 0,
      error: String((e as Error)?.message ?? e),
      meta: { manual, categories: results },
    });
    return json({ error: "retention_cleanup_failed" }, 500);
  } finally {
    await admin.from("retention_locks").upsert({
      lock_name: LOCK_NAME,
      locked_until: new Date().toISOString(),
      locked_at: new Date().toISOString(),
    });
  }
});

// ----------------------------------------------------------------------
// One category
// ----------------------------------------------------------------------
async function runCategory(admin: any, policy: Policy): Promise<CategoryResult> {
  const r: CategoryResult = {
    category: policy.category,
    dry_run: policy.dry_run,
    candidates: 0,
    processed: 0,
    warned: 0,
    errors: [],
  };
  const cutoff = daysAgo(policy.retention_days);
  const limit = policy.batch_limit;

  switch (policy.category) {
    // ------------------------------------------------------------------
    case "inactive_accounts": {
      // Warn first: accounts that cross the warning threshold.
      if (policy.warn_days > 0) {
        const warnCutoff = daysAgo(policy.retention_days - policy.warn_days);
        const { data: warnRows } = await admin
          .from("profiles")
          .select("user_id, display_name, last_seen_at, created_at, is_demo")
          .lt("last_seen_at", warnCutoff)
          .gte("last_seen_at", cutoff)
          .limit(limit);
        for (const p of warnRows ?? []) {
          if (p.is_demo) continue;
          if (await alreadyNotified(admin, policy.category, p.user_id, "pre_delete")) continue;
          if (await isProtectedUser(admin, p.user_id)) continue;
          const email = await emailFor(admin, p.user_id);
          if (!email) continue;
          if (!policy.dry_run) {
            try {
              await sendTemplateEmail("retention-deletion-warning", email, {
                templateData: {
                  kind: "account",
                  recipientName: p.display_name ?? "",
                  deleteOn: dateIn(policy.warn_days),
                  locale: "da",
                },
                idempotencyKey: `retention-account-${p.user_id}`,
              });
              await admin.from("retention_notices").insert({
                category: policy.category, subject_id: p.user_id, notice_type: "pre_delete",
              });
            } catch {
              r.errors.push("warn_email_failed");
              continue;
            }
          }
          r.warned++;
        }
      }

      const { data: rows } = await admin
        .from("profiles")
        .select("user_id, last_seen_at, is_demo")
        .lt("last_seen_at", cutoff)
        .limit(limit);

      for (const p of rows ?? []) {
        if (p.is_demo) continue;
        if (await isProtectedUser(admin, p.user_id)) continue;
        // Never delete without a warning having been sent first.
        if (policy.warn_days > 0 && !(await alreadyNotified(admin, policy.category, p.user_id, "pre_delete"))) continue;
        // Re-check the real sign-in timestamp before deleting.
        const { data: authUser } = await admin.auth.admin.getUserById(p.user_id);
        const lastSignIn = authUser?.user?.last_sign_in_at;
        if (lastSignIn && new Date(lastSignIn).getTime() > new Date(cutoff).getTime()) continue;
        r.candidates++;
        if (policy.dry_run) continue;
        const res = await purgeUser(admin, p.user_id);
        if (res.errors.length > 0) r.errors.push(`purge:${p.user_id.slice(0, 8)}`);
        r.processed++;
      }
      return r;
    }

    // ------------------------------------------------------------------
    case "left_club_health_data": {
      const { data: rows } = await admin
        .from("club_memberships")
        .select("user_id, ended_at, status")
        .eq("status", "removed")
        .lt("ended_at", cutoff)
        .limit(limit);

      for (const m of rows ?? []) {
        // Skip athletes who are still active somewhere else.
        const { count } = await admin
          .from("club_memberships")
          .select("*", { count: "exact", head: true })
          .eq("user_id", m.user_id)
          .eq("status", "active");
        if ((count ?? 0) > 0) continue;
        if (await alreadyNotified(admin, policy.category, m.user_id, "purged")) continue;
        r.candidates++;
        if (policy.dry_run) continue;
        const res = await purgeHealthData(admin, m.user_id);
        if (res.errors.length > 0) r.errors.push(...res.errors.slice(0, 3));
        await admin.from("retention_notices").insert({
          category: policy.category, subject_id: m.user_id, notice_type: "purged",
        });
        r.processed++;
      }
      return r;
    }

    // ------------------------------------------------------------------
    case "terminated_club_data": {
      // Warning to club admins while the grace period runs.
      if (policy.warn_days > 0) {
        const warnCutoff = daysAgo(policy.retention_days - policy.warn_days);
        const { data: warnClubs } = await admin
          .from("clubs")
          .select("id, name, license_ended_at")
          .not("license_ended_at", "is", null)
          .lt("license_ended_at", warnCutoff)
          .gte("license_ended_at", cutoff)
          .limit(limit);
        for (const c of warnClubs ?? []) {
          if (await alreadyNotified(admin, policy.category, c.id, "pre_delete")) continue;
          const { data: admins } = await admin
            .from("club_memberships")
            .select("user_id")
            .eq("club_id", c.id)
            .eq("role_in_club", "admin")
            .eq("status", "active");
          if (policy.dry_run) { r.warned++; continue; }
          let sent = false;
          for (const a of admins ?? []) {
            const email = await emailFor(admin, a.user_id);
            if (!email) continue;
            try {
              await sendTemplateEmail("retention-deletion-warning", email, {
                templateData: {
                  kind: "club",
                  recipientName: "",
                  subjectLabel: c.name ?? "",
                  deleteOn: dateIn(policy.warn_days),
                  locale: "da",
                },
                idempotencyKey: `retention-club-${c.id}-${a.user_id}`,
              });
              sent = true;
            } catch { r.errors.push("club_warn_email_failed"); }
          }
          if (sent) {
            await admin.from("retention_notices").insert({
              category: policy.category, subject_id: c.id, notice_type: "pre_delete",
            });
            r.warned++;
          }
        }
      }

      const { data: clubs } = await admin
        .from("clubs")
        .select("id, name, license_ended_at")
        .not("license_ended_at", "is", null)
        .lt("license_ended_at", cutoff)
        .limit(20);

      for (const c of clubs ?? []) {
        const { data: members } = await admin
          .from("club_memberships")
          .select("user_id, role_in_club")
          .eq("club_id", c.id)
          .limit(limit);
        for (const m of members ?? []) {
          if (m.role_in_club !== "athlete") continue;
          if (await isProtectedUser(admin, m.user_id)) continue;
          r.candidates++;
          if (policy.dry_run) continue;
          const res = await purgeUser(admin, m.user_id);
          if (res.errors.length > 0) r.errors.push(`club_purge:${m.user_id.slice(0, 8)}`);
          r.processed++;
          if (r.processed >= limit) break;
        }
      }
      return r;
    }

    // ------------------------------------------------------------------
    case "soft_deleted_chat_messages": {
      const { data: rows } = await admin
        .from("chat_messages")
        .select("id, attachment_path")
        .not("deleted_at", "is", null)
        .lt("deleted_at", cutoff)
        .limit(limit);
      r.candidates = (rows ?? []).length;
      if (policy.dry_run || r.candidates === 0) return r;

      const ids = (rows ?? []).map((m: any) => m.id);
      const paths = (rows ?? []).map((m: any) => m.attachment_path).filter(Boolean);
      if (paths.length > 0) {
        const { error } = await admin.storage.from("chat-attachments").remove(paths);
        if (error) r.errors.push("chat_attachment_remove_failed");
      }
      await admin.from("chat_reactions").delete().in("message_id", ids);
      const { count, error } = await admin.from("chat_messages").delete({ count: "exact" }).in("id", ids);
      if (error) r.errors.push("chat_message_delete_failed");
      r.processed = count ?? 0;
      return r;
    }

    // ------------------------------------------------------------------
    case "inactive_chat_threads": {
      const { data: rows } = await admin
        .from("chat_threads")
        .select("id, last_message_at, created_at")
        .or(`last_message_at.lt.${cutoff},and(last_message_at.is.null,created_at.lt.${cutoff})`)
        .limit(limit);
      r.candidates = (rows ?? []).length;
      if (policy.dry_run || r.candidates === 0) return r;

      for (const t of rows ?? []) {
        const { data: msgs } = await admin.from("chat_messages").select("id, attachment_path").eq("thread_id", t.id);
        const ids = (msgs ?? []).map((m: any) => m.id);
        const paths = (msgs ?? []).map((m: any) => m.attachment_path).filter(Boolean);
        if (paths.length > 0) await admin.storage.from("chat-attachments").remove(paths);
        if (ids.length > 0) await admin.from("chat_reactions").delete().in("message_id", ids);
        await admin.from("chat_messages").delete().eq("thread_id", t.id);
        await admin.from("chat_thread_members").delete().eq("thread_id", t.id);
        const { error } = await admin.from("chat_threads").delete().eq("id", t.id);
        if (error) { r.errors.push("thread_delete_failed"); continue; }
        r.processed++;
      }
      return r;
    }

    // ------------------------------------------------------------------
    case "match_videos": {
      if (policy.warn_days > 0) {
        const warnCutoff = daysAgo(policy.retention_days - policy.warn_days);
        const { data: warnRows } = await admin
          .from("match_videos")
          .select("id, title, athlete_id, created_at")
          .lt("created_at", warnCutoff)
          .gte("created_at", cutoff)
          .limit(limit);
        for (const v of warnRows ?? []) {
          if (await alreadyNotified(admin, policy.category, v.id, "pre_delete")) continue;
          if (policy.dry_run) { r.warned++; continue; }
          const email = await emailFor(admin, v.athlete_id);
          if (!email) continue;
          try {
            await sendTemplateEmail("retention-deletion-warning", email, {
              templateData: {
                kind: "video",
                subjectLabel: v.title ?? "",
                deleteOn: dateIn(policy.warn_days),
                locale: "da",
              },
              idempotencyKey: `retention-video-${v.id}`,
            });
            await admin.from("retention_notices").insert({
              category: policy.category, subject_id: v.id, notice_type: "pre_delete",
            });
            r.warned++;
          } catch { r.errors.push("video_warn_email_failed"); }
        }
      }

      const { data: rows } = await admin
        .from("match_videos")
        .select("id, storage_path, created_at")
        .lt("created_at", cutoff)
        .limit(limit);
      r.candidates = (rows ?? []).length;
      if (policy.dry_run || r.candidates === 0) return r;

      for (const v of rows ?? []) {
        if (v.storage_path) {
          const { error } = await admin.storage.from("match_videos").remove([v.storage_path]);
          if (error) { r.errors.push("video_file_remove_failed"); continue; }
        }
        await admin.from("video_annotations").delete().eq("video_id", v.id);
        await admin.from("video_notes").delete().eq("video_id", v.id);
        await admin.from("match_tags").delete().eq("video_id", v.id);
        const { error } = await admin.from("match_videos").delete().eq("id", v.id);
        if (error) { r.errors.push("video_row_delete_failed"); continue; }
        r.processed++;
      }
      return r;
    }

    // ------------------------------------------------------------------
    case "operational_logs": {
      for (const table of ["email_send_log", "ai_assistant_logs", "scheduled_job_runs"]) {
        const { count: candidates } = await admin
          .from(table)
          .select("*", { count: "exact", head: true })
          .lt("created_at", cutoff);
        r.candidates += candidates ?? 0;
        if (policy.dry_run) continue;
        const { data: ids } = await admin.from(table).select("id").lt("created_at", cutoff).limit(limit);
        const idList = (ids ?? []).map((x: any) => x.id);
        if (idList.length === 0) continue;
        const { count, error } = await admin.from(table).delete({ count: "exact" }).in("id", idList);
        if (error) { r.errors.push(`log_delete_failed:${table}`); continue; }
        r.processed += count ?? 0;
      }
      return r;
    }

    // ------------------------------------------------------------------
    case "consent_documentation": {
      const { data: rows } = await admin
        .from("consent_records")
        .select("id, status, withdrawn_at")
        .eq("status", "withdrawn")
        .lt("withdrawn_at", cutoff)
        .limit(limit);
      r.candidates = (rows ?? []).length;
      if (policy.dry_run || r.candidates === 0) return r;
      const ids = (rows ?? []).map((c: any) => c.id);
      const { count, error } = await admin.from("consent_records").delete({ count: "exact" }).in("id", ids);
      if (error) r.errors.push("consent_delete_failed");
      r.processed = count ?? 0;
      return r;
    }
  }

  return r;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
async function alreadyNotified(admin: any, category: string, subjectId: string, noticeType: string) {
  const { count } = await admin
    .from("retention_notices")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .eq("subject_id", subjectId)
    .eq("notice_type", noticeType);
  return (count ?? 0) > 0;
}

/** Platform admins and coaches are never auto-deleted. */
async function isProtectedUser(admin: any, uid: string) {
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", uid);
  if ((roles ?? []).some((r: any) => r.role === "admin" || r.role === "coach")) return true;
  const { count } = await admin
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("status", "active")
    .in("role_in_club", ["coach", "admin"]);
  return (count ?? 0) > 0;
}

async function emailFor(admin: any, uid: string): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.getUserById(uid);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}
