import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DaySessionSchema = z.object({
  type: z.enum(["tkd", "gym", "rest"]),
});

const DayScheduleSchema = z.object({
  day: z.string().min(1).max(20),
  type: z.enum(["tkd", "gym", "rest"]),
  sessions: z.array(DaySessionSchema).min(1).max(3).optional(),
});

const UpdateProfileSchema = z.object({
  age: z.number().int().min(5).max(99).nullable().optional(),
  weight_kg: z.number().min(20).max(300).nullable().optional(),
  belt_level: z.string().min(1).max(20).optional(),
  experience_years: z.number().int().min(0).max(80).nullable().optional(),
  tkd_sessions_per_week: z.number().int().min(0).max(14).optional(),
  goals: z.array(z.string().min(1).max(100)).max(20).optional(),
  weekly_schedule: z.array(DayScheduleSchema).min(1).max(7).optional(),
  program_weeks: z.number().int().min(1).max(52).optional(),
  current_injury: z.string().max(500).nullable().optional(),
  discipline: z.string().min(1).max(50).optional(),
  club_id: z.string().uuid().nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  custom_calories: z.number().int().min(500).max(10000).nullable().optional(),
  owns_wearable: z.boolean().optional(),
  default_locale: z.enum(["en", "da", "sv", "no", "de", "ar"]).nullable().optional(),
  onboarding_completed: z.boolean().optional(),
  coach_club_name: z.string().max(120).nullable().optional(),
  coach_athlete_count_band: z.string().max(20).nullable().optional(),
  coach_focus: z.array(z.string().min(1).max(40)).max(10).nullable().optional(),
  pending_invite_code: z.string().max(20).nullable().optional(),
  pending_coach_id: z.string().uuid().nullable().optional(),
  gal_license: z.string().max(50).nullable().optional(),
  gal_license_expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  has_myfightbook: z.boolean().optional(),
  myfightbook_expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  avatar_url: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => {
      if (v == null) return null;
      const trimmed = v.trim();
      return trimmed === "" ? null : trimmed;
    })
    .refine(
      (v) => v === undefined || v === null || /^[0-9a-f-]{36}\/avatar\.(jpg|jpeg|png|webp|gif)$/i.test(v),
      { message: "avatar_url must match {uuid}/avatar.{jpg|jpeg|png|webp|gif}" }
    ),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = UpdateProfileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid profile payload", details: parsed.error.flatten() }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Drop undefined keys so we only update fields the client actually sent.
    const updateData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) updateData[k] = v;
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select("user_id")
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, profile: updatedProfile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
