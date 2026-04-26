// Coach-side view of an athlete's mental performance assessments.
// Lists the assessment history (latest first), shows category radar for the
// most recent entry, and lets the coach drill into the AI-generated advice.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { MentalRadarChart } from "@/components/MentalRadarChart";
import { Brain, ChevronRight, Loader2 } from "lucide-react";

type SupportedLocale = "en" | "da" | "sv" | "de" | "ar";

const categoryLabels: Record<string, Record<SupportedLocale, string>> = {
  mentalToughness: { en: "Mental Toughness", da: "Mental styrke", sv: "Mental styrka", de: "Mentale Stärke", ar: "القوة الذهنية" },
  competitionAnxiety: { en: "Competition Anxiety", da: "Konkurrenceangst", sv: "Tävlingsångest", de: "Wettkampfangst", ar: "قلق المنافسة" },
  focusConcentration: { en: "Focus & Concentration", da: "Fokus & koncentration", sv: "Fokus & koncentration", de: "Fokus & Konzentration", ar: "التركيز والانتباه" },
  recoveryFromLoss: { en: "Recovery from Loss", da: "Håndtering af nederlag", sv: "Återhämtning efter förlust", de: "Erholung nach Niederlagen", ar: "التعافي من الخسارة" },
  confidence: { en: "Confidence", da: "Selvtillid", sv: "Självförtroende", de: "Selbstvertrauen", ar: "الثقة بالنفs" },
  motivation: { en: "Motivation", da: "Motivation", sv: "Motivation", de: "Motivation", ar: "التحفيز" },
};

const t = {
  en: {
    title: "Mental Performance",
    none: "No mental assessments yet.",
    score: "Score",
    summary: "Summary",
    strengths: "Strengths",
    areasToImprove: "Areas to Improve",
    affirmations: "Personal Affirmations",
    preCompRoutine: "Pre-Competition Routine",
    history: "Assessment History",
    tapToView: "Tap to view",
    noAdvice: "No personalized advice was generated for this assessment.",
    latestVsPrev: "Latest vs. previous",
  },
  da: {
    title: "Mental præstation",
    none: "Ingen mentale vurderinger endnu.",
    score: "Score",
    summary: "Resumé",
    strengths: "Styrker",
    areasToImprove: "Områder at forbedre",
    affirmations: "Personlige affirmationer",
    preCompRoutine: "Rutine før konkurrence",
    history: "Historik",
    tapToView: "Tryk for at se",
    noAdvice: "Der blev ikke genereret personlig rådgivning for denne vurdering.",
    latestVsPrev: "Seneste vs. forrige",
  },
  sv: {
    title: "Mental prestation",
    none: "Inga mentala bedömningar än.",
    score: "Poäng",
    summary: "Sammanfattning",
    strengths: "Styrkor",
    areasToImprove: "Områden att förbättra",
    affirmations: "Personliga affirmationer",
    preCompRoutine: "Rutin före tävling",
    history: "Historik",
    tapToView: "Tryck för att visa",
    noAdvice: "Ingen personlig rådgivning genererades för denna bedömning.",
    latestVsPrev: "Senaste vs. föregående",
  },
  de: {
    title: "Mentale Leistung",
    none: "Noch keine mentalen Bewertungen.",
    score: "Punktzahl",
    summary: "Zusammenfassung",
    strengths: "Stärken",
    areasToImprove: "Verbesserungsbereiche",
    affirmations: "Persönliche Affirmationen",
    preCompRoutine: "Routine vor dem Wettkampf",
    history: "Verlauf",
    tapToView: "Tippen zum Anzeigen",
    noAdvice: "Für diese Bewertung wurde keine persönliche Beratung erstellt.",
    latestVsPrev: "Aktuell vs. vorherige",
  },
  ar: {
    title: "الأداء الذهني",
    none: "لا توجد تقييمات ذهنية بعد.",
    score: "النتيجة",
    summary: "الملخص",
    strengths: "نقاط القوة",
    areasToImprove: "مجالات التحسين",
    affirmations: "تأكيدات شخصية",
    preCompRoutine: "روتين ما قبل المنافسة",
    history: "السجل",
    tapToView: "انقر للعرض",
    noAdvice: "لم يتم توليد نصيحة شخصية لهذا التقييم.",
    latestVsPrev: "الأحدث مقابل السابق",
  },
} as const;

interface Assessment {
  id: string;
  total_score: number;
  scores: Record<string, number>;
  ai_advice: any;
  created_at: string;
}

function parseAdvice(raw: unknown): any | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try { return JSON.parse(trimmed); } catch { return null; }
  }
  return null;
}

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar" : locale, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

interface Props {
  athleteId: string;
}

export function CoachAthleteMental({ athleteId }: Props) {
  const { locale } = useLanguage();
  const l = (locale as SupportedLocale) || "en";
  const tr = t[l] || t.en;
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("mental_assessments")
        .select("id, total_score, scores, ai_advice, created_at")
        .eq("user_id", athleteId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows: Assessment[] = (data || []).map((a: any) => ({
        id: a.id,
        total_score: a.total_score,
        scores: (a.scores as Record<string, number>) || {},
        ai_advice: parseAdvice(a.ai_advice),
        created_at: a.created_at,
      }));
      setAssessments(rows);
      setSelectedId(rows[0]?.id ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [athleteId]);

  const selected = useMemo(
    () => assessments.find((a) => a.id === selectedId) || null,
    [assessments, selectedId],
  );

  const previous = useMemo(() => {
    if (!selected) return null;
    const idx = assessments.findIndex((a) => a.id === selected.id);
    return assessments[idx + 1] || null;
  }, [assessments, selected]);

  const radarLabels = useMemo(
    () => Object.fromEntries(Object.entries(categoryLabels).map(([k, v]) => [k, v[l]])),
    [l],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
        <Brain className="h-4 w-4 text-purple-500" /> {tr.title}
      </h4>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> ...
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-xs text-muted-foreground">{tr.none}</div>
      ) : (
        <>
          {/* Selected assessment summary + radar */}
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(selected.created_at, l)}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {selected.total_score}
                    <span className="text-xs text-muted-foreground font-normal"> / 30</span>
                  </div>
                </div>
                {previous && (
                  <div className="text-[10px] text-muted-foreground text-right">
                    {tr.latestVsPrev}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <MentalRadarChart
                  scores={selected.scores}
                  labels={radarLabels}
                  previousScores={previous?.scores}
                  size={260}
                />
              </div>

              {/* Category breakdown */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selected.scores).map(([cat, score]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2"
                  >
                    <span className="text-[11px] text-muted-foreground truncate">
                      {categoryLabels[cat]?.[l] || cat}
                    </span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {score}/5
                    </span>
                  </div>
                ))}
              </div>

              {/* AI advice (if present) */}
              {selected.ai_advice ? (
                <div className="space-y-3 pt-2">
                  {selected.ai_advice.summary && (
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-1">{tr.summary}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selected.ai_advice.summary}
                      </p>
                    </div>
                  )}
                  {Array.isArray(selected.ai_advice.strengths) && selected.ai_advice.strengths.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-1">{tr.strengths}</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                        {selected.ai_advice.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(selected.ai_advice.improvementAreas) && selected.ai_advice.improvementAreas.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-1">{tr.areasToImprove}</div>
                      <div className="space-y-2">
                        {selected.ai_advice.improvementAreas.map((a: any, i: number) => (
                          <div key={i} className="rounded-lg border border-border bg-background/50 px-3 py-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">{a.area}</span>
                              {typeof a.score === "number" && (
                                <span className="text-[10px] text-muted-foreground tabular-nums">{a.score}/5</span>
                              )}
                            </div>
                            {Array.isArray(a.techniques) && (
                              <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                                {a.techniques.map((tech: string, j: number) => <li key={j}>{tech}</li>)}
                              </ul>
                            )}
                            {a.dailyHabit && (
                              <div className="text-[11px] text-muted-foreground italic">→ {a.dailyHabit}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.ai_advice.preCompetitionRoutine && (
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-1">{tr.preCompRoutine}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {selected.ai_advice.preCompetitionRoutine}
                      </p>
                    </div>
                  )}
                  {Array.isArray(selected.ai_advice.affirmations) && selected.ai_advice.affirmations.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-1">{tr.affirmations}</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                        {selected.ai_advice.affirmations.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic pt-1">{tr.noAdvice}</div>
              )}
            </div>
          )}

          {/* History list (only if more than one) */}
          {assessments.length > 1 && (
            <div className="pt-2 border-t border-border space-y-1">
              <div className="text-xs font-semibold text-foreground">{tr.history}</div>
              {assessments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors ${
                    a.id === selectedId
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-background/50 hover:bg-accent/30 border border-border"
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-medium text-foreground">
                      {formatDate(a.created_at, l)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {tr.score}: {a.total_score}/30
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
