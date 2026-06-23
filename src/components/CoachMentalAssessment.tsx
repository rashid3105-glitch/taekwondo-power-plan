import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Brain, Loader2, ChevronLeft, ChevronRight, History, Trash2, Sparkles, CloudOff,
  Trophy, TrendingUp, Heart, Users, Wind, ShieldCheck, Flame, Anchor,
} from "lucide-react";
import {
  coachMentalQuestions,
  type CoachMentalQuestion,
} from "@/data/coachMentalQuestions";
import { useOfflineCoachMentalAssessments } from "@/hooks/useOfflineCoachMentalAssessments";
import type { CachedCoachAssessment } from "@/lib/coachMentalAssessmentOfflineDB";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SupportedLocale = "en" | "da" | "sv" | "de" | "ar" | "no" | "es";

// New 6 categories mirror athlete dimensions but in coach-perspective:
//   composureUnderPressure  ↔ athlete mentalToughness
//   sidelineCalm            ↔ athlete competitionAnxiety
//   decisionMakingUnderChaos ↔ athlete focusConcentration
//   roleModelAfterLoss      ↔ athlete recoveryFromLoss
//   coachConfidence         ↔ athlete confidence
//   motivationBurnout       ↔ athlete motivation / fatigueMotivation
const categoryIcons: Record<string, React.ReactNode> = {
  composureUnderPressure: <Anchor className="h-4 w-4" />,
  sidelineCalm: <Wind className="h-4 w-4" />,
  decisionMakingUnderChaos: <Brain className="h-4 w-4" />,
  roleModelAfterLoss: <Heart className="h-4 w-4" />,
  coachConfidence: <ShieldCheck className="h-4 w-4" />,
  motivationBurnout: <Flame className="h-4 w-4" />,
};

const categoryLabels: Record<string, Record<SupportedLocale, string>> = {
  composureUnderPressure: {
    en: "Composure under pressure", da: "Ro når holdet er presset", sv: "Lugn när laget pressas",
    de: "Ruhe unter Druck", ar: "الهدوء تحت الضغط", no: "Ro når laget er presset",
    es: "Calma bajo presión",
  },
  sidelineCalm: {
    en: "Sideline calm", da: "Sidelinje-ro", sv: "Lugn vid sidan",
    de: "Ruhe an der Seitenlinie", ar: "هدوء على حافة البساط", no: "Ro på sidelinjen",
    es: "Calma en la esquina",
  },
  decisionMakingUnderChaos: {
    en: "Decision making under chaos", da: "Beslutningstagning i kampens kaos", sv: "Beslutsfattande i kampens kaos",
    de: "Entscheidungen im Kampf-Chaos", ar: "اتخاذ القرار وسط فوضى المباراة", no: "Beslutninger i kampens kaos",
    es: "Decisiones en el caos del combate",
  },
  roleModelAfterLoss: {
    en: "Role model after a loss", da: "At være rollemodel efter tab", sv: "Förebild efter en förlust",
    de: "Vorbild nach einer Niederlage", ar: "أن تكون قدوة بعد الخسارة", no: "Rollemodell etter tap",
    es: "Ser modelo después de una derrota",
  },
  coachConfidence: {
    en: "Coach confidence", da: "Coach-selvtillid", sv: "Tränarsjälvförtroende",
    de: "Coach-Selbstvertrauen", ar: "ثقة المدرب بنفسه", no: "Coach-selvtillit",
    es: "Confianza del entrenador",
  },
  motivationBurnout: {
    en: "Motivation & burnout", da: "Motivation & udbrændthed", sv: "Motivation & utbrändhet",
    de: "Motivation & Burnout", ar: "الحافز والإنهاك", no: "Motivasjon & utbrenthet",
    es: "Motivación y desgaste",
  },
};

const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    title: "Coach Mental Review", subtitle: "An honest monthly check-in on your inner coaching game — not for athletes, for you.",
    startAssessment: "Start review", viewHistory: "View history",
    question: "Question", of: "of", next: "Next", back: "Back",
    getResults: "Get my review & advice", yourScore: "Your coach score", outOf: "out of 30",
    generating: "Generating personalised advice for you as a coach…",
    strengths: "Where you're strong", areasToImprove: "Where to grow",
    techniques: "Techniques", dailyHabit: "Daily habit",
    preCompRoutine: "Pre-session centering routine", affirmations: "Affirmations for you",
    retake: "Retake review", backToIntro: "Back", history: "Review history",
    noHistory: "No previous coach reviews yet.", score: "Score", delete: "Delete",
    overallExcellent: "You're showing up sharp.", overallGood: "Solid inner game.",
    overallAverage: "Room to grow — that's normal.", overallNeedsWork: "Time to recharge — you matter too.",
    pending: "Pending", adviceWillSyncOnline: "Saved offline. Advice will appear when you reconnect.",
    confirmDeleteTitle: "Delete this review?", confirmDeleteDesc: "This permanently removes the review and its advice. You can't undo this.",
    cancel: "Cancel", noAdviceTitle: "No advice yet", regenerateAdvice: "Regenerate advice",
    adviceRegenerated: "Advice regenerated", adviceRegenerateFailed: "Couldn't regenerate. Try again.",
    tapToView: "Tap to view", coachOnly: "Coach only",
    intro1: "Coaches carry pressure athletes don't see: parents, leadership, long sessions, identity tied to results.",
    intro2: "This 18-question review focuses on YOUR mental game — presence on the floor, emotional regulation, communication, pressure, confidence, and burnout risk.",
    intro3: "Takes ~3 minutes. Repeat monthly to see trends.",
  },
  da: {
    title: "Mental gennemgang for trænere", subtitle: "En ærlig månedlig check-in på din indre coaching — ikke for atleter, for dig.",
    startAssessment: "Start gennemgang", viewHistory: "Se historik",
    question: "Spørgsmål", of: "af", next: "Næste", back: "Tilbage",
    getResults: "Få min gennemgang & råd", yourScore: "Din trænerscore", outOf: "ud af 30",
    generating: "Genererer personlige råd til dig som træner…",
    strengths: "Hvor du står stærkt", areasToImprove: "Hvor du kan vokse",
    techniques: "Teknikker", dailyHabit: "Daglig vane",
    preCompRoutine: "Centrering før træning", affirmations: "Bekræftelser til dig",
    retake: "Tag gennemgang igen", backToIntro: "Tilbage", history: "Gennemgangshistorik",
    noHistory: "Ingen tidligere trænergennemgange endnu.", score: "Score", delete: "Slet",
    overallExcellent: "Du står skarpt.", overallGood: "Solid indre spillet.",
    overallAverage: "Plads til vækst — det er normalt.", overallNeedsWork: "Tid til at lade op — du tæller også.",
    pending: "Afventer", adviceWillSyncOnline: "Gemt offline. Råd kommer, når du er online igen.",
    confirmDeleteTitle: "Slet denne gennemgang?", confirmDeleteDesc: "Dette fjerner gennemgangen og dens råd permanent. Det kan ikke fortrydes.",
    cancel: "Annuller", noAdviceTitle: "Ingen råd endnu", regenerateAdvice: "Generér råd igen",
    adviceRegenerated: "Råd genereret igen", adviceRegenerateFailed: "Kunne ikke generere. Prøv igen.",
    tapToView: "Tryk for at se", coachOnly: "Kun for trænere",
    intro1: "Trænere bærer et pres, atleter ikke ser: forældre, klubledelse, lange træninger, identitet bundet til resultater.",
    intro2: "Denne 18-spørgsmåls gennemgang fokuserer på DIT mentale spil — nærvær på gulvet, følelser, kommunikation, pres, tillid og risiko for udbrændthed.",
    intro3: "Tager ca. 3 minutter. Gentag månedligt for at se tendenser.",
  },
  sv: {
    title: "Mental genomgång för tränare", subtitle: "En ärlig månadsvis check-in av din inre coaching — inte för atleter, för dig.",
    startAssessment: "Starta genomgång", viewHistory: "Visa historik",
    question: "Fråga", of: "av", next: "Nästa", back: "Tillbaka",
    getResults: "Få min genomgång & råd", yourScore: "Din tränarpoäng", outOf: "av 30",
    generating: "Genererar personliga råd till dig som tränare…",
    strengths: "Där du står starkt", areasToImprove: "Där du kan växa",
    techniques: "Tekniker", dailyHabit: "Daglig vana",
    preCompRoutine: "Centrering före pass", affirmations: "Affirmationer för dig",
    retake: "Gör om genomgången", backToIntro: "Tillbaka", history: "Genomgångshistorik",
    noHistory: "Inga tidigare tränargenomgångar ännu.", score: "Poäng", delete: "Radera",
    overallExcellent: "Du står skarpt.", overallGood: "Stabilt inre spel.",
    overallAverage: "Utrymme att växa — det är normalt.", overallNeedsWork: "Dags att ladda om — du räknas också.",
    pending: "Väntar", adviceWillSyncOnline: "Sparat offline. Råd kommer när du är online igen.",
    confirmDeleteTitle: "Radera denna genomgång?", confirmDeleteDesc: "Detta tar bort genomgången och råden permanent. Kan inte ångras.",
    cancel: "Avbryt", noAdviceTitle: "Inga råd ännu", regenerateAdvice: "Generera råd igen",
    adviceRegenerated: "Råden har genererats igen", adviceRegenerateFailed: "Kunde inte generera. Försök igen.",
    tapToView: "Tryck för att visa", coachOnly: "Endast tränare",
    intro1: "Tränare bär press atleter inte ser: föräldrar, klubbledning, långa pass, identitet kopplad till resultat.",
    intro2: "Denna 18-fråge-genomgång fokuserar på DITT mentala spel — närvaro på golvet, känslor, kommunikation, press, självförtroende och utbrändhetsrisk.",
    intro3: "Tar ca 3 minuter. Upprepa månadsvis för att se trender.",
  },
  de: {
    title: "Mentale Bestandsaufnahme für Trainer", subtitle: "Ein ehrlicher monatlicher Check-in zu deinem inneren Coaching — nicht für Athleten, für dich.",
    startAssessment: "Bestandsaufnahme starten", viewHistory: "Verlauf anzeigen",
    question: "Frage", of: "von", next: "Weiter", back: "Zurück",
    getResults: "Meine Auswertung & Empfehlungen", yourScore: "Dein Coach-Score", outOf: "von 30",
    generating: "Erstelle personalisierte Empfehlungen für dich als Coach…",
    strengths: "Wo du stark bist", areasToImprove: "Wo du wachsen kannst",
    techniques: "Techniken", dailyHabit: "Tägliche Gewohnheit",
    preCompRoutine: "Zentrierungsroutine vor der Einheit", affirmations: "Affirmationen für dich",
    retake: "Bestandsaufnahme wiederholen", backToIntro: "Zurück", history: "Verlauf",
    noHistory: "Noch keine früheren Coach-Bestandsaufnahmen.", score: "Score", delete: "Löschen",
    overallExcellent: "Du bist hellwach.", overallGood: "Solides inneres Spiel.",
    overallAverage: "Raum zum Wachsen — das ist normal.", overallNeedsWork: "Zeit zum Auftanken — du zählst auch.",
    pending: "Ausstehend", adviceWillSyncOnline: "Offline gespeichert. Empfehlungen erscheinen, sobald du wieder online bist.",
    confirmDeleteTitle: "Diese Bestandsaufnahme löschen?", confirmDeleteDesc: "Damit werden Bestandsaufnahme und Empfehlungen dauerhaft entfernt. Nicht widerrufbar.",
    cancel: "Abbrechen", noAdviceTitle: "Noch keine Empfehlungen", regenerateAdvice: "Empfehlungen neu generieren",
    adviceRegenerated: "Empfehlungen neu generiert", adviceRegenerateFailed: "Konnte nicht generieren. Bitte erneut versuchen.",
    tapToView: "Zum Anzeigen tippen", coachOnly: "Nur Trainer",
    intro1: "Trainer tragen Druck, den Athleten nicht sehen: Eltern, Vereinsführung, lange Einheiten, Identität an Ergebnisse geknüpft.",
    intro2: "Diese 18-Fragen-Auswertung fokussiert auf DEIN mentales Spiel — Präsenz auf der Matte, Emotionen, Kommunikation, Druck, Selbstvertrauen und Burnout-Risiko.",
    intro3: "Dauert ca. 3 Minuten. Monatlich wiederholen, um Trends zu sehen.",
  },
  ar: {
    title: "المراجعة الذهنية للمدرب", subtitle: "تسجيل شهري صادق عن لعبتك الداخلية كمدرب — ليس للاعبين، بل لك.",
    startAssessment: "ابدأ المراجعة", viewHistory: "عرض السجل",
    question: "سؤال", of: "من", next: "التالي", back: "رجوع",
    getResults: "احصل على مراجعتي ونصائحي", yourScore: "نتيجتك كمدرب", outOf: "من 30",
    generating: "جاري إنشاء نصائح مخصصة لك كمدرب…",
    strengths: "نقاط قوتك", areasToImprove: "مجالات النمو",
    techniques: "التقنيات", dailyHabit: "العادة اليومية",
    preCompRoutine: "روتين توسيط قبل الجلسة", affirmations: "تأكيدات لك",
    retake: "إعادة المراجعة", backToIntro: "رجوع", history: "سجل المراجعات",
    noHistory: "لا توجد مراجعات سابقة للمدرب.", score: "النتيجة", delete: "حذف",
    overallExcellent: "أنت حاضر وحاد.", overallGood: "لعبة داخلية متينة.",
    overallAverage: "مجال للنمو — هذا طبيعي.", overallNeedsWork: "حان وقت إعادة الشحن — أنت تستحق أيضًا.",
    pending: "قيد الانتظار", adviceWillSyncOnline: "تم الحفظ دون اتصال. ستظهر النصائح عند الاتصال.",
    confirmDeleteTitle: "حذف هذه المراجعة؟", confirmDeleteDesc: "سيتم حذف المراجعة ونصائحها نهائياً. لا يمكن التراجع.",
    cancel: "إلغاء", noAdviceTitle: "لا توجد نصائح بعد", regenerateAdvice: "إعادة إنشاء النصائح",
    adviceRegenerated: "تم إعادة إنشاء النصائح", adviceRegenerateFailed: "تعذّر الإنشاء. حاول مجددًا.",
    tapToView: "اضغط للعرض", coachOnly: "للمدربين فقط",
    intro1: "يحمل المدربون ضغطًا لا يراه اللاعبون: الأهل والإدارة وجلسات طويلة وهوية مرتبطة بالنتائج.",
    intro2: "تركز هذه المراجعة من 18 سؤالًا على لعبتك الذهنية أنت — الحضور، المشاعر، التواصل، الضغط، الثقة، ومخاطر الإنهاك.",
    intro3: "تستغرق نحو 3 دقائق. كرّر شهريًا لرصد الاتجاهات.",
  },
  no: {
    title: "Mental gjennomgang for trenere", subtitle: "En ærlig månedlig sjekk på din indre coaching — ikke for utøvere, for deg.",
    startAssessment: "Start gjennomgang", viewHistory: "Vis historikk",
    question: "Spørsmål", of: "av", next: "Neste", back: "Tilbake",
    getResults: "Få gjennomgangen og rådene mine", yourScore: "Din trenerpoengsum", outOf: "av 30",
    generating: "Genererer personlige råd til deg som trener…",
    strengths: "Der du står sterkt", areasToImprove: "Der du kan vokse",
    techniques: "Teknikker", dailyHabit: "Daglig vane",
    preCompRoutine: "Sentreringsrutine før økt", affirmations: "Affirmasjoner til deg",
    retake: "Ta gjennomgangen igjen", backToIntro: "Tilbake", history: "Gjennomgangshistorikk",
    noHistory: "Ingen tidligere trenergjennomganger ennå.", score: "Poengsum", delete: "Slett",
    overallExcellent: "Du står skarpt.", overallGood: "Solid indre spill.",
    overallAverage: "Rom for vekst — det er normalt.", overallNeedsWork: "På tide å lade opp — du teller også.",
    pending: "Venter", adviceWillSyncOnline: "Lagret frakoblet. Råd kommer når du er på nett igjen.",
    confirmDeleteTitle: "Slette denne gjennomgangen?", confirmDeleteDesc: "Dette fjerner gjennomgangen og rådene permanent. Kan ikke angres.",
    cancel: "Avbryt", noAdviceTitle: "Ingen råd ennå", regenerateAdvice: "Generer råd på nytt",
    adviceRegenerated: "Råd generert på nytt", adviceRegenerateFailed: "Kunne ikke generere. Prøv igjen.",
    tapToView: "Trykk for å se", coachOnly: "Kun trenere",
    intro1: "Trenere bærer press utøvere ikke ser: foreldre, klubbledelse, lange økter, identitet knyttet til resultater.",
    intro2: "Denne 18-spørsmåls gjennomgangen fokuserer på DITT mentale spill — tilstedeværelse, følelser, kommunikasjon, press, selvtillit og utbrenthetsrisiko.",
    intro3: "Tar ca. 3 minutter. Gjenta månedlig for å se trender.",
  },
};

interface Profile {
  belt_level?: string | null;
  experience_years?: number | null;
  discipline?: string | null;
}

export function CoachMentalAssessment({ profile }: { profile: Profile | null }) {
  const [step, setStep] = useState<"intro" | "quiz" | "results" | "history">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  const [advice, setAdvice] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [pendingAdvice, setPendingAdvice] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const { toast } = useToast();
  const { locale } = useLanguage();
  
  const {
    assessments: history,
    loading: loadingHistory,
    submitOffline,
    removeAssessment,
    regenerateAdvice,
  } = useOfflineCoachMentalAssessments();

  const l: SupportedLocale = (["en", "da", "sv", "de", "ar", "no"].includes(locale) ? locale : "en") as SupportedLocale;
  const txt = translations[l];
  const questions: CoachMentalQuestion[] = coachMentalQuestions;

  const getOverallLabel = (score: number) => {
    if (score >= 25) return txt.overallExcellent;
    if (score >= 20) return txt.overallGood;
    if (score >= 15) return txt.overallAverage;
    return txt.overallNeedsWork;
  };

  const handleAnswer = (value: number) => {
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const calculateScores = () => {
    const catSums: Record<string, number[]> = {};
    questions.forEach((q) => {
      if (!catSums[q.category]) catSums[q.category] = [];
      catSums[q.category].push(answers[q.id] || 1);
    });
    const catScores: Record<string, number> = {};
    for (const [cat, vals] of Object.entries(catSums)) {
      catScores[cat] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    }
    const total = Math.round(Object.values(catScores).reduce((a, b) => a + b, 0) * 10) / 10;
    setScores(catScores);
    setTotalScore(total);
    return { catScores, total };
  };

  const submitAssessment = async () => {
    const { catScores, total } = calculateScores();
    setStep("results");
    setGenerating(true);
    setAdvice(null);
    setPendingAdvice(false);
    try {
      const result = await submitOffline({
        total_score: total,
        scores: catScores,
        answers,
        profile,
        language: locale,
      });
      if (result?.ai_advice) setAdvice(result.ai_advice);
      else if (!navigator.onLine) setPendingAdvice(true);
      else toast({ title: txt.adviceRegenerateFailed, variant: "destructive" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const viewPastResult = (assessment: CachedCoachAssessment) => {
    setScores((assessment.scores as Record<string, number>) || {});
    setTotalScore(assessment.total_score);
    const raw = assessment.ai_advice;
    let parsed: any = null;
    if (raw && typeof raw === "object") parsed = raw;
    else if (typeof raw === "string" && raw.trim()) { try { parsed = JSON.parse(raw); } catch { parsed = null; } }
    setAdvice(parsed);
    setViewingId(assessment.id);
    setGenerating(false);
    setPendingAdvice(false);
    setStep("results");
  };

  const handleRegenerate = async () => {
    if (!viewingId) return;
    setRegenerating(true);
    try {
      const a = await regenerateAdvice(viewingId, profile, locale);
      if (a) { setAdvice(a); toast({ title: txt.adviceRegenerated }); }
      else toast({ title: txt.adviceRegenerateFailed, variant: "destructive" });
    } finally { setRegenerating(false); }
  };

  const resetQuiz = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
    setAdvice(null);
    setScores({});
    setTotalScore(0);
    setPendingAdvice(false);
    setViewingId(null);
  };

  const getScoreColor = (s: number) =>
    s >= 4 ? "text-green-500" : s >= 3 ? "text-yellow-500" : "text-destructive";

  // INTRO
  if (step === "intro") {
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-card-foreground">{txt.title}</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">{txt.coachOnly}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{txt.subtitle}</p>
          <div className="text-xs text-muted-foreground space-y-1 border-l-2 border-primary/30 pl-3">
            <p>{txt.intro1}</p>
            <p>{txt.intro2}</p>
            <p>{txt.intro3}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => { setCurrentQ(0); setAnswers({}); setStep("quiz"); }} className="flex-1">
              <Brain className="h-4 w-4 mr-1" /> {txt.startAssessment}
            </Button>
            <Button variant="outline" onClick={() => setStep("history")} className="flex-1">
              <History className="h-4 w-4 mr-1" /> {txt.viewHistory}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // HISTORY
  if (step === "history") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetQuiz}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {txt.backToIntro}
          </Button>
          <h3 className="font-bold text-foreground">{txt.history}</h3>
        </div>
        {loadingHistory ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : history.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">{txt.noHistory}</Card>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <Card key={h.id}
                className="p-3 flex items-center justify-between gap-2 transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99] cursor-pointer"
                onClick={() => viewPastResult(h)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); viewPastResult(h); } }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-card-foreground">{txt.score}: {h.total_score}/30</p>
                    {h.pending && (
                      <Badge variant="outline" className="gap-1 text-[10px] py-0 h-5">
                        <CloudOff className="h-3 w-3" /> {txt.pending}
                      </Badge>
                    )}
                    {!h.pending && !h.ai_advice && (
                      <Badge variant="secondary" className="text-[10px] py-0 h-5">{txt.noAdviceTitle}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleDateString()} · {txt.tapToView}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(h.id); }}
                    aria-label={txt.delete}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}
        <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{txt.confirmDeleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>{txt.confirmDeleteDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{txt.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => { if (confirmDeleteId) { await removeAssessment(confirmDeleteId); setConfirmDeleteId(null); } }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {txt.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // QUIZ
  if (step === "quiz") {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;
    const answered = answers[q.id] !== undefined;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : resetQuiz()}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {txt.back}
          </Button>
          <span className="text-xs text-muted-foreground">
            {txt.question} {currentQ + 1} {txt.of} {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {categoryIcons[q.category]}
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {categoryLabels[q.category][l]}
            </span>
          </div>
          <h3 className="font-bold text-card-foreground text-base sm:text-lg">{q.text[l]}</h3>
          <div className="space-y-2">
            {q.options.map((opt) => (
              <button key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                  answers[q.id] === opt.value
                    ? "border-primary bg-primary/10 text-card-foreground"
                    : "border-border bg-card hover:border-primary/50 text-card-foreground"
                }`}>
                {opt.label[l]}
              </button>
            ))}
          </div>
        </Card>
        {currentQ === questions.length - 1 && answered && (
          <Button onClick={submitAssessment} className="w-full" size="lg">
            <Sparkles className="h-4 w-4 mr-2" /> {txt.getResults}
          </Button>
        )}
      </div>
    );
  }

  // RESULTS
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={resetQuiz}>
          <ChevronLeft className="h-4 w-4 mr-1" /> {txt.backToIntro}
        </Button>
      </div>

      <Card className="p-4 sm:p-6 text-center space-y-3">
        <Users className="h-8 w-8 mx-auto text-primary" />
        <h2 className="text-2xl font-extrabold text-card-foreground">{totalScore}/30</h2>
        <p className="text-sm text-muted-foreground">{getOverallLabel(totalScore)}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
          {Object.entries(scores).map(([cat, s]) => (
            <div key={cat} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
              {categoryIcons[cat]}
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {categoryLabels[cat]?.[l] || cat}
              </span>
              <span className={`text-lg font-bold ${getScoreColor(s)}`}>{s}</span>
            </div>
          ))}
        </div>
      </Card>

      {pendingAdvice && (
        <Card className="p-4 text-sm text-muted-foreground flex items-start gap-2">
          <CloudOff className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{txt.adviceWillSyncOnline}</span>
        </Card>
      )}

      {generating ? (
        <Card className="p-6 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">{txt.generating}</p>
        </Card>
      ) : advice ? (
        <>
          {advice.summary && (
            <Card className="p-4"><p className="text-sm text-card-foreground">{advice.summary}</p></Card>
          )}

          {advice.strengths?.length > 0 && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold text-card-foreground text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-500" /> {txt.strengths}
              </h3>
              <ul className="space-y-1">
                {advice.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {advice.improvementAreas?.map((area: any, i: number) => (
            <Card key={i} className="p-4 space-y-2">
              <h3 className="font-bold text-card-foreground text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> {area.area}
                {typeof area.score === "number" && (
                  <span className={`ml-auto text-sm font-bold ${getScoreColor(area.score)}`}>{area.score}/5</span>
                )}
              </h3>
              {area.techniques?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{txt.techniques}</p>
                  <ul className="space-y-1">
                    {area.techniques.map((t: string, j: number) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {area.dailyHabit && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  <span className="font-semibold">{txt.dailyHabit}: </span>{area.dailyHabit}
                </p>
              )}
            </Card>
          ))}

          {advice.preCompetitionRoutine && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold text-card-foreground text-sm">{txt.preCompRoutine}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{advice.preCompetitionRoutine}</p>
            </Card>
          )}

          {advice.affirmations?.length > 0 && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold text-card-foreground text-sm">{txt.affirmations}</h3>
              <ul className="space-y-1">
                {advice.affirmations.map((a: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground italic">"{a}"</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      ) : (
        viewingId && (
          <Card className="p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{txt.noAdviceTitle}</p>
            <Button onClick={handleRegenerate} disabled={regenerating || !navigator.onLine} size="sm">
              {regenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {txt.regenerateAdvice}
            </Button>
          </Card>
        )
      )}

      <Button variant="outline" onClick={resetQuiz} className="w-full">
        <ChevronLeft className="h-4 w-4 mr-1" /> {txt.retake}
      </Button>
    </div>
  );
}
