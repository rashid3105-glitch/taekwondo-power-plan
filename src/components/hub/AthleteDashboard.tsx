import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useThreads } from "@/hooks/useThreads";
import { Calendar, MessageCircle, Play, BookOpen, Flame, Dumbbell, Trophy, NotebookPen, CalendarX } from "lucide-react";

interface TodaySession {
  weekdayLabel: string;
  type: string;
  tags: string[];
}

interface NextCompetition {
  name: string;
  eventDate: Date;
  dateLabel: string;
  location?: string;
}

interface Stats {
  streak: number;
  sessions: number;
}

const WEEKDAYS_DA = ["SØNDAG", "MANDAG", "TIRSDAG", "ONSDAG", "TORSDAG", "FREDAG", "LØRDAG"];

/**
 * Self-contained athlete home dashboard.
 * Rendered only when activeRole === "athlete".
 * Dark surface using semantic background + --accent CSS variable for highlights.
 */
export function AthleteDashboard() {
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const { totalUnread } = useThreads();

  const [todaySession, setTodaySession] = useState<TodaySession | null>(null);
  const [nextCompetition, setNextCompetition] = useState<NextCompetition | null>(null);
  const [stats, setStats] = useState<Stats>({ streak: 0, sessions: 0 });
  const [now, setNow] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Live countdown tick — every minute
  useEffect(() => {
    if (!nextCompetition) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [nextCompetition]);

  useEffect(() => {
    if (activeRole !== "athlete") return;
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Next competition
      const todayIso = new Date().toISOString().slice(0, 10);
      const { data: comp } = await supabase
        .from("competitions")
        .select("name, event_date, location")
        .eq("user_id", user.id)
        .gte("event_date", todayIso)
        .order("event_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (comp && mounted) {
        const dt = new Date(comp.event_date + "T00:00:00");
        setNextCompetition({
          name: comp.name,
          eventDate: dt,
          dateLabel: dt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
          location: comp.location || undefined,
        });
      }

      // Active plan -> today's session
      const { data: plan } = await supabase
        .from("training_plans")
        .select("plan_data")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const days: any[] = (plan?.plan_data as any)?.days || (plan?.plan_data as any)?.week || [];
      const todayDow = new Date().getDay();
      const todayIdx = (todayDow + 6) % 7; // Monday=0
      let today: TodaySession | null = null;
      if (Array.isArray(days) && days.length > 0) {
        const d: any = days[todayIdx];
        if (d) {
          const sessions = Array.isArray(d.sessions) ? d.sessions : (d.session ? [d.session] : []);
          const first = sessions.find((s: any) => s && (s.type || s.exercises?.length));
          if (first) {
            const tags: string[] = [];
            if (first.focus) tags.push(String(first.focus));
            if (d.focus && d.focus !== first.focus) tags.push(String(d.focus));
            if (first.duration || first.duration_minutes) {
              tags.push(`${first.duration || first.duration_minutes} min`);
            }
            today = {
              weekdayLabel: WEEKDAYS_DA[todayDow],
              type: first.type || d.focus || "Træning",
              tags: tags.slice(0, 3),
            };
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
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(todayDate);
        expected.setDate(todayDate.getDate() - i);
        const iso = expected.toISOString().slice(0, 10);
        if (dates.includes(iso)) streak++;
        else if (i === 0) continue;
        else break;
      }

      if (!mounted) return;
      setTodaySession(today);
      setStats({ streak, sessions: dates.length });
    })();

    return () => { mounted = false; };
  }, [activeRole]);

  const countdown = useMemo(() => {
    if (!nextCompetition) return null;
    const diff = nextCompetition.eventDate.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return { days, hours, minutes };
  }, [nextCompetition, now]);

  if (activeRole !== "athlete") return null;

  const accentStyle = { color: "var(--accent-hex)" } as const;
  const accentLeftBorder = { borderLeft: "3px solid var(--accent-hex)" } as const;

  return (
    <div
      className="space-y-4 rounded-2xl p-4"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* 1. TODAY card */}
      <section
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
        style={accentLeftBorder}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="h-4 w-4 shrink-0" style={accentStyle} />
            <h3 className="text-[11px] font-bold uppercase tracking-wider truncate" style={accentStyle}>
              I DAG · {WEEKDAYS_DA[new Date().getDay()]}
            </h3>
          </div>
          {todaySession && (
            <button
              type="button"
              onClick={() => navigate("/dashboard?tab=plan")}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
            >
              <Play className="h-3 w-3" fill="currentColor" /> Start
            </button>
          )}
        </div>
        {todaySession ? (
          <div>
            <p className="text-sm font-semibold text-white">{todaySession.type}</p>
            {todaySession.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {todaySession.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/[0.06] text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/60">Ingen træning i dag</p>
        )}
      </section>

      {/* 2. Next event with countdown */}
      <section
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
        style={accentLeftBorder}
      >
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4" style={accentStyle} />
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={accentStyle}>
            Næste begivenhed
          </h3>
        </div>
        {nextCompetition && countdown ? (
          <div>
            <p className="text-sm font-semibold text-white">{nextCompetition.name}</p>
            <p className="text-xs text-white/60 mt-1">
              {nextCompetition.dateLabel}{nextCompetition.location ? ` · ${nextCompetition.location}` : ""}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <CountBox value={countdown.days} label="DAGE" accentStyle={accentStyle} />
              <CountBox value={countdown.hours} label="TIMER" accentStyle={accentStyle} />
              <CountBox value={countdown.minutes} label="MIN" accentStyle={accentStyle} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/60">Ingen kommende begivenheder</p>
        )}
      </section>

      {/* 3. Stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatTile icon={<Flame className="h-4 w-4" />} value={stats.streak} label="Streak" accentStyle={accentStyle} />
        <StatTile icon={<Dumbbell className="h-4 w-4" />} value={stats.sessions} label="Sessioner" accentStyle={accentStyle} />
      </section>

      {/* 4. Messages */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center relative">
          <MessageCircle className="h-4 w-4" style={accentStyle} />
          {totalUnread > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-black"
              style={{ backgroundColor: "var(--accent-hex)" }}
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
          style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
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
          style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
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
        <button
          type="button"
          onClick={() => navigate("/diary")}
          className="col-span-2 rounded-xl border border-white/15 bg-white/[0.04] p-4 flex items-center gap-2 font-semibold text-sm text-white"
        >
          <NotebookPen className="h-4 w-4" style={accentStyle} />
          Skriv i dagbogen
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

function CountBox({
  value, label, accentStyle,
}: { value: number; label: string; accentStyle: React.CSSProperties }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/10 py-2 text-center">
      <div className="text-xl font-bold tabular-nums" style={accentStyle}>{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-white/50 mt-0.5">{label}</div>
    </div>
  );
}
