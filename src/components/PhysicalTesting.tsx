import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, Plus, Trash2, Timer, Dumbbell, Wind, Zap, ClipboardList, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TestResult {
  id: string;
  test_name: string;
  category: string;
  value: number;
  unit: string;
  test_type: string;
  test_date: string;
  notes: string;
}

interface CoachAthlete {
  athlete_id: string;
  display_name: string;
}

const STANDARD_TESTS: Record<string, { name: string; unit: string; category: string }[]> = {
  speed: [
    { name: "30m Sprint", unit: "sec", category: "speed" },
    { name: "10m Sprint", unit: "sec", category: "speed" },
    { name: "5-10-5 Shuttle", unit: "sec", category: "speed" },
  ],
  endurance: [
    { name: "Beep Test", unit: "level", category: "endurance" },
    { name: "Cooper Test", unit: "m", category: "endurance" },
    { name: "3 min Step Test", unit: "bpm", category: "endurance" },
  ],
  strength: [
    { name: "1RM Back Squat", unit: "kg", category: "strength" },
    { name: "1RM Deadlift", unit: "kg", category: "strength" },
    { name: "Max Push-ups (1 min)", unit: "reps", category: "strength" },
    { name: "Grip Strength", unit: "kg", category: "strength" },
  ],
  agility: [
    { name: "T-Test", unit: "sec", category: "agility" },
    { name: "Illinois Agility", unit: "sec", category: "agility" },
    { name: "Hexagonal Agility", unit: "sec", category: "agility" },
  ],
};

const CATEGORY_ICONS: Record<string, typeof Timer> = {
  speed: Zap,
  endurance: Wind,
  strength: Dumbbell,
  agility: Timer,
};

interface PhysicalTestingProps {
  mode: "individual" | "coach";
  athleteId?: string;
  athleteName?: string;
}

export function PhysicalTesting({ mode, athleteId, athleteName }: PhysicalTestingProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState("speed");
  const { toast } = useToast();
  const { t } = useLanguage();

  // Coach athlete selection (when no athleteId is provided but mode is coach)
  const [athletes, setAthletes] = useState<CoachAthlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athleteId || "");
  const [selectedAthleteName, setSelectedAthleteName] = useState<string>(athleteName || "");
  const [loadingAthletes, setLoadingAthletes] = useState(mode === "coach" && !athleteId);

  // Form state
  const [selectedTest, setSelectedTest] = useState("");
  const [customTestName, setCustomTestName] = useState("");
  const [testValue, setTestValue] = useState("");
  const [testUnit, setTestUnit] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [testNotes, setTestNotes] = useState("");

  // Load coach's athletes if in coach mode without a pre-selected athlete
  useEffect(() => {
    if (mode === "coach" && !athleteId) {
      loadAthletes();
    }
  }, [mode, athleteId]);

  useEffect(() => {
    const targetId = athleteId || selectedAthleteId;
    if (mode === "coach" && !targetId) {
      setResults([]);
      setLoading(false);
      return;
    }
    loadResults();
  }, [athleteId, selectedAthleteId]);

  const loadAthletes = async () => {
    setLoadingAthletes(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: links } = await supabase
      .from("coach_athletes")
      .select("athlete_id")
      .eq("coach_id", user.id);

    if (links && links.length > 0) {
      const athleteIds = links.map(l => l.athlete_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", athleteIds);

      if (profiles) {
        setAthletes(profiles.map(p => ({ athlete_id: p.user_id, display_name: p.display_name })));
      }
    }
    setLoadingAthletes(false);
  };

  const loadResults = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const targetId = mode === "coach" ? (athleteId || selectedAthleteId) : user.id;
    if (!targetId) { setLoading(false); return; }

    const { data } = await supabase
      .from("physical_test_results" as any)
      .select("*")
      .eq("user_id", targetId)
      .order("test_date", { ascending: false });

    if (data) setResults(data as unknown as TestResult[]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    const finalName = selectedTest === "__custom" ? customTestName.trim() : selectedTest;
    if (!finalName) {
      toast({ title: t("error"), description: t("ptSelectTestError" as any) || "Vælg venligst en test", variant: "destructive" });
      return;
    }
    if (!testValue) {
      toast({ title: t("error"), description: t("ptEnterValueError" as any) || "Indtast venligst en værdi", variant: "destructive" });
      return;
    }
    if (mode === "coach" && !(athleteId || selectedAthleteId)) {
      toast({ title: t("error"), description: t("ptSelectAthleteError" as any) || "Vælg venligst en atlet", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const targetId = mode === "coach" ? (athleteId || selectedAthleteId) : user.id;
    if (!targetId) return;
    const standardTest = Object.values(STANDARD_TESTS).flat().find(t => t.name === finalName);
    const unit = testUnit || standardTest?.unit || "";

    const { error } = await supabase.from("physical_test_results" as any).insert({
      user_id: targetId,
      test_name: finalName,
      category: activeCategory,
      value: parseFloat(testValue),
      unit,
      test_type: mode === "coach" ? "coach" : "individual",
      tested_by: mode === "coach" ? user.id : null,
      notes: testNotes,
      test_date: testDate,
    } as any);

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("ptResultSaved" as any) });
      setSelectedTest("");
      setCustomTestName("");
      setTestValue("");
      setTestUnit("");
      setTestNotes("");
      loadResults();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("physical_test_results" as any).delete().eq("id", id);
    loadResults();
  };

  const categoryResults = results.filter(r => r.category === activeCategory);

  // Group by test name for comparison table
  const groupedByTest = categoryResults.reduce((acc, r) => {
    if (!acc[r.test_name]) acc[r.test_name] = [];
    acc[r.test_name].push(r);
    return acc;
  }, {} as Record<string, TestResult[]>);

  if (loadingAthletes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (loading && (mode !== "coach" || selectedAthleteId || athleteId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[activeCategory] || ClipboardList;
  const currentAthleteName = athleteName || selectedAthleteName;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
          {t("ptTitle" as any)}
          {mode === "coach" && currentAthleteName && (
            <span className="text-muted-foreground font-normal text-base ml-2">— {currentAthleteName}</span>
          )}
        </h2>
      </div>

      {/* Coach athlete selector */}
      {mode === "coach" && !athleteId && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> {t("ptSelectAthlete" as any) || "Select Athlete"}
          </h3>
          {athletes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ptNoAthletes" as any) || "No athletes connected to you."}</p>
          ) : (
            <Select value={selectedAthleteId} onValueChange={(v) => {
              setSelectedAthleteId(v);
              const ath = athletes.find(a => a.athlete_id === v);
              setSelectedAthleteName(ath?.display_name || "");
            }}>
              <SelectTrigger>
                <SelectValue placeholder={t("ptSelectAthlete" as any) || "Select an athlete..."} />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(a => (
                  <SelectItem key={a.athlete_id} value={a.athlete_id}>{a.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-4 w-full">
          {(["speed", "endurance", "strength", "agility"] as const).map(cat => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1 text-xs sm:text-sm">
                <Icon className="h-3.5 w-3.5" />
                {t(`ptCat_${cat}` as any)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(["speed", "endurance", "strength", "agility"] as const).map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-4">
            {/* Add test form */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4" /> {t("ptAddResult" as any)}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Select value={selectedTest} onValueChange={(v) => {
                    setSelectedTest(v);
                    if (v !== "__custom") {
                      const st = STANDARD_TESTS[cat].find(t => t.name === v);
                      if (st) setTestUnit(st.unit);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("ptSelectTest" as any)} />
                    </SelectTrigger>
                    <SelectContent>
                      {STANDARD_TESTS[cat].map(test => (
                        <SelectItem key={test.name} value={test.name}>{test.name}</SelectItem>
                      ))}
                      <SelectItem value="__custom">{t("ptCustomTest" as any)}</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedTest === "__custom" && (
                    <Input
                      className="mt-2"
                      placeholder={t("ptCustomTestName" as any)}
                      value={customTestName}
                      onChange={(e) => setCustomTestName(e.target.value)}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder={t("ptValue" as any)}
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder={t("ptUnit" as any)}
                    value={testUnit}
                    onChange={(e) => setTestUnit(e.target.value)}
                    className="w-20"
                  />
                </div>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                />
                <Input
                  placeholder={t("ptNotes" as any)}
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmit} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {t("ptSaveResult" as any)}
              </Button>
            </div>

            {/* Results comparison table */}
            {Object.keys(groupedByTest).length > 0 ? (
              Object.entries(groupedByTest).map(([testName, testResults]) => (
                <div key={testName} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4 text-primary" />
                    {testName}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-xs text-muted-foreground font-semibold">{t("ptDate" as any)}</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-semibold">{t("ptResult" as any)}</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-semibold">{t("ptChange" as any)}</th>
                          <th className="text-left py-2 text-xs text-muted-foreground font-semibold">{t("ptType" as any)}</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResults.map((r, i) => {
                          const prev = testResults[i + 1];
                          const isLowerBetter = ["sec", "bpm"].includes(r.unit);
                          let changeEl = null;
                          if (prev) {
                            const diff = r.value - prev.value;
                            const improved = isLowerBetter ? diff < 0 : diff > 0;
                            changeEl = (
                              <span className={improved ? "text-green-500 font-semibold" : diff === 0 ? "text-muted-foreground" : "text-red-500 font-semibold"}>
                                {diff > 0 ? "+" : ""}{diff.toFixed(1)} {r.unit}
                              </span>
                            );
                          }
                          return (
                            <tr key={r.id} className="border-b border-border/50 last:border-0">
                              <td className="py-2 text-foreground">{new Date(r.test_date).toLocaleDateString()}</td>
                              <td className="py-2 text-right font-mono font-bold text-foreground">{r.value} {r.unit}</td>
                              <td className="py-2 text-right">{changeEl || "—"}</td>
                              <td className="py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${r.test_type === "coach" ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"}`}>
                                  {r.test_type === "coach" ? t("ptCoachTest" as any) : t("ptIndividualTest" as any)}
                                </span>
                              </td>
                              <td className="py-2 text-right">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
                <CategoryIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("ptNoResults" as any)}</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
