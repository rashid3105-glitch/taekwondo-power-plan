import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seed-secret",
};

const PASSWORD = "Test1234!";

type Person = {
  email: string;
  name: string;
  role: "coach" | "athlete";
  grade: string;
  age: number;
  weight: number;
  sessions: number;
  goals: string[];
};

type ClubSeed = {
  name: string;
  slug: string;
  sport: string;
  discipline: string;
  people: Person[];
};

const CLUBS: ClubSeed[] = [
  {
    name: "Test Karate Klub",
    slug: "test-karate-klub",
    sport: "karate",
    discipline: "kumite",
    people: [
      { email: "karate@sportstalent.dk", name: "Karate Coach", role: "coach", grade: "1. dan", age: 38, weight: 78, sessions: 4, goals: ["technique"] },
      { email: "karate.test1@sportstalent.dk", name: "Karate Atlet 1", role: "athlete", grade: "6. kyu (grøn)", age: 16, weight: 61, sessions: 4, goals: ["technique", "strength"] },
      { email: "karate.test2@sportstalent.dk", name: "Karate Atlet 2", role: "athlete", grade: "3. kyu (brun)", age: 19, weight: 72, sessions: 5, goals: ["competition", "endurance"] },
    ],
  },
  {
    name: "Test Kickboxing Klub",
    slug: "test-kickboxing-klub",
    sport: "kickboxing",
    discipline: "k1",
    people: [
      { email: "kickboxing@sportstalent.dk", name: "Kickboxing Coach", role: "coach", grade: "Elite/senior A", age: 41, weight: 84, sessions: 4, goals: ["technique"] },
      { email: "kickboxing.test1@sportstalent.dk", name: "Kickboxing Atlet 1", role: "athlete", grade: "Øvet", age: 17, weight: 67, sessions: 4, goals: ["competition"] },
      { email: "kickboxing.test2@sportstalent.dk", name: "Kickboxing Atlet 2", role: "athlete", grade: "Nationalt niveau", age: 22, weight: 80, sessions: 6, goals: ["strength", "endurance"] },
    ],
  },
  {
    name: "Test Fitness Klub",
    slug: "test-fitness-klub",
    sport: "fitness",
    discipline: "fitness",
    people: [
      { email: "fitness@sportstalent.dk", name: "Fitness Coach", role: "coach", grade: "Elite", age: 35, weight: 76, sessions: 5, goals: ["strength"] },
      { email: "fitness.test1@sportstalent.dk", name: "Fitness Atlet 1", role: "athlete", grade: "Let øvet", age: 24, weight: 70, sessions: 3, goals: ["strength", "weight"] },
      { email: "fitness.test2@sportstalent.dk", name: "Fitness Atlet 2", role: "athlete", grade: "Avanceret", age: 29, weight: 88, sessions: 5, goals: ["strength", "endurance"] },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Auth: either a valid admin JWT, or the shared seed secret header.
  const seedSecret = Deno.env.get("SEED_TEST_CLUBS_SECRET");
  const providedSecret = req.headers.get("x-seed-secret");
  let authorized = Boolean(seedSecret && providedSecret && providedSecret === seedSecret);

  if (!authorized) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);
    authorized = true;
  }

  const summary: Record<string, unknown>[] = [];

  try {
    for (const club of CLUBS) {
      // 1. Club (idempotent by slug)
      let clubId: string | null = null;
      const { data: existingClub } = await admin
        .from("clubs")
        .select("id")
        .eq("slug", club.slug)
        .maybeSingle();

      if (existingClub) {
        clubId = (existingClub as { id: string }).id;
        await admin
          .from("clubs")
          .update({ name: club.name, sport: club.sport, license_active: true, max_athletes: 10 })
          .eq("id", clubId);
      } else {
        const { data: created, error: clubErr } = await admin
          .from("clubs")
          .insert({
            name: club.name,
            slug: club.slug,
            sport: club.sport,
            license_active: true,
            max_athletes: 10,
          })
          .select("id")
          .single();
        if (clubErr) throw new Error(`club ${club.slug}: ${clubErr.message}`);
        clubId = (created as { id: string }).id;
      }

      const ids: Record<string, string> = {};

      // 2. Users + profiles + memberships + roles
      for (const person of club.people) {
        let userId: string | null = null;

        const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
          email: person.email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { display_name: person.name },
        });

        if (createErr) {
          // Already exists -> look it up and reset the password so it is known.
          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const found = list?.users?.find(
            (u) => (u.email ?? "").toLowerCase() === person.email.toLowerCase(),
          );
          if (!found) throw new Error(`user ${person.email}: ${createErr.message}`);
          userId = found.id;
          await admin.auth.admin.updateUserById(userId, {
            password: PASSWORD,
            email_confirm: true,
          });
        } else {
          userId = createdUser.user!.id;
        }

        ids[person.email] = userId!;

        const profile = {
          user_id: userId,
          display_name: person.name,
          club_id: clubId,
          discipline: club.discipline,
          belt_level: person.grade,
          age: person.age,
          weight_kg: person.weight,
          sessions_per_week: person.sessions,
          goals: person.goals,
          country: "DK",
          is_approved: true,
          onboarding_completed: true,
          role: person.role === "coach" ? "coach" : "athlete",
          roles: person.role === "coach" ? ["coach"] : ["athlete"],
        };

        const { error: profErr } = await admin
          .from("profiles")
          .upsert(profile, { onConflict: "user_id" });
        if (profErr) throw new Error(`profile ${person.email}: ${profErr.message}`);

        const { error: memErr } = await admin.from("club_memberships").upsert(
          {
            user_id: userId,
            club_id: clubId,
            role_in_club: person.role === "coach" ? "coach" : "athlete",
            status: "active",
          },
          { onConflict: "user_id,club_id,role_in_club" },
        );
        if (memErr) throw new Error(`membership ${person.email}: ${memErr.message}`);

        if (person.role === "coach") {
          const { error: roleErr } = await admin
            .from("user_roles")
            .upsert({ user_id: userId, role: "coach" }, { onConflict: "user_id,role" });
          if (roleErr) throw new Error(`role ${person.email}: ${roleErr.message}`);
        }
      }

      // 3. Coach <-> athlete links
      const coach = club.people.find((p) => p.role === "coach")!;
      const athletes = club.people.filter((p) => p.role === "athlete");
      for (const athlete of athletes) {
        const { error: linkErr } = await admin.from("coach_athletes").upsert(
          {
            coach_id: ids[coach.email],
            athlete_id: ids[athlete.email],
            club_id: clubId,
          },
          { onConflict: "coach_id,athlete_id,club_id" },
        );
        if (linkErr) throw new Error(`link ${athlete.email}: ${linkErr.message}`);
      }

      summary.push({
        club: club.name,
        sport: club.sport,
        club_id: clubId,
        coach: coach.email,
        athletes: athletes.map((a) => a.email),
      });
    }

    return json({ ok: true, password: PASSWORD, clubs: summary });
  } catch (err) {
    return json({ ok: false, error: String((err as Error).message ?? err) }, 500);
  }
});
