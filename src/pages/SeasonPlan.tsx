import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarRange, Loader2, Plus, Trash2, Sparkles, Save, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { SeasonTimeline } from "@/components/season/SeasonTimeline";
import {
  PHASE_META, PHASE_TYPES, generateDefaultPhases, currentPhase, uid, todayISO, addDays,
  type SeasonPhase, type SeasonMilestone, type PhaseType,
} from "@/lib/seasonPlan";

interface SeasonPlanRow {
  id: string;
  user_id: string;
  name: string;
  season_start: string;
  season_end: string;
  phases: SeasonPhase[];
  milestones: SeasonMilestone[];
  is_active: boolean;
}

export default function SeasonPlan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const athleteIdParam = params.get("athlete"); // coach-mode override

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<SeasonPlanRow | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string>("");
  const [isCoachView, setIsCoachView] = useState(false);

  // Create form
  const [name, setName] = useState("2025/2026 Season");
  const [seasonStart, setSeasonStart] = useState(todayISO());
  const [seasonEnd, setSeasonEnd] = useState(addDays(todayISO(), 365));

  useEffect(() => { void load(); }, [athleteIdParam]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const targetUserId = athleteIdParam || user.id;
    setOwnerId(targetUserId);
    setIsCoachView(targetUserId !== user.id);

    const { data } = await supabase
      .from("season_plans")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPlan({
        ...data,
        phases: (data.phases as any) ?? [],
        milestones: (data.milestones as any) ?? [],
      } as SeasonPlanRow);
    }
    setLoading(false);
  }

  async function createPlan() {
    if (!seasonStart || !seasonEnd || seasonStart >= seasonEnd) {
      toast({ title: "Invalid season dates", variant: "destructive" }); return;
    }
    // Pull A-priority competitions in range to seed phases
    const { data: comps } = await supabase
      .from("competitions").select("name, event_date, priority")
      .eq("user_id", ownerId)
      .gte("event_date", seasonStart).lte("event_date", seasonEnd);
    const aEvents = (comps || []).filter((c) => c.priority === "A").map((c) => ({ date: c.event_date, label: c.name }));
    const milestones: SeasonMilestone[] = (comps || []).map((c) => ({
      id: uid(), date: c.event_date, label: c.name, priority: c.priority as any,
    }));
    const phases = generateDefaultPhases(seasonStart, seasonEnd, aEvents);

    const { data, error } = await supabase.from("season_plans").insert({
      user_id: ownerId, name, season_start: seasonStart, season_end: seasonEnd,
      phases: phases as any, milestones: milestones as any,
    }).select().single();
    if (error) { toast({ title: "Could not create", description: error.message, variant: "destructive" }); return; }
    setPlan({ ...(data as any), phases, milestones } as SeasonPlanRow);
    toast({ title: "Season plan created" });
  }

  async function persist(next: SeasonPlanRow) {
    setPlan(next);
    setSaving(true);
    const { error } = await supabase.from("season_plans").update({
      name: next.name, season_start: next.season_start, season_end: next.season_end,
      phases: next.phases as any, milestones: next.milestones as any,
    }).eq("id", next.id);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
  }

  function updatePhase(id: string, patch: Partial<SeasonPhase>) {
    if (!plan) return;
    const phases = plan.phases.map((p) => (p.id === id ? { ...p, ...patch } : p));
    void persist({ ...plan, phases });
  }

  function addPhase() {
    if (!plan) return;
    const lastEnd = plan.phases[plan.phases.length - 1]?.end_date ?? plan.season_start;
    const start = addDays(lastEnd, 1);
    const end = addDays(start, 13);
    if (end > plan.season_end) {
      toast({ title: "No room left in season", variant: "destructive" }); return;
    }
    const meta = PHASE_META.specific_prep;
    const newPhase: SeasonPhase = {
      id: uid(), type: "specific_prep", label: meta.label,
      start_date: start, end_date: end, focus: "",
      volume_pct: meta.defaults.volume, intensity_pct: meta.defaults.intensity,
    };
    void persist({ ...plan, phases: [...plan.phases, newPhase] });
    setSelectedPhaseId(newPhase.id);
  }

  function deletePhase(id: string) {
    if (!plan || !confirm("Delete this phase?")) return;
    void persist({ ...plan, phases: plan.phases.filter((p) => p.id !== id) });
    if (selectedPhaseId === id) setSelectedPhaseId(null);
  }

  async function deletePlan() {
    if (!plan || !confirm("Delete the entire season plan?")) return;
    await supabase.from("season_plans").delete().eq("id", plan.id);
    setPlan(null);
  }

  const selectedPhase = plan?.phases.find((p) => p.id === selectedPhaseId) ?? null;
  const active = plan ? currentPhase(plan.phases) : null;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(isCoachView ? "/coach" : "/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" /> Season Planner
          </h1>
          {isCoachView && <Badge variant="outline" className="ml-auto">Coach view</Badge>}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !plan ? (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Start your season</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Map your full competition season. We'll auto-build a periodization (General Prep → Specific Prep → Peak → Deload) around your A-priority events.
              </p>
              <div><Label>Season name</Label><Input value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start</Label><Input type="date" value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)} /></div>
                <div><Label>End</Label><Input type="date" value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)} /></div>
              </div>
              <Button onClick={createPlan} className="w-full"><Sparkles className="h-4 w-4 mr-1" /> Generate plan</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div>
                  <Input
                    value={plan.name}
                    onChange={(e) => setPlan({ ...plan, name: e.target.value.slice(0, 80) })}
                    onBlur={() => persist(plan)}
                    className="font-bold text-lg border-0 px-0 h-auto bg-transparent"
                  />
                  <p className="text-xs text-muted-foreground">
                    {plan.season_start} → {plan.season_end}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  <Button variant="ghost" size="sm" onClick={deletePlan} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {active && (
                  <div className={`rounded-md border px-3 py-2 ${PHASE_META[active.type].colorClass}`}>
                    <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">Currently in</p>
                    <p className="text-sm font-bold">{active.label}</p>
                    <p className="text-xs opacity-80">{active.focus}</p>
                  </div>
                )}
                <SeasonTimeline
                  seasonStart={plan.season_start}
                  seasonEnd={plan.season_end}
                  phases={plan.phases}
                  milestones={plan.milestones}
                  onPhaseClick={setSelectedPhaseId}
                  selectedPhaseId={selectedPhaseId}
                />
                {/* Legend */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PHASE_TYPES.map((t) => (
                    <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${PHASE_META[t].colorClass}`}>
                      {PHASE_META[t].label}
                    </span>
                  ))}
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> Competition
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Phase editor */}
            {selectedPhase ? (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Edit phase</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => deletePhase(selectedPhase.id)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={selectedPhase.type} onValueChange={(v) => updatePhase(selectedPhase.id, { type: v as PhaseType, label: PHASE_META[v as PhaseType].label })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PHASE_TYPES.map((t) => <SelectItem key={t} value={t}>{PHASE_META[t].label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Custom label</Label>
                      <Input value={selectedPhase.label} onChange={(e) => updatePhase(selectedPhase.id, { label: e.target.value.slice(0, 60) })} />
                    </div>
                    <div>
                      <Label>Start</Label>
                      <Input type="date" value={selectedPhase.start_date} min={plan.season_start} max={plan.season_end} onChange={(e) => updatePhase(selectedPhase.id, { start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>End</Label>
                      <Input type="date" value={selectedPhase.end_date} min={plan.season_start} max={plan.season_end} onChange={(e) => updatePhase(selectedPhase.id, { end_date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Focus / training emphasis</Label>
                    <Textarea
                      value={selectedPhase.focus}
                      onChange={(e) => updatePhase(selectedPhase.id, { focus: e.target.value.slice(0, 400) })}
                      rows={2}
                      placeholder="What this block targets…"
                      maxLength={400}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex justify-between">Volume <span className="text-muted-foreground text-xs">{selectedPhase.volume_pct}%</span></Label>
                      <Slider value={[selectedPhase.volume_pct]} max={100} step={5} onValueChange={([v]) => updatePhase(selectedPhase.id, { volume_pct: v })} />
                    </div>
                    <div>
                      <Label className="flex justify-between">Intensity <span className="text-muted-foreground text-xs">{selectedPhase.intensity_pct}%</span></Label>
                      <Slider value={[selectedPhase.intensity_pct]} max={100} step={5} onValueChange={([v]) => updatePhase(selectedPhase.id, { intensity_pct: v })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-center text-sm text-muted-foreground">Tap a phase block above to edit it.</p>
            )}

            <Button variant="outline" className="w-full" onClick={addPhase}>
              <Plus className="h-4 w-4 mr-1" /> Add phase
            </Button>

            {/* Milestones list */}
            {plan.milestones.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-explosive" /> Competitions</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {plan.milestones.sort((a, b) => a.date.localeCompare(b.date)).map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-[10px]">{m.priority || "—"}</Badge>
                      <span className="font-medium">{m.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{m.date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
