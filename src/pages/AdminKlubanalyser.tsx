import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ClipboardList, Mail, MailX, Archive, ArchiveRestore, Sparkles, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DIMENSIONS, LEVELS, QUESTIONS, pointsFor } from "@/data/clubAssessment";
import AnalysisMarkdown from "@/components/admin/AnalysisMarkdown";
import AssessmentRadar from "@/components/admin/AssessmentRadar";

type Row = {
  id: string;
  created_at: string;
  email: string;
  club_name: string | null;
  sport: string | null;
  role: string | null;
  level: number | null;
  scores: number[] | null;
  answers: number[] | null;
  subject_variant: string | null;
  report_sent_at: string | null;
  profile_completed_at: string | null;
  locale: string | null;
  archived_at: string | null;
  ai_analysis: string | null;
  ai_analysis_at: string | null;
  questions_version: number | null;
  member_range: string | null;
  coach_range: string | null;
  followup_status: string | null;
  followup_note: string | null;
};

const STATUSES = [
  { value: "new", label: "Ny" },
  { value: "contacted", label: "Kontaktet" },
  { value: "declined", label: "Afvist" },
  { value: "won", label: "Vundet" },
] as const;

const STATUS_ORDER: Record<string, number> = { new: 0, contacted: 1, won: 2, declined: 3 };

const statusLabel = (v: string | null) =>
  STATUSES.find((s) => s.value === (v || "new"))?.label ?? "Ny";

// Samme regel som i submit-club-assessment: disse besvarelser er test.
const isTestRow = (r: Row) => {
  const e = (r.email || "").toLowerCase();
  return (
    e.endsWith("@sportstalent.dk") ||
    e.includes("+test") ||
    e.endsWith("@example.com") ||
    e.endsWith(".example.com")
  );
};

const maxDimFor = (r: Row) => ((r.questions_version ?? 1) >= 2 ? 12 : 9);

function weakest(scores: number[] | null) {
  if (!Array.isArray(scores) || scores.length !== 5) return null;
  let idx = 0;
  scores.forEach((s, i) => { if (s < scores[idx]) idx = i; });
  return { idx, score: scores[idx], name: DIMENSIONS[idx]?.name ?? "—" };
}

export default function AdminKlubanalyser() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("id");
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [hideTests, setHideTests] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [savingNote, setSavingNote] = useState(false);

  const setStatus = async (r: Row, value: string) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, followup_status: value } : x)));
    const { error } = await supabase
      .from("club_assessments")
      .update({ followup_status: value } as any)
      .eq("id", r.id);
    if (error) { toast.error("Kunne ikke gemme status: " + error.message); return; }
    toast.success("Status gemt");
  };

  const saveNote = async (r: Row) => {
    setSavingNote(true);
    const { error } = await supabase
      .from("club_assessments")
      .update({ followup_note: noteDraft || null } as any)
      .eq("id", r.id);
    setSavingNote(false);
    if (error) { toast.error("Kunne ikke gemme noten: " + error.message); return; }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, followup_note: noteDraft || null } : x)));
    toast.success("Noten er gemt");
  };

  const runAnalysis = async (r: Row) => {
    setAnalyzingId(r.id);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-club-assessment", {
        body: { assessmentId: r.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const analysis = (data as any).analysis as string;
      const at = (data as any).analysis_at as string;
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, ai_analysis: analysis, ai_analysis_at: at } : x)));
      toast.success("Analysen er klar");
    } catch (e: any) {
      toast.error("Kunne ikke lave analysen: " + (e?.message ?? "ukendt fejl"));
    } finally {
      setAnalyzingId(null);
    }
  };

  const toggleArchive = async (r: Row) => {
    setBusyId(r.id);
    const next = r.archived_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from("club_assessments")
      .update({ archived_at: next } as any)
      .eq("id", r.id);
    setBusyId(null);
    if (error) { toast.error("Kunne ikke arkivere: " + error.message); return; }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, archived_at: next } : x)));
    toast.success(next ? "Besvarelsen er arkiveret" : "Besvarelsen er hentet frem igen");
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("club_assessments")
        .select("id, created_at, email, club_name, sport, role, level, scores, answers, subject_variant, report_sent_at, profile_completed_at, locale, archived_at, ai_analysis, ai_analysis_at, questions_version, member_range, coach_range, followup_status, followup_note")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const visibleRows = useMemo(
    () =>
      rows
        .filter((r) => (showArchived ? true : !r.archived_at))
        .filter((r) => (hideTests ? !isTestRow(r) : true))
        .filter((r) => (statusFilter === "all" ? true : (r.followup_status || "new") === statusFilter))
        .sort((a, b) => {
          const d = (STATUS_ORDER[a.followup_status || "new"] ?? 0) - (STATUS_ORDER[b.followup_status || "new"] ?? 0);
          if (d !== 0) return d;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [rows, showArchived, hideTests, statusFilter]
  );
  const testCount = rows.filter(isTestRow).length;
  const newCount = rows.filter((r) => !r.archived_at && (r.followup_status || "new") === "new").length;
  const archivedCount = rows.filter((r) => r.archived_at).length;

  const variantCounts = useMemo(() => {
    const m: Record<string, number> = {};
    rows.filter((r) => r.report_sent_at).forEach((r) => {
      const v = r.subject_variant || "—";
      m[v] = (m[v] ?? 0) + 1;
    });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage
        </Button>

        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">Klubanalyser</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle besvarelser af klubanalysen, nyeste først. Besvarelser fra @sportstalent.dk er markeret som test.
        </p>

        {/* A/B-panel */}
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Emnelinje A/B</h2>
          {variantCounts.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Ingen rapportmails sendt endnu.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3">
              {variantCounts.map(([v, n]) => (
                <div key={v} className="rounded-lg bg-muted px-3 py-2">
                  <div className="text-xs text-muted-foreground">Variant {v}</div>
                  <div className="text-lg font-bold text-foreground">{n} sendt</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Åbnings- og klikdata registreres ikke af mailsystemet. A/B-testen kan i dag kun
            aflæses på antal sendte mails pr. variant — ikke på effekt.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Skjul arkiverede" : `Vis arkiverede (${archivedCount})`}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setHideTests((v) => !v)}>
            {hideTests ? `Vis test (${testCount})` : "Skjul test"}
          </Button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            <option value="all">Alle statusser</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Badge variant="outline" className="border-amber-500 text-amber-500">{newCount} nye</Badge>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <p className="mt-10 text-sm text-destructive">Kunne ikke hente besvarelser: {error}</p>
        ) : visibleRows.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">Ingen besvarelser endnu.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Dato</th>
                  <th className="px-3 py-2 text-left">Klub</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Sport</th>
                  <th className="px-3 py-2 text-left">Rolle</th>
                  <th className="px-3 py-2 text-left">Niveau</th>
                  <th className="px-3 py-2 text-left">Svagest</th>
                  <th className="px-3 py-2 text-left">Variant</th>
                  <th className="px-3 py-2 text-left">Rapport</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Arkiv</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const w = weakest(r.scores);
                  const test = isTestRow(r);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setParams(selectedId === r.id ? {} : { id: r.id })}
                      className={`cursor-pointer border-t border-border hover:bg-accent/40 ${selectedId === r.id ? "bg-accent/60" : ""}`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        {r.club_name || <span className="text-muted-foreground">ikke oplyst</span>}
                        {test && <Badge variant="outline" className="ml-2 border-amber-500 text-amber-500">TEST</Badge>}
                        {r.archived_at && <Badge variant="outline" className="ml-2 text-muted-foreground">ARKIVERET</Badge>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.sport || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.role || "—"}</td>
                      <td className="px-3 py-2 text-foreground">{r.level ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w ? `${w.name} (${w.score}/${maxDimFor(r)})` : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.subject_variant || "—"}</td>
                      <td className="px-3 py-2">
                        {r.report_sent_at ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500">
                            <Mail className="h-3.5 w-3.5" />
                            {format(new Date(r.report_sent_at), "dd/MM HH:mm")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MailX className="h-3.5 w-3.5" /> ikke sendt
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={r.followup_status || "new"}
                          onChange={(e) => setStatus(r, e.target.value)}
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={(e) => { e.stopPropagation(); toggleArchive(r); }}
                          title={r.archived_at ? "Hent frem igen" : "Arkivér"}
                        >
                          {busyId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : r.archived_at ? (
                            <ArchiveRestore className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div className="print-area mt-6 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-foreground">
                {selected.club_name || "Klub ikke oplyst"}{" "}
                <span className="text-sm font-normal text-muted-foreground">— {selected.email}</span>
              </h2>
              <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Udskriv
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Niveau {selected.level ?? "—"}
              {selected.level ? ` — ${LEVELS[selected.level - 1]?.name ?? ""}` : ""} ·{" "}
              {selected.member_range ? `${selected.member_range} medlemmer · ` : ""}
              {selected.coach_range ? `${selected.coach_range} trænere · ` : ""}
              {`Spørgsmålsversion ${selected.questions_version ?? 1}`} ·{" "}
              {selected.report_sent_at
                ? `Rapportmail leveret ${format(new Date(selected.report_sent_at), "dd/MM/yyyy HH:mm")}`
                : "Rapportmail ikke sendt"}
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">Profil</h3>
            <AssessmentRadar scores={selected.scores} max={maxDimFor(selected)} />

            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
              <h3 className="text-sm font-semibold text-foreground">
                Opfølgning — status: {statusLabel(selected.followup_status)}
              </h3>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                placeholder="Kort note om opfølgningen…"
                className="no-print mt-2 w-full rounded-md border border-border bg-background p-2 text-sm text-foreground"
              />
              <Button size="sm" className="no-print mt-2" disabled={savingNote} onClick={() => saveNote(selected)}>
                {savingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Gem note
              </Button>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-foreground">Dimensioner</h3>
            <ul className="mt-2 space-y-1">
              {DIMENSIONS.map((d, i) => (
                <li key={d.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold text-foreground">{selected.scores?.[i] ?? "—"}/{maxDimFor(selected)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Klubanalyse
                </h3>
                <Button
                  size="sm"
                  className="no-print"
                  disabled={analyzingId === selected.id}
                  onClick={() => runAnalysis(selected)}
                >
                  {analyzingId === selected.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyserer…
                    </>
                  ) : selected.ai_analysis ? (
                    "Lav ny analyse"
                  ) : (
                    "Lav analyse"
                  )}
                </Button>
              </div>
              {selected.ai_analysis ? (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Genereret {selected.ai_analysis_at ? format(new Date(selected.ai_analysis_at), "dd/MM/yyyy HH:mm") : "—"}
                  </p>
                  <div className="mt-3">
                    <AnalysisMarkdown text={selected.ai_analysis} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="no-print mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(selected.ai_analysis || "");
                      toast.success("Analysen er kopieret");
                    }}
                  >
                    Kopiér tekst
                  </Button>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Få en samlet vurdering af klubbens svar med styrker, kritiske huller,
                  90-dages handlingsplan og spørgsmål til salgssamtalen.
                </p>
              )}
            </div>


            {Array.isArray(selected.answers) && (selected.questions_version ?? 1) < 2 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-foreground">Svar pr. spørgsmål</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Besvarelsen er fra den gamle version med 15 spørgsmål. Spørgsmålsteksterne
                  gemmes ikke for den version — rå svar: {selected.answers.join(", ")}
                </p>
              </>
            )}

            {Array.isArray(selected.answers) && (selected.questions_version ?? 1) >= 2 && selected.answers.length === QUESTIONS.length && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-foreground">Svar pr. spørgsmål</h3>
                <ol className="mt-2 space-y-3">
                  {QUESTIONS.map((q, i) => (
                    <li key={i} className="text-sm">
                      <div className="text-muted-foreground">{i + 1}. {q.text}</div>
                      <div className="text-foreground">
                        → {selected.answers![i] === -1 ? "Ved ikke" : q.options[selected.answers![i]] ?? "—"}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({pointsFor(q, selected.answers![i])}/3 · {DIMENSIONS[q.dim]?.name}
                          {q.reverse ? " · omvendt" : ""})
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
