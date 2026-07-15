// Coach page: run a single team test session (guided or grid entry).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, CheckCircle2, PlayCircle, ChevronRight, Save, Clock, Printer } from "lucide-react";
import { generateTestSheetsPdf } from "@/lib/testSheetPdf";
import { TestRunner, type TestRunResult } from "@/components/testing/TestRunner";
import {
  findTestByDbName,
  findTestById,
  localizedTestName,
  type TestDefinition,
} from "@/lib/testCatalog";
import {
  getSession,
  listSessionResults,
  markSessionCompleted,
  type TeamTestSession,
  type TeamTestSessionTest,
} from "@/lib/teamTestSessionApi";
import { useOfflinePhysicalTests } from "@/hooks/useOfflinePhysicalTests";

interface AthleteInfo { id: string; name: string; birth_date?: string | null }

export default function CoachTestSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeClubId, activeMembership } = useActiveClub();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<TeamTestSession | null>(null);
  const [tests, setTests] = useState<TeamTestSessionTest[]>([]);
  const [athletes, setAthletes] = useState<AthleteInfo[]>([]);
  const [results, setResults] = useState<Array<{ user_id: string; test_name: string; value: number; unit: string }>>([]);
  const [runnerTestIndex, setRunnerTestIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { addResult } = useOfflinePhysicalTests(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const { session, tests, athletes } = await getSession(sessionId);
      setSession(session);
      setTests(tests);
      // Look up athlete names via club member profiles
      if (activeClubId) {
        const { data: members } = await supabase.rpc("get_club_member_profiles" as any, { _club_id: activeClubId });
        const nameById = new Map<string, string>();
        ((members as any[]) ?? []).forEach((m) => nameById.set(m.user_id, m.display_name ?? ""));
        const ids = athletes.map((a) => a.athlete_id);
        const bdayById = new Map<string, string | null>();
        if (ids.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, birth_date")
            .in("user_id", ids);
          ((profs as any[]) ?? []).forEach((p) => bdayById.set(p.user_id, p.birth_date ?? null));
        }
        setAthletes(athletes.map((a) => ({
          id: a.athlete_id,
          name: nameById.get(a.athlete_id) ?? "?",
          birth_date: bdayById.get(a.athlete_id) ?? null,
        })).sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setAthletes(athletes.map((a) => ({ id: a.athlete_id, name: "?" })));
      }
      const rs = await listSessionResults(sessionId);
      setResults(rs.map((r) => ({ user_id: r.user_id, test_name: r.test_name, value: r.value, unit: r.unit })));
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [sessionId, activeClubId, t, toast]);

  useEffect(() => { void load(); }, [load]);

  const resultKey = (userId: string, testName: string) => `${userId}::${testName}`;
  const resultMap = useMemo(() => {
    const m = new Map<string, { value: number; unit: string }>();
    results.forEach((r) => m.set(resultKey(r.user_id, r.test_name), { value: r.value, unit: r.unit }));
    return m;
  }, [results]);

  async function saveEntries(def: TestDefinition, entries: Array<{ athleteId: string; value: number }>) {
    if (!session || !userId) return;
    for (const e of entries) {
      await addResult({
        user_id: e.athleteId,
        test_name: def.dbTestName,
        category: def.category,
        value: e.value,
        unit: def.unit,
        test_type: "coach",
        tested_by: userId,
        notes: "",
        test_date: session.session_date,
        session_id: session.id,
      });
    }
    // Optimistically merge into local results view
    setResults((prev) => {
      const next = prev.filter((r) => !entries.some((e) => e.athleteId === r.user_id && r.test_name === def.dbTestName));
      entries.forEach((e) => next.push({ user_id: e.athleteId, test_name: def.dbTestName, value: e.value, unit: def.unit }));
      return next;
    });
    toast({ title: t("ptResultSaved"), description: t("ptSavedForN").replace("{n}", String(entries.length)) });
  }

  async function handleComplete() {
    if (!session) return;
    try {
      await markSessionCompleted(session.id, session.status !== "completed");
      setSession({ ...session, status: session.status === "completed" ? "in_progress" : "completed" });
      toast({ title: session.status === "completed" ? t("ptSessionReopened") : t("ptSessionCompleted") });
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message, variant: "destructive" });
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!session) {
    return <div className="p-6 text-center text-muted-foreground">{t("notFound")}</div>;
  }

  const testDefs = tests.map((t) => findTestById(t.test_id) ?? findTestByDbName(t.test_name)).filter((d): d is TestDefinition => !!d);
  const totalCells = testDefs.length * athletes.length;
  const filledCells = testDefs.reduce((acc, def) => acc + athletes.filter((a) => resultMap.has(resultKey(a.id, def.dbTestName))).length, 0);
  const progressPct = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/coach/testing/sessions" className="text-muted-foreground hover:text-foreground p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold truncate">{session.name}</h1>
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <Clock className="h-3 w-3" /> {new Date(session.session_date).toLocaleDateString(locale)}
            <span>· {athletes.length} {t("ptSelectedCount")}</span>
            <span>· {testDefs.length} {t("ptWizSelectedTests")}</span>
            {session.status === "completed" && (
              <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />{t("ptSessionCompleted")}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              if (athletes.length === 0 || testDefs.length === 0) {
                toast({ title: t("error"), description: t("ptNoAthletesOrTests") });
                return;
              }
              try {
                await generateTestSheetsPdf(
                  athletes.map((a) => ({ id: a.id, name: a.name, birth_date: a.birth_date })),
                  testDefs,
                  {
                    sessionName: session.name,
                    sessionDate: session.session_date,
                    clubName: activeMembership?.club_name ?? null,
                    locale,
                  },
                );
              } catch (e: any) {
                toast({ title: t("error"), description: e?.message, variant: "destructive" });
              }
            }}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            {t("ptPrintSheet")}
          </Button>
          <Button variant={session.status === "completed" ? "outline" : "default"} onClick={handleComplete} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            {session.status === "completed" ? t("ptSessionReopen") : t("ptSessionMarkComplete")}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("ptSessionProgress")}</span>
          <span>{filledCells}/{totalCells} · {progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Entry area: guided or grid */}
      {session.entry_mode === "guided" ? (
        <GuidedMode
          testDefs={testDefs}
          athletes={athletes}
          resultMap={resultMap}
          onRun={(i) => setRunnerTestIndex(i)}
        />
      ) : (
        <GridMode
          testDefs={testDefs}
          athletes={athletes}
          resultMap={resultMap}
          onRun={(i) => setRunnerTestIndex(i)}
          onSaveCell={async (def, athleteId, value) => saveEntries(def, [{ athleteId, value }])}
        />
      )}

      {/* Runner dialog */}
      <Dialog open={runnerTestIndex !== null} onOpenChange={(o) => { if (!o) setRunnerTestIndex(null); }}>
        <DialogContent className="max-w-md p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <DialogTitle className="sr-only">
            {runnerTestIndex !== null ? localizedTestName(testDefs[runnerTestIndex], locale) : ""}
          </DialogTitle>
          {runnerTestIndex !== null && (
            <TestRunner
              def={testDefs[runnerTestIndex]}
              onCancel={() => setRunnerTestIndex(null)}
              athletes={athletes.map((a) => ({ id: a.id, name: a.name }))}
              onSave={async (payload: TestRunResult) => {
                const def = testDefs[runnerTestIndex];
                if ("entries" in payload) {
                  await saveEntries(def, payload.entries);
                }
                // Auto-advance in guided mode
                if (session.entry_mode === "guided" && runnerTestIndex < testDefs.length - 1) {
                  setRunnerTestIndex(runnerTestIndex + 1);
                } else {
                  setRunnerTestIndex(null);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuidedMode({
  testDefs, athletes, resultMap, onRun,
}: {
  testDefs: TestDefinition[];
  athletes: AthleteInfo[];
  resultMap: Map<string, { value: number; unit: string }>;
  onRun: (index: number) => void;
}) {
  const { t, locale } = useLanguage();
  return (
    <ol className="space-y-2">
      {testDefs.map((def, i) => {
        const filled = athletes.filter((a) => resultMap.has(`${a.id}::${def.dbTestName}`)).length;
        const done = filled === athletes.length && athletes.length > 0;
        return (
          <li key={def.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            <span className="shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-card-foreground truncate">{localizedTestName(def, locale)}</div>
              <div className="text-[11px] text-muted-foreground">
                {t(`ptCat_${def.category}`)} · {def.unit} · {filled}/{athletes.length} {t("ptWizAthletes")}
              </div>
            </div>
            {done && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            <Button size="sm" onClick={() => onRun(i)} className="gap-1.5">
              <PlayCircle className="h-4 w-4" /> {done ? t("ptRedo") : t("ptStartTest")}
            </Button>
          </li>
        );
      })}
    </ol>
  );
}

function GridMode({
  testDefs, athletes, resultMap, onRun, onSaveCell,
}: {
  testDefs: TestDefinition[];
  athletes: AthleteInfo[];
  resultMap: Map<string, { value: number; unit: string }>;
  onRun: (index: number) => void;
  onSaveCell: (def: TestDefinition, athleteId: string, value: number) => Promise<void>;
}) {
  const { t, locale } = useLanguage();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const key = (a: string, tn: string) => `${a}::${tn}`;

  async function commit(def: TestDefinition, athleteId: string) {
    const raw = (drafts[key(athleteId, def.dbTestName)] ?? "").replace(",", ".").trim();
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    await onSaveCell(def, athleteId, n);
    setDrafts((prev) => { const n = { ...prev }; delete n[key(athleteId, def.dbTestName)]; return n; });
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 text-xs text-muted-foreground font-semibold sticky left-0 bg-card z-10">
              {t("ptWizAthletes")}
            </th>
            {testDefs.map((def, i) => (
              <th key={def.id} className="text-left p-2 text-xs font-semibold min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <span className="truncate">{localizedTestName(def, locale)}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => onRun(i)} aria-label={t("ptStartTest")}>
                    <PlayCircle className="h-3.5 w-3.5 text-primary" />
                  </Button>
                </div>
                <span className="text-[10px] text-muted-foreground font-normal">{def.unit}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {athletes.map((a) => (
            <tr key={a.id} className="border-b border-border/50 last:border-0">
              <td className="p-2 font-medium text-card-foreground sticky left-0 bg-card z-10 whitespace-nowrap">{a.name}</td>
              {testDefs.map((def) => {
                const k = key(a.id, def.dbTestName);
                const saved = resultMap.get(k);
                const draft = drafts[k];
                const shown = draft ?? (saved ? String(saved.value) : "");
                return (
                  <td key={def.id} className="p-1.5">
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={shown}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [k]: e.target.value }))}
                        onBlur={() => (draft !== undefined ? commit(def, a.id) : undefined)}
                        onKeyDown={(e) => { if (e.key === "Enter") void commit(def, a.id); }}
                        className={`h-8 w-20 text-sm text-right font-mono ${saved ? "bg-primary/5" : ""}`}
                        placeholder={def.unit}
                      />
                      {draft !== undefined && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => void commit(def, a.id)}>
                          <Save className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Small ChevronRight placeholder to keep import list stable in case of future use.
export const _unused = ChevronRight;
