import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Trophy, MapPin, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comp {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
  user_id: string;
  athlete_name: string;
  priority: string;
  result: string | null;
}

interface CompGroup {
  key: string;
  name: string;
  event_date: string;
  location: string | null;
  priority: string;
  participants: { user_id: string; athlete_name: string; result: string | null }[];
}

// fallback helper: t() returns the key string when no translation exists
function tx(value: string, fallback: string) {
  // if t returned the key literally, use fallback
  if (!value || value === fallback) return fallback;
  // heuristic: missing keys look like camelCase identifiers
  if (/^[a-z][a-zA-Z]+$/.test(value) && value.length > 6) return fallback;
  return value;
}

function priorityRank(p: string) {
  return p === "A" || p === "high" ? 3 : p === "B" || p === "medium" ? 2 : 1;
}

function groupComps(list: Comp[]): CompGroup[] {
  const map = new Map<string, CompGroup>();
  for (const c of list) {
    const key = `${c.name.trim().toLowerCase()}|${c.event_date}|${(c.location ?? "").trim().toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        name: c.name,
        event_date: c.event_date,
        location: c.location,
        priority: c.priority,
        participants: [{ user_id: c.user_id, athlete_name: c.athlete_name, result: c.result }],
      });
    } else {
      existing.participants.push({ user_id: c.user_id, athlete_name: c.athlete_name, result: c.result });
      if (priorityRank(c.priority) > priorityRank(existing.priority)) existing.priority = c.priority;
    }
  }
  return Array.from(map.values());
}

export default function CoachCompetitions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState<CompGroup | null>(null);

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
      setComps(((competitions ?? []) as any[]).map((c: any) => ({ ...c, athlete_name: nameMap.get(c.user_id) || "—" })));
      setLoading(false);
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const { upcoming, past } = useMemo(() => {
    const up = groupComps(comps.filter(c => c.event_date >= today)).sort((a, b) => a.event_date.localeCompare(b.event_date));
    const pa = groupComps(comps.filter(c => c.event_date < today)).sort((a, b) => b.event_date.localeCompare(a.event_date));
    return { upcoming: up, past: pa };
  }, [comps, today]);

  const labelUpcoming = tx(t("upcomingCompetitions") as string, "Kommende stævner");
  const labelPast = tx(t("pastCompetitions") as string, "Tidligere stævner");
  const labelCompetitions = tx(t("competitions") as string, "Stævner");
  const labelLoading = tx(t("loading") as string, "Indlæser…");
  const labelNone = tx(t("noCompetitions") as string, "Ingen stævner registreret endnu");
  const labelAthletes = tx(t("athletes") as string, "atleter");
  const labelParticipants = tx(t("participants") as string, "Deltagere");

  const renderCard = (g: CompGroup, isPast: boolean) => (
    <button
      key={g.key}
      onClick={() => setOpenGroup(g)}
      className="w-full text-left"
    >
      <Card className={cn(
        "p-3 transition hover:bg-accent/50 active:scale-[0.99]",
        !isPast && g.priority === "high" && "border-primary/40 bg-primary/5",
        isPast && "opacity-80"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{g.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                <Users className="h-3 w-3" />
                {g.participants.length} {labelAthletes}
              </Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(g.event_date + "T00:00:00").toLocaleDateString()}</span>
            </div>
            {g.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 justify-end">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{g.location}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")}><ArrowLeft className="h-4 w-4" /></Button>
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold">{labelCompetitions}</span>
        </div>
      </header>
      <main className="container max-w-4xl mx-auto px-3 py-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-12 text-sm">{labelLoading}</p>
        ) : comps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{labelNone}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{labelUpcoming}</h2>
                <div className="space-y-2">{upcoming.map(g => renderCard(g, false))}</div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{labelPast}</h2>
                <div className="space-y-2">{past.slice(0, 20).map(g => renderCard(g, true))}</div>
              </div>
            )}
          </>
        )}
      </main>

      <Sheet open={!!openGroup} onOpenChange={(o) => !o && setOpenGroup(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          {openGroup && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  {openGroup.name}
                </SheetTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(openGroup.event_date + "T00:00:00").toLocaleDateString()}</span>
                  {openGroup.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{openGroup.location}</span>}
                </div>
              </SheetHeader>
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {labelParticipants} ({openGroup.participants.length})
                </p>
                <div className="space-y-1.5">
                  {[...openGroup.participants]
                    .sort((a, b) => a.athlete_name.localeCompare(b.athlete_name))
                    .map((p) => (
                      <div key={p.user_id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium truncate">{p.athlete_name}</span>
                        {p.result && <Badge variant="outline" className="text-[10px]">{p.result}</Badge>}
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
