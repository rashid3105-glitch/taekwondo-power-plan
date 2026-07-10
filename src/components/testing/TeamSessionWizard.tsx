// Wizard to create a Team Test Session (athletes → tests → name/mode).
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Search, Users, ClipboardList, Grid3x3, PlayCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  TEST_CATALOG,
  TEST_CATEGORIES,
  findTestById,
  localizedTestName,
  type TestCategory,
  type TestDefinition,
} from "@/lib/testCatalog";
import { cn } from "@/lib/utils";

export interface CoachAthlete { athlete_id: string; display_name: string }

export interface WizardResult {
  name: string;
  session_date: string;
  entry_mode: "guided" | "grid";
  focus_areas: string[];
  notes: string;
  tests: Array<{ test_id: string; test_name: string }>;
  athlete_ids: string[];
}

interface Props {
  athletes: CoachAthlete[];
  onCancel: () => void;
  onCreate: (r: WizardResult) => Promise<void>;
}

export function TeamSessionWizard({ athletes, onCancel, onCreate }: Props) {
  const { t, locale } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [athleteQuery, setAthleteQuery] = useState("");
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const filteredAthletes = useMemo(() => {
    const q = athleteQuery.trim().toLowerCase();
    return q ? athletes.filter((a) => a.display_name.toLowerCase().includes(q)) : athletes;
  }, [athleteQuery, athletes]);

  // Step 2
  const [pickMode, setPickMode] = useState<"ai" | "manual">("ai");
  const [focuses, setFocuses] = useState<Set<TestCategory>>(new Set());
  const [intensity, setIntensity] = useState<"short" | "full">("short");
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [manualQuery, setManualQuery] = useState("");
  const filteredCatalog = useMemo(() => {
    const q = manualQuery.trim().toLowerCase();
    if (!q) return TEST_CATALOG;
    return TEST_CATALOG.filter((d) => localizedTestName(d, locale).toLowerCase().includes(q));
  }, [manualQuery, locale]);

  // Step 3
  const [name, setName] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entryMode, setEntryMode] = useState<"guided" | "grid">("guided");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (name) return;
    const focusPart = Array.from(focuses).slice(0, 2).map((f) => t(`ptCat_${f}`)).join(" + ");
    setName(focusPart ? `${focusPart} — ${sessionDate}` : `${t("ptTeamTestSession")} — ${sessionDate}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focuses]);

  function toggleAthlete(id: string) {
    setSelectedAthletes((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAllAthletes() {
    setSelectedAthletes((prev) =>
      prev.size === filteredAthletes.length ? new Set() : new Set(filteredAthletes.map((a) => a.athlete_id)),
    );
  }
  function toggleFocus(c: TestCategory) {
    setFocuses((prev) => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });
  }
  function toggleTestId(id: string) {
    setSelectedTestIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function requestAiSuggestion() {
    setAiLoading(true); setAiError(null); setAiRationale(null);
    try {
      const catalog = TEST_CATALOG.map((d) => ({
        id: d.id, category: d.category, name: d.names.en, unit: d.unit,
      }));
      const { data, error } = await supabase.functions.invoke("suggest-test-battery", {
        body: {
          focuses: Array.from(focuses),
          intensity,
          notes: aiNotes,
          catalog,
        },
      });
      if (error) throw error;
      const ids: string[] = Array.isArray((data as any)?.test_ids) ? (data as any).test_ids : [];
      setSelectedTestIds(ids);
      setAiRationale(String((data as any)?.rationale ?? ""));
    } catch (e: any) {
      setAiError(e?.message || t("error"));
    } finally {
      setAiLoading(false);
    }
  }

  const selectedTestDefs = selectedTestIds
    .map((id) => findTestById(id))
    .filter((d): d is TestDefinition => !!d);

  const canNext1 = selectedAthletes.size > 0;
  const canNext2 = selectedTestIds.length > 0;
  const canFinish = name.trim().length > 0 && sessionDate.length > 0;

  async function handleFinish() {
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        session_date: sessionDate,
        entry_mode: entryMode,
        focus_areas: Array.from(focuses),
        notes: notes.trim(),
        tests: selectedTestDefs.map((d) => ({ test_id: d.id, test_name: d.dbTestName })),
        athlete_ids: Array.from(selectedAthletes),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center font-bold",
              step === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}>{n}</div>
            {n < 3 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
        <span className="ml-2">
          {step === 1 ? t("ptWizStepAthletes") : step === 2 ? t("ptWizStepTests") : t("ptWizStepReview")}
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={athleteQuery} onChange={(e) => setAthleteQuery(e.target.value)}
              placeholder={t("search") || "Search"} className="pl-9" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> {t("ptSelectAthletes")}
              <Badge variant="secondary">{selectedAthletes.size}</Badge>
            </span>
            <button type="button" onClick={toggleAllAthletes}
              className="text-xs text-primary font-semibold hover:underline">
              {selectedAthletes.size === filteredAthletes.length && filteredAthletes.length > 0
                ? t("beepTestDeselectAll") : t("ptSelectAll")}
            </button>
          </div>
          <div className="rounded-lg border border-border divide-y divide-border max-h-72 overflow-y-auto">
            {filteredAthletes.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("ptNoAthletes")}</p>
            )}
            {filteredAthletes.map((a) => (
              <label key={a.athlete_id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                <Checkbox checked={selectedAthletes.has(a.athlete_id)}
                  onCheckedChange={() => toggleAthlete(a.athlete_id)} />
                <span className="text-sm font-medium">{a.display_name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Tabs value={pickMode} onValueChange={(v) => setPickMode(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="ai" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />{t("ptWizAiTab")}</TabsTrigger>
              <TabsTrigger value="manual" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" />{t("ptWizManualTab")}</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-3 mt-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("ptWizFocusAreas")}</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TEST_CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => toggleFocus(c)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                        focuses.has(c)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-accent/30",
                      )}>
                      {t(`ptCat_${c}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("ptWizIntensity")}</label>
                <div className="mt-2 flex gap-2">
                  {(["short", "full"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setIntensity(v)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm font-semibold border",
                        intensity === v
                          ? "bg-primary/10 text-primary border-primary"
                          : "bg-card text-foreground border-border hover:bg-accent/30",
                      )}>
                      {v === "short" ? t("ptWizIntensityShort") : t("ptWizIntensityFull")}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea value={aiNotes} onChange={(e) => setAiNotes(e.target.value)}
                placeholder={t("ptWizNotesPlaceholder")} rows={2} />
              <Button onClick={requestAiSuggestion} disabled={focuses.size === 0 || aiLoading} className="w-full gap-2">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {t("ptWizSuggest")}
              </Button>
              {aiError && <p className="text-sm text-destructive">{aiError}</p>}
              {aiRationale && <p className="text-xs text-muted-foreground italic">{aiRationale}</p>}

              {selectedTestDefs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("ptWizSuggestedBattery")} ({selectedTestDefs.length})
                  </div>
                  <ul className="rounded-lg border border-border divide-y divide-border">
                    {selectedTestDefs.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 px-3 py-2">
                        <Checkbox checked={selectedTestIds.includes(d.id)} onCheckedChange={() => toggleTestId(d.id)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{localizedTestName(d, locale)}</div>
                          <div className="text-[10px] text-muted-foreground">{t(`ptCat_${d.category}`)} · {d.unit}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-3 mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={manualQuery} onChange={(e) => setManualQuery(e.target.value)}
                  placeholder={t("ptPickTestPrompt")} className="pl-9" />
              </div>
              <div className="rounded-lg border border-border divide-y divide-border max-h-80 overflow-y-auto">
                {filteredCatalog.map((d) => {
                  const active = selectedTestIds.includes(d.id);
                  return (
                    <label key={d.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                      <Checkbox checked={active} onCheckedChange={() => toggleTestId(d.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{localizedTestName(d, locale)}</div>
                        <div className="text-[10px] text-muted-foreground">{t(`ptCat_${d.category}`)} · {d.unit}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedTestIds.length} {t("ptWizSelectedTests")}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("ptWizSessionName")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("ptDate")}</label>
            <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("ptWizEntryMode")}</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEntryMode("guided")}
                className={cn(
                  "p-3 rounded-lg border text-left space-y-1",
                  entryMode === "guided" ? "bg-primary/10 border-primary text-foreground" : "border-border hover:bg-accent/30",
                )}>
                <div className="flex items-center gap-1.5 text-sm font-semibold"><PlayCircle className="h-4 w-4" />{t("ptWizModeGuided")}</div>
                <div className="text-[11px] text-muted-foreground">{t("ptWizModeGuidedDesc")}</div>
              </button>
              <button type="button" onClick={() => setEntryMode("grid")}
                className={cn(
                  "p-3 rounded-lg border text-left space-y-1",
                  entryMode === "grid" ? "bg-primary/10 border-primary text-foreground" : "border-border hover:bg-accent/30",
                )}>
                <div className="flex items-center gap-1.5 text-sm font-semibold"><Grid3x3 className="h-4 w-4" />{t("ptWizModeGrid")}</div>
                <div className="text-[11px] text-muted-foreground">{t("ptWizModeGridDesc")}</div>
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("ptNotes")}</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <div>{selectedAthletes.size} {t("ptSelectedCount")} · {selectedTestDefs.length} {t("ptWizSelectedTests")}</div>
            {focuses.size > 0 && (
              <div className="flex flex-wrap gap-1">
                {Array.from(focuses).map((f) => (
                  <Badge key={f} variant="secondary" className="text-[10px]">{t(`ptCat_${f}`)}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-2">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep((s) => (s === 3 ? 2 : 1))} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> {t("back") || "Back"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
            disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
            className="gap-1.5"
          >
            {t("next") || "Next"} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={!canFinish || saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("ptWizCreateSession")}
          </Button>
        )}
      </div>
    </div>
  );
}
