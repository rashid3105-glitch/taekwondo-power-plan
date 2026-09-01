import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useSuperadminLab } from "@/hooks/useSuperadminLab";
import { TrainingLogCard } from "@/components/lab/TrainingLogCard";
import { CoachLogQueue } from "@/components/lab/CoachLogQueue";
import { Loader2 } from "lucide-react";

interface Athlete { user_id: string; display_name: string; birth_date?: string | null }

/**
 * Hidden live-test surface for the post-training log v2.
 * Superadmin only, no navigation entry, noindex.
 */
export default function PostTrainingLogLive() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { labEnabled, loading } = useSuperadminLab();
  const { activeClubId } = useActiveClub();
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  useEffect(() => {
    if (!labEnabled) return;
    let cancelled = false;
    (async () => {
      let q = supabase.from("profiles").select("user_id, display_name, birth_date").limit(200);
      if (activeClubId) q = q.eq("club_id", activeClubId);
      const { data } = await q;
      if (!cancelled) setAthletes(((data as any[]) || []).map((p) => ({
        user_id: p.user_id, display_name: p.display_name, birth_date: p.birth_date,
      })));
    })();
    return () => { cancelled = true; };
  }, [labEnabled, activeClubId]);

  useEffect(() => {
    if (!loading && !labEnabled) navigate("/dashboard", { replace: true });
  }, [loading, labEnabled, navigate]);

  if (loading || !labEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Lab — post-training log</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-6 pt-safe">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Lab</p>
          <h1 className="text-xl font-extrabold text-foreground">{t("labPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("labPageDesc")}</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("labAthleteSide")}
            </p>
            <TrainingLogCard bare sessionLabel={null} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("labCoachSide")}
            </p>
            <CoachLogQueue bare athletes={athletes} />
          </section>
        </div>
      </main>
    </div>
  );
}
