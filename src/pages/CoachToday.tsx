import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CalendarCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { SessionAttendance } from "@/components/coach/SessionAttendance";

interface MiniAthlete {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function CoachToday() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { activeClubId } = useActiveClub();
  const [coachUserId, setCoachUserId] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<MiniAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      // Coach guard
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isCoach = (roles || []).some((r: any) => r.role === "coach" || r.role === "admin");
      if (!isCoach) { navigate("/dashboard"); return; }

      setCoachUserId(user.id);

      // Load coach's athletes — same pattern as CoachDashboard.loadAthletes
      const { data: links } = await supabase
        .from("coach_athletes")
        .select("athlete_id");
      const athleteIds = (links || []).map((l: any) => l.athlete_id);

      let memberIds = new Set<string>();
      if (activeClubId) {
        const { data: memberRows } = await supabase
          .from("club_memberships" as any)
          .select("user_id")
          .eq("club_id", activeClubId)
          .eq("status", "active");
        memberIds = new Set(((memberRows as any[]) ?? []).map((r) => r.user_id as string));
      }

      if (athleteIds.length === 0) {
        setAthletes([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, club_id")
        .in("user_id", athleteIds);

      const filtered = ((profiles || []) as any[])
        .filter((a) => !activeClubId || memberIds.has(a.user_id) || a.club_id === activeClubId)
        .map((a) => ({ user_id: a.user_id, display_name: a.display_name, avatar_url: a.avatar_url }))
        .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));

      setAthletes(filtered);
      setLoading(false);
    })();
  }, [activeClubId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Watermark />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CalendarCheck className="h-5 w-5 text-primary" />
          <span className="text-base font-extrabold text-card-foreground">{t("todayTab")}</span>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {coachUserId && (
          <SessionAttendance coachId={coachUserId} athletes={athletes} />
        )}
      </main>
      <AppFooter />
    </div>
  );
}
