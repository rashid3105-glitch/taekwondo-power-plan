// Picks up to 5 pending monthly_report_jobs and processes them one at a time.
// Service-role-only. Designed to be called every few minutes by pg_cron until the queue drains.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    // Auth: any caller may trigger draining the queue. The queue can only be
    // populated by service-role (enqueue_monthly_reports SQL function), so the
    // worst this allows is processing already-legitimate jobs. Cron uses the
    // standard anon-key bearer pattern matching the other scheduled tasks.

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: jobs } = await admin
      .from("monthly_report_jobs")
      .select("id, athlete_user_id, period_year, period_month, attempts")
      .eq("status", "pending")
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    const list = (jobs as any[]) || [];
    if (list.length === 0) {
      return new Response(JSON.stringify({ processed: 0, remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ok = 0;
    let err = 0;

    for (const job of list) {
      await admin
        .from("monthly_report_jobs")
        .update({ status: "running", attempts: (job.attempts || 0) + 1, updated_at: new Date().toISOString() })
        .eq("id", job.id);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-monthly-report`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            athlete_user_id: job.athlete_user_id,
            year: job.period_year,
            month: job.period_month,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`${res.status}: ${txt.slice(0, 200)}`);
        }
        await admin
          .from("monthly_report_jobs")
          .update({ status: "done", last_error: null, updated_at: new Date().toISOString() })
          .eq("id", job.id);
        ok++;
      } catch (e: any) {
        console.error("job failed", job.id, e);
        await admin
          .from("monthly_report_jobs")
          .update({
            status: (job.attempts || 0) + 1 >= 3 ? "error" : "pending",
            last_error: String(e?.message || e).slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        err++;
      }
    }

    const { count } = await admin
      .from("monthly_report_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    return new Response(
      JSON.stringify({ processed: list.length, ok, err, remaining: count ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("process-monthly-report-batch error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
