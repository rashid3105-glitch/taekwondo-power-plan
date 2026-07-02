import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trophy, MapPin, Calendar, Users, Sparkles, CheckCircle2, Clock, Pencil, Trash2, X, Check, FileText, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { CoachBulkCreateCompetitionDialog } from "@/components/coach/CoachBulkCreateCompetitionDialog";

interface Comp {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
  user_id: string;
  athlete_name: string;
  priority: string;
  result: string | null;
  invitation_pdf_url: string | null;
}

interface CompGroup {
  key: string;
  name: string;
  event_date: string;
  location: string | null;
  priority: string;
  invitation_pdf_url: string | null;
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
        invitation_pdf_url: c.invitation_pdf_url,
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
  const { activeClubId } = useActiveClub();
  const [comps, setComps] = useState<Comp[]>([]);
  const [myAthletes, setMyAthletes] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState<CompGroup | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  // Per-athlete reflection status keyed by `${userId}|${compName}|${eventDate}`
  const [reflectionStatus, setReflectionStatus] = useState<Record<string, "submitted" | "requested">>({});
  const [requestingAll, setRequestingAll] = useState(false);
  const [requestingOne, setRequestingOne] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Scope to active club so atleter fra andre klubber ikke optræder.
      let athleteIds: string[] = [];
      const nameMap = new Map<string, string>();
      if (activeClubId) {
        const { data: members } = await supabase
          .rpc("get_club_member_profiles" as any, { _club_id: activeClubId });
        for (const m of ((members ?? []) as any[])) {
          if (m.is_coach) continue;
          if (m.user_id === user.id) continue;
          athleteIds.push(m.user_id);
          nameMap.set(m.user_id, m.display_name || "—");
        }
      } else {
        const { data: links } = await supabase.from("coach_athletes").select("athlete_id").eq("coach_id", user.id);
        athleteIds = (links ?? []).map((l: any) => l.athlete_id);
        if (athleteIds.length) {
          const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", athleteIds);
          (profiles ?? []).forEach((p: any) => nameMap.set(p.user_id, p.display_name || "—"));
        }
      }

      if (!athleteIds.length) { setMyAthletes([]); setComps([]); setLoading(false); return; }
      setMyAthletes(athleteIds.map((id) => ({ user_id: id, display_name: nameMap.get(id) || "—" })));
      const { data: competitions } = await supabase.from("competitions").select("id, name, event_date, location, user_id, priority, result, invitation_pdf_url").in("user_id", athleteIds).order("event_date", { ascending: true });
      const compsList = ((competitions ?? []) as any[]).map((c: any) => ({ ...c, athlete_name: nameMap.get(c.user_id) || "—" }));
      setComps(compsList);


      // Fetch reflection state (submitted + requested) for these athletes
      const compIds = compsList.map((c: any) => c.id);
      if (compIds.length) {
        const [{ data: refls }, { data: reqs }] = await Promise.all([
          supabase.from("competition_reflections")
            .select("user_id, competition_name, competition_date")
            .in("user_id", athleteIds),
          supabase.from("competition_reflection_requests")
            .select("athlete_id, competition_id")
            .in("competition_id", compIds),
        ]);
        const status: Record<string, "submitted" | "requested"> = {};
        const compById = new Map(compsList.map((c: any) => [c.id, c]));
        for (const r of (reqs ?? []) as any[]) {
          const c = compById.get(r.competition_id);
          if (!c) continue;
          status[`${r.athlete_id}|${c.name.trim().toLowerCase()}|${c.event_date}`] = "requested";
        }
        for (const r of (refls ?? []) as any[]) {
          const key = `${r.user_id}|${(r.competition_name || "").trim().toLowerCase()}|${r.competition_date}`;
          status[key] = "submitted";
        }
        setReflectionStatus(status);
      }
      setLoading(false);
    })();
  }, [activeClubId]);

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
  const labelReflectionSection = t("reflectionRequestSection") as string;
  const labelRequestAll = t("requestReflectionAll") as string;
  const labelRequestOne = t("requestReflectionOne") as string;
  const labelStatusSubmitted = t("reflectionStatusSubmitted") as string;
  const labelStatusRequested = t("reflectionStatusRequested") as string;
  const labelRequestSent = t("reflectionRequestSent") as string;
  const labelRequestNone = t("reflectionRequestNone") as string;
  const labelEdit = t("editCompetition") as string;
  const labelSave = t("saveChanges") as string;
  const labelCancel = t("cancel") as string;
  const labelDelete = t("deleteCompetition") as string;
  const labelDeleteHelper = t("deleteCompetitionHelper") as string;
  const labelDeleteConfirm = t("deleteCompetitionConfirm") as string;
  const labelUpdated = t("competitionUpdated") as string;
  const labelDeleted = t("competitionDeleted") as string;

  const startEdit = (g: CompGroup) => {
    setEditName(g.name);
    setEditDate(g.event_date);
    setEditLocation(g.location ?? "");
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!openGroup) return;
    const name = editName.trim();
    const date = editDate;
    const location = editLocation.trim() || null;
    if (!name || !date) return;
    setSaving(true);
    try {
      const ids = comps
        .filter(c =>
          c.name.trim().toLowerCase() === openGroup.name.trim().toLowerCase() &&
          c.event_date === openGroup.event_date &&
          (c.location ?? "").trim().toLowerCase() === (openGroup.location ?? "").trim().toLowerCase()
        )
        .map(c => c.id);
      if (!ids.length) throw new Error("No rows");
      const { error } = await supabase
        .from("competitions")
        .update({ name, event_date: date, location })
        .in("id", ids);
      if (error) throw error;
      setComps(prev => prev.map(c => ids.includes(c.id) ? { ...c, name, event_date: date, location } : c));
      setOpenGroup(prev => prev ? { ...prev, name, event_date: date, location } : prev);
      setEditMode(false);
      toast({ title: labelUpdated });
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteWholeCompetition = async () => {
    if (!openGroup) return;
    setDeleting(true);
    try {
      const ids = comps
        .filter(c =>
          c.name.trim().toLowerCase() === openGroup.name.trim().toLowerCase() &&
          c.event_date === openGroup.event_date &&
          (c.location ?? "").trim().toLowerCase() === (openGroup.location ?? "").trim().toLowerCase()
        )
        .map(c => c.id);
      if (ids.length) {
        // Best-effort: remove any reflection requests tied to these comp ids
        await supabase.from("competition_reflection_requests").delete().in("competition_id", ids);
        const { error } = await supabase.from("competitions").delete().in("id", ids);
        if (error) throw error;
      }
      setComps(prev => prev.filter(c => !ids.includes(c.id)));
      setConfirmDelete(false);
      setOpenGroup(null);
      toast({ title: labelDeleted });
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const reflectionKey = (userId: string, group: CompGroup) =>
    `${userId}|${group.name.trim().toLowerCase()}|${group.event_date}`;

  const requestReflection = async (group: CompGroup, athleteIds?: string[]) => {
    if (athleteIds && athleteIds.length === 1) setRequestingOne(athleteIds[0]);
    else setRequestingAll(true);
    try {
      // Use any participant's competition row id (server resolves all participants by name+date)
      const refCompId = getCompId(group, group.participants[0]?.user_id ?? "");
      if (!refCompId) throw new Error("No competition id");
      const { data, error } = await supabase.functions.invoke("request-competition-reflection", {
        body: { competition_id: refCompId, athlete_ids: athleteIds },
      });
      if (error) throw error;
      const requested = (data as any)?.requested ?? 0;
      if (requested === 0) {
        toast({ title: labelRequestNone });
      } else {
        toast({ title: labelRequestSent, description: `${requested} / ${(athleteIds ?? group.participants.map(p => p.user_id)).length}` });
        // Optimistically mark as requested
        const targetIds = athleteIds ?? group.participants.map(p => p.user_id);
        setReflectionStatus(prev => {
          const next = { ...prev };
          for (const id of targetIds) {
            const key = reflectionKey(id, group);
            if (next[key] !== "submitted") next[key] = "requested";
          }
          return next;
        });
      }
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    } finally {
      setRequestingOne(null);
      setRequestingAll(false);
    }
  };


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
        ...(activeClubId ? { club_id: activeClubId } : {}),
      } as any).select("id").single();
      if (error) throw error;
      const athleteName = myAthletes.find(a => a.user_id === athleteId)?.display_name || "—";
      const newId = (data as any)?.id || crypto.randomUUID();
      setComps(prev => [...prev, { id: newId, name: group.name, event_date: group.event_date, location: group.location, user_id: athleteId, athlete_name: athleteName, priority: group.priority, result: null, invitation_pdf_url: group.invitation_pdf_url }]);
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")} aria-label={t("back")} title={t("back")}><ArrowLeft className="h-4 w-4" /></Button>
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold flex-1">{labelCompetitions}</span>
          <CoachBulkCreateCompetitionDialog
            athletes={myAthletes.map((a) => ({ user_id: a.user_id, display_name: a.display_name }))}
            onCreated={async () => {
              // Re-fetch by re-triggering effect via bumping a state — simplest: call reload
              const evt = new Event("focus");
              window.dispatchEvent(evt);
            }}
          />
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

      <Sheet
        open={!!openGroup}
        onOpenChange={(o) => {
          if (!o) {
            setOpenGroup(null);
            setEditMode(false);
          }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          {openGroup && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-start justify-between gap-2">
                  <SheetTitle className="flex items-center gap-2 flex-1 min-w-0">
                    <Trophy className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{openGroup.name}</span>
                  </SheetTitle>
                  {!editMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => startEdit(openGroup)}
                      aria-label={labelEdit}
                      title={labelEdit}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!editMode ? (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(openGroup.event_date + "T00:00:00").toLocaleDateString()}</span>
                    {openGroup.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{openGroup.location}</span>}
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={labelCompetitions}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <Input
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Sted"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMode(false)}
                        disabled={saving}
                        className="gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        {labelCancel}
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={saving || !editName.trim() || !editDate}
                        className="gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {saving ? "…" : labelSave}
                      </Button>
                    </div>
                  </div>
                )}
              </SheetHeader>
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {labelParticipants} ({openGroup.participants.length})
                </p>
                <div className="space-y-1.5">
                  {[...openGroup.participants]
                    .sort((a, b) => a.athlete_name.localeCompare(b.athlete_name))
                    .map((p) => {
                      const isPastEvent = openGroup.event_date <= today;
                      const rStatus = reflectionStatus[reflectionKey(p.user_id, openGroup)];
                      return (
                        <div key={p.user_id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50">
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{p.athlete_name}</span>
                            {isPastEvent && rStatus === "submitted" && (
                              <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />{labelStatusSubmitted}
                              </Badge>
                            )}
                            {isPastEvent && rStatus === "requested" && (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <Clock className="h-3 w-3" />{labelStatusRequested}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.result && <Badge variant="outline" className="text-[10px]">{p.result}</Badge>}
                            {isPastEvent && rStatus !== "submitted" && (
                              <button
                                onClick={() => requestReflection(openGroup, [p.user_id])}
                                disabled={requestingOne === p.user_id || requestingAll}
                                className="text-xs text-primary hover:text-primary/80 px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                {requestingOne === p.user_id ? "…" : labelRequestOne}
                              </button>
                            )}
                            <button
                              onClick={() => removeAthleteFromComp(openGroup, p.user_id)}
                              disabled={removingId === p.user_id}
                              className="text-xs text-destructive hover:text-destructive/80 px-2 py-0.5 rounded border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            >
                              {removingId === p.user_id ? "…" : labelRemove}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {openGroup.event_date <= today && openGroup.participants.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {labelReflectionSection}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => requestReflection(openGroup)}
                      disabled={requestingAll}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {requestingAll ? "…" : labelRequestAll}
                    </Button>
                  </div>
                )}

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

                <div className="mt-6 p-3 rounded-lg border border-destructive/40 bg-destructive/5">
                  <p className="text-sm font-semibold text-destructive mb-1 flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    {labelDelete}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">{labelDeleteHelper}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {labelDelete}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labelDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {labelDeleteConfirm.replace("{count}", String(openGroup?.participants.length ?? 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{labelCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); deleteWholeCompetition(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "…" : labelDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
