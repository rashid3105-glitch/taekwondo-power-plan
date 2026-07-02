import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Printer, Trash2, CalendarRange, Eye, ChevronLeft, ChevronRight, ChevronDown, Target, Sparkles, Info } from "lucide-react";
import { GENERIC_DEFAULT_SCHEDULE } from "@/components/coach/TeamWeeklyScheduleCard";
import type { DaySchedule } from "@/components/WeekSchedulePicker";
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
const MONTH_NAMES = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];
const DAY_LABELS = ["Ma","Ti","On","To","Fr","Lø","Sø"];

export default function SeasonCalendar() {
  const navigate = useNavigate();
  const { activeClubId } = useActiveClub();
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
    start_date: "",
    end_date: "",
    focus_tags: [] as string[],
  });
  const [customTagInput, setCustomTagInput] = useState("");

  // Per-club tag catalog overrides (rename + hide). Stored locally.
  // Old phases keep their raw `focus_tags` values; this only affects rendering + which chips appear.
  type TagCatalog = { labels: Record<string, string>; hidden: string[] };
  const [tagCatalog, setTagCatalog] = useState<TagCatalog>({ labels: {}, hidden: [] });
  const [tagEditorOpen, setTagEditorOpen] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    try {
      const raw = localStorage.getItem(`season-tag-catalog:${clubId}`);
      if (raw) setTagCatalog(JSON.parse(raw));
      else setTagCatalog({ labels: {}, hidden: [] });
    } catch { /* ignore */ }
  }, [clubId]);

  function persistCatalog(next: TagCatalog) {
    setTagCatalog(next);
    if (clubId) {
      try { localStorage.setItem(`season-tag-catalog:${clubId}`, JSON.stringify(next)); } catch { /* ignore */ }
    }
  }

  function tagLabel(value: string): string {
    if (tagCatalog.labels[value]) return tagCatalog.labels[value];
    const preset = PHASE_FOCUS_TAGS.find((m) => m.value === value);
    return preset ? t(preset.labelKey as any) : value;
  }

  const [overrideForm, setOverrideForm] = useState({ date: "", session_type: "rest" as SessionType, notes: "" });

  const [visibleAthleteIds, setVisibleAthleteIds] = useState<Set<string>>(new Set());
  const [savingVisibility, setSavingVisibility] = useState(false);

  // Technique library + week focus state
  const [techniques, setTechniques] = useState<{ id: string; name: string; category: string; discipline: string }[]>([]);
  const [newTechName, setNewTechName] = useState("");
  const [newTechCategory, setNewTechCategory] = useState("attack");
  const [newTechDiscipline, setNewTechDiscipline] = useState("both");
  const [showTechForm, setShowTechForm] = useState(false);
  const [weekFocusMap, setWeekFocusMap] = useState<Map<number, { id?: string; technique_ids: string[]; coach_note: string }>>(new Map());
  const [athleteFocusMap, setAthleteFocusMap] = useState<Map<string, string[]>>(new Map());

  // Monthly calendar view state
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  const compDateSet = useMemo(() => new Set(
    selectedAthleteId
      ? competitions.filter((c) => c.user_id === selectedAthleteId).map((c) => c.event_date)
      : competitions.map((c) => c.event_date),
  ), [competitions, selectedAthleteId]);

  const calendarDays = useMemo(() => {
    const days: (string | null)[] = [];
    const d = new Date(viewYear, viewMonth, 1);
    const firstDow = ((d.getDay() + 6) % 7);
    for (let i = 0; i < firstDow; i++) days.push(null);
    const toLocalIso = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    while (d.getMonth() === viewMonth) {
      days.push(toLocalIso(d));
      d.setDate(d.getDate() + 1);
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewYear, viewMonth]);

  // Default phase form ISO weeks to plan's first ISO week when plan changes.
  useEffect(() => {
    if (!selectedPlan) return;
    setPhaseForm((prev) => ({
      ...prev,
      start_date: selectedPlan.start_date,
      end_date: addDays(selectedPlan.start_date, 27),
    }));
  }, [selectedPlan?.id]);

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
      const cid = activeClubId ?? ((profile as any)?.club_id ?? null);
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
  }, [navigate, activeClubId]);

  // Build the per-day session template from the club's standard weekly schedule
  // (managed on /coach via TeamWeeklyScheduleCard). One row per session per day_of_week.
  useEffect(() => {
    if (!clubId) { setTemplate([]); return; }
    (async () => {
      const { data } = await (supabase.from as any)("clubs")
        .select("default_weekly_schedule").eq("id", clubId).maybeSingle();
      const schedule: DaySchedule[] =
        ((data as any)?.default_weekly_schedule as DaySchedule[] | null) ?? GENERIC_DEFAULT_SCHEDULE;
      const DOW: Record<string, number> = {
        Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
      };
      const rows: ClubSeasonDayTemplate[] = [];
      for (let dow = 0; dow < 7; dow++) {
        const entry = schedule.find((s) => DOW[s.day] === dow);
        const sessions = entry?.sessions && entry.sessions.length > 0
          ? entry.sessions
          : [{ type: (entry?.type ?? "rest") as SessionType }];
        sessions.forEach((sess, i) => {
          rows.push({
            id: `club-${dow}-${i}`,
            season_plan_id: "",
            day_of_week: dow,
            session_type: sess.type as SessionType,
            location: null,
            notes: null,
          });
        });
      }
      setTemplate(rows);
    })();
  }, [clubId]);

  // Load phases / template / overrides / competitions whenever plan changes
  useEffect(() => {
    if (!selectedPlanId) {
      setPhases([]); setOverrides([]); setCompetitions([]); setVisibleAthleteIds(new Set());
      setWeekFocusMap(new Map()); setAthleteFocusMap(new Map());
      return;
    }
    (async () => {
      const [phRes, visRes, focusRes, athFocusRes] = await Promise.all([
        (supabase.from as any)("club_season_phases").select("*").eq("season_plan_id", selectedPlanId).order("start_week"),
        (supabase.from as any)("club_season_plan_visibility").select("athlete_id").eq("season_plan_id", selectedPlanId),
        (supabase.from as any)("club_week_technique_focus").select("id, season_week, technique_ids, coach_note").eq("season_plan_id", selectedPlanId),
        (supabase.from as any)("athlete_week_technique_focus").select("athlete_id, season_week, technique_ids").eq("season_plan_id", selectedPlanId),
      ]);
      setPhases((phRes.data ?? []) as ClubSeasonPhase[]);
      setVisibleAthleteIds(new Set(((visRes.data ?? []) as any[]).map((r) => r.athlete_id)));

      const fm = new Map<number, { id?: string; technique_ids: string[]; coach_note: string }>();
      for (const row of (focusRes.data ?? []) as any[]) {
        fm.set(row.season_week, { id: row.id, technique_ids: row.technique_ids ?? [], coach_note: row.coach_note ?? "" });
      }
      setWeekFocusMap(fm);

      const afm = new Map<string, string[]>();
      for (const row of (athFocusRes.data ?? []) as any[]) {
        afm.set(`${row.season_week}:${row.athlete_id}`, row.technique_ids ?? []);
      }
      setAthleteFocusMap(afm);

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

  // Load techniques whenever club changes
  useEffect(() => {
    if (!clubId) { setTechniques([]); return; }
    (async () => {
      const { data } = await (supabase.from as any)("club_techniques")
        .select("id, name, category, discipline").eq("club_id", clubId).order("category").order("name");
      setTechniques((data ?? []) as any[]);
    })();
  }, [clubId]);

  async function addTechnique() {
    if (!clubId || !newTechName.trim()) return;
    const { data, error } = await (supabase.from as any)("club_techniques").insert({
      club_id: clubId, name: newTechName.trim(), category: newTechCategory,
      discipline: newTechDiscipline, created_by: userId,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTechniques((prev) => [...prev, data as any].sort((a, b) => a.name.localeCompare(b.name)));
    setNewTechName("");
    setShowTechForm(false);
  }

  async function deleteTechnique(id: string) {
    await (supabase.from as any)("club_techniques").delete().eq("id", id);
    setTechniques((prev) => prev.filter((tt) => tt.id !== id));
  }

  async function saveWeekFocus(seasonWeek: number) {
    if (!selectedPlanId || !userId) return;
    const current = weekFocusMap.get(seasonWeek) ?? { technique_ids: [], coach_note: "" };
    const { data } = await (supabase.from as any)("club_week_technique_focus").upsert({
      ...(current.id ? { id: current.id } : {}),
      season_plan_id: selectedPlanId,
      season_week: seasonWeek,
      technique_ids: current.technique_ids,
      coach_note: current.coach_note,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "season_plan_id,season_week" }).select().single();
    if (data) {
      setWeekFocusMap((prev) => new Map(prev).set(seasonWeek, { id: data.id, technique_ids: data.technique_ids ?? [], coach_note: data.coach_note ?? "" }));
    }
    toast({ title: t("seasonTechFocusSaved") || "Teknikfokus gemt" });
  }

  async function copyWeekFocusTo(sourceWeek: number, targetWeeks: number[]) {
    if (!selectedPlanId || !userId || targetWeeks.length === 0) return;
    const src = weekFocusMap.get(sourceWeek);
    if (!src) return;
    const rows = targetWeeks.map((w) => ({
      season_plan_id: selectedPlanId,
      season_week: w,
      technique_ids: src.technique_ids,
      coach_note: src.coach_note,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }));
    const { data, error } = await (supabase.from as any)("club_week_technique_focus")
      .upsert(rows, { onConflict: "season_plan_id,season_week" })
      .select();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setWeekFocusMap((prev) => {
      const next = new Map(prev);
      for (const row of (data ?? []) as any[]) {
        next.set(row.season_week, {
          id: row.id,
          technique_ids: row.technique_ids ?? [],
          coach_note: row.coach_note ?? "",
        });
      }
      return next;
    });
    setCopyOpen(false);
    setCopyTargets([]);
    toast({ title: (t("seasonTechFocusCopied") || "Fokus kopieret") + ` (${targetWeeks.length})` });
  }

  async function saveAthleteFocus(seasonWeek: number, athleteId: string, techIds: string[]) {
    if (!selectedPlanId || !userId) return;
    await (supabase.from as any)("athlete_week_technique_focus").upsert({
      season_plan_id: selectedPlanId,
      athlete_id: athleteId,
      season_week: seasonWeek,
      technique_ids: techIds,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "season_plan_id,athlete_id,season_week" });
    setAthleteFocusMap((prev) => {
      const next = new Map(prev);
      next.set(`${seasonWeek}:${athleteId}`, techIds);
      return next;
    });
  }

  function getAiHint(seasonWeek: number): { text: string; variant: 'pre' | 'comp' | 'recovery' | 'base' } | null {
    if (!selectedPlan || competitions.length === 0) return null;
    const weekStartIso = addDays(selectedPlan.start_date, (seasonWeek - 1) * 7);
    const weekEndIso = addDays(weekStartIso, 6);
    const inWeekComps = competitions.filter((c) => c.event_date >= weekStartIso && c.event_date <= weekEndIso);
    if (inWeekComps.length > 0) return { text: t("seasonAiHintCompWeek") || "Stævneuge: Let polering + mentalt fokus. Ingen ny teknik.", variant: 'comp' };
    const recentComp = competitions.filter((c) => c.event_date < weekStartIso).sort((a, b) => b.event_date.localeCompare(a.event_date))[0];
    if (recentComp) {
      const daysSince = Math.round((new Date(weekStartIso).getTime() - new Date(recentComp.event_date).getTime()) / 86400000);
      if (daysSince <= 14) return { text: t("seasonAiHintRecovery") || "Efter stævne: Teknisk gennemgang + korrektioner.", variant: 'recovery' };
    }
    const upcoming = competitions.filter((c) => c.event_date >= weekStartIso).sort((a, b) => a.event_date.localeCompare(b.event_date))[0];
    if (!upcoming) return { text: t("seasonAiHintBase") || "Teknisk grundtræning og konditionel base.", variant: 'base' };
    const daysTo = Math.round((new Date(upcoming.event_date).getTime() - new Date(weekStartIso).getTime()) / 86400000);
    if (daysTo <= 21) return { text: `${t("seasonAiHintPreComp") || "Specifik stævneteknik + reaktionstræning"} — ${daysTo} ${t("days") || "dage"} ${t("toCompetition") || "til stævne"}`, variant: 'pre' };
    return { text: t("seasonAiHintBase") || "Teknisk grundtræning og konditionel base.", variant: 'base' };
  }
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
    await (supabase.from as any)("club_season_phases").delete().eq("season_plan_id", id);
    const { error } = await (supabase.from as any)("club_season_plans").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const remaining = plans.filter((p) => p.id !== id);
    setPlans(remaining);
    setSelectedPlanId(remaining[0]?.id ?? null);
    toast({ title: t("seasonPlanDeleted") || "Season plan deleted" });
  }

  async function addPhase() {
    if (!selectedPlanId || !selectedPlan || !phaseForm.name) return;
    if (!phaseForm.start_date || !phaseForm.end_date) {
      toast({ title: t("seasonPhase"), description: "Vælg start- og slutdato", variant: "destructive" });
      return;
    }
    if (phaseForm.start_date < selectedPlan.start_date || phaseForm.end_date > selectedPlan.end_date) {
      toast({
        title: t("seasonPhase"),
        description: `Datoerne skal ligge inden for sæsonen (${selectedPlan.start_date} – ${selectedPlan.end_date})`,
        variant: "destructive",
      });
      return;
    }
    if (phaseForm.end_date < phaseForm.start_date) {
      toast({ title: t("seasonPhase"), description: "Slutdato skal være efter startdato", variant: "destructive" });
      return;
    }
    const startSeasonWeek = seasonWeekNumber(selectedPlan.start_date, phaseForm.start_date);
    const endSeasonWeek = seasonWeekNumber(selectedPlan.start_date, phaseForm.end_date);

    const { data, error } = await (supabase.from as any)("club_season_phases")
      .insert({
        season_plan_id: selectedPlanId,
        name: phaseForm.name,
        focus_label: phaseForm.focus_label || null,
        color: phaseForm.color,
        start_week: startSeasonWeek,
        end_week: endSeasonWeek,
        focus_tags: phaseForm.focus_tags,
        sort_order: phases.length,
      })
      .select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setPhases((prev) => [...prev, data as ClubSeasonPhase].sort((a, b) => a.start_week - b.start_week));
    setPhaseForm((prev) => ({
      ...prev,
      name: "",
      focus_label: "",
      color: PHASE_PALETTE[0].value,
      focus_tags: [],
      start_date: selectedPlan.start_date,
      end_date: addDays(selectedPlan.start_date, 27),
    }));
  }

  async function deletePhase(id: string) {
    await (supabase.from as any)("club_season_phases").delete().eq("id", id);
    setPhases((prev) => prev.filter((p) => p.id !== id));
  }

  async function removePhaseTag(phaseId: string, tag: string) {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const next = (phase.focus_tags ?? []).filter((x) => x !== tag);
    setPhases((prev) => prev.map((p) => (p.id === phaseId ? { ...p, focus_tags: next } : p)));
    await (supabase.from as any)("club_season_phases").update({ focus_tags: next }).eq("id", phaseId);
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

  // (legacy calendarRows removed — monthly grid is rendered directly)

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 pt-safe print:hidden">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0" aria-label={t("back")} title={t("back")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CalendarRange className="h-5 w-5 text-primary shrink-0" />
            <span className="font-extrabold truncate">{t("seasonCalendar")}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            {selectedPlan && (
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">{t("seasonPrint")}</span>
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
                  <Button size="icon" variant="ghost" onClick={deletePlan} className="h-9 w-9 text-destructive hover:text-destructive shrink-0" title={t("seasonDeletePlan") || "Delete plan"} aria-label={t("delete")}>
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
                      <div key={p.id} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="h-3 w-3 rounded shrink-0 mt-0.5" style={{ backgroundColor: p.color }} />
                          <div className="min-w-0 space-y-1">
                            <div className="font-semibold truncate">{p.name}</div>
                            <div className="text-muted-foreground">Uge {isoStart}–{isoEnd}</div>
                            {(p.focus_tags ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {(p.focus_tags ?? []).map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => removePhaseTag(p.id, tag)}
                                    title={t("remove") || "Remove"}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border inline-flex items-center gap-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors"
                                  >
                                    {tagLabel(tag)}
                                    <span className="opacity-60">×</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deletePhase(p.id)} className="h-7 w-7 shrink-0" aria-label={t("delete")} title={t("delete")}>
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
                  <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Fra dato</Label>
                        <Input
                          type="date"
                          value={phaseForm.start_date}
                          min={selectedPlan.start_date}
                          max={selectedPlan.end_date}
                          onChange={(e) => setPhaseForm({ ...phaseForm, start_date: e.target.value })}
                        />
                        {phaseForm.start_date && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Sæsonuge {seasonWeekNumber(selectedPlan.start_date, phaseForm.start_date)}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Til dato</Label>
                        <Input
                          type="date"
                          value={phaseForm.end_date}
                          min={phaseForm.start_date || selectedPlan.start_date}
                          max={selectedPlan.end_date}
                          onChange={(e) => setPhaseForm({ ...phaseForm, end_date: e.target.value })}
                        />
                        {phaseForm.end_date && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Sæsonuge {seasonWeekNumber(selectedPlan.start_date, phaseForm.end_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Inden for sæsonen: {selectedPlan.start_date} – {selectedPlan.end_date}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("seasonPhaseFocusTags") || "Træningsfokus"}</Label>
                      <button type="button" onClick={() => setTagEditorOpen(true)} className="text-[10px] underline text-muted-foreground hover:text-foreground">
                        {t("seasonPhaseFocusTagsEdit") || "Rediger tags"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PHASE_FOCUS_TAGS
                        .filter((tag) => !tagCatalog.hidden.includes(tag.value))
                        .map((tag) => {
                          const active = phaseForm.focus_tags.includes(tag.value);
                          return (
                            <button key={tag.value} type="button"
                              onClick={() => setPhaseForm({
                                ...phaseForm,
                                focus_tags: active
                                  ? phaseForm.focus_tags.filter((x) => x !== tag.value)
                                  : [...phaseForm.focus_tags, tag.value],
                              })}
                              className={cn(
                                "text-[11px] px-2 py-1 rounded-full border transition-colors",
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/40 border-border text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {tagLabel(tag.value)}
                            </button>
                          );
                        })}
                      {phaseForm.focus_tags
                        .filter((v) => !PHASE_FOCUS_TAGS.some((m) => m.value === v))
                        .map((custom) => (
                          <button key={custom} type="button"
                            onClick={() => setPhaseForm({
                              ...phaseForm,
                              focus_tags: phaseForm.focus_tags.filter((x) => x !== custom),
                            })}
                            className="text-[11px] px-2 py-1 rounded-full border bg-primary text-primary-foreground border-primary inline-flex items-center gap-1"
                            title={t("remove") || "Remove"}
                          >
                            {tagLabel(custom)}
                            <span className="opacity-70">×</span>
                          </button>
                        ))}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <Input
                        placeholder={t("seasonPhaseFocusTagCustomPlaceholder") || "Egen tag…"}
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = customTagInput.trim().slice(0, 32);
                            if (v && !phaseForm.focus_tags.includes(v)) {
                              setPhaseForm({ ...phaseForm, focus_tags: [...phaseForm.focus_tags, v] });
                            }
                            setCustomTagInput("");
                          }
                        }}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" variant="outline" type="button"
                        onClick={() => {
                          const v = customTagInput.trim().slice(0, 32);
                          if (v && !phaseForm.focus_tags.includes(v)) {
                            setPhaseForm({ ...phaseForm, focus_tags: [...phaseForm.focus_tags, v] });
                          }
                          setCustomTagInput("");
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
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
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteOverride(o.id)} aria-label={t("delete")} title={t("delete")}><Trash2 className="h-3 w-3" /></Button>
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

              {/* Technique library */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">🥋 {t("seasonTechniqueLibrary") || "Teknikbibliotek"}</h2>
                  <Button size="sm" variant="ghost" onClick={() => setShowTechForm((f) => !f)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {showTechForm && (
                  <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
                    <Input placeholder={t("seasonTechniqueName") || "Tekniknavn"} value={newTechName} onChange={(e) => setNewTechName(e.target.value)} className="h-8 text-xs" />
                    <Select value={newTechCategory} onValueChange={setNewTechCategory}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attack">{t("seasonCatAttack") || "Angreb"}</SelectItem>
                        <SelectItem value="defence">{t("seasonCatDefence") || "Forsvar"}</SelectItem>
                        <SelectItem value="combo">{t("seasonCatCombo") || "Kombination"}</SelectItem>
                        <SelectItem value="poomsae">{t("seasonCatPoomsae") || "Poomsae"}</SelectItem>
                        <SelectItem value="fitness">{t("seasonCatFitness") || "Kondition"}</SelectItem>
                        <SelectItem value="other">{t("seasonCatOther") || "Andet"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newTechDiscipline} onValueChange={setNewTechDiscipline}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">{t("seasonDisciplineBoth") || "Begge"}</SelectItem>
                        <SelectItem value="kyorugi">{t("seasonDisciplineKyorugi") || "Kyorugi"}</SelectItem>
                        <SelectItem value="poomsae">{t("seasonDisciplinePoomsae") || "Poomsae"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="w-full" onClick={addTechnique}>{t("seasonPhaseAdd") || "Tilføj"}</Button>
                  </div>
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {["attack", "defence", "combo", "poomsae", "fitness", "other"].map((cat) => {
                    const catTechs = techniques.filter((tt) => tt.category === cat);
                    if (catTechs.length === 0) return null;
                    const labelKey = `seasonCat${cat.charAt(0).toUpperCase() + cat.slice(1)}` as any;
                    return (
                      <div key={cat}>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider py-1">{t(labelKey) || cat}</div>
                        {catTechs.map((tech) => (
                          <div key={tech.id} className="flex items-center justify-between gap-1 text-xs py-0.5">
                            <span className="truncate">{tech.name}</span>
                            <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => deleteTechnique(tech.id)} aria-label={t("delete")} title={t("delete")}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {techniques.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">{t("seasonNoTechniques") || "Ingen teknikker endnu"}</p>
                  )}
                </div>
              </Card>

              {/* Info: weekly schedule comes from team standard week */}
              <Card className="p-3 bg-muted/30 border-dashed">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p>{t("seasonWeeklyFromTeam")}</p>
                    <button
                      type="button"
                      onClick={() => navigate("/coach")}
                      className="text-primary hover:underline font-medium"
                    >
                      {t("editTeamWeeklySchedule")} →
                    </button>
                  </div>
                </div>
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

              {/* Monthly calendar grid */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("iconHintPrevious")} title={t("iconHintPrevious")} onClick={() => {
                    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
                    else setViewMonth((m) => m - 1);
                  }}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="font-semibold text-sm">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("next")} title={t("next")} onClick={() => {
                    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
                    else setViewMonth((m) => m + 1);
                  }}><ChevronRight className="h-4 w-4" /></Button>
                </div>

                <div className="grid grid-cols-7 border-b border-border">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-center py-1.5 text-[11px] font-semibold text-muted-foreground">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((iso, i) => {
                    if (!iso) return <div key={`e${i}`} className="min-h-[58px] border-b border-r border-border/30 bg-muted/20" />;
                    const inSeason = iso >= selectedPlan.start_date && iso <= selectedPlan.end_date;
                    const isToday = iso === todayIso;
                    const wk = inSeason ? seasonWeekNumber(selectedPlan.start_date, iso) : null;
                    const phase = wk ? phaseForWeek(phases, wk) : null;
                    const s = inSeason ? resolveSessionForDate(iso, template, overrides, compDateSet) : null;
                    const isSelected = wk !== null && wk === selectedWeek;
                    const focusIds = wk !== null && s?.type === "tkd" ? (weekFocusMap.get(wk)?.technique_ids ?? []) : [];
                    const focusTechs = focusIds.length > 0 ? techniques.filter((tt) => focusIds.includes(tt.id)) : [];
                    return (
                      <div
                        key={iso}
                        onClick={() => inSeason && wk && setSelectedWeek(wk === selectedWeek ? null : wk)}
                        className={cn(
                          "min-h-[58px] border-b border-r border-border/30 p-1 flex flex-col cursor-pointer transition-colors",
                          !inSeason && "opacity-25 cursor-default",
                          isSelected && "ring-2 ring-inset ring-primary",
                          s && inSeason ? sessionRowClass(s.type) : "",
                        )}
                        style={phase && inSeason ? { borderBottom: `2px solid ${phase.color}50` } : undefined}
                      >
                        <span className={cn(
                          "text-[11px] font-semibold self-start rounded-full w-5 h-5 flex items-center justify-center",
                          isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                        )}>
                          {new Date(iso + "T00:00:00").getDate()}
                        </span>
                        {s && s.type !== "rest" && inSeason && (
                          <span className="text-[9px] font-bold leading-tight mt-0.5">{t(sessionLabelKey(s.type) as any)}</span>
                        )}
                        {focusTechs.length > 0 && inSeason && (
                          <div className="flex flex-wrap gap-0.5 mt-auto pt-0.5">
                            {focusTechs.slice(0, 2).map((tech) => (
                              <span
                                key={tech.id}
                                title={tech.name}
                                className="text-[8px] leading-none px-1 py-0.5 rounded bg-primary/15 text-primary font-semibold max-w-full truncate"
                              >
                                {tech.name}
                              </span>
                            ))}
                            {focusTechs.length > 2 && (
                              <span className="text-[8px] leading-none px-1 py-0.5 rounded bg-primary/15 text-primary font-semibold">
                                +{focusTechs.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Week detail panel */}
              {selectedWeek !== null && (() => {
                const sw = selectedWeek;
                const weekStart = addDays(selectedPlan.start_date, (sw - 1) * 7);
                const weekEnd = addDays(weekStart, 6);
                const focus = weekFocusMap.get(sw) ?? { technique_ids: [], coach_note: "" };
                const hint = getAiHint(sw);
                const teamTechs = techniques.filter((tt) => focus.technique_ids.includes(tt.id));

                return (
                  <Card className="overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{t("seasonWeek")} {sw} · {weekStart} – {weekEnd}</span>
                    </div>

                    {hint && (
                      <div className={cn("px-4 py-2 border-b text-sm flex gap-2 items-start", {
                        'bg-amber-50 border-amber-200 text-amber-800': hint.variant === 'pre',
                        'bg-red-50 border-red-200 text-red-800': hint.variant === 'comp',
                        'bg-emerald-50 border-emerald-200 text-emerald-800': hint.variant === 'recovery',
                        'bg-primary/10 border-primary/30 text-primary': hint.variant === 'base',
                      })}>
                        <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span className="text-[12px]"><strong>{t("seasonAiSuggestion") || "AI-forslag"}:</strong> {hint.text}</span>
                      </div>
                    )}

                    <div className="p-4 space-y-4">
                      {/* Team focus */}
                      <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          👥 {t("seasonTeamFocus") || "Hold-fokus"} (1–3)
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {teamTechs.map((tech) => (
                            <span key={tech.id} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">
                              <button onClick={() => {
                                const updated = { ...focus, technique_ids: focus.technique_ids.filter((id) => id !== tech.id) };
                                setWeekFocusMap((prev) => new Map(prev).set(sw, updated));
                              }} className="opacity-50 hover:opacity-100">✕</button>
                              {tech.name}
                            </span>
                          ))}
                          {focus.technique_ids.length < 3 && (
                            <select
                              className="text-xs px-3 py-1 rounded-full border-2 border-dashed border-border text-muted-foreground bg-transparent cursor-pointer"
                              value=""
                              onChange={(e) => {
                                if (!e.target.value || focus.technique_ids.includes(e.target.value)) return;
                                const updated = { ...focus, technique_ids: [...focus.technique_ids, e.target.value] };
                                setWeekFocusMap((prev) => new Map(prev).set(sw, updated));
                              }}
                            >
                              <option value="">＋ {t("seasonAddTechnique") || "Tilføj teknik"}</option>
                              {techniques.filter((tt) => !focus.technique_ids.includes(tt.id)).map((tt) => (
                                <option key={tt.id} value={tt.id}>{tt.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <input
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-muted/30 focus:outline-none focus:border-primary"
                          placeholder={t("seasonTeamNote") || "Note til holdet (valgfri)..."}
                          value={focus.coach_note}
                          onChange={(e) => setWeekFocusMap((prev) => new Map(prev).set(sw, { ...focus, coach_note: e.target.value }))}
                        />
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Button size="sm" onClick={() => saveWeekFocus(sw)}>
                            {t("save") || "Gem"}
                          </Button>
                          {(() => {
                            const hasFocusToCopy = focus.technique_ids.length > 0 || (focus.coach_note ?? "").trim().length > 0;
                            const totalWeeks = Math.max(1, Math.floor(daysBetween(selectedPlan.start_date, selectedPlan.end_date) / 7) + 1);
                            const otherWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter((w) => w !== sw);
                            return (
                              <Popover open={copyOpen} onOpenChange={(o) => { setCopyOpen(o); if (!o) setCopyTargets([]); }}>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!hasFocusToCopy}
                                    title={!hasFocusToCopy ? (t("seasonNoFocusToCopy") || "Ingen fokus at kopiere") : undefined}
                                  >
                                    {t("seasonCopyFocus") || "Kopiér fokus til andre uger"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-72 p-3 space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    {t("seasonCopyFocusHelp") || "Vælg op til 4 uger"}
                                  </p>
                                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                                    {otherWeeks.map((w) => {
                                      const ws = addDays(selectedPlan.start_date, (w - 1) * 7);
                                      const we = addDays(ws, 6);
                                      const checked = copyTargets.includes(w);
                                      const disabled = !checked && copyTargets.length >= 4;
                                      return (
                                        <label
                                          key={w}
                                          className={cn(
                                            "flex items-center gap-2 text-xs px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50",
                                            disabled && "opacity-50 cursor-not-allowed"
                                          )}
                                        >
                                          <Checkbox
                                            checked={checked}
                                            disabled={disabled}
                                            onCheckedChange={(v) => {
                                              setCopyTargets((prev) =>
                                                v ? [...prev, w].slice(0, 4) : prev.filter((x) => x !== w)
                                              );
                                            }}
                                          />
                                          <span className="font-medium">{t("seasonWeek") || "Uge"} {w}</span>
                                          <span className="text-muted-foreground">· {ws} – {we}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <div className="flex justify-end gap-2 pt-1">
                                    <Button size="sm" variant="ghost" onClick={() => { setCopyOpen(false); setCopyTargets([]); }}>
                                      {t("cancel") || "Annullér"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={copyTargets.length === 0}
                                      onClick={() => copyWeekFocusTo(sw, copyTargets)}
                                    >
                                      {(t("seasonCopyFocusConfirm") || "Kopiér til {n} uger").replace("{n}", String(copyTargets.length))}
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="h-px bg-border" />

                      {/* Individual athlete overrides */}
                      <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          🎯 {t("seasonIndividualFocus") || "Individuelle afvigelser"} (max 2)
                        </div>
                        {athletes.map((athlete) => {
                          const key = `${sw}:${athlete.user_id}`;
                          const athTechIds = athleteFocusMap.get(key) ?? [];
                          const athTechs = techniques.filter((tt) => athTechIds.includes(tt.id));
                          if (athTechIds.length === 0) {
                            return (
                              <div key={athlete.user_id} className="flex items-center gap-2 py-1">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">{athlete.display_name.slice(0, 2).toUpperCase()}</div>
                                <span className="text-xs text-muted-foreground">{athlete.display_name}</span>
                                <select
                                  className="text-[11px] border border-dashed border-border rounded-full px-2 py-0.5 bg-transparent text-muted-foreground cursor-pointer ml-auto"
                                  value=""
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    const updated = [...athTechIds, e.target.value];
                                    saveAthleteFocus(sw, athlete.user_id, updated);
                                  }}
                                >
                                  <option value="">＋ {t("seasonAddTechnique") || "Tilføj"}</option>
                                  {techniques.filter((tt) => !focus.technique_ids.includes(tt.id)).map((tt) => (
                                    <option key={tt.id} value={tt.id}>{tt.name}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          }
                          return (
                            <div key={athlete.user_id} className="bg-muted/30 border border-border rounded-lg p-3 mb-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">{athlete.display_name.slice(0, 2).toUpperCase()}</div>
                                <span className="text-xs font-medium">{athlete.display_name}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {athTechs.map((tech) => (
                                  <span key={tech.id} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-violet-100 border border-violet-300 text-violet-700">
                                    <button onClick={() => {
                                      const updated = athTechIds.filter((id) => id !== tech.id);
                                      saveAthleteFocus(sw, athlete.user_id, updated);
                                    }} className="opacity-50 hover:opacity-100">✕</button>
                                    {tech.name}
                                  </span>
                                ))}
                                {athTechIds.length < 2 && (
                                  <select
                                    className="text-[11px] border border-dashed border-border rounded-full px-2 py-0.5 bg-transparent text-muted-foreground cursor-pointer"
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value || athTechIds.includes(e.target.value)) return;
                                      const updated = [...athTechIds, e.target.value];
                                      saveAthleteFocus(sw, athlete.user_id, updated);
                                    }}
                                  >
                                    <option value="">＋ {t("seasonAddTechnique") || "Tilføj"}</option>
                                    {techniques.filter((tt) => !athTechIds.includes(tt.id)).map((tt) => (
                                      <option key={tt.id} value={tt.id}>{tt.name}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              })()}
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

      <Dialog open={tagEditorOpen} onOpenChange={setTagEditorOpen}>
        <DialogContent className="max-w-md w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("seasonPhaseFocusTagsEdit") || "Rediger tags"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {t("seasonPhaseFocusTagsEditHint") || "Omdøb eller skjul tags. Eksisterende faser bevarer deres tags."}
            </p>
            {(() => {
              const usedCustoms = Array.from(new Set(phases.flatMap((p) => p.focus_tags ?? []))).filter(
                (v) => !PHASE_FOCUS_TAGS.some((m) => m.value === v),
              );
              const allValues = [...PHASE_FOCUS_TAGS.map((m) => m.value), ...usedCustoms];
              return allValues.map((value) => {
                const preset = PHASE_FOCUS_TAGS.find((m) => m.value === value);
                const fallback = preset ? t(preset.labelKey as any) : value;
                const current = tagCatalog.labels[value] ?? "";
                const hidden = tagCatalog.hidden.includes(value);
                return (
                  <div key={value} className="flex items-center gap-2">
                    <Input
                      placeholder={fallback}
                      value={current}
                      onChange={(e) => {
                        const v = e.target.value;
                        const labels = { ...tagCatalog.labels };
                        if (v.trim()) labels[value] = v;
                        else delete labels[value];
                        persistCatalog({ ...tagCatalog, labels });
                      }}
                      className={cn("h-9 text-sm flex-1", hidden && "opacity-50 line-through")}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={hidden ? "outline" : "ghost"}
                      onClick={() => {
                        const set = new Set(tagCatalog.hidden);
                        if (hidden) set.delete(value); else set.add(value);
                        persistCatalog({ ...tagCatalog, hidden: Array.from(set) });
                      }}
                      className="shrink-0"
                    >
                      {hidden ? (t("show") || "Vis") : (t("hide") || "Skjul")}
                    </Button>
                  </div>
                );
              });
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagEditorOpen(false)}>{t("close") || "Luk"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
