import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useSuperadminLab } from "@/hooks/useSuperadminLab";
import { CoachLogQueue } from "@/components/lab/CoachLogQueue";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";

interface Athlete { user_id: string; display_name: string; birth_date?: string | null }

/**
 * Full-screen coach view of the shared post-training log queue.
 * Platform admins only while the feature is live-tested.
 */
export default function CoachLogs() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { labEnabled, loading } = useSuperadminLab();
  const { activeClubId } = useActiveClub();
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  useEffect(() => {
    if (!loading && !labEnabled) navigate("/coach", { replace: true });
  }, [loading, labEnabled, navigate]);

  useEffect(() => {
    if (!labEnabled) return;
    let cancelled = false;
    (async () => {
      let q = supabase.from("profiles").select("user_id, display_name, birth_date").limit(200);
      if (activeClubId) q = q.eq("club_id", activeClubId);
      const { data } = await q;
      if (!cancelled) setAthletes((data as any[]) || []);
    })();
    return () => { cancelled = true; };
  }, [labEnabled, activeClubId]);

  if (loading || !labEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>{t("labQueueTitle")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm pt-safe">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach/today")} aria-label={t("back")} title={t("back")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="text-base font-extrabold text-card-foreground">{t("labQueueTitle")}</span>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <p className="text-xs text-muted-foreground">{t("labLogsPageDesc")}</p>
        <CoachLogQueue athletes={athletes} />
      </main>
    </div>
  );
}
