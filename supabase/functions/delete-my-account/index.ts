// Selvbetjent / admin-initieret HÅRD sletning af en bruger.
// Hård-sletter brugerens egne data, anonymiserer fælles data, sletter
// storage-objekter, og sletter til sidst selve auth-brugeren.
//
// Auth: verify_jwt = true. En almindelig bruger kan KUN slette sig selv.
// En admin kan slette en anden bruger ved at sende { target_user_id } i body.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  DELETED_USER_ID,
  HARD_DELETE,
  ANONYMIZE,
  STORAGE_BUCKETS,
} from "../_shared/deletion-lists.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve target user (self vs admin-initiated)
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const targetId: string = body?.target_user_id || user.id;

    if (targetId === DELETED_USER_ID) {
      return json({ error: "cannot_delete_system_user" }, 400);
    }

    if (targetId !== user.id) {
      // Admin-only path
      const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
    } else {
      // Self-deletion requires explicit confirmation
      if (body?.confirmation !== "DELETE MY ACCOUNT") {
        return json({ error: "missing_confirmation" }, 400);
      }
    }

    const uid = targetId;
    const deleted: Array<{ table: string; count: number }> = [];
    const anonymized: Array<{ table: string; column: string; count: number }> = [];
    const storage: Array<{ bucket: string; removed: number }> = [];
    const errors: Array<{ step: string; error: string }> = [];

    // ============================================================
    // 1) ANONYMIZE shared/other-people's data FIRST
    //    (so subsequent FK-cascading deletes don't touch them)
    // ============================================================
    for (const { table, column, nullable } of ANONYMIZE) {
      try {
        const newVal = nullable ? null : DELETED_USER_ID;
        const { count, error } = await admin
          .from(table)
          .update({ [column]: newVal }, { count: "exact" })
          .eq(column, uid)
          .neq(column, DELETED_USER_ID); // never touch the system row
        if (error) throw error;
        anonymized.push({ table, column, count: count ?? 0 });
      } catch (e) {
        errors.push({ step: `anonymize:${table}.${column}`, error: String((e as Error)?.message ?? e) });
      }
    }

    // ============================================================
    // 2) HARD DELETE the user's own data
    //    Order matters for some FK chains — handle children first.
    // ============================================================

    // 2a) diary_comments on user's own diary entries (children of diary_entries)
    try {
      const { data: entries } = await admin
        .from("diary_entries").select("id").eq("user_id", uid);
      const entryIds = (entries ?? []).map((r: any) => r.id);
      if (entryIds.length > 0) {
        const { count, error } = await admin
          .from("diary_comments").delete({ count: "exact" }).in("diary_entry_id", entryIds);
        if (error) throw error;
        deleted.push({ table: "diary_comments", count: count ?? 0 });
      } else {
        deleted.push({ table: "diary_comments", count: 0 });
      }
    } catch (e) {
      errors.push({ step: "delete:diary_comments", error: String((e as Error)?.message ?? e) });
    }

    // 2b) Everything else from the HARD_DELETE list
    for (const { table, column } of HARD_DELETE) {
      if (table === "diary_comments") continue; // handled above
      try {
        const { count, error } = await admin
          .from(table)
          .delete({ count: "exact" })
          .eq(column, uid)
          .neq(column, DELETED_USER_ID); // safety: never touch system row
        if (error) throw error;
        deleted.push({ table, count: count ?? 0 });
      } catch (e) {
        errors.push({ step: `delete:${table}.${column}`, error: String((e as Error)?.message ?? e) });
      }
    }

    // 2c) profiles row (user_id is PK/unique on this table; explicit hard delete)
    try {
      const { error } = await admin.from("profiles").delete().eq("user_id", uid).neq("user_id", DELETED_USER_ID);
      if (error) throw error;
      deleted.push({ table: "profiles", count: 1 });
    } catch (e) {
      errors.push({ step: "delete:profiles", error: String((e as Error)?.message ?? e) });
    }

    // ============================================================
    // 3) Storage objects under the user's prefix
    // ============================================================
    for (const { bucket, prefix } of STORAGE_BUCKETS) {
      try {
        let removed = 0;
        const pfx = prefix(uid);
        // Paginate list (max 1000 per call)
        // deno-lint-ignore no-constant-condition
        while (true) {
          const { data, error } = await admin.storage.from(bucket).list(pfx, { limit: 1000 });
          if (error) throw error;
          if (!data || data.length === 0) break;
          const paths = data.map((o) => `${pfx}${o.name}`);
          const { error: rmErr } = await admin.storage.from(bucket).remove(paths);
          if (rmErr) throw rmErr;
          removed += paths.length;
          if (data.length < 1000) break;
        }
        storage.push({ bucket, removed });
      } catch (e) {
        errors.push({ step: `storage:${bucket}`, error: String((e as Error)?.message ?? e) });
      }
    }

    // ============================================================
    // 4) Finally: delete the auth user itself
    // ============================================================
    try {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error) throw error;
    } catch (e) {
      errors.push({ step: "auth:deleteUser", error: String((e as Error)?.message ?? e) });
    }

    const total_deleted = deleted.reduce((s, r) => s + (r.count || 0), 0);
    const total_anonymized = anonymized.reduce((s, r) => s + (r.count || 0), 0);
    const total_storage = storage.reduce((s, r) => s + (r.removed || 0), 0);

    return json({
      success: errors.length === 0,
      user_id: uid,
      initiated_by: user.id,
      total_deleted,
      total_anonymized,
      total_storage,
      deleted,
      anonymized,
      storage,
      errors,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
