import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Loader2, Trash2, ClipboardList, Users, WifiOff, Pencil, Plus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useOfflinePhysicalTests } from "@/hooks/useOfflinePhysicalTests";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BeepTestTimer } from "@/components/BeepTestTimer";
import { TestCatalogPicker } from "@/components/testing/TestCatalogPicker";
import { TestRunner } from "@/components/testing/TestRunner";
import { AthleteProgressionView } from "@/components/testing/AthleteProgressionView";
import { AthletesComparisonView } from "@/components/testing/AthletesComparisonView";
import {
  TEST_CATEGORIES,
  type TestCategory,
  type TestDefinition,
  findTestByDbName,
  localizedTestName,
} from "@/lib/testCatalog";

interface TestResult {
  id: string;
  local_id: string;
  test_name: string;
  category: string;
  value: number;
  unit: string;
  test_type: string;
  test_date: string;
  notes: string;
  pending: boolean;
}

interface CoachAthlete {
  athlete_id: string;
  display_name: string;
}

interface PhysicalTestingProps {
  mode: "individual" | "coach";
  athleteId?: string;
  athleteName?: string;
}

// Re-export for callers that previously imported this helper.
export const getLocalizedTestName = (englishName: string, t: (key: string) => string, locale?: any): string => {
  const def = findTestByDbName(englishName);
  if (def && locale) return localizedTestName(def, locale);
  return englishName;
};

export function PhysicalTesting({ mode, athleteId, athleteName }: PhysicalTestingProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  // Coach athlete selection (multi)
  const [athletes, setAthletes] = useState<CoachAthlete[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(athleteId ? [athleteId] : []),
  );
  const [focusedAthleteId, setFocusedAthleteId] = useState<string>(athleteId || "");
  const [loadingAthletes, setLoadingAthletes] = useState(mode === "coach" && !athleteId);

  // Run-flow state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [runnerDef, setRunnerDef] = useState<TestDefinition | null>(null);
  const [beepOpen, setBeepOpen] = useState(false);

  // View state
  const [tab, setTab] = useState<string>("results");
  const [activeCategory, setActiveCategory] = useState<TestCategory>("endurance");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (mode === "coach" && !athleteId) void loadAthletes();
  }, [mode, athleteId]);

  // Single user the results table / progression is keyed to
  const targetUserId =
    mode === "coach"
      ? (athleteId || focusedAthleteId || (selectedIds.size > 0 ? Array.from(selectedIds)[0] : null))
      : currentUserId;

  const selectedAthletes = useMemo(
    () => athletes.filter((a) => selectedIds.has(a.athlete_id)),
    [athletes, selectedIds],
  );
  const { results: cachedResults, loading, addResult, removeResult, updateResult, refresh } =
    useOfflinePhysicalTests(targetUserId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const results: TestResult[] = cachedResults.map((r) => ({
    id: r.server_id || r.local_id,
    local_id: r.local_id,
    test_name: r.test_name,
    category: r.category,
    value: r.value,
    unit: r.unit,
    test_type: r.test_type,
    test_date: r.test_date,
    notes: r.notes,
    pending: r.pending,
  }));

  async function loadAthletes() {
    setLoadingAthletes(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingAthletes(false); return; }
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
        setAthletes(
          profiles
            .map(p => ({ athlete_id: p.user_id, display_name: p.display_name }))
            .sort((a, b) => a.display_name.localeCompare(b.display_name)),
        );
      }
    }
    setLoadingAthletes(false);
  }

  function toggleAthlete(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setFocusedAthleteId((cur) => cur || id);
  }
  function selectAllAthletes() {
    setSelectedIds(new Set(athletes.map((a) => a.athlete_id)));
    if (!focusedAthleteId && athletes[0]) setFocusedAthleteId(athletes[0].athlete_id);
  }
  function clearAthletes() {
    setSelectedIds(new Set());
    setFocusedAthleteId("");
  }

  function handleCatalogPick(def: TestDefinition) {
    setPickerOpen(false);
    // The existing dedicated Beep Test flow is preserved.
    if (def.id === "shuttle_beep_20m") {
      setBeepOpen(true);
      return;
    }
    setRunnerDef(def);
  }

  async function handleRunnerSave(
    payload:
      | { value: number; unit: string }
      | { entries: Array<{ athleteId: string; value: number }>; unit: string },
  ) {
    if (!runnerDef) return;
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toISOString().split("T")[0];

    // Group mode
    if ("entries" in payload) {
      if (payload.entries.length === 0) return;
      for (const e of payload.entries) {
        await addResult({
          user_id: e.athleteId,
          test_name: runnerDef.dbTestName,
          category: runnerDef.category,
          value: e.value,
          unit: payload.unit,
          test_type: "coach",
          tested_by: user?.id ?? null,
          notes: "",
          test_date: today,
        });
      }
      toast({
        title: t("ptResultSaved"),
        description: t("ptSavedForN").replace("{n}", String(payload.entries.length)),
      });
      setRunnerDef(null);
      void refresh();
      return;
    }

    // Single-athlete mode
    if (mode === "coach" && !targetUserId) {
      toast({ title: t("error"), description: t("ptSelectAthlete"), variant: "destructive" });
      return;
    }
    const targetId = targetUserId;
    if (!targetId) return;
    await addResult({
      user_id: targetId,
      test_name: runnerDef.dbTestName,
      category: runnerDef.category,
      value: payload.value,
      unit: payload.unit,
      test_type: mode === "coach" ? "coach" : "individual",
      tested_by: mode === "coach" ? (user?.id ?? null) : null,
      notes: "",
      test_date: today,
    });
    toast({ title: t("ptResultSaved") });
    setRunnerDef(null);
  }

  const handleDelete = async (localId: string) => { await removeResult(localId); };


  if (loadingAthletes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (loading && (mode !== "coach" || targetUserId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const focusedAthlete = athletes.find((a) => a.athlete_id === (focusedAthleteId || targetUserId || ""));
  const currentAthleteName = athleteName || focusedAthlete?.display_name || "";
  const categoryResults = results.filter((r) => r.category === activeCategory);
  const groupedByTest = categoryResults.reduce((acc, r) => {
    if (!acc[r.test_name]) acc[r.test_name] = [];
    acc[r.test_name].push(r);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const showAthletePickedUI = mode !== "coach" || athleteId || targetUserId;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
          {t("ptTitle")}
          {mode === "coach" && currentAthleteName && (
            <span className="text-muted-foreground font-normal text-base ml-2">— {currentAthleteName}</span>
          )}
        </h2>
      </div>

      {/* Coach athlete selector (multi) */}
      {mode === "coach" && !athleteId && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> {t("ptSelectAthletes")}
              {selectedIds.size > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({selectedIds.size})</span>
              )}
            </h3>
            {athletes.length > 0 && (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={selectAllAthletes}>
                  {t("ptSelectAll")}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearAthletes} disabled={selectedIds.size === 0}>
                  {t("ptClearSelection")}
                </Button>
              </div>
            )}
          </div>
          {athletes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ptNoAthletes")}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                {athletes.map((a) => {
                  const checked = selectedIds.has(a.athlete_id);
                  return (
                    <label
                      key={a.athlete_id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer transition-colors ${
                        checked ? "border-primary/40 bg-primary/5" : "border-border bg-background hover:bg-muted/30"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleAthlete(a.athlete_id)}
                      />
                      <span className="text-sm truncate flex-1">{a.display_name}</span>
                    </label>
                  );
                })}
              </div>
              {selectedIds.size > 1 && (
                <div className="pt-1">
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    {t("ptFocusAthlete")}
                  </label>
                  <Select value={focusedAthleteId} onValueChange={setFocusedAthleteId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("ptFocusAthlete")} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedAthletes.map((a) => (
                        <SelectItem key={a.athlete_id} value={a.athlete_id}>{a.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      )}


      {/* Tabs: Results | Progression | Compare (coach) */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: mode === "coach" ? "1fr 1fr 1fr" : "1fr 1fr" }}>
          <TabsTrigger value="results">{t("ptResult")}</TabsTrigger>
          <TabsTrigger value="progression">{t("ptProgressionTitle")}</TabsTrigger>
          {mode === "coach" && <TabsTrigger value="compare">{t("ptComparisonTitle")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="results" className="space-y-4 mt-3">
          {showAthletePickedUI && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {TEST_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={activeCategory === cat ? "default" : "outline"}
                    onClick={() => setActiveCategory(cat)}
                    className="h-8 text-xs"
                  >
                    {t(`ptCat_${cat}`)}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setPickerOpen(true)} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> {t("ptRunTest")}
              </Button>
            </div>
          )}

          {!showAthletePickedUI ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("ptSelectAthlete")}
            </div>
          ) : Object.keys(groupedByTest).length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("ptNoResults")}
            </div>
          ) : (
            Object.entries(groupedByTest).map(([testName, testResults]) => {
              const def = findTestByDbName(testName);
              const label = def ? localizedTestName(def, locale) : testName;
              return (
                <div key={testName} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
                  <h3 className="text-sm font-bold text-card-foreground mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" /> {label}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-xs text-muted-foreground font-semibold">{t("ptDate")}</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-semibold">{t("ptResult")}</th>
                          <th className="text-left py-2 text-xs text-muted-foreground font-semibold">{t("ptUnit")}</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-semibold">{t("ptChange")}</th>
                          <th className="text-left py-2 text-xs text-muted-foreground font-semibold">{t("ptType")}</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResults.map((r, i) => {
                          const prev = testResults[i + 1];
                          let changeEl: React.ReactNode = null;
                          if (prev && def) {
                            const diff = r.value - prev.value;
                            const improved = def.direction === "lower_is_better" ? diff < 0 : diff > 0;
                            const same = diff === 0;
                            changeEl = (
                              <span className={same ? "text-muted-foreground" : improved ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                                {diff > 0 ? "+" : ""}{(Math.round(diff * 100) / 100)} {r.unit}
                              </span>
                            );
                          }
                          return (
                            <Fragment key={r.local_id}>
                              <tr className="border-b border-border/50 last:border-0">
                                <td className="py-2 text-card-foreground">
                                  <span className="inline-flex items-center gap-1.5">
                                    {new Date(r.test_date).toLocaleDateString(locale)}
                                    {r.pending && <WifiOff className="h-3 w-3 text-amber-500" aria-label="Pending sync" />}
                                  </span>
                                </td>
                                <td className="py-2 text-right font-mono font-bold text-card-foreground">{r.value}</td>
                                <td className="py-2 text-left text-muted-foreground">{r.unit}</td>
                                <td className="py-2 text-right">{changeEl || "—"}</td>
                                <td className="py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.test_type === "coach" ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"}`}>
                                    {r.test_type === "coach" ? t("ptCoachTest") : t("ptIndividualTest")}
                                  </span>
                                </td>
                                <td className="py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {mode === "coach" && editingId !== r.local_id && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => { setEditingId(r.local_id); setEditValue(String(r.value)); setEditNotes(r.notes || ""); }}>
                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                      </Button>
                                    )}
                                    {mode === "coach" && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.local_id)}>
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {mode === "coach" && editingId === r.local_id && (
                                <tr key={`${r.local_id}-edit`}>
                                  <td colSpan={6} className="pb-3 pt-1 px-1">
                                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                                      <p className="text-xs font-bold text-primary uppercase tracking-wider">{t("ptEditResult")}</p>
                                      <div className="flex gap-2 flex-wrap">
                                        <Input type="text" inputMode="decimal" value={editValue}
                                          onChange={e => setEditValue(e.target.value)}
                                          className="h-8 w-24 text-sm" placeholder={t("ptValue")} />
                                        <Input value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                          className="h-8 flex-1 text-sm" placeholder={t("ptNotes")} />
                                        <Button size="sm" className="h-8" onClick={async () => {
                                          const parsed = Number(editValue.replace(",", "."));
                                          if (!Number.isFinite(parsed)) return;
                                          await updateResult(r.local_id, { value: parsed, notes: editNotes });
                                          setEditingId(null);
                                          toast({ title: t("ptResultSaved") });
                                        }}>{t("save")}</Button>
                                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>{t("cancel")}</Button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="progression" className="space-y-3 mt-3">
          {targetUserId ? (
            <AthleteProgressionView athleteId={targetUserId} />
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("ptSelectAthlete")}
            </div>
          )}
        </TabsContent>

        {mode === "coach" && (
          <TabsContent value="compare" className="space-y-3 mt-3">
            <AthletesComparisonView />
          </TabsContent>
        )}
      </Tabs>

      {/* Catalog picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogTitle>{t("ptOpenCatalog")}</DialogTitle>
          <TestCatalogPicker onPick={handleCatalogPick} />
        </DialogContent>
      </Dialog>

      {/* Runner dialog */}
      <Dialog open={!!runnerDef} onOpenChange={(o) => !o && setRunnerDef(null)}>
        <DialogContent className="max-w-md p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <DialogTitle className="sr-only">{runnerDef ? localizedTestName(runnerDef, locale) : ""}</DialogTitle>
          {runnerDef && (
            <TestRunner
              def={runnerDef}
              onCancel={() => setRunnerDef(null)}
              onSave={handleRunnerSave}
              athletes={
                mode === "coach" && !athleteId && selectedAthletes.length > 1
                  ? selectedAthletes.map((a) => ({ id: a.athlete_id, name: a.display_name }))
                  : undefined
              }
            />

          )}
        </DialogContent>
      </Dialog>

      {/* Existing Beep Test (kept) */}
      <Dialog open={beepOpen} onOpenChange={setBeepOpen}>
        <DialogContent className="max-w-md p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <DialogTitle className="sr-only">{t("beepTestTitle")}</DialogTitle>
          <BeepTestTimer
            mode={mode}
            athletes={athletes}
            currentUserId={currentUserId}
            onSave={async ({ userId, level, shuttle, testType, testedBy }) => {
              const decimalLevel = Math.round((level + shuttle / 100) * 100) / 100;
              await addResult({
                user_id: userId,
                test_name: "Beep Test",
                category: "endurance",
                value: decimalLevel,
                unit: "level",
                test_type: testType,
                tested_by: testedBy,
                notes: `Beep test — level ${level} shuttle ${shuttle}`,
                test_date: new Date().toISOString().split("T")[0],
              });
            }}
            onClose={() => setBeepOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
