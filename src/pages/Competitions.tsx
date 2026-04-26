import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trophy, Plus, ArrowLeft, Loader2, Scale, AlertTriangle, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { CompetitionPlanDialog } from "@/components/CompetitionPlanDialog";
import { useLanguage } from "@/i18n/LanguageContext";

interface Competition {
  id: string;
  name: string;
  event_date: string;
  weight_class_kg: number | null;
  priority: "A" | "B" | "C";
  location: string | null;
  plan_data: any;
  result: string | null;
  is_public: boolean;
}

interface WeightLog { log_date: string; weight_kg: number; }

export default function Competitions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [comps, setComps] = useState<Competition[]>([]);
  const [pastComps, setPastComps] = useState<Competition[]>([]);
  const [reflectedIds, setReflectedIds] = useState<Set<string>>(new Set());
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewPlan, setViewPlan] = useState<Competition | null>(null);

  // create form
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [priority, setPriority] = useState<"A" | "B" | "C">("A");
  const [location, setLocation] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // weight log
  const [todayWeight, setTodayWeight] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: c }, { data: past }, { data: w }, { data: refls }] = await Promise.all([
      supabase.from("competitions").select("*").eq("user_id", user.id).gte("event_date", today).order("event_date"),
      supabase.from("competitions").select("*").eq("user_id", user.id).lt("event_date", today).order("event_date", { ascending: false }).limit(20),
      supabase.from("weight_logs").select("log_date, weight_kg").eq("user_id", user.id).order("log_date", { ascending: false }).limit(30),
      supabase.from("competition_reflections").select("competition_id").eq("user_id", user.id).not("competition_id", "is", null),
    ]);
    setComps((c || []) as Competition[]);
    setPastComps((past || []) as Competition[]);
    setReflectedIds(new Set((refls || []).map((r: any) => r.competition_id).filter(Boolean)));
    setWeights((w || []) as WeightLog[]);
    setLoading(false);
  }

  async function createComp() {
    if (!name || !date) { toast({ title: t("competitionsNameDateRequired"), variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("competitions").insert({
      user_id: user.id, name, event_date: date,
      weight_class_kg: weightClass ? parseFloat(weightClass) : null,
      priority, location: location || null,
    });
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    setName(""); setDate(""); setWeightClass(""); setLocation(""); setPriority("A"); setCreateOpen(false);
    toast({ title: t("competitionsCreated") });
    // Apply taper overlay to active training plan (non-blocking)
    void supabase.functions.invoke("apply-competition-taper", { body: { user_id: user.id } });
    void load();
  }

  async function generatePlan(id: string) {
    setGenerating(id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-competition-plan", { body: { competition_id: id } });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast({ title: t("competitionsPlanGenerated") });
      void load();
    } catch (e: any) {
      toast({ title: t("competitionsGenerationFailed"), description: e.message, variant: "destructive" });
    } finally { setGenerating(null); }
  }

  async function logWeight() {
    const w = parseFloat(todayWeight);
    if (!(w > 20 && w < 300)) { toast({ title: t("competitionsInvalidWeight"), variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("weight_logs").upsert({ user_id: user.id, log_date: today, weight_kg: w }, { onConflict: "user_id,log_date" });
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    setTodayWeight("");
    toast({ title: t("competitionsWeightLogged") });
    void load();
  }

  async function deleteComp(id: string) {
    if (!confirm(t("competitionsDeleteConfirm"))) return;
    await supabase.from("competitions").delete().eq("id", id);
    void load();
  }

  const latestWeight = weights[0]?.weight_kg ?? null;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-4 w-4 mr-1" /> {t("competitionsBack")}</Button>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> {t("competitionsTitle")}</h1>
        </div>

        {/* Quick weight log */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4" /> {t("competitionsTodayWeight")}</CardTitle></CardHeader>
          <CardContent className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">{t("competitionsWeightKg")}</Label>
              <Input type="number" inputMode="decimal" step="0.1" value={todayWeight} onChange={(e) => setTodayWeight(e.target.value)} placeholder={latestWeight ? `${latestWeight} ${t("competitionsLastSuffix")}` : t("competitionsWeightPlaceholder")} />
            </div>
            <Button onClick={logWeight}>{t("competitionsLog")}</Button>
          </CardContent>
        </Card>

        {/* Create new */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="w-full"><Plus className="h-4 w-4 mr-1" /> {t("competitionsAdd")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("competitionsNew")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("competitionsName")} *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nordic Open" /></div>
              <div><Label>{t("competitionsDate")} *</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label>{t("competitionsWeightClass")}</Label><Input type="number" inputMode="decimal" step="0.1" value={weightClass} onChange={(e) => setWeightClass(e.target.value)} placeholder="67.5" /></div>
              <div>
                <Label>{t("competitionsPriority")}</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">{t("competitionsPriorityA")}</SelectItem>
                    <SelectItem value="B">{t("competitionsPriorityB")}</SelectItem>
                    <SelectItem value="C">{t("competitionsPriorityC")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("competitionsLocation")}</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("competitionsLocationPlaceholder")} /></div>
              <Button onClick={createComp} className="w-full">{t("competitionsCreate")}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* List */}
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : comps.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">{t("competitionsNoneTitle")}</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {comps.map((c) => {
              const days = Math.max(0, Math.round((new Date(c.event_date).getTime() - Date.now()) / 86400000));
              const targetGap = c.weight_class_kg && latestWeight ? latestWeight - c.weight_class_kg : null;
              const onTrack = targetGap !== null && targetGap <= (days / 7) * 0.7;
              return (
                <Card key={c.id} className="border-2 border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{c.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs">
                          <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />{days} {t("competitionsDays")}</Badge>
                          <Badge variant="outline">{t("competitionsPriorityLabel")} {c.priority}</Badge>
                          {c.weight_class_kg && <Badge variant="outline">{c.weight_class_kg} kg</Badge>}
                          {c.location && <Badge variant="outline">{c.location}</Badge>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteComp(c.id)}>{t("competitionsRemove")}</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {targetGap !== null && (
                      <div className={`text-sm p-2 rounded border ${onTrack ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                        {t("competitionsCurrent")} {latestWeight} kg → {t("competitionsTarget")} {c.weight_class_kg} kg ({targetGap > 0 ? `${targetGap.toFixed(1)} ${t("competitionsToCut")}` : t("competitionsAtTarget")}) · {onTrack ? t("competitionsOnTrack") : t("competitionsBehind")}
                      </div>
                    )}
                    {c.plan_data?.warnings?.length > 0 && (
                      <div className="text-xs space-y-1">
                        {c.plan_data.warnings.map((w: string, i: number) => (
                          <div key={i} className="flex items-start gap-1 text-rose-600"><AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{w}</span></div>
                        ))}
                      </div>
                    )}
                    {c.plan_data?.taperSummary && (
                      <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-2">{c.plan_data.taperSummary}</div>
                    )}
                    {/* Public profile controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                      <Input
                        value={c.result ?? ""}
                        onChange={async (e) => {
                          const result = e.target.value.slice(0, 50);
                          setComps(comps.map(x => x.id === c.id ? { ...x, result } : x));
                        }}
                        onBlur={async (e) => {
                          await supabase.from("competitions").update({ result: e.target.value.slice(0, 50) || null }).eq("id", c.id);
                        }}
                        placeholder={t("competitionsResult")}
                        className="h-8 text-xs flex-1 min-w-[140px]"
                        maxLength={50}
                      />
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <Switch
                          checked={c.is_public}
                          onCheckedChange={async (v) => {
                            setComps(comps.map(x => x.id === c.id ? { ...x, is_public: v } : x));
                            await supabase.from("competitions").update({ is_public: v }).eq("id", c.id);
                          }}
                        />
                        {t("competitionsShowOnPublicProfile")}
                      </label>
                    </div>
                    <div className="flex gap-2">
                      {c.plan_data?.taperSummary && (
                        <Button size="sm" variant="default" className="flex-1" onClick={() => setViewPlan(c)}>
                          {t("competitionsViewFull")}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => generatePlan(c.id)} disabled={generating === c.id}>
                        {generating === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        {c.plan_data?.taperSummary ? t("competitionsRegenerate") : t("competitionsGenerate")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Past competitions — reflect CTA */}
        {!loading && pastComps.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-muted-foreground" /> {t("reflectionPastTitle")}
            </h2>
            <div className="space-y-2">
              {pastComps.map((c) => {
                const reflected = reflectedIds.has(c.id);
                return (
                  <Card key={c.id} className="border border-border">
                    <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.event_date}{c.result ? ` · ${c.result}` : ""}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={reflected ? "outline" : "default"}
                        onClick={() => navigate(`/competitions/${c.id}/reflect`)}
                      >
                        {reflected ? (
                          <><CheckCircle2 className="h-4 w-4 mr-1" /> {t("reflectionDone")}</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-1" /> {t("reflectionCTA")}</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <AppFooter />
      {viewPlan && (
        <CompetitionPlanDialog
          open={!!viewPlan}
          onOpenChange={(o) => !o && setViewPlan(null)}
          competitionName={viewPlan.name}
          plan={viewPlan.plan_data}
        />
      )}
    </div>
  );
}
