import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useThreads } from "@/hooks/useThreads";
import { Calendar, NotebookPen, MessageCircle, Play, BookOpen, ChevronRight, Flame, Dumbbell, Award } from "lucide-react";

interface NextSession {
  date: string;
  type: string;
  duration: string;
}

interface Stats {
  streak: number;
  sessions: number;
  belt: string;
}

/**
 * Self-contained athlete home dashboard.
 * Rendered only when activeRole === "athlete".
 * Dark surface using semantic background + --accent CSS variable for highlights.
 */
export function AthleteDashboard() {
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const { totalUnread } = useThreads();

  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [stats, setStats] = useState<Stats>({ streak: 0, sessions: 0, belt: "—" });

  useEffect(() => {
    if (activeRole !== "athlete") return;
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Profile (belt)
      const { data: prof } = await supabase
        .from("profiles")
        .select("belt_level")
        .eq("user_id", user.id)
        .maybeSingle();

      // Active plan -> infer next session
      const { data: plan } = await supabase
        .from("training_plans")
        .select("plan_data")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      let next: NextSession | null = null;
      const days: any[] = (plan?.plan_data as any)?.days || (plan?.plan_data as any)?.week || [];
      if (Array.isArray(days) && days.length > 0) {
        const todayIdx = (new Date().getDay() + 6) % 7; // Monday=0
        for (let i = 0; i < 7; i++) {
          const d: any = days[(todayIdx + i) % 7];
          if (!d) continue;
          const sessions = Array.isArray(d.sessions) ? d.sessions : (d.session ? [d.session] : []);
          const first = sessions.find((s: any) => s && (s.type || s.exercises?.length));
          if (first) {
            const dt = new Date();
            dt.setDate(dt.getDate() + i);
            next = {
              date: dt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
              type: first.type || d.focus || "Træning",
              duration: first.duration ? `${first.duration} min` : (first.duration_minutes ? `${first.duration_minutes} min` : ""),
            };
            break;
          }
        }
      }

      // Sessions count + streak from workout_logs (completed)
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("logged_date, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("logged_date", { ascending: false })
        .limit(500);

      const dates = Array.from(new Set((logs || []).map((l: any) => l.logged_date)));
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(today.getDate() - i);
        const iso = expected.toISOString().slice(0, 10);
        if (dates.includes(iso)) streak++;
        else if (i === 0) continue; // allow no-log today
        else break;
      }

      if (!mounted) return;
      setNextSession(next);
      setStats({
        streak,
        sessions: dates.length,
        belt: prof?.belt_level || "—",
      });
    })();

    return () => { mounted = false; };
  }, [activeRole]);

  if (activeRole !== "athlete") return null;

  const accentStyle = { color: "hsl(var(--accent))" } as const;
  const accentBg = { backgroundColor: "hsl(var(--accent) / 0.12)", borderColor: "hsl(var(--accent) / 0.35)" } as const;

  return (
    <div
      className="space-y-4 rounded-2xl p-4"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* 1. Next session */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4" style={accentStyle} />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/60">Næste session</h3>
        </div>
        {nextSession ? (
          <div>
            <p className="text-sm font-semibold text-white">{nextSession.type}</p>
            <p className="text-xs text-white/60 mt-1">
              {nextSession.date}{nextSession.duration ? ` · ${nextSession.duration}` : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/60">Ingen planlagt træning</p>
        )}
      </section>

      {/* 2. Stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatTile icon={<Flame className="h-4 w-4" />} value={stats.streak} label="Streak" accentStyle={accentStyle} />
        <StatTile icon={<Dumbbell className="h-4 w-4" />} value={stats.sessions} label="Sessioner" accentStyle={accentStyle} />
        <StatTile icon={<Award className="h-4 w-4" />} value={stats.belt} label="Bælte" accentStyle={accentStyle} small />
      </section>

      {/* 3. Diary */}
      <section
        className="rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:bg-white/[0.05] transition-colors"
        style={accentBg}
        onClick={() => navigate("/diary")}
      >
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--accent) / 0.18)" }}>
          <NotebookPen className="h-4 w-4" style={accentStyle} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Skriv i dagbog</p>
          <p className="text-xs text-white/60">Reflekter over dag</p>
        </div>
        <ChevronRight className="h-4 w-4 text-white/40" />
      </section>

      {/* 4. Messages */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center relative">
          <MessageCircle className="h-4 w-4" style={accentStyle} />
          {totalUnread > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-black"
              style={{ backgroundColor: "hsl(var(--accent))" }}
            >
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {totalUnread > 0 ? `${totalUnread} ulæste beskeder` : "Ingen nye beskeder"}
          </p>
          <p className="text-xs text-white/60">Fra din coach</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/messages")}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "hsl(var(--accent))", color: "#000" }}
        >
          Se beskeder
        </button>
      </section>

      {/* 5. Quick access */}
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard?tab=plan")}
          className="rounded-xl p-4 flex items-center gap-2 font-semibold text-sm"
          style={{ backgroundColor: "hsl(var(--accent))", color: "#000" }}
        >
          <Play className="h-4 w-4" />
          Log session
        </button>
        <button
          type="button"
          onClick={() => navigate("/library")}
          className="rounded-xl border border-white/15 bg-white/[0.04] p-4 flex items-center gap-2 font-semibold text-sm text-white"
        >
          <BookOpen className="h-4 w-4" style={accentStyle} />
          Se øvelser
        </button>
      </section>
    </div>
  );
}

function StatTile({
  icon, value, label, accentStyle, small,
}: { icon: React.ReactNode; value: string | number; label: string; accentStyle: React.CSSProperties; small?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="flex items-center justify-center mb-1" style={accentStyle}>{icon}</div>
      <div className={small ? "text-sm font-bold text-white capitalize truncate" : "text-xl font-bold text-white"}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">{label}</div>
    </div>
  );
}
