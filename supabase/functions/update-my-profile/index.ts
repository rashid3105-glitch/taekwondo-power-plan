import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

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
  age: z.number().int().min(5).max(99).nullable(),
  weight_kg: z.number().min(20).max(300).nullable(),
  belt_level: z.string().min(1).max(20),
  experience_years: z.number().int().min(0).max(80).nullable(),
  tkd_sessions_per_week: z.number().int().min(0).max(14),
  goals: z.array(z.string().min(1).max(100)).max(20),
  weekly_schedule: z.array(DayScheduleSchema).min(1).max(7),
  program_weeks: z.number().int().min(1).max(52),
  current_injury: z.string().max(500).nullable(),
  discipline: z.string().min(1).max(50),
  club_id: z.string().uuid().nullable(),
  country: z.string().max(100).nullable(),
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

    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update(parsed.data)
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
