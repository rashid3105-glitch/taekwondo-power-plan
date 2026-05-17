import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Printer, Trash2, CalendarRange, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ClubSeasonPlan,
  type ClubSeasonPhase,
  type ClubSeasonDayTemplate,
  type AthleteSeasonOverride,
  type SessionType,
  SESSION_TYPES,
  PHASE_PALETTE,
  PHASE_FOCUS_TAGS,
  addDays,
  dayOfWeekMon0,
  daysBetween,
  isoWeekNumber,
  isoWeekYear,
  isoWeekToSeasonWeek,
  seasonWeekToIso,
  phaseForWeek,
  resolveSessionForDate,
  seasonWeekNumber,
  sessionLabelKey,
  sessionRowClass,
} from "@/lib/seasonCalendar";

interface AthleteRow { user_id: string; display_name: string; }
interface CompetitionRow { id: string; name: string; event_date: string; user_id: string; }

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SeasonCalendar() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);

  const [plans, setPlans] = useState<ClubSeasonPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [phases, setPhases] = useState<ClubSeasonPhase[]>([]);
  const [template, setTemplate] = useState<ClubSeasonDayTemplate[]>([]);
  const [overrides, setOverrides] = useState<AthleteSeasonOverride[]>([]);
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionRow[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");

  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", start_date: "", end_date: "" });

  const [phaseForm, setPhaseForm] = useState({
    name: "", focus_label: "", color: PHASE_PALETTE[0].value,
    start_iso_week: 1, end_iso_week: 4,
    focus_tags: [] as string[],
  });

  const [overrideForm, setOverrideForm] = useState({ date: "", session_type: "rest" as SessionType, notes: "" });

  const [visibleAthleteIds, setVisibleAthleteIds] = useState<Set<string>>(new Set());
  const [savingVisibility, setSavingVisibility] = useState(false);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);

      // Coach role check
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const isCoach = (roles ?? []).some((r: any) => r.role === "coach");
      if (!isCoach) { navigate("/dashboard"); return; }

      const { data: profile } = await supabase.from("profiles").select("club_id").eq("user_id", user.id).single();
      const cid = (profile as any)?.club_id ?? null;
      setClubId(cid);
      if (!cid) { setLoading(false); return; }

      // Load all plans for this club
      const { data: planRows } = await (supabase.from as any)("club_season_plans")
        .select("*").eq("club_id", cid).order("created_at", { ascending: false });
      const pl = (planRows ?? []) as ClubSeasonPlan[];
      setPlans(pl);
      const active = pl.find((p) => p.is_active) ?? pl[0] ?? null;
      setSelectedPlanId(active?.id ?? null);

      // Athletes (club members other than self)
      const { data: aRows } = await supabase
        .from("profiles").select("user_id, display_name")
        .eq("club_id", cid).neq("user_id", user.id);
      setAthletes(((aRows ?? []) as any[]).map((r) => ({ user_id: r.user_id, display_name: r.display_name || "Athlete" })));

      setLoading(false);
    })();
  }, [navigate]);

  // Load phases / template / overrides / competitions whenever plan changes
  useEffect(() => {
    if (!selectedPlanId) {
      setPhases([]); setTemplate([]); setOverrides([]); setCompetitions([]); setVisibleAthleteIds(new Set());
      return;
    }
    (async () => {
      const [phRes, tplRes, visRes] = await Promise.all([
        (supabase.from as any)("club_season_phases").select("*").eq("season_plan_id", selectedPlanId).order("start_week"),
        (supabase.from as any)("club_season_day_templates").select("*").eq("season_plan_id", selectedPlanId).order("day_of_week"),
        (supabase.from as any)("club_season_plan_visibility").select("athlete_id").eq("season_plan_id", selectedPlanId),
      ]);
      setPhases((phRes.data ?? []) as ClubSeasonPhase[]);
      setTemplate((tplRes.data ?? []) as ClubSeasonDayTemplate[]);
      setVisibleAthleteIds(new Set(((visRes.data ?? []) as any[]).map((r) => r.athlete_id)));

      // Competitions of all club athletes within plan range
      const plan = plans.find((p) => p.id === selectedPlanId);
      if (plan) {
        const athleteIds = athletes.map((a) => a.user_id);
        if (athleteIds.length > 0) {
          const { data: comps } = await supabase
            .from("competitions").select("id,name,event_date,user_id")
            .in("user_id", athleteIds)
            .gte("event_date", plan.start_date).lte("event_date", plan.end_date);
          setCompetitions((comps ?? []) as CompetitionRow[]);
        }
      }
    })();
  }, [selectedPlanId, plans, athletes]);

  async function saveVisibility() {
    if (!selectedPlanId) return;
    setSavingVisibility(true);
    await (supabase.from as any)("club_season_plan_visibility").delete().eq("season_plan_id", selectedPlanId);
    const rows = Array.from(visibleAthleteIds).map((athlete_id) => ({
      season_plan_id: selectedPlanId, athlete_id,
    }));
    if (rows.length > 0) {
      await (supabase.from as any)("club_season_plan_visibility").insert(rows);
    }
    setSavingVisibility(false);
    toast({ title: t("seasonVisibilitySaved") });
  }

  // Load overrides when athlete or plan changes
  useEffect(() => {
    if (!selectedPlanId || !selectedAthleteId) { setOverrides([]); return; }
    (async () => {
      const { data } = await (supabase.from as any)("club_athlete_season_overrides")
        .select("*").eq("season_plan_id", selectedPlanId).eq("athlete_id", selectedAthleteId);
      setOverrides((data ?? []) as AthleteSeasonOverride[]);
    })();
  }, [selectedPlanId, selectedAthleteId]);

  async function createPlan() {
    if (!clubId || !userId) return;
    if (!newPlan.name || !newPlan.start_date || !newPlan.end_date) {
      toast({ title: t("seasonNewPlan"), description: "Fill all fields", variant: "destructive" });
      return;
    }
    // Deactivate older active plans
    await (supabase.from as any)("club_season_plans")
      .update({ is_active: false }).eq("club_id", clubId).eq("is_active", true);
    const { data, error } = await (supabase.from as any)("club_season_plans")
      .insert({ ...newPlan, club_id: clubId, created_by: userId, is_active: true })
      .select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Seed empty 7-day template
    const tplRows = Array.from({ length: 7 }, (_, i) => ({
      season_plan_id: data.id, day_of_week: i, session_type: "rest" as SessionType,
    }));
    await (supabase.from as any)("club_season_day_templates").insert(tplRows);

    setPlans((prev) => [data as ClubSeasonPlan, ...prev]);
    setSelectedPlanId(data.id);
    setNewPlanOpen(false);
    setNewPlan({ name: "", start_date: "", end_date: "" });
    toast({ title: t("seasonNewPlan"), description: data.name });
  }

  async function deletePlan() {
    if (!selectedPlan) return;
    if (!window.confirm(`${t("seasonDeletePlanConfirm") || "Delete this season plan? This cannot be undone."}\n\n${selectedPlan.name}`)) return;
    const id = selectedPlan.id;
    await (supabase.from as any)("club_athlete_season_overrides").delete().eq("season_plan_id", id);
    await (supabase.from as any)("club_season_day_templates").delete().eq("season_plan_id", id);
    await (supabase.from as any)("club_season_phases").delete().eq("season_plan_id", id);
    const { error } = await (supabase.from as any)("club_season_plans").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const remaining = plans.filter((p) => p.id !== id);
    setPlans(remaining);
    setSelectedPlanId(remaining[0]?.id ?? null);
    toast({ title: t("seasonPlanDeleted") || "Season plan deleted" });
  }

  async function addPhase() {
    if (!selectedPlanId || !phaseForm.name) return;
    const { data, error } = await (supabase.from as any)("club_season_phases")
      .insert({ ...phaseForm, season_plan_id: selectedPlanId, sort_order: phases.length })
      .select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setPhases((prev) => [...prev, data as ClubSeasonPhase].sort((a, b) => a.start_week - b.start_week));
    setPhaseForm({ name: "", focus_label: "", color: PHASE_PALETTE[0].value, start_week: 1, end_week: 4 });
  }

  async function deletePhase(id: string) {
    await (supabase.from as any)("club_season_phases").delete().eq("id", id);
    setPhases((prev) => prev.filter((p) => p.id !== id));
  }

  async function updateTemplate(day: number, patch: Partial<ClubSeasonDayTemplate>) {
    const row = template.find((t) => t.day_of_week === day);
    if (!row) return;
    const updated = { ...row, ...patch };
    setTemplate((prev) => prev.map((t) => (t.day_of_week === day ? updated : t)));
    await (supabase.from as any)("club_season_day_templates")
      .update({ session_type: updated.session_type, location: updated.location ?? null })
      .eq("id", row.id);
  }

  async function addOverride() {
    if (!selectedPlanId || !selectedAthleteId || !overrideForm.date) return;
    const { data, error } = await (supabase.from as any)("club_athlete_season_overrides")
      .upsert({
        season_plan_id: selectedPlanId,
        athlete_id: selectedAthleteId,
        override_date: overrideForm.date,
        session_type: overrideForm.session_type,
        notes: overrideForm.notes || null,
      }, { onConflict: "season_plan_id,athlete_id,override_date" })
      .select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setOverrides((prev) => [...prev.filter((o) => o.override_date !== overrideForm.date), data as AthleteSeasonOverride]);
    setOverrideForm({ date: "", session_type: "rest", notes: "" });
  }

  async function deleteOverride(id: string) {
    await (supabase.from as any)("club_athlete_season_overrides").delete().eq("id", id);
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  }

  // Build the row list for the main calendar
  const calendarRows = useMemo(() => {
    if (!selectedPlan) return [];
    const compSet = new Set(
      selectedAthleteId
        ? competitions.filter((c) => c.user_id === selectedAthleteId).map((c) => c.event_date)
        : competitions.map((c) => c.event_date),
    );
    const rows: { iso: string; weekNum: number; phase: ClubSeasonPhase | null; type: SessionType; isComp: boolean; fromOverride: boolean; location: string | null }[] = [];
    const total = daysBetween(selectedPlan.start_date, selectedPlan.end_date);
    for (let i = 0; i <= total; i++) {
      const iso = addDays(selectedPlan.start_date, i);
      const wk = seasonWeekNumber(selectedPlan.start_date, iso);
      const ph = phaseForWeek(phases, wk);
      const r = resolveSessionForDate(iso, template, overrides, compSet);
      rows.push({ iso, weekNum: wk, phase: ph, type: r.type, isComp: r.isCompetition, fromOverride: r.fromOverride, location: r.location });
    }
    return rows;
  }, [selectedPlan, phases, template, overrides, competitions, selectedAthleteId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 pt-safe print:hidden">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/coach")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CalendarRange className="h-5 w-5 text-primary" />
            <span className="font-extrabold">{t("seasonCalendar")}</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedPlan && (
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" /> {t("seasonPrint")}
              </Button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4 print:hidden">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{t("seasonPlan")}</h2>
              <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />{t("seasonNewPlan")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t("seasonNewPlan")}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>{t("seasonPlan")}</Label><Input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} /></div>
                    <div><Label>{t("seasonStartDate")}</Label><Input type="date" value={newPlan.start_date} onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })} /></div>
                    <div><Label>{t("seasonEndDate")}</Label><Input type="date" value={newPlan.end_date} onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={createPlan}>{t("seasonNewPlan")}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {plans.length > 0 ? (
              <div className="flex items-center gap-2">
                <Select value={selectedPlanId ?? ""} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.is_active ? " ●" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlan && (
                  <Button size="icon" variant="ghost" onClick={deletePlan} className="h-9 w-9 text-destructive hover:text-destructive shrink-0" title={t("seasonDeletePlan") || "Delete plan"}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
          </Card>

          {selectedPlan && (
            <>
              <Card className="p-4 space-y-3">
                <h2 className="font-semibold text-sm">{t("seasonPhase")}</h2>
                <div className="space-y-2">
                  {phases.map((p) => {
                    const isoStart = isoWeekNumber(addDays(selectedPlan!.start_date, (p.start_week - 1) * 7));
                    const isoEnd = isoWeekNumber(addDays(selectedPlan!.start_date, (p.end_week - 1) * 7));
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-3 w-3 rounded shrink-0" style={{ backgroundColor: p.color }} />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{p.name}</div>
                            <div className="text-muted-foreground">Uge {isoStart}–{isoEnd}</div>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deletePhase(p.id)} className="h-7 w-7">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2 border-t border-border pt-3">
                  <Input placeholder={t("seasonPhase")} value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} />
                  <Input placeholder={t("seasonPhaseFocus")} value={phaseForm.focus_label} onChange={(e) => setPhaseForm({ ...phaseForm, focus_label: e.target.value })} />
                  <div className="flex gap-1">
                    {PHASE_PALETTE.map((c) => (
                      <button key={c.value} type="button"
                        className={cn("h-6 w-6 rounded border-2", phaseForm.color === c.value ? "border-foreground" : "border-transparent")}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setPhaseForm({ ...phaseForm, color: c.value })}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" min={1} value={phaseForm.start_week} onChange={(e) => setPhaseForm({ ...phaseForm, start_week: parseInt(e.target.value) || 1 })} />
                    <Input type="number" min={1} value={phaseForm.end_week} onChange={(e) => setPhaseForm({ ...phaseForm, end_week: parseInt(e.target.value) || 1 })} />
                  </div>
                  <Button size="sm" className="w-full" onClick={addPhase}><Plus className="h-3 w-3 mr-1" />{t("seasonPhaseAdd")}</Button>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h2 className="font-semibold text-sm">{t("seasonAthleteOverride")}</h2>
                <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {athletes.map((a) => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedAthleteId && (
                  <>
                    <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                      {overrides.map((o) => (
                        <div key={o.id} className="flex items-center justify-between gap-2">
                          <span>{o.override_date} · <Badge variant="outline">{t(sessionLabelKey(o.session_type) as any)}</Badge></span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteOverride(o.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 border-t border-border pt-2">
                      <Input type="date" value={overrideForm.date} onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })} />
                      <Select value={overrideForm.session_type} onValueChange={(v) => setOverrideForm({ ...overrideForm, session_type: v as SessionType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SESSION_TYPES.map((s) => <SelectItem key={s} value={s}>{t(sessionLabelKey(s) as any)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="w-full" onClick={addOverride}><Plus className="h-3 w-3 mr-1" />{t("seasonPhaseAdd")}</Button>
                    </div>
                  </>
                )}
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("seasonVisibility")}</h2>
                </div>
                <p className="text-xs text-muted-foreground">{t("seasonVisibilityDesc")}</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {athletes.map((a) => (
                    <label key={a.user_id} className="flex items-center justify-between gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                          {a.display_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm">{a.display_name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={visibleAthleteIds.has(a.user_id)}
                        onChange={(e) => {
                          setVisibleAthleteIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(a.user_id);
                            else next.delete(a.user_id);
                            return next;
                          });
                        }}
                        className="h-4 w-4"
                      />
                    </label>
                  ))}
                  {athletes.length === 0 && (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                </div>
                <Button size="sm" className="w-full" onClick={saveVisibility} disabled={savingVisibility}>
                  {savingVisibility ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {t("seasonVisibilitySave")}
                </Button>
              </Card>
            </>
          )}
        </aside>

        {/* Main */}
        <section className="space-y-4">
          {!selectedPlan ? (
            <Card className="p-12 text-center text-muted-foreground">
              <CalendarRange className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("seasonNewPlan")}</p>
            </Card>
          ) : (
            <>
              <div className="print:block hidden text-center mb-4">
                <h1 className="text-2xl font-bold">{selectedPlan.name}</h1>
                <p className="text-sm">{selectedPlan.start_date} → {selectedPlan.end_date}</p>
              </div>

              <Card className="overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr>
                        <th className="text-left p-2">{t("seasonWeek")}</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Day</th>
                        <th className="text-left p-2">{t("seasonPhase")}</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarRows.map((r, idx) => {
                        const prevPhase = idx > 0 ? calendarRows[idx - 1].phase : null;
                        const phaseChanged = r.phase?.id !== prevPhase?.id;
                        return (
                          <>
                            {phaseChanged && r.phase && (
                              <tr key={`ph-${r.iso}`} className="border-y" style={{ background: `${r.phase.color}15` }}>
                                <td colSpan={6} className="p-2 font-bold uppercase text-xs" style={{ color: r.phase.color }}>
                                  {r.phase.name}{r.phase.focus_label ? ` — ${r.phase.focus_label}` : ""}
                                </td>
                              </tr>
                            )}
                            <tr key={r.iso} className={cn("border-b border-border/40", sessionRowClass(r.type))}
                                style={r.phase ? { borderLeft: `4px solid ${r.phase.color}` } : undefined}>
                              <td className="p-2 font-mono">{isoWeekNumber(r.iso)}</td>
                              <td className="p-2 font-mono">{r.iso}</td>
                              <td className="p-2">{DAY_KEYS[dayOfWeekMon0(r.iso)]}</td>
                              <td className="p-2 text-muted-foreground truncate max-w-32">{r.phase?.name ?? ""}</td>
                              <td className="p-2 font-semibold">
                                {t(sessionLabelKey(r.type) as any)}
                                {r.fromOverride && <Badge variant="outline" className="ml-1 text-[9px]">★</Badge>}
                              </td>
                              <td className="p-2 text-muted-foreground">{r.location ?? ""}</td>
                            </tr>
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Weekly template editor */}
              <Card className="p-4 space-y-3 print:hidden">
                <h2 className="font-semibold text-sm">Weekly template</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {Array.from({ length: 7 }, (_, d) => {
                    const row = template.find((t) => t.day_of_week === d);
                    return (
                      <div key={d} className="border border-border rounded p-2 space-y-2">
                        <div className="text-xs font-bold uppercase">{DAY_KEYS[d]}</div>
                        <Select value={row?.session_type ?? "rest"} onValueChange={(v) => updateTemplate(d, { session_type: v as SessionType })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SESSION_TYPES.map((s) => <SelectItem key={s} value={s}>{t(sessionLabelKey(s) as any)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          className="h-8 text-xs" placeholder="Location"
                          defaultValue={row?.location ?? ""}
                          onBlur={(e) => updateTemplate(d, { location: e.target.value })}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </section>
      </main>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background: white !important; }
          aside, header, footer, nav, .print\\:hidden { display: none !important; }
          main { display: block !important; max-width: none !important; padding: 0 !important; }
          table { font-size: 10px !important; }
        }
      `}</style>
    </div>
  );
}
