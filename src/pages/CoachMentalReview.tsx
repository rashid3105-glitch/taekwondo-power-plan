import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CoachMentalAssessment } from "@/components/CoachMentalAssessment";

export default function CoachMentalReview() {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const [profile, setProfile] = useState<{
    belt_level?: string | null;
    experience_years?: number | null;
    discipline?: string | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("belt_level, experience_years, discipline")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data ?? {});
    })();
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] bg-background" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="container max-w-2xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/coach")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Coach
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")} aria-label="Home">
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <CoachMentalAssessment profile={profile} />
      </main>
    </div>
  );
}
