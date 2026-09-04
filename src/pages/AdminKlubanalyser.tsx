import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ClipboardList, Mail, MailX, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DIMENSIONS, LEVELS, QUESTIONS } from "@/data/clubAssessment";

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
};

const isTestRow = (r: Row) => (r.email || "").toLowerCase().endsWith("@sportstalent.dk");

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
        .select("id, created_at, email, club_name, sport, role, level, scores, answers, subject_variant, report_sent_at, profile_completed_at, locale, archived_at")
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
    () => rows.filter((r) => (showArchived ? true : !r.archived_at)),
    [rows, showArchived]
  );
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
                      <td className="px-3 py-2 text-muted-foreground">{w ? `${w.name} (${w.score}/9)` : "—"}</td>
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
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-bold text-foreground">
              {selected.club_name || "Klub ikke oplyst"}{" "}
              <span className="text-sm font-normal text-muted-foreground">— {selected.email}</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Niveau {selected.level ?? "—"}
              {selected.level ? ` — ${LEVELS[selected.level - 1]?.name ?? ""}` : ""} ·{" "}
              {selected.report_sent_at
                ? `Rapportmail leveret ${format(new Date(selected.report_sent_at), "dd/MM/yyyy HH:mm")}`
                : "Rapportmail ikke sendt"}
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">Dimensioner</h3>
            <ul className="mt-2 space-y-1">
              {DIMENSIONS.map((d, i) => (
                <li key={d.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold text-foreground">{selected.scores?.[i] ?? "—"}/9</span>
                </li>
              ))}
            </ul>

            {Array.isArray(selected.answers) && selected.answers.length === QUESTIONS.length && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-foreground">Svar pr. spørgsmål</h3>
                <ol className="mt-2 space-y-3">
                  {QUESTIONS.map((q, i) => (
                    <li key={i} className="text-sm">
                      <div className="text-muted-foreground">{i + 1}. {q.text}</div>
                      <div className="text-foreground">
                        → {q.options[selected.answers![i]] ?? "—"}{" "}
                        <span className="text-xs text-muted-foreground">({selected.answers![i]}/3 · {DIMENSIONS[q.dim]?.name})</span>
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
