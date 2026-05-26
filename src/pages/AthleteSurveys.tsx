import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  fetchAthleteSurveys, fetchSurvey, submitSurvey,
  type Survey, type SurveyQuestion, type SurveyAnswerInput,
} from "@/lib/surveysApi";

export default function AthleteSurveys() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [items, setItems] = useState<{ survey: Survey; submitted: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchAthleteSurveys()); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const pending = items.filter((i) => !i.submitted);
  const done = items.filter((i) => i.submitted);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">{t("surveysTitle")}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{t("surveyNoSurveysAthlete")}</p>
          </div>
        ) : (
          <>
            {pending.map(({ survey }) => (
              <SurveyCard key={survey.id} survey={survey} submitted={false} onOpen={() => setOpenId(survey.id)} t={t} />
            ))}
            {done.length > 0 && (
              <>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-4">{t("surveyMyResponses")}</h3>
                {done.map(({ survey }) => (
                  <SurveyCard key={survey.id} survey={survey} submitted onOpen={() => setOpenId(survey.id)} t={t} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {openId && (
        <SurveyFormDialog
          surveyId={openId}
          onClose={() => setOpenId(null)}
          onSubmitted={() => { setOpenId(null); load(); }}
          alreadySubmitted={items.find((i) => i.survey.id === openId)?.submitted || false}
        />
      )}
    </div>
  );
}

function SurveyCard({ survey, submitted, onOpen, t }: { survey: Survey; submitted: boolean; onOpen: () => void; t: (k: any) => string }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-lg border border-border bg-card p-4 hover:bg-accent/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold flex-1">{survey.title}</h3>
        {submitted ? (
          <Badge variant="secondary" className="shrink-0 text-[10px]"><Check className="h-3 w-3 mr-1" />{t("surveyAnswered")}</Badge>
        ) : (
          <Badge className="shrink-0 text-[10px]">{t("surveyPending")}</Badge>
        )}
      </div>
      {survey.description && <p className="text-sm text-muted-foreground line-clamp-2">{survey.description}</p>}
      {survey.allow_anonymous && (
        <Badge variant="outline" className="mt-2 text-[10px]">{t("surveyAnonymous")}</Badge>
      )}
    </button>
  );
}

function SurveyFormDialog({ surveyId, onClose, onSubmitted, alreadySubmitted }: { surveyId: string; onClose: () => void; onSubmitted: () => void; alreadySubmitted: boolean }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerInput>>({});
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { survey, questions } = await fetchSurvey(surveyId);
        setSurvey(survey); setQuestions(questions);
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, [surveyId]);

  const setAnswer = (qid: string, patch: Partial<SurveyAnswerInput>) =>
    setAnswers((a) => ({ ...a, [qid]: { question_id: qid, ...a[qid], ...patch } }));

  const handleSubmit = async () => {
    // Validate required
    for (const q of questions) {
      if (!q.required) continue;
      const a = answers[q.id];
      const has = a && (a.answer_text || a.answer_number != null || a.answer_choice || a.answer_bool != null);
      if (!has) { toast.error(`${t("surveyAnswerRequired")}: ${q.question_text}`); return; }
    }
    setSubmitting(true);
    try {
      await submitSurvey(surveyId, anonymous && !!survey?.allow_anonymous, Object.values(answers));
      toast.success(t("surveySubmitted"));
      onSubmitted();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{survey?.title}</DialogTitle>
        </DialogHeader>
        {loading || !survey ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}
            {alreadySubmitted && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">{t("surveyAlreadySubmitted")}</div>
            )}
            {survey.allow_anonymous && !alreadySubmitted && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label className="cursor-pointer">{t("surveySubmitAnonymously")}</Label>
                <Switch checked={anonymous} onCheckedChange={setAnonymous} />
              </div>
            )}

            {questions.map((q) => (
              <div key={q.id} className="rounded-lg border border-border p-3">
                <Label className="block mb-2">
                  {q.question_text}{q.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {q.type === "text" && (
                  <Textarea
                    placeholder={t("surveyAnswerPlaceholder")}
                    rows={3}
                    disabled={alreadySubmitted}
                    value={answers[q.id]?.answer_text || ""}
                    onChange={(e) => setAnswer(q.id, { answer_text: e.target.value })}
                  />
                )}
                {q.type === "scale" && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: q.scale_max || 5 }, (_, i) => i + 1).map((n) => {
                      const selected = answers[q.id]?.answer_number === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={alreadySubmitted}
                          onClick={() => setAnswer(q.id, { answer_number: n })}
                          className={`h-10 w-10 rounded-full border font-semibold transition-colors ${
                            selected ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-accent/30"
                          }`}
                        >{n}</button>
                      );
                    })}
                  </div>
                )}
                {q.type === "yesno" && (
                  <div className="flex gap-2">
                    {[true, false].map((b) => {
                      const selected = answers[q.id]?.answer_bool === b;
                      return (
                        <button
                          key={String(b)}
                          type="button"
                          disabled={alreadySubmitted}
                          onClick={() => setAnswer(q.id, { answer_bool: b })}
                          className={`flex-1 h-11 rounded-lg border font-semibold transition-colors ${
                            selected ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-accent/30"
                          }`}
                        >{b ? t("surveyYes") : t("surveyNo")}</button>
                      );
                    })}
                  </div>
                )}
                {q.type === "mc" && q.mc_options && (
                  <RadioGroup
                    value={answers[q.id]?.answer_choice || ""}
                    onValueChange={(v) => setAnswer(q.id, { answer_choice: v })}
                    disabled={alreadySubmitted}
                  >
                    {q.mc_options.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer">
                        <RadioGroupItem value={opt} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ))}
          </div>
        )}
        {!alreadySubmitted && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{t("surveySubmit")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
