// Nightly retention cleanup. Driven entirely by public.retention_policies:
// each category has a retention period, an optional warning period, a batch
// limit, an enabled flag and a dry_run flag. dry_run = count only, delete
// nothing. Results are written to public.scheduled_job_runs.
//
// Auth: service role key (called by pg_cron via pg_net) or a platform admin
// JWT (manual run from the admin page).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { purgeUser, purgeClubMembershipData } from "../_shared/purge-user.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-retention-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  // Either the scheduler key (nightly cron) or a platform admin JWT.
  const presentedSecret = req.headers.get("x-retention-secret") ?? "";
  let cronSecret = "";
  if (presentedSecret) {
    const { data: cfg } = await admin.from("retention_config").select("cron_secret").maybeSingle();
    cronSecret = cfg?.cron_secret ?? "";
  }
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  let manual = false;

  if (!(cronSecret && presentedSecret === cronSecret)) {
    if (!token) return json({ error: "unauthorized" }, 401);
    if (token !== serviceKey) {
      const userClient = createClient(supabaseUrl, anonKey);
      const { data: { user } } = await userClient.auth.getUser(token);
      if (!user) return json({ error: "unauthorized" }, 401);
      const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
      manual = true;
    }
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
      "withdrawn_consent_health_data",
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
      status: totals.errors > 0 ? "error" : "ok",
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
      status: "error",
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
      // Warn first so the athlete can export the diary before it goes.
      if (policy.warn_days > 0) {
        const warnCutoff = daysAgo(policy.retention_days - policy.warn_days);
        const { data: warnRows } = await admin
          .from("club_memberships")
          .select("user_id, ended_at")
          .eq("status", "removed")
          .lt("ended_at", warnCutoff)
          .gte("ended_at", cutoff)
          .limit(limit);
        for (const m of warnRows ?? []) {
          if (await hasActiveMembership(admin, m.user_id)) continue;
          if (await alreadyNotified(admin, policy.category, m.user_id, "pre_delete")) continue;
          if (policy.dry_run) { r.warned++; continue; }
          const { data: prof } = await admin
            .from("profiles").select("display_name, default_locale").eq("user_id", m.user_id).maybeSingle();
          const locale = LOCALES.includes(prof?.default_locale) ? prof.default_locale : "da";
          // Athlete + parent(s) when below the country's consent age.
          const recipients = await clubAthleteRecipients(admin, m.user_id);
          if (recipients.length === 0) continue;
          try {
            for (const email of recipients) {
              await sendTemplateEmail("retention-deletion-warning", email, {
                templateData: {
                  kind: "health_data",
                  recipientName: prof?.display_name ?? "",
                  deleteOn: dateIn(policy.warn_days),
                  locale,
                },
                idempotencyKey: `retention-health-${m.user_id}-${email}`,
              });
            }
            await admin.from("retention_notices").insert({
              category: policy.category, subject_id: m.user_id, notice_type: "pre_delete",
            });
            r.warned++;
          } catch { r.errors.push("health_warn_email_failed"); }
        }
      }

      const { data: rows } = await admin
        .from("club_memberships")
        .select("user_id, ended_at, status")
        .eq("status", "removed")
        .lt("ended_at", cutoff)
        .limit(limit);

      for (const m of rows ?? []) {
        // Skip athletes who are still active somewhere else.
        if (await hasActiveMembership(admin, m.user_id)) continue;
        if (await alreadyNotified(admin, policy.category, m.user_id, "purged")) continue;
        // Never delete without a warning having been sent first.
        if (policy.warn_days > 0 && !policy.dry_run &&
            !(await alreadyNotified(admin, policy.category, m.user_id, "pre_delete"))) continue;
        r.candidates++;
        if (policy.dry_run) continue;
        // Same rule as terminated clubs: the athlete's history follows the athlete.
        // Purge the left club's data about them (+ health data, since no active club);
        // keep account, profile, own diary text, own test results and personal plans.
        const { data: left } = await admin.from("club_memberships")
          .select("club_id").eq("user_id", m.user_id).eq("status", "removed");
        const clubIds = [...new Set((left ?? []).map((x: any) => x.club_id).filter(Boolean))];
        for (const clubId of clubIds) {
          const res = await purgeClubMembershipData(admin, m.user_id, clubId as string);
          if (res.errors.length > 0) r.errors.push(...res.errors.slice(0, 3));
          await admin.from("club_termination_purge_audit").insert({
            club_id: clubId,
            reason: "left_club",
            health_data_purged: res.health_purged,
            warning_sent: policy.warn_days > 0,
            table_counts: res.counts,
          });
        }
        await admin.from("retention_notices").insert({
          category: policy.category, subject_id: m.user_id, notice_type: "purged",
        });
        r.processed++;
      }
      return r;
    }


    // ------------------------------------------------------------------
    case "terminated_club_data": {
      // Warning to club admins AND to each athlete (+ parent of minors) while
      // the grace period runs. The athlete account itself is never deleted here.
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
          const deleteOn = clubDeleteOn(c.license_ended_at, policy.retention_days);
          if (!(await alreadyNotified(admin, policy.category, c.id, "pre_delete"))) {
            const { data: admins } = await admin
              .from("club_memberships")
              .select("user_id")
              .eq("club_id", c.id)
              .eq("role_in_club", "admin")
              .eq("status", "active");
            if (policy.dry_run) { r.warned++; }
            else {
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
                      deleteOn,
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

          const { data: athletes } = await admin
            .from("club_memberships")
            .select("id, user_id")
            .eq("club_id", c.id)
            .eq("role_in_club", "athlete")
            .neq("status", "removed")
            .limit(limit);
          for (const m of athletes ?? []) {
            if (await alreadyNotified(admin, policy.category, m.id, "athlete_pre_delete")) continue;
            if (policy.dry_run) { r.warned++; continue; }
            await warnClubAthlete(admin, policy, r, c, m, deleteOn);
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
          .select("id, user_id, role_in_club, status")
          .eq("club_id", c.id)
          .eq("role_in_club", "athlete")
          .neq("status", "removed")
          .limit(limit);
        for (const m of members ?? []) {
          if (await isProtectedUser(admin, m.user_id)) continue;
          // Never delete before the athlete warning has been attempted, and
          // give late-warned athletes the full warning period.
          if (policy.warn_days > 0) {
            const { data: notice } = await admin
              .from("retention_notices")
              .select("sent_at, created_at")
              .eq("category", policy.category)
              .eq("subject_id", m.id)
              .eq("notice_type", "athlete_pre_delete")
              .maybeSingle();
            if (!notice) {
              if (!policy.dry_run) {
                await warnClubAthlete(admin, policy, r, c, m, dateIn(policy.warn_days));
              } else r.warned++;
              continue;
            }
            const warnedAt = new Date(notice.sent_at ?? notice.created_at).getTime();
            if (Date.now() - warnedAt < policy.warn_days * 86400_000) continue;
          }
          r.candidates++;
          if (policy.dry_run) continue;
          const res = await purgeClubMembershipData(admin, m.user_id, c.id);
          if (res.errors.length > 0) r.errors.push(...res.errors.slice(0, 3));
          await admin.from("club_termination_purge_audit").insert({
            club_id: c.id,
            health_data_purged: res.health_purged,
            warning_sent: true,
            table_counts: res.counts,
          });
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
      const { data: threadRows } = await admin
        .from("chat_threads")
        .select("id, last_message_at, created_at")
        .or(`last_message_at.lt.${cutoff},and(last_message_at.is.null,created_at.lt.${cutoff})`)
        .limit(limit);

      // A thread only goes when no participant is still an active club member.
      const rows: any[] = [];
      for (const t of threadRows ?? []) {
        const { data: members } = await admin
          .from("chat_thread_members").select("user_id").eq("thread_id", t.id);
        let keep = false;
        for (const mem of members ?? []) {
          if (await hasActiveMembership(admin, mem.user_id)) { keep = true; break; }
        }
        if (!keep) rows.push(t);
      }
      r.candidates = rows.length;
      if (policy.dry_run || r.candidates === 0) return r;

      for (const t of rows) {

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
    case "withdrawn_consent_health_data": {
      // GDPR art. 7(3)/17: 30 days after withdrawal (health_data_delete_after,
      // set by trigger) delete the athlete's health data unless consent was
      // given again (re-grant clears health_data_delete_after).
      const { data: due } = await admin
        .from("consent_records")
        .select("id, athlete_id")
        .eq("consent_type", "health_data_processing")
        .eq("status", "withdrawn")
        .not("health_data_delete_after", "is", null)
        .lt("health_data_delete_after", new Date().toISOString())
        .is("health_data_purged_at", null)
        .limit(limit);
      r.candidates = (due ?? []).length;
      for (const c of due ?? []) {
        if (!c.athlete_id) continue;
        const counts: Record<string, number> = {};
        const del = async (table: string, extra?: (q: any) => any) => {
          let q = admin.from(table).delete({ count: policy.dry_run ? undefined : "exact" }).eq("user_id", c.athlete_id);
          if (policy.dry_run) {
            let cq = admin.from(table).select("*", { count: "exact", head: true }).eq("user_id", c.athlete_id);
            if (extra) cq = extra(cq);
            const { count } = await cq; counts[table] = count ?? 0; return;
          }
          if (extra) q = extra(q);
          const { count, error } = await q;
          if (error) throw new Error(`${table}_failed`);
          counts[table] = count ?? 0;
        };
        try {
          await del("wearable_samples");
          await del("wearable_daily_summary");
          await del("workout_logs", (q) => q.not("wearable_source", "is", null));
          await del("health_data");
          await del("mental_assessments");
          await del("readiness_checkins");
          await del("weight_logs");
          await del("diary_entry_health");
          await admin.from("consent_withdrawal_purge_audit").insert({
            consent_record_id: c.id, dry_run: policy.dry_run, row_counts: counts,
          });
          if (!policy.dry_run) {
            await admin.from("consent_records")
              .update({ health_data_purged_at: new Date().toISOString() }).eq("id", c.id);
            r.processed++;
          }
        } catch (e) {
          r.errors.push(String((e as Error)?.message ?? e));
        }
      }
      return r;
    }

    case "consent_documentation": {
      // 1) Withdrawn consents past the deadline.
      const { data: withdrawn } = await admin
        .from("consent_records")
        .select("id")
        .eq("status", "withdrawn")
        .lt("withdrawn_at", cutoff)
        // Never drop the record while its health-data purge is still due.
        .or("health_data_delete_after.is.null,health_data_purged_at.not.is.null")
        .limit(limit);
      const deleteIds = new Set<string>((withdrawn ?? []).map((c: any) => c.id));

      // 2) Records whose athlete no longer exists: scrub the guardian's email
      //    immediately, delete the row once it is past the deadline.
      const { data: candidates } = await admin
        .from("consent_records")
        .select("id, athlete_id, granted_at, updated_at, granted_by_email")
        .limit(2000);
      const athleteIds = [...new Set((candidates ?? []).map((c: any) => c.athlete_id).filter(Boolean))];
      const existing = new Set<string>();
      for (let i = 0; i < athleteIds.length; i += 500) {
        const { data: profs } = await admin
          .from("profiles").select("user_id").in("user_id", athleteIds.slice(i, i + 500));
        for (const p of profs ?? []) existing.add(p.user_id);
      }
      const scrubIds: string[] = [];
      for (const c of candidates ?? []) {
        if (c.athlete_id && existing.has(c.athlete_id)) continue;
        const ref = c.updated_at ?? c.granted_at;
        if (ref && new Date(ref).getTime() < new Date(cutoff).getTime()) {
          if (deleteIds.size < limit) deleteIds.add(c.id);
        } else if (c.granted_by_email) {
          scrubIds.push(c.id);
        }
      }

      r.candidates = deleteIds.size + scrubIds.length;
      if (policy.dry_run || r.candidates === 0) return r;

      if (scrubIds.length > 0) {
        const { error } = await admin
          .from("consent_records").update({ granted_by_email: null }).in("id", scrubIds.slice(0, limit));
        if (error) r.errors.push("consent_scrub_failed");
        else r.processed += Math.min(scrubIds.length, limit);
      }
      if (deleteIds.size > 0) {
        const { count, error } = await admin
          .from("consent_records").delete({ count: "exact" }).in("id", [...deleteIds]);
        if (error) r.errors.push("consent_delete_failed");
        r.processed += count ?? 0;
      }
      return r;
    }

  }

  return r;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
/** True when the user is still an active member of at least one club. */
async function hasActiveMembership(admin: any, uid: string) {
  const { count } = await admin
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("status", "active");
  return (count ?? 0) > 0;
}

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

function clubDeleteOn(endedAt: string, retentionDays: number): string {
  return new Date(new Date(endedAt).getTime() + retentionDays * 86400_000).toISOString().slice(0, 10);
}

const LOCALES = ["en", "da", "sv", "de", "ar", "no", "es"];

/** Recipients for a club-athlete warning: the athlete, plus parents if below consent age. */
async function clubAthleteRecipients(admin: any, uid: string): Promise<string[]> {
  const out = new Set<string>();
  const own = await emailFor(admin, uid);
  if (own) out.add(own.toLowerCase());
  const { data: prof } = await admin.from("profiles")
    .select("birth_date, parent_email, guardian_email").eq("user_id", uid).maybeSingle();
  let minor = false;
  if (prof?.birth_date) {
    const { data: ca } = await admin.rpc("consent_age_for_athlete", { _athlete_id: uid });
    const limit = typeof ca === "number" ? ca : 18;
    const b = new Date(prof.birth_date); const n = new Date();
    let age = n.getFullYear() - b.getFullYear();
    const mo = n.getMonth() - b.getMonth();
    if (mo < 0 || (mo === 0 && n.getDate() < b.getDate())) age--;
    minor = age < limit;
  }
  if (!minor) return [...out];
  for (const e of [prof?.parent_email, prof?.guardian_email]) {
    if (e && String(e).trim()) out.add(String(e).trim().toLowerCase());
  }
  const { data: links } = await admin.from("parent_athletes").select("parent_user_id").eq("athlete_id", uid);
  for (const l of links ?? []) {
    const e = await emailFor(admin, l.parent_user_id);
    if (e) out.add(e.toLowerCase());
  }
  const { data: tok } = await admin.from("consent_tokens").select("parent_email")
    .eq("athlete_id", uid).not("parent_email", "is", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (tok?.parent_email) out.add(String(tok.parent_email).trim().toLowerCase());
  return [...out];
}

/** Sends the athlete (+parent) warning and records it. Recorded even with no email
 *  (logged) — the club, as data controller, has been warned. */
async function warnClubAthlete(admin: any, policy: Policy, r: CategoryResult, c: any, m: any, deleteOn: string) {
  const { data: prof } = await admin.from("profiles")
    .select("display_name, default_locale").eq("user_id", m.user_id).maybeSingle();
  const locale = LOCALES.includes(prof?.default_locale) ? prof.default_locale : "da";
  const recipients = await clubAthleteRecipients(admin, m.user_id);
  if (recipients.length === 0) r.errors.push("club_athlete_no_email");
  for (const email of recipients) {
    try {
      await sendTemplateEmail("retention-deletion-warning", email, {
        templateData: {
          kind: "club_athlete",
          recipientName: prof?.display_name ?? "",
          subjectLabel: c.name ?? "",
          deleteOn,
          locale,
        },
        idempotencyKey: `retention-club-athlete-${m.id}-${email}`,
      });
    } catch { r.errors.push("club_athlete_warn_email_failed"); }
  }
  await admin.from("retention_notices").insert({
    category: policy.category, subject_id: m.id, notice_type: "athlete_pre_delete",
  });
  r.warned++;
}
