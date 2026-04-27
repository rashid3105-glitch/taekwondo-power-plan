// Coach-side view of an athlete's post-competition reflections.
// Lists reflections (newest first) with quick rating summary, expandable to
// view full ratings, reflection answers, and the AI action plan. Shows a
// trend chart of ratings over time and lets the coach (a) create a new
// competition for this athlete and (b) attach a private comment per reflection.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy, Loader2, ChevronDown, ChevronRight, Target, Sparkles, MessageSquare, Save,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ReflectionTrendChart } from "@/components/ReflectionTrendChart";
import { CoachCreateCompetitionDialog } from "@/components/coach/CoachCreateCompetitionDialog";
import { CoachManualReflectionDialog } from "@/components/coach/CoachManualReflectionDialog";

type SupportedLocale = "en" | "da" | "sv" | "de" | "ar" | "no";

interface Reflection {
  id: string;
  competition_name: string | null;
  competition_date: string | null;
  result: string | null;
  ratings: Record<string, number>;
  reflections: Record<string, string>;
  ai_plan: any;
  created_at: string;
}

interface CommentRecord {
  reflection_id: string;
  content: string;
  updated_at: string;
}

function parsePlan(raw: unknown): any | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try { return JSON.parse(t); } catch { return null; }
  }
  return null;
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar" : locale, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return iso.slice(0, 10); }
}

interface Props {
  athleteId: string;
  athleteName?: string;
}

export function CoachAthleteReflections({ athleteId, athleteName }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const l = (locale as SupportedLocale) || "en";
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Reflection[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommentRecord>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setCoachId(user?.id ?? null);

      const { data } = await supabase
        .from("competition_reflections")
        .select("id, competition_name, competition_date, result, ratings, reflections, ai_plan, created_at")
        .eq("user_id", athleteId)
        .order("competition_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows: Reflection[] = (data || []).map((r: any) => ({
        id: r.id,
        competition_name: r.competition_name,
        competition_date: r.competition_date,
        result: r.result,
        ratings: (r.ratings as Record<string, number>) || {},
        reflections: (r.reflections as Record<string, string>) || {},
        ai_plan: parsePlan(r.ai_plan),
        created_at: r.created_at,
      }));
      setItems(rows);
      if (rows[0]) setOpenId(rows[0].id);

      // Load coach's existing private comments for these reflections
      if (user && rows.length > 0) {
        const { data: cs } = await supabase
          .from("coach_reflection_comments" as any)
          .select("reflection_id, content, updated_at")
          .eq("coach_id", user.id)
          .in("reflection_id", rows.map((r) => r.id));
        const map: Record<string, CommentRecord> = {};
        const draftMap: Record<string, string> = {};
        (cs as any[] | null || []).forEach((c) => {
          map[c.reflection_id] = c;
          draftMap[c.reflection_id] = c.content;
        });
        setComments(map);
        setDrafts(draftMap);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [athleteId]);

  const trendData = useMemo(
    () => items.map((r) => ({
      id: r.id,
      competition_name: r.competition_name,
      competition_date: r.competition_date,
      created_at: r.created_at,
      ratings: r.ratings,
    })),
    [items],
  );

  async function saveComment(reflectionId: string) {
    if (!coachId) return;
    const content = (drafts[reflectionId] ?? "").slice(0, 5000);
    setSavingId(reflectionId);
    try {
      const { error } = await supabase
        .from("coach_reflection_comments" as any)
        .upsert(
          { reflection_id: reflectionId, coach_id: coachId, athlete_id: athleteId, content },
          { onConflict: "reflection_id,coach_id" },
        );
      if (error) throw error;
      setComments((prev) => ({
        ...prev,
        [reflectionId]: { reflection_id: reflectionId, content, updated_at: new Date().toISOString() },
      }));
      toast({ title: t("notesSaved") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> ...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> {t("coachReflectionsTitle")}
          </h4>
          {athleteName && (
            <CoachCreateCompetitionDialog athleteId={athleteId} athleteName={athleteName} />
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>{t("coachReflectionsNone")}</div>
            <div className="text-[11px] opacity-80">{t("coachReflectionsHint")}</div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((r) => {
              const open = r.id === openId;
              const overall = (r.ratings?.overallPerformance ?? r.ratings?.postCompMood) as number | undefined;
              const draft = drafts[r.id] ?? "";
              const existingComment = comments[r.id];
              const dirty = (existingComment?.content ?? "") !== draft;
              return (
                <div key={r.id} className="rounded-lg border border-border bg-background/50">
                  <button
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-accent/30 transition-colors rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground truncate">
                        {r.competition_name || t("competitionsResult")}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {formatDate(r.competition_date || r.created_at, l)}
                        {r.result ? ` · ${r.result}` : ""}
                        {typeof overall === "number" ? ` · ${overall}/10` : ""}
                        {existingComment?.content ? ` · ${t("coachReflectionCommentBadge")}` : ""}
                      </div>
                    </div>
                    {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>

                  {open && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      {/* Ratings grid */}
                      {Object.keys(r.ratings).length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(r.ratings).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between rounded border border-border bg-background px-2 py-1.5">
                              <span className="text-[10px] text-muted-foreground truncate">{t(`reflectionRating_${k}` as any)}</span>
                              <span className="text-xs font-semibold tabular-nums">{v}/10</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reflection answers */}
                      {Object.entries(r.reflections).filter(([, v]) => v && v.trim()).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(r.reflections).filter(([, v]) => v && v.trim()).map(([k, v]) => (
                            <div key={k}>
                              <div className="text-[10px] font-semibold text-foreground uppercase tracking-wide">
                                {t(`reflectionPrompt_${k}` as any)}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI plan */}
                      {r.ai_plan && (
                        <div className="space-y-2 border-t border-border pt-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-primary" /> {t("reflectionPlanTitle")}
                          </div>
                          {r.ai_plan.summary && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{r.ai_plan.summary}</p>
                          )}
                          {Array.isArray(r.ai_plan.nextCompetitionGoals) && r.ai_plan.nextCompetitionGoals.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-semibold flex items-center gap-1">
                                <Target className="h-3 w-3 text-primary" /> {t("reflectionNextGoals")}
                              </div>
                              {r.ai_plan.nextCompetitionGoals.map((g: any, i: number) => (
                                <div key={i} className="rounded border border-primary/20 bg-primary/5 p-2">
                                  <div className="text-[11px] font-medium text-foreground">{g.goal}</div>
                                  {g.metric && <div className="text-[10px] text-muted-foreground mt-0.5">{t("reflectionGoalMetric")}: {g.metric}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Coach private comment */}
                      <div className="space-y-2 border-t border-border pt-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-primary" /> {t("coachReflectionCommentTitle")}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!dirty || savingId === r.id}
                            onClick={() => saveComment(r.id)}
                            className="h-7 px-2 text-[11px]"
                          >
                            {savingId === r.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><Save className="h-3 w-3 mr-1" /> {t("save")}</>
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{t("coachReflectionCommentDesc")}</p>
                        <Textarea
                          value={draft}
                          onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: e.target.value.slice(0, 5000) }))}
                          rows={3}
                          maxLength={5000}
                          placeholder={t("coachReflectionCommentPlaceholder")}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trend chart */}
      <ReflectionTrendChart reflections={trendData} />
    </div>
  );
}
