import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comp {
  id: string; name: string; event_date: string; location: string | null;
  user_id: string; athlete_name: string; priority: string; result: string | null;
}

export default function CoachCompetitions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: links } = await supabase.from("coach_athletes").select("athlete_id").eq("coach_id", user.id);
      const athleteIds = (links ?? []).map((l: any) => l.athlete_id);
      if (!athleteIds.length) { setLoading(false); return; }
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", athleteIds);
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.display_name]));
      const { data: competitions } = await supabase.from("competitions").select("id, name, event_date, location, user_id, priority, result").in("user_id", athleteIds).order("event_date", { ascending: true });
      setComps(((competitions ?? []) as any[]).map((c: any) => ({ ...c, athlete_name: nameMap.get(c.user_id) || "Ukendt" })));
      setLoading(false);
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = comps.filter(c => c.event_date >= today);
  const past = comps.filter(c => c.event_date < today).reverse();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")}><ArrowLeft className="h-4 w-4" /></Button>
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold">{t("competitions") || "Stævner"}</span>
        </div>
      </header>
      <main className="container max-w-4xl mx-auto px-3 py-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-12 text-sm">{t("loading") || "Indlæser…"}</p>
        ) : comps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{t("noCompetitions") || "Ingen stævner registreret endnu"}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t("upcomingCompetitions") || "Kommende stævner"}</h2>
                <div className="space-y-2">
                  {upcoming.map(c => (
                    <Card key={c.id} className={cn("p-3", c.priority === "high" && "border-primary/40 bg-primary/5")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.athlete_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(c.event_date + "T00:00:00").toLocaleDateString()}</span>
                          </div>
                          {c.location && <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><MapPin className="h-3 w-3" /><span className="truncate max-w-[100px]">{c.location}</span></div>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t("pastCompetitions") || "Tidligere stævner"}</h2>
                <div className="space-y-2">
                  {past.slice(0, 10).map(c => (
                    <Card key={c.id} className="p-3 opacity-70">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.athlete_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{new Date(c.event_date + "T00:00:00").toLocaleDateString()}</p>
                          {c.result && <p className="text-xs font-semibold text-primary">{c.result}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
