// Page wrapping the post-competition reflection flow.
// Loads the competition + upcoming competitions, then renders the reflection UI.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { useLanguage } from "@/i18n/LanguageContext";
import { PostCompetitionReflection } from "@/components/PostCompetitionReflection";

interface Competition {
  id: string;
  name: string;
  event_date: string;
  result: string | null;
}

export default function CompetitionReflectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [comp, setComp] = useState<Competition | null>(null);
  const [upcoming, setUpcoming] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [id]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    if (!id) { navigate("/competitions"); return; }
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from("competitions").select("id, name, event_date, result").eq("id", id).maybeSingle(),
      supabase.from("competitions").select("id, name, event_date, result")
        .eq("user_id", user.id).gt("event_date", today).order("event_date").limit(20),
    ]);
    setComp(c as any);
    setUpcoming((u || []) as any);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <div className="relative z-10 max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/competitions")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
        </Button>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !comp ? (
          <div className="text-center text-sm text-muted-foreground py-10">{t("notFound")}</div>
        ) : (
          <PostCompetitionReflection
            competition={comp}
            upcomingCompetitions={upcoming}
            onClose={() => navigate("/competitions")}
          />
        )}
      </div>
      <AppFooter />
    </div>
  );
}
