import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () =>
  Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "club";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const body = await req.json().catch(() => ({}));
    const clubName: string = (body.club_name || "").toString().trim().slice(0, 80);
    const athleteBand: string = (body.athlete_band || "").toString().slice(0, 16);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Get current profile
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id, club_id, is_demo, demo_full_access, demo_expires_at, payment_status, is_approved")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) throw new Error("Profile missing");

    // Prevent privilege escalation / trial reuse: only brand-new users (no
    // existing demo, no paid status, not already approved) may bootstrap a
    // coach trial. Existing athletes or returning demo users are blocked.
    const alreadyDemo = !!profile.is_demo || !!profile.demo_full_access || !!profile.demo_expires_at;
    const alreadyPaid = profile.payment_status === "paid";
    if (alreadyDemo || alreadyPaid || profile.is_approved) {
      return new Response(
        JSON.stringify({ error: "Trial not available for this account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Also block if user already has any role assigned
    const { data: existingRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (existingRoles && existingRoles.length > 0) {
      return new Response(
        JSON.stringify({ error: "Trial not available for this account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Ensure club
    let clubId = profile.club_id;
    if (!clubId && clubName) {
      const slug = `${slugify(clubName)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: club, error: clubErr } = await admin
        .from("clubs")
        .insert({ name: clubName, slug, max_athletes: 100, share_coach_notes: false })
        .select("id")
        .single();
      if (clubErr) throw clubErr;
      clubId = club.id;
    }

    // Update profile: trial, club, marketing fields
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    const profileUpdates: Record<string, any> = {
      is_approved: true,
      is_demo: true,
      demo_full_access: true,
      demo_expires_at: trialEnd.toISOString().slice(0, 10),
      coach_club_name: clubName || null,
      coach_athlete_count_band: athleteBand || null,
      onboarding_completed: true,
    };
    if (clubId) profileUpdates.club_id = clubId;
    await admin.from("profiles").update(profileUpdates).eq("user_id", user.id);

    // Grant coach role
    await admin.from("user_roles").insert({ user_id: user.id, role: "coach" }).then(() => {}, () => {});

    // Ensure invite code
    const { data: existing } = await admin
      .from("coach_invites")
      .select("code")
      .eq("coach_id", user.id)
      .eq("active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let code = existing?.code;
    if (!code) {
      code = generateCode();
      const { error: invErr } = await admin
        .from("coach_invites")
        .insert({ coach_id: user.id, club_id: clubId, code });
      if (invErr) throw invErr;
    }

    return new Response(
      JSON.stringify({ ok: true, code, club_id: clubId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("bootstrap-coach-trial error", err);
    return new Response(
      JSON.stringify({ error: "server_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
