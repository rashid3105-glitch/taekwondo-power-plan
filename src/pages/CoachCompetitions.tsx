import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
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

function tx(value: string, fallback: string) {
  if (!value || value === fallback) return fallback;
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [comps, setComps] = useState<Comp[]>([]);
  const [myAthletes, setMyAthletes] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState<CompGroup | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: links } = await supabase.from("coach_athletes").select("athlete_id").eq("coach_id", user.id);
      const athleteIds = (links ?? []).map((l: any) => l.athlete_id);
      if (!athleteIds.length) { setLoading(false); return; }
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", athleteIds);
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.display_name]));
      setMyAthletes((profiles ?? []).map((p: any) => ({ user_id: p.user_id, display_name: p.display_name || "—" })));
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
  const labelRemove = tx(t("removeParticipant") as string, "Fjern");
  const labelAddSection = tx(t("addParticipant") as string, "Tilføj atlet");

  const getCompId = (group: CompGroup, userId: string): string | null => {
    const match = comps.find(c =>
      c.user_id === userId &&
      c.name.trim().toLowerCase() === group.name.trim().toLowerCase() &&
      c.event_date === group.event_date
    );
    return match?.id ?? null;
  };

  const addAthleteToComp = async (group: CompGroup, athleteId: string) => {
    setAddingId(athleteId);
    try {
      const { data, error } = await supabase.from("competitions").insert({
        user_id: athleteId,
        name: group.name,
        event_date: group.event_date,
        location: group.location,
        priority: group.priority,
        result: null,
      } as any).select("id").single();
      if (error) throw error;
      const athleteName = myAthletes.find(a => a.user_id === athleteId)?.display_name || "—";
      const newId = (data as any)?.id || crypto.randomUUID();
      setComps(prev => [...prev, { id: newId, name: group.name, event_date: group.event_date, location: group.location, user_id: athleteId, athlete_name: athleteName, priority: group.priority, result: null }]);
      setOpenGroup(prev => prev ? { ...prev, participants: [...prev.participants, { user_id: athleteId, athlete_name: athleteName, result: null }] } : prev);
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    } finally {
      setAddingId(null);
    }
  };

  const removeAthleteFromComp = async (group: CompGroup, userId: string) => {
    const compId = getCompId(group, userId);
    if (!compId) return;
    setRemovingId(userId);
    try {
      const { error } = await supabase.from("competitions").delete().eq("id", compId);
      if (error) throw error;
      setComps(prev => prev.filter(c => c.id !== compId));
      setOpenGroup(prev => prev ? { ...prev, participants: prev.participants.filter(p => p.user_id !== userId) } : prev);
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

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

  const notYetIn = openGroup
    ? myAthletes.filter(a => !new Set(openGroup.participants.map(p => p.user_id)).has(a.user_id))
    : [];

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
                        <div className="flex items-center gap-2 shrink-0">
                          {p.result && <Badge variant="outline" className="text-[10px]">{p.result}</Badge>}
                          <button
                            onClick={() => removeAthleteFromComp(openGroup, p.user_id)}
                            disabled={removingId === p.user_id}
                            className="text-xs text-destructive hover:text-destructive/80 px-2 py-0.5 rounded border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                          >
                            {removingId === p.user_id ? "…" : labelRemove}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {notYetIn.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {labelAddSection}
                    </p>
                    <div className="space-y-1.5">
                      {[...notYetIn].sort((a, b) => a.display_name.localeCompare(b.display_name)).map(a => (
                        <div key={a.user_id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-dashed border-border">
                          <span className="text-sm text-muted-foreground truncate">{a.display_name}</span>
                          <button
                            onClick={() => addAthleteToComp(openGroup, a.user_id)}
                            disabled={addingId === a.user_id}
                            className="text-xs text-primary hover:text-primary/80 px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50 shrink-0"
                          >
                            {addingId === a.user_id ? "…" : `+ ${labelAddSection}`}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
