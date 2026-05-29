import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { Users, AlertTriangle, Dumbbell, FileText, Send, ChevronRight, CalendarDays, CheckCircle } from "lucide-react";
import { EmptyState } from "./AthleteDashboard";

interface CoachStats {
  totalAthletes: number;
  sessionsThisWeek: number;
  activePlans: number;
}

interface InactiveAthlete {
  id: string;
  display_name: string;
}

/**
 * Self-contained coach home dashboard.
 * Rendered only when activeRole === "coach".
 * Dark surface using semantic background + --accent CSS variable for highlights.
 */
export function CoachDashboard() {
  const { activeRole } = useRole();
  const navigate = useNavigate();

  const [stats, setStats] = useState<CoachStats>({ totalAthletes: 0, sessionsThisWeek: 0, activePlans: 0 });
  const [inactiveAthletes, setInactiveAthletes] = useState<InactiveAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeRole !== "coach") return;
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // 1. Get all athletes linked to this coach
      const { data: links } = await supabase
        .from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", user.id);

      const athleteIds = (links || []).map((l: any) => l.athlete_id);
      if (athleteIds.length === 0) {
        if (mounted) setLoading(false);
        return;
      }

      // 2. Fetch athlete profiles for names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", athleteIds);

      const profileMap = new Map<string, string>();
      (profiles || []).forEach((p: any) => {
        profileMap.set(p.user_id, p.display_name || "Atlet");
      });

      // 3. Get latest workout log per athlete (for inactive detection)
      const { data: allLogs } = await supabase
        .from("workout_logs")
        .select("user_id, logged_date")
        .in("user_id", athleteIds)
        .order("logged_date", { ascending: false });

      const latestLogByAthlete = new Map<string, string>();
      (allLogs || []).forEach((log: any) => {
        if (!latestLogByAthlete.has(log.user_id)) {
          latestLogByAthlete.set(log.user_id, log.logged_date);
        }
      });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffIso = sevenDaysAgo.toISOString().slice(0, 10);

      const inactive: InactiveAthlete[] = [];
      athleteIds.forEach((id) => {
        const latest = latestLogByAthlete.get(id);
        if (!latest || latest < cutoffIso) {
          inactive.push({ id, display_name: profileMap.get(id) || "Atlet" });
        }
      });

      // 4. Sessions this week (Mon-Sun)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekLogs = (allLogs || []).filter((log: any) => {
        const d = new Date(log.logged_date);
        return d >= monday && d <= sunday;
      });

      // 5. Active plans for these athletes
      const { data: plansData } = await supabase
        .from("training_plans")
        .select("id")
        .in("user_id", athleteIds)
        .eq("is_active", true);

      if (!mounted) return;
      setStats({
        totalAthletes: athleteIds.length,
        sessionsThisWeek: weekLogs.length,
        activePlans: (plansData || []).length,
      });
      setInactiveAthletes(inactive);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [activeRole]);

  if (activeRole !== "coach") return null;

  const accentStyle = { color: "var(--accent-hex)" } as const;
  const accentBg = { backgroundColor: "hsl(var(--accent) / 0.12)", borderColor: "hsl(var(--accent) / 0.35)" } as const;

  return (
    <div
      className="space-y-4 rounded-2xl p-4"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* 1. Atletoverblik */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4" style={accentStyle} />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/60">Atletoverblik</h3>
        </div>
        {loading ? (
          <p className="text-sm text-white/60">Henter data…</p>
        ) : (
          <div>
            <p className="text-2xl font-bold text-white">{stats.totalAthletes}</p>
            <p className="text-xs text-white/60 mt-1">
              {stats.totalAthletes === 1 ? "aktiv atlet" : "aktive atleter"} tilknyttet
            </p>
          </div>
        )}
      </section>

      {/* 2. Inaktive atleter */}
      <section
        className={`rounded-xl border p-4 ${inactiveAthletes.length > 0 ? "border-destructive/30 bg-destructive/5" : "border-white/10 bg-white/[0.03]"}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {inactiveAthletes.length > 0 ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CalendarDays className="h-4 w-4" style={accentStyle} />
          )}
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/60">Inaktive atleter</h3>
        </div>
        {inactiveAthletes.length > 0 ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-destructive">
                {inactiveAthletes.length} {inactiveAthletes.length === 1 ? "atlet" : "atleter"} uden træning i 7+ dage
              </p>
              <p className="text-xs text-white/60 mt-1">Tjek op på dem</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/coach")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              Se hvem
            </button>
          </div>
        ) : (
          <p className="text-sm text-white/80">Alle atleter er aktive</p>
        )}
      </section>

      {/* 3. Holdstatistik */}
      <section className="grid grid-cols-3 gap-3">
        <StatTile icon={<Users className="h-4 w-4" />} value={stats.totalAthletes} label="Atleter" accentStyle={accentStyle} />
        <StatTile icon={<Dumbbell className="h-4 w-4" />} value={stats.sessionsThisWeek} label="Sessioner i ugen" accentStyle={accentStyle} />
        <StatTile icon={<FileText className="h-4 w-4" />} value={stats.activePlans} label="Aktive planer" accentStyle={accentStyle} />
      </section>

      {/* 4. Hurtig adgang */}
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate("/coach/season-calendar")}
          className="rounded-xl p-4 flex items-center gap-2 font-semibold text-sm"
          style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
        >
          <CalendarDays className="h-4 w-4" />
          Træningsplaner
        </button>
        <button
          type="button"
          onClick={() => navigate("/messages")}
          className="rounded-xl border border-white/15 bg-white/[0.04] p-4 flex items-center gap-2 font-semibold text-sm text-white"
        >
          <Send className="h-4 w-4" style={accentStyle} />
          Send besked
        </button>
      </section>
    </div>
  );
}

function StatTile({
  icon, value, label, accentStyle,
}: { icon: React.ReactNode; value: string | number; label: string; accentStyle: React.CSSProperties }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="flex items-center justify-center mb-1" style={accentStyle}>{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">{label}</div>
    </div>
  );
}
