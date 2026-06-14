// Auth-required edge function: counts (but does NOT delete) what a real
// account deletion would touch for the calling user. Returns a structured
// summary so the user can see what will happen before they confirm.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HARD_DELETE, ANONYMIZE, STORAGE_BUCKETS } from "../_shared/deletion-lists.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;

    const hard_delete: Array<{ table: string; column: string; count: number; error?: string }> = [];
    const anonymize: Array<{ table: string; column: string; count: number; error?: string }> = [];

    for (const { table, column } of HARD_DELETE) {
      try {
        if (table === "diary_comments") {
          // Counted via diary_entries ownership chain (the user's diary entries).
          const { data: entryIds } = await admin
            .from("diary_entries").select("id").eq("user_id", uid);
          const ids = (entryIds ?? []).map((r: any) => r.id);
          if (ids.length === 0) {
            hard_delete.push({ table, column: "via diary_entries.user_id", count: 0 });
          } else {
            const { count, error } = await admin
              .from("diary_comments")
              .select("*", { count: "exact", head: true })
              .in("diary_entry_id", ids);
            if (error) throw error;
            hard_delete.push({ table, column: "via diary_entries.user_id", count: count ?? 0 });
          }
          continue;
        }
        const { count, error } = await admin
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq(column, uid);
        if (error) throw error;
        hard_delete.push({ table, column, count: count ?? 0 });
      } catch (e) {
        hard_delete.push({ table, column, count: 0, error: String((e as Error)?.message ?? e) });
      }
    }

    for (const { table, column } of ANONYMIZE) {
      try {
        const { count, error } = await admin
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq(column, uid);
        if (error) throw error;
        anonymize.push({ table, column, count: count ?? 0 });
      } catch (e) {
        anonymize.push({ table, column, count: 0, error: String((e as Error)?.message ?? e) });
      }
    }

    const storage: Array<{ bucket: string; estimated_objects: number; error?: string }> = [];
    for (const { bucket, prefix } of STORAGE_BUCKETS) {
      try {
        const { data, error } = await admin.storage.from(bucket).list(prefix(uid), { limit: 1000 });
        if (error) throw error;
        storage.push({ bucket, estimated_objects: data?.length ?? 0 });
      } catch (e) {
        storage.push({ bucket, estimated_objects: 0, error: String((e as Error)?.message ?? e) });
      }
    }

    const total_hard = hard_delete.reduce((s, r) => s + (r.count || 0), 0);
    const total_anonymize = anonymize.reduce((s, r) => s + (r.count || 0), 0);
    const total_storage = storage.reduce((s, r) => s + (r.estimated_objects || 0), 0);

    return json({
      user: { id: uid, email: user.email },
      hard_delete,
      anonymize,
      storage,
      total_hard,
      total_anonymize,
      total_storage,
      total_hard_tables: hard_delete.filter((r) => r.count > 0).length,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
