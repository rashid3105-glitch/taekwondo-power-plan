// Platform-admin only. Reads auth.users data (never exposed to the client via
// RLS) for two admin views: demo signups and accounts that never signed in.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const STATUSES = new Set(["new", "contacted", "declined", "won"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "list");

    if (action === "set_status") {
      const targetId = String(body?.user_id || "");
      const status = String(body?.status || "");
      const note = typeof body?.note === "string" ? body.note.slice(0, 2000) : null;
      if (!targetId) return json({ error: "user_id_required" }, 400);
      if (!STATUSES.has(status)) return json({ error: "invalid_status" }, 400);

      const { error } = await admin
        .from("profiles")
        .update({
          lead_status: status,
          lead_note: note,
          lead_status_updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetId);
      if (error) throw error;
      console.log("admin-leads set_status", { by: user.id, targetId, status });
      return json({ ok: true });
    }

    if (action === "log_action") {
      console.log("admin-leads client action", {
        by: user.id,
        target: String(body?.user_id || ""),
        kind: String(body?.kind || ""),
        ok: Boolean(body?.ok),
      });
      return json({ ok: true });
    }

    // ── list ──────────────────────────────────────────────────────────────
    // Collect all auth users (paged) — the project is small (< 1000s).
    type AuthUser = {
      id: string;
      email: string | null;
      created_at: string;
      last_sign_in_at: string | null;
      email_confirmed_at: string | null;
      recovery_sent_at: string | null;
      confirmation_sent_at: string | null;
      meta: Record<string, unknown>;
    };
    const authUsers: AuthUser[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const list = data?.users ?? [];
      for (const u of list) {
        authUsers.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: (u as any).last_sign_in_at ?? null,
          email_confirmed_at: (u as any).email_confirmed_at ?? null,
          recovery_sent_at: (u as any).recovery_sent_at ?? null,
          confirmation_sent_at: (u as any).confirmation_sent_at ?? null,
          meta: (u.user_metadata || {}) as Record<string, unknown>,
        });
      }
      if (list.length < 1000) break;
    }

    const ids = authUsers.map((u) => u.id);
    const profileById = new Map<string, any>();
    for (let i = 0; i < ids.length; i += 500) {
      const { data } = await admin
        .from("profiles")
        .select(
          "user_id, display_name, club_id, is_demo, coach_club_name, coach_athlete_count_band, discipline, roles, lead_status, lead_note, lead_status_updated_at",
        )
        .in("user_id", ids.slice(i, i + 500));
      (data ?? []).forEach((p: any) => profileById.set(p.user_id, p));
    }

    const { data: clubs } = await admin.from("clubs").select("id, name, license_active");
    const clubById = new Map((clubs ?? []).map((c: any) => [c.id, c]));

    const { data: roleRows } = await admin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    (roleRows ?? []).forEach((r: any) => {
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role]);
    });

    const shape = (u: AuthUser) => {
      const p = profileById.get(u.id) || {};
      const club = p.club_id ? clubById.get(p.club_id) : null;
      const roles = rolesByUser.get(u.id) ?? [];
      return {
        user_id: u.id,
        email: u.email,
        display_name: p.display_name ?? (u.meta?.display_name as string) ?? null,
        club_name: (club as any)?.name ?? p.coach_club_name ?? null,
        license_active: (club as any)?.license_active ?? null,
        role: roles.includes("admin")
          ? "platform_admin"
          : roles.includes("coach")
          ? "coach"
          : "athlete",
        discipline: p.discipline ?? null,
        athlete_band: p.coach_athlete_count_band ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        recovery_sent_at: u.recovery_sent_at,
        confirmation_sent_at: u.confirmation_sent_at,
        wants_demo: Boolean(u.meta?.wants_demo) || Boolean(p.is_demo),
        lead_status: p.lead_status ?? "new",
        lead_note: p.lead_note ?? null,
        lead_status_updated_at: p.lead_status_updated_at ?? null,
      };
    };

    const all = authUsers.map(shape);
    return json({
      demo_signups: all.filter((r) => r.wants_demo),
      never_signed_in: all.filter((r) => !r.last_sign_in_at),
    });
  } catch (e: any) {
    console.error("admin-leads failed", e?.message || e);
    return json({ error: "server_error" }, 500);
  }
});
