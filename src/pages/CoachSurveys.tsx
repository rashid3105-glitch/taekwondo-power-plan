import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, ClipboardList, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCoachSurveys, createSurvey, deleteSurvey, fetchSurvey, fetchSurveyResults,
  type Survey, type SurveyQuestion, type SurveyQuestionType, type SurveyTargetScope,
} from "@/lib/surveysApi";

interface DraftQ {
  type: SurveyQuestionType;
  question_text: string;
  required: boolean;
  scale_max: number;
  mc_options: string[];
}

const emptyQ = (type: SurveyQuestionType = "text"): DraftQ => ({
  type, question_text: "", required: false, scale_max: 5, mc_options: [],
});

export default function CoachSurveys() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [list, setList] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setList(await fetchCoachSurveys()); } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/coach")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold flex-1">{t("surveysTitle")}</h1>
          <Button size="sm" onClick={() => setBuilderOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />{t("newSurvey")}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{t("surveyNoSurveysCoach")}</p>
          </div>
        ) : (
          list.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{s.title}</h3>
                    <Badge variant={s.published_at ? "default" : "outline"} className="shrink-0 text-[10px]">
                      {s.published_at ? t("surveyPublished") : t("surveyDraft")}
                    </Badge>
                    {s.allow_anonymous && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">{t("surveyAnonymous")}</Badge>
                    )}
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setResultsId(s.id)}>
                  <BarChart3 className="h-4 w-4 mr-1" />{t("surveyResults")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeletingId(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {builderOpen && (
        <SurveyBuilder
          onClose={() => setBuilderOpen(false)}
          onSaved={() => { setBuilderOpen(false); load(); }}
        />
      )}
      {resultsId && (
        <SurveyResultsDialog surveyId={resultsId} onClose={() => setResultsId(null)} />
      )}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("surveyDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("surveyDeleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingId) return;
                try { await deleteSurvey(deletingId); toast.success(t("delete")); load(); }
                catch (e: any) { toast.error(e.message); }
                finally { setDeletingId(null); }
              }}
            >{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SurveyBuilder({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowAnon, setAllowAnon] = useState(false);
  const [scope, setScope] = useState<SurveyTargetScope>("club");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState<DraftQ[]>([emptyQ("scale")]);
  const [athletes, setAthletes] = useState<{ user_id: string; display_name: string }[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("club_id").eq("user_id", user.id).maybeSingle();
      const clubId = (profile as any)?.club_id;
      if (!clubId) return;
      const { data } = await supabase.rpc("get_club_member_profiles", { _club_id: clubId });
      const filtered = (data || []).filter((p: any) => p.user_id !== user.id);
      setAthletes(filtered.map((p: any) => ({ user_id: p.user_id, display_name: p.display_name || "" })));
    })();
  }, []);

  const updateQ = (i: number, patch: Partial<DraftQ>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const removeQ = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const save = async (publish: boolean) => {
    if (!title.trim()) { toast.error(t("surveyNeedTitle")); return; }
    const valid = questions.filter((q) => q.question_text.trim().length > 0);
    if (valid.length === 0) { toast.error(t("surveyNeedQuestion")); return; }
    setSaving(true);
    try {
      await createSurvey({
        title: title.trim(),
        description: description.trim() || null,
        allow_anonymous: allowAnon,
        target_scope: scope,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        questions: valid.map((q) => ({
          position: 0,
          type: q.type,
          question_text: q.question_text.trim(),
          required: q.required,
          scale_max: q.type === "scale" ? q.scale_max : null,
          mc_options: q.type === "mc" ? q.mc_options.filter((o) => o.trim().length > 0) : null,
        })) as any,
        recipients: scope === "selected" ? Array.from(selectedAthletes) : [],
        publish,
      });
      toast.success(publish ? t("surveyPublished") : t("surveyDraft"));
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("newSurvey")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("surveyFormTitle")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>{t("surveyFormDescription")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={2} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex-1 pr-3">
              <Label className="cursor-pointer">{t("surveyAllowAnonymous")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("surveyAllowAnonymousHint")}</p>
            </div>
            <Switch checked={allowAnon} onCheckedChange={setAllowAnon} />
          </div>
          <div>
            <Label>{t("surveyTargetScope")}</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as SurveyTargetScope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="club">{t("surveyTargetClub")}</SelectItem>
                <SelectItem value="selected">{t("surveyTargetSelected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === "selected" && (
            <div className="rounded-lg border border-border p-3 max-h-48 overflow-y-auto space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("surveySelectAthletes")}</p>
              {athletes.map((a) => (
                <label key={a.user_id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <Checkbox
                    checked={selectedAthletes.has(a.user_id)}
                    onCheckedChange={(c) => {
                      setSelectedAthletes((s) => {
                        const n = new Set(s);
                        if (c) n.add(a.user_id); else n.delete(a.user_id);
                        return n;
                      });
                    }}
                  />
                  <span className="text-sm">{a.display_name}</span>
                </label>
              ))}
            </div>
          )}
          <div>
            <Label>{t("surveyDeadline")}</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">{t("surveyQuestion")}</Label>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("text")])}>
                  <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeText")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("scale")])}>
                  <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeScale")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("mc")])}>
                  <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeMc")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("yesno")])}>
                  <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeYesno")}
                </Button>
              </div>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 mt-2 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={t("surveyQuestion")}
                      value={q.question_text}
                      onChange={(e) => updateQ(i, { question_text: e.target.value })}
                      maxLength={500}
                    />
                    {q.type === "scale" && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">{t("surveyScaleMax")}</Label>
                        <Select value={String(q.scale_max)} onValueChange={(v) => updateQ(i, { scale_max: Number(v) })}>
                          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {q.type === "mc" && (
                      <Textarea
                        placeholder={t("surveyMcOptions")}
                        rows={3}
                        value={q.mc_options.join("\n")}
                        onChange={(e) => updateQ(i, { mc_options: e.target.value.split("\n") })}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Switch checked={q.required} onCheckedChange={(c) => updateQ(i, { required: c })} />
                      <Label className="text-xs">{t("surveyRequired")}</Label>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {q.type === "text" ? t("surveyQTypeText")
                          : q.type === "scale" ? t("surveyQTypeScale")
                          : q.type === "mc" ? t("surveyQTypeMc")
                          : t("surveyQTypeYesno")}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeQ(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>{t("surveySaveDraft")}</Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{t("surveyPublish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SurveyResultsDialog({ surveyId, onClose }: { surveyId: string; onClose: () => void }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchSurveyResults>> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([fetchSurvey(surveyId), fetchSurveyResults(surveyId)]);
        setSurvey(s.survey); setQuestions(s.questions); setData(r);
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, [surveyId]);

  const stats = useMemo(() => {
    if (!data) return null;
    const byQ: Record<string, { numbers: number[]; choices: Record<string, number>; bools: { y: number; n: number }; texts: { text: string; anon: boolean; name: string }[] }> = {};
    for (const q of questions) byQ[q.id] = { numbers: [], choices: {}, bools: { y: 0, n: 0 }, texts: [] };
    const respMap = new Map(data.responses.map((r) => [r.id, r]));
    for (const a of data.answers) {
      const bucket = byQ[a.question_id]; if (!bucket) continue;
      if (a.answer_number != null) bucket.numbers.push(Number(a.answer_number));
      if (a.answer_choice) bucket.choices[a.answer_choice] = (bucket.choices[a.answer_choice] || 0) + 1;
      if (a.answer_bool != null) { if (a.answer_bool) bucket.bools.y++; else bucket.bools.n++; }
      if (a.answer_text) {
        const r = respMap.get(a.response_id);
        bucket.texts.push({
          text: a.answer_text,
          anon: !!r?.is_anonymous,
          name: r?.athlete_id ? (data.responder_names[r.athlete_id] || "") : "",
        });
      }
    }
    return byQ;
  }, [data, questions]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{survey?.title || t("surveyResults")}</DialogTitle>
        </DialogHeader>
        {loading || !data ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {data.responses.length} {t("surveyResponsesCount")}
            </div>
            {questions.map((q) => {
              const s = stats?.[q.id];
              return (
                <div key={q.id} className="rounded-lg border border-border p-3">
                  <p className="font-semibold text-sm mb-2">{q.question_text}</p>
                  {q.type === "scale" && s && s.numbers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t("surveyAverage")}: <span className="font-bold text-foreground">{(s.numbers.reduce((a, b) => a + b, 0) / s.numbers.length).toFixed(1)}</span> / {q.scale_max}</p>
                      <p className="text-xs text-muted-foreground mt-1">n = {s.numbers.length}</p>
                    </div>
                  )}
                  {q.type === "yesno" && s && (
                    <div className="text-sm flex gap-4">
                      <span>{t("surveyYes")}: <strong>{s.bools.y}</strong></span>
                      <span>{t("surveyNo")}: <strong>{s.bools.n}</strong></span>
                    </div>
                  )}
                  {q.type === "mc" && s && (
                    <div className="space-y-1">
                      {Object.entries(s.choices).map(([opt, count]) => (
                        <div key={opt} className="flex justify-between text-sm">
                          <span>{opt}</span><strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === "text" && s && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{t("surveyTextAnswers")}: {s.texts.length}</p>
                      {s.texts.map((a, idx) => (
                        <div key={idx} className="rounded bg-muted/40 p-2 text-sm">
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            {a.anon ? t("surveyAnonymous") : a.name}
                          </p>
                          <p className="whitespace-pre-wrap">{a.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
