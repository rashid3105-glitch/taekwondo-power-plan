import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isMinor, POLICY_VERSION } from "../_shared/age.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://taekwondo-power-plan.lovable.app";

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: hasCoachRole } = await adminClient.rpc("has_role", {
      _user_id: user.id, _role: "coach",
    });
    const { data: isAdmin } = await adminClient.rpc("is_admin", {
      _user_id: user.id,
    });
    if (!hasCoachRole && !isAdmin) throw new Error("Not a coach");

    const { data: coachProfile, error: coachProfileError } = await adminClient
      .from("profiles").select("club_id").eq("user_id", user.id).maybeSingle();
    if (coachProfileError) throw coachProfileError;
    if (!coachProfile?.club_id) throw new Error("COACH_CLUB_REQUIRED");

    if (!isAdmin) {
      const { data: club } = await adminClient
        .from("clubs").select("max_athletes").eq("id", coachProfile.club_id).single();
      const limit = club?.max_athletes ?? 5;
      const { count } = await adminClient
        .from("coach_athletes").select("id", { count: "exact", head: true })
        .eq("coach_id", user.id);
      if ((count ?? 0) >= limit) throw new Error("MAX_ATHLETES_REACHED");
    }

    const {
      name, email, password, age, belt_level, experience_years, discipline,
      birth_date, parent_email,
    } = await req.json();

    if (!name || !email || !password) throw new Error("Missing required fields");
    const hasLetter = /\p{L}/u.test(password);
    const hasDigit = /\d/.test(password);
    if (typeof password !== "string" || password.length < 8 || !hasLetter || !hasDigit) {
      throw new Error("WEAK_PASSWORD");
    }

    const minor = isMinor(birth_date, typeof age === "number" ? age : null);

    if (minor) {
      if (!parent_email || typeof parent_email !== "string" || !EMAIL_RE.test(parent_email.trim())) {
        throw new Error("PARENT_EMAIL_REQUIRED");
      }
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { display_name: name, wants_demo: true },
    });
    if (createError) throw createError;

    let profileExists = false;
    for (let i = 0; i < 10; i++) {
      const { data: check } = await adminClient
        .from("profiles").select("user_id").eq("user_id", newUser.user!.id).maybeSingle();
      if (check) { profileExists = true; break; }
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!profileExists) console.error("Profile not created by trigger after retries");

    const profileUpdates: Record<string, any> = {
      club_id: coachProfile.club_id,
      is_approved: true,
    };

    const { data: clubDefault } = await adminClient
      .from("clubs").select("default_weekly_schedule").eq("id", coachProfile.club_id).maybeSingle();
    if (clubDefault?.default_weekly_schedule) {
      profileUpdates.weekly_schedule = clubDefault.default_weekly_schedule;
    }

    if (age != null && typeof age === "number" && age >= 5 && age <= 99) profileUpdates.age = age;
    if (birth_date && typeof birth_date === "string") profileUpdates.birth_date = birth_date;
    if (belt_level && typeof belt_level === "string") profileUpdates.belt_level = belt_level;
    if (experience_years != null && typeof experience_years === "number" && experience_years >= 0 && experience_years <= 50) profileUpdates.experience_years = experience_years;
    if (discipline && (discipline === "sparring" || discipline === "poomsae")) profileUpdates.discipline = discipline;

    const { error: updateError } = await adminClient.from("profiles")
      .update(profileUpdates).eq("user_id", newUser.user!.id);
    if (updateError) console.error("Profile update error:", updateError);

    await adminClient.from("coach_athletes").insert({
      coach_id: user.id, athlete_id: newUser.user!.id,
    });

    // ─── Consent handling ───
    let consentSent = false;
    if (minor) {
      const token = randomToken(32);
      const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();

      // pending consent record
      await adminClient.from("consent_records").upsert({
        athlete_id: newUser.user!.id,
        consent_type: "health_data_processing",
        status: "pending",
        club_id: coachProfile.club_id,
      }, { onConflict: "athlete_id,consent_type" });

      // consent token
      await adminClient.from("consent_tokens").insert({
        token,
        athlete_id: newUser.user!.id,
        parent_email: parent_email.trim(),
        consent_type: "health_data_processing",
        expires_at: expiresAt,
      });

      // Email parent via existing transactional pipeline
      try {
        const consentUrl = `${APP_URL}/consent/${token}`;
        const { error: emailErr } = await adminClient.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "parental-consent-request",
              recipientEmail: parent_email.trim(),
              idempotencyKey: `parental-consent-${newUser.user!.id}-${token.slice(0, 8)}`,
              templateData: {
                athleteName: name,
                consentUrl,
                expiresInDays: 14,
              },
            },
          },
        );
        if (!emailErr) consentSent = true;
      } catch (e) {
        console.warn("consent email send failed:", e);
      }
    } else {
      // Adult — record self-consent so health-sync passes uniformly.
      await adminClient.from("consent_records").upsert({
        athlete_id: newUser.user!.id,
        consent_type: "health_data_processing",
        status: "granted",
        granted_at: new Date().toISOString(),
        granted_by_relation: "self",
        policy_version: POLICY_VERSION,
        club_id: coachProfile.club_id,
      }, { onConflict: "athlete_id,consent_type" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        athlete_id: newUser.user!.id,
        minor,
        consent_email_sent: consentSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
