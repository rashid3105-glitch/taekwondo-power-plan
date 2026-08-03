import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { WeightStatusCard } from "./WeightStatusCard";
import { WeightTrendChart } from "./WeightTrendChart";
import { WeightGoalDialog } from "./WeightGoalDialog";
import { CompetitionWeightCard } from "./CompetitionWeightCard";
import { WeightOnboarding } from "./onboarding/WeightOnboarding";
import { FoodScanner } from "@/components/FoodScanner";
import { NutritionPlan } from "@/components/NutritionPlan";
import {
  estimateMaintenanceCalories, milestones, movingAverage, todayISO,
  type WeightGoal, type WeightPoint,
} from "@/lib/weightPlanner";

interface Props {
  /** Athlete whose data is shown. Defaults to the signed-in user. */
  userId?: string;
  profile?: any;
  readOnly?: boolean;
  canEditGoal?: boolean;
  /** Hide the food-logging / nutrition-plan tabs (used in the coach panel). */
  compact?: boolean;
}

export function WeightModule({ userId, profile, readOnly = false, canEditGoal = true, compact = false }: Props) {
  const { t } = useLanguage();
  const [resolvedId, setResolvedId] = useState<string | null>(userId ?? null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WeightPoint[]>([]);
  const [goal, setGoal] = useState<(WeightGoal & { id: string }) | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [weighIn, setWeighIn] = useState("");
  const [saving, setSaving] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [rerunOnboarding, setRerunOnboarding] = useState(false);

  useEffect(() => {
    if (userId) { setResolvedId(userId); return; }
    supabase.auth.getUser().then(({ data }) => setResolvedId(data.user?.id ?? null));
  }, [userId]);

  const load = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    const [logRes, goalRes, compRes] = await Promise.all([
      supabase.from("weight_logs").select("log_date, weight_kg").eq("user_id", resolvedId).order("log_date", { ascending: true }).limit(400),
      supabase.from("weight_goals").select("*").eq("user_id", resolvedId).eq("is_active", true).order("created_at", { ascending: false }).limit(1),
      supabase.from("competitions").select("id, name, event_date, weight_class_kg").eq("user_id", resolvedId).gte("event_date", todayISO()).order("event_date", { ascending: true }).limit(1),
    ]);
    setLogs((logRes.data ?? []).map((l: any) => ({ log_date: l.log_date, weight_kg: Number(l.weight_kg) })));
    const g = goalRes.data?.[0];
    setGoal(g ? ({ ...g, start_weight_kg: Number(g.start_weight_kg), target_weight_kg: Number(g.target_weight_kg), rate_kg_per_week: Number(g.rate_kg_per_week) } as any) : null);
    setCompetition(compRes.data?.[0] ?? null);
    setLoading(false);
  }, [resolvedId]);

  useEffect(() => { void load(); }, [load]);

  const ma = useMemo(() => movingAverage(logs), [logs]);
  const currentWeight = ma.length ? Number(ma[ma.length - 1].weight_kg) : (profile?.weight_kg ? Number(profile.weight_kg) : null);
  const maintenance = useMemo(
    () => profile?.custom_calories
      ? Number(profile.custom_calories)
      : estimateMaintenanceCalories({
          weightKg: currentWeight ?? 65,
          age: profile?.age ?? null,
          sessionsPerWeek: profile?.tkd_sessions_per_week ?? null,
          activityLevel: (goal?.activity_level as any) ?? null,
          sex: (goal?.sex as any) ?? null,
        }),
    [profile, currentWeight, goal],
  );

  const saveWeighIn = async () => {
    if (!resolvedId) return;
    const w = parseFloat(weighIn.replace(",", "."));
    if (isNaN(w) || w < 20 || w > 250) { toast.error(t("wpInvalidWeight")); return; }
    setSaving(true);
    const { error } = await supabase.from("weight_logs").upsert(
      { user_id: resolvedId, log_date: todayISO(), weight_kg: w, ...(profile?.club_id ? { club_id: profile.club_id } : {}) },
      { onConflict: "user_id,log_date" },
    );
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setWeighIn("");
    toast.success(t("wpWeightSaved"));
    void load();
  };

  const saveGoal = async (g: Omit<WeightGoal, "id">) => {
    if (!resolvedId) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const payload: any = {
      ...g,
      user_id: resolvedId,
      set_by: auth.user?.id ?? null,
      ...(profile?.club_id ? { club_id: profile.club_id } : {}),
    };
    const { error } = goal
      ? await supabase.from("weight_goals").update(payload).eq("id", goal.id)
      : await supabase.from("weight_goals").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setGoalOpen(false);
    setRerunOnboarding(false);
    toast.success(t("wpGoalSaved"));
    void load();
  };

  const deleteGoal = async () => {
    if (!goal) return;
    setSaving(true);
    const { error } = await supabase.from("weight_goals").update({ is_active: false }).eq("id", goal.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setGoalOpen(false);
    void load();
  };

  const stones = goal && currentWeight != null ? milestones(goal, currentWeight) : [];
  const setByCoach = !!(goal?.set_by && resolvedId && goal.set_by !== resolvedId);

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const showOnboarding = canEditGoal && !readOnly && (rerunOnboarding || !goal);
  if (showOnboarding) {
    return (
      <div className="max-w-md mx-auto py-2">
        <WeightOnboarding
          currentWeight={currentWeight}
          age={profile?.age ?? null}
          saving={saving}
          onCancel={rerunOnboarding ? () => setRerunOnboarding(false) : undefined}
          onComplete={saveGoal}
        />
      </div>
    );
  }

  const statusView = (
    <div className="space-y-4">
      <WeightStatusCard
        goal={goal}
        logs={logs}
        maintenanceKcal={maintenance}
        weighIn={weighIn}
        onWeighInChange={setWeighIn}
        onWeighInSave={saveWeighIn}
        saving={saving}
        canEditGoal={canEditGoal && !readOnly}
        onEditGoal={() => setGoalOpen(true)}
        setByCoach={setByCoach}
      />
      <WeightTrendChart logs={logs} goal={goal} />
      <CompetitionWeightCard competition={competition} logs={logs} age={profile?.age ?? null} />
      {stones.length > 0 && (
        <Card className="p-4 space-y-2">
          <p className="text-sm font-bold">{t("wpMilestones")}</p>
          <div className="flex flex-wrap gap-1.5">
            {stones.map((s) => (
              <span
                key={s.weight}
                className={`text-[11px] px-2 py-1 rounded-full border ${s.reached ? "bg-primary/15 border-primary/40 text-primary" : "border-border text-muted-foreground"}`}
              >
                {s.weight} {t("wpKg")}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {compact ? statusView : (
        <Tabs defaultValue="today">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="today">{t("wpTabToday")}</TabsTrigger>
            <TabsTrigger value="status">{t("wpTabStatus")}</TabsTrigger>
            <TabsTrigger value="plan">{t("wpTabPlan")}</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-4">
            {resolvedId && (
              <DailyOverview
                userId={resolvedId}
                goal={goal}
                currentWeight={currentWeight}
                dailyTargetKcal={dailyTarget}
                readOnly={readOnly}
                weighIn={weighIn}
                onWeighInChange={setWeighIn}
                onWeighInSave={saveWeighIn}
                saving={saving}
              />
            )}
          </TabsContent>
          <TabsContent value="status" className="mt-4">{statusView}</TabsContent>
          <TabsContent value="plan" className="mt-4">
            <NutritionPlan profile={profile} readOnly={readOnly} />
          </TabsContent>
        </Tabs>
      )}


      <WeightGoalDialog
        open={goalOpen}
        onOpenChange={setGoalOpen}
        goal={goal}
        currentWeight={currentWeight}
        age={profile?.age ?? null}
        saving={saving}
        onSave={saveGoal}
        onDelete={goal ? deleteGoal : undefined}
        onRerunSetup={canEditGoal && !readOnly ? () => setRerunOnboarding(true) : undefined}
      />
    </div>
  );
}

export default WeightModule;
