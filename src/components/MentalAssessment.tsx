import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Brain,
  Target,
  Eye,
  RefreshCw,
  Shield,
  Flame,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Trophy,
  TrendingUp,
  Sparkles,
  History,
  Trash2,
  Download,
  NotebookPen,
  CloudOff,
} from "lucide-react";
import jsPDF from "jspdf";
import { MentalRadarChart, drawRadarOnPDF } from "./MentalRadarChart";
import { getQuestionsForAge, type MentalQuestion } from "@/data/mentalQuestions";
import { useOfflineMentalAssessments } from "@/hooks/useOfflineMentalAssessments";

interface Profile {
  belt_level: string;
  experience_years: number | null;
  age: number | null;
  discipline?: string;
}

type SupportedLocale = "en" | "da" | "sv" | "de" | "ar";

const categoryIcons: Record<string, React.ReactNode> = {
  mentalToughness: <Shield className="h-4 w-4" />,
  competitionAnxiety: <Target className="h-4 w-4" />,
  focusConcentration: <Eye className="h-4 w-4" />,
  recoveryFromLoss: <RefreshCw className="h-4 w-4" />,
  confidence: <Flame className="h-4 w-4" />,
  motivation: <Trophy className="h-4 w-4" />,
};

const categoryLabels: Record<string, Record<SupportedLocale, string>> = {
  mentalToughness: { en: "Mental Toughness", da: "Mental styrke", sv: "Mental styrka", de: "Mentale Stärke", ar: "القوة الذهنية" },
  competitionAnxiety: { en: "Competition Anxiety", da: "Konkurrenceangst", sv: "Tävlingsångest", de: "Wettkampfangst", ar: "قلق المنافسة" },
  focusConcentration: { en: "Focus & Concentration", da: "Fokus & koncentration", sv: "Fokus & koncentration", de: "Fokus & Konzentration", ar: "التركيز والانتباه" },
  recoveryFromLoss: { en: "Recovery from Loss", da: "Håndtering af nederlag", sv: "Återhämtning efter förlust", de: "Erholung nach Niederlagen", ar: "التعافي من الخسارة" },
  confidence: { en: "Confidence", da: "Selvtillid", sv: "Självförtroende", de: "Selbstvertrauen", ar: "الثقة بالنفس" },
  motivation: { en: "Motivation", da: "Motivation", sv: "Motivation", de: "Motivation", ar: "التحفيز" },
};

interface Assessment {
  id: string;
  total_score: number;
  scores: Record<string, number>;
  ai_advice: any;
  created_at: string;
}

const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    title: "Mental Performance",
    subtitle: "Assess your mental readiness and get personalized coping strategies",
    startAssessment: "Start Assessment",
    viewHistory: "View History",
    question: "Question",
    of: "of",
    next: "Next",
    back: "Back",
    getResults: "Get My Results & Advice",
    yourScore: "Your Mental Score",
    outOf: "out of 30",
    generating: "Generating personalized advice...",
    strengths: "Your Strengths",
    areasToImprove: "Areas to Improve",
    techniques: "Techniques",
    dailyHabit: "Daily Habit",
    preCompRoutine: "Pre-Competition Routine",
    affirmations: "Personal Affirmations",
    retake: "Retake Assessment",
    backToIntro: "Back",
    history: "Assessment History",
    noHistory: "No previous assessments yet.",
    score: "Score",
    delete: "Delete",
    downloadPlan: "Download Plan",
    saveToDiary: "Save to Diary",
    savedToDiary: "Saved to diary!",
    diaryNote: "Mental Assessment Summary",
    saveToDiaryPrompt: "Would you like to save this assessment summary as a note in your diary?",
    overallExcellent: "Excellent mental readiness!",
    overallGood: "Good mental strength",
    overallAverage: "Average — room for growth",
    overallNeedsWork: "Needs work — let's build it up!",
    pending: "Pending",
    adviceWillSyncOnline: "Saved offline. Personalized advice will be generated when you reconnect.",
  },
  da: {
    title: "Mental præstation",
    subtitle: "Vurder din mentale parathed og få personlige copingstrategier",
    startAssessment: "Start vurdering",
    viewHistory: "Se historik",
    question: "Spørgsmål",
    of: "af",
    next: "Næste",
    back: "Tilbage",
    getResults: "Få mine resultater & råd",
    yourScore: "Din mentale score",
    outOf: "ud af 30",
    generating: "Genererer personlige råd...",
    strengths: "Dine styrker",
    areasToImprove: "Områder til forbedring",
    techniques: "Teknikker",
    dailyHabit: "Daglig vane",
    preCompRoutine: "Før-konkurrence rutine",
    affirmations: "Personlige bekræftelser",
    retake: "Tag vurdering igen",
    backToIntro: "Tilbage",
    history: "Vurderingshistorik",
    noHistory: "Ingen tidligere vurderinger endnu.",
    score: "Score",
    delete: "Slet",
    downloadPlan: "Download plan",
    saveToDiary: "Gem i dagbog",
    savedToDiary: "Gemt i dagbog!",
    diaryNote: "Mental vurdering resumé",
    saveToDiaryPrompt: "Vil du gemme denne vurdering som en note i din dagbog?",
    overallExcellent: "Fremragende mental parathed!",
    overallGood: "God mental styrke",
    overallAverage: "Gennemsnitlig — plads til vækst",
    overallNeedsWork: "Har brug for arbejde — lad os bygge det op!",
    pending: "Afventer",
    adviceWillSyncOnline: "Gemt offline. Personlige råd genereres, når du er online igen.",
  },
  sv: {
    title: "Mental prestation",
    subtitle: "Utvärdera din mentala beredskap och få personliga copingstrategier",
    startAssessment: "Starta utvärdering",
    viewHistory: "Visa historik",
    question: "Fråga",
    of: "av",
    next: "Nästa",
    back: "Tillbaka",
    getResults: "Få mina resultat & råd",
    yourScore: "Din mentala poäng",
    outOf: "av 30",
    generating: "Genererar personliga råd...",
    strengths: "Dina styrkor",
    areasToImprove: "Förbättringsområden",
    techniques: "Tekniker",
    dailyHabit: "Daglig vana",
    preCompRoutine: "Förtävlingsrutin",
    affirmations: "Personliga affirmationer",
    retake: "Gör om utvärderingen",
    backToIntro: "Tillbaka",
    history: "Utvärderingshistorik",
    noHistory: "Inga tidigare utvärderingar ännu.",
    score: "Poäng",
    delete: "Radera",
    downloadPlan: "Ladda ner plan",
    saveToDiary: "Spara i dagbok",
    savedToDiary: "Sparad i dagboken!",
    diaryNote: "Mental utvärdering sammanfattning",
    saveToDiaryPrompt: "Vill du spara denna utvärdering som en anteckning i din dagbok?",
    overallExcellent: "Utmärkt mental beredskap!",
    overallGood: "Bra mental styrka",
    overallAverage: "Genomsnittlig — utrymme för tillväxt",
    overallNeedsWork: "Behöver arbete — låt oss bygga upp det!",
    pending: "Väntar",
    adviceWillSyncOnline: "Sparat offline. Personliga råd genereras när du är online igen.",
  },
  de: {
    title: "Mentale Leistung",
    subtitle: "Bewerte deine mentale Bereitschaft und erhalte personalisierte Bewältigungsstrategien",
    startAssessment: "Bewertung starten",
    viewHistory: "Verlauf anzeigen",
    question: "Frage",
    of: "von",
    next: "Weiter",
    back: "Zurück",
    getResults: "Meine Ergebnisse & Ratschläge",
    yourScore: "Dein mentaler Score",
    outOf: "von 30",
    generating: "Generiere personalisierte Ratschläge...",
    strengths: "Deine Stärken",
    areasToImprove: "Verbesserungsbereiche",
    techniques: "Techniken",
    dailyHabit: "Tägliche Gewohnheit",
    preCompRoutine: "Vor-Wettkampf-Routine",
    affirmations: "Persönliche Affirmationen",
    retake: "Bewertung wiederholen",
    backToIntro: "Zurück",
    history: "Bewertungsverlauf",
    noHistory: "Noch keine früheren Bewertungen.",
    score: "Score",
    delete: "Löschen",
    downloadPlan: "Plan herunterladen",
    saveToDiary: "Im Tagebuch speichern",
    savedToDiary: "Im Tagebuch gespeichert!",
    diaryNote: "Mentale Bewertung Zusammenfassung",
    saveToDiaryPrompt: "Möchtest du diese Bewertung als Notiz in deinem Tagebuch speichern?",
    overallExcellent: "Ausgezeichnete mentale Bereitschaft!",
    overallGood: "Gute mentale Stärke",
    overallAverage: "Durchschnittlich — Raum für Wachstum",
    overallNeedsWork: "Braucht Arbeit — lass es uns aufbauen!",
    pending: "Ausstehend",
    adviceWillSyncOnline: "Offline gespeichert. Personalisierte Ratschläge werden generiert, sobald du wieder online bist.",
  },
  ar: {
    title: "الأداء الذهني",
    subtitle: "قيّم استعدادك الذهني واحصل على استراتيجيات تأقلم مخصصة",
    startAssessment: "ابدأ التقييم",
    viewHistory: "عرض السجل",
    question: "سؤال",
    of: "من",
    next: "التالي",
    back: "رجوع",
    getResults: "احصل على نتائجي ونصائحي",
    yourScore: "نتيجتك الذهنية",
    outOf: "من 30",
    generating: "جارٍ إنشاء نصائح مخصصة...",
    strengths: "نقاط قوتك",
    areasToImprove: "مجالات التحسين",
    techniques: "التقنيات",
    dailyHabit: "العادة اليومية",
    preCompRoutine: "روتين ما قبل المنافسة",
    affirmations: "التأكيدات الشخصية",
    retake: "إعادة التقييم",
    backToIntro: "رجوع",
    history: "سجل التقييمات",
    noHistory: "لا توجد تقييمات سابقة بعد.",
    score: "النتيجة",
    delete: "حذف",
    downloadPlan: "تحميل الخطة",
    saveToDiary: "حفظ في المذكرات",
    savedToDiary: "تم الحفظ في المذكرات!",
    diaryNote: "ملخص التقييم الذهني",
    saveToDiaryPrompt: "هل تريد حفظ ملخص هذا التقييم كملاحظة في مذكراتك؟",
    overallExcellent: "استعداد ذهني ممتاز!",
    overallGood: "قوة ذهنية جيدة",
    overallAverage: "متوسط — مجال للنمو",
    overallNeedsWork: "يحتاج عملاً — لنبنيه!",
    pending: "قيد الانتظار",
    adviceWillSyncOnline: "تم الحفظ دون اتصال. سيتم إنشاء النصائح المخصصة عند عودة الاتصال.",
  },
};

export function MentalAssessment({ profile }: { profile: Profile | null }) {
  const [step, setStep] = useState<"intro" | "quiz" | "results" | "history">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  const [advice, setAdvice] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [pendingAdvice, setPendingAdvice] = useState(false);
  const [savingDiary, setSavingDiary] = useState(false);
  const [diarySaved, setDiarySaved] = useState(false);
  const { toast } = useToast();
  const { locale } = useLanguage();
  const {
    assessments: history,
    loading: loadingHistory,
    submitOffline,
    removeAssessment,
    regenerateAdvice,
  } = useOfflineMentalAssessments();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Map locale to supported locale with fallback
  const l: SupportedLocale = (["en", "da", "sv", "de", "ar"].includes(locale) ? locale : "en") as SupportedLocale;
  const questions = getQuestionsForAge(profile?.age);
  const txt = translations[l];

  const getOverallLabel = (score: number) => {
    if (score >= 25) return txt.overallExcellent;
    if (score >= 20) return txt.overallGood;
    if (score >= 15) return txt.overallAverage;
    return txt.overallNeedsWork;
  };

  const handleAnswer = (value: number) => {
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
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
      if (result?.ai_advice) {
        setAdvice(result.ai_advice);
      } else {
        // Submission queued offline — advice will arrive later via sync.
        setPendingAdvice(true);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const saveToDiary = async () => {
    setSavingDiary(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const scoreLines = Object.entries(scores)
        .map(([cat, score]) => `${categoryLabels[cat][l]}: ${score}/5`)
        .join("\n");

      const content = [
        `🧠 ${txt.diaryNote}`,
        `${txt.yourScore}: ${totalScore}/30 — ${getOverallLabel(totalScore)}`,
        "",
        scoreLines,
        "",
        advice?.summary || "",
        "",
        advice?.strengths?.length > 0
          ? `${txt.strengths}: ${advice.strengths.join(", ")}`
          : "",
        "",
        advice?.affirmations?.length > 0
          ? `${txt.affirmations}: ${advice.affirmations.map((a: string) => `"${a}"`).join(", ")}`
          : "",
      ].filter(Boolean).join("\n");

      const { error } = await supabase.from("diary_entries").insert({
        user_id: user.id,
        content,
        mood: Math.round(totalScore / 6),
        energy: Math.round(totalScore / 6),
        tags: ["mental-assessment"],
      });

      if (error) throw error;
      setDiarySaved(true);
      toast({ title: txt.savedToDiary });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingDiary(false);
    }
  };

  const deleteAssessment = async (id: string) => {
    await removeAssessment(id);
  };

  const viewPastResult = (assessment: Assessment) => {
    const catScores = assessment.scores as Record<string, number>;
    setScores(catScores);
    setTotalScore(assessment.total_score);
    const rawAdvice = assessment.ai_advice;
    setAdvice(typeof rawAdvice === "string" ? JSON.parse(rawAdvice) : rawAdvice);
    setStep("results");
  };

  const downloadPDF = () => {
    if (!advice) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, bold = false, color: [number, number, number] = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      if (y + lines.length * size * 0.5 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, margin, y);
      y += lines.length * size * 0.45 + 4;
    };

    addText(txt.title, 20, true, [30, 64, 175]);
    addText(`${txt.yourScore}: ${totalScore}/30 — ${getOverallLabel(totalScore)}`, 12, false);
    y += 4;

    const radarLabels = Object.fromEntries(Object.entries(categoryLabels).map(([k, v]) => [k, v[l]]));
    drawRadarOnPDF(doc, scores, radarLabels, pageWidth / 2, y + 45, 35, 5);
    y += 100;

    Object.entries(scores).forEach(([cat, score]) => {
      addText(`${categoryLabels[cat][l]}: ${score}/5`, 11, true);
    });
    y += 4;

    if (advice.summary) {
      addText(advice.summary, 10);
      y += 2;
    }

    if (advice.strengths?.length > 0) {
      addText(txt.strengths, 13, true, [34, 139, 34]);
      advice.strengths.forEach((s: string) => addText(`✓ ${s}`, 10));
      y += 2;
    }

    advice.improvementAreas?.forEach((area: any) => {
      addText(`${area.area} (${area.score}/5)`, 13, true, [30, 64, 175]);
      area.techniques?.forEach((tech: string) => addText(`• ${tech}`, 10));
      if (area.dailyHabit) {
        addText(`${txt.dailyHabit}: ${area.dailyHabit}`, 10, false, [80, 80, 80]);
      }
      y += 2;
    });

    if (advice.preCompetitionRoutine) {
      addText(txt.preCompRoutine, 13, true, [30, 64, 175]);
      addText(advice.preCompetitionRoutine, 10);
      y += 2;
    }

    if (advice.affirmations?.length > 0) {
      addText(txt.affirmations, 13, true, [180, 140, 0]);
      advice.affirmations.forEach((a: string) => addText(`"${a}"`, 10, false, [80, 80, 80]));
    }

    doc.save("mental-plan.pdf");
  };

  const resetQuiz = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
    setAdvice(null);
    setScores({});
    setTotalScore(0);
    setDiarySaved(false);
    setPendingAdvice(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-500";
    if (score >= 3) return "text-yellow-500";
    return "text-destructive";
  };

  // INTRO
  if (step === "intro") {
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">{txt.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{txt.subtitle}</p>
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
              <Card key={h.id} className="p-3 flex items-center justify-between">
                <button onClick={() => viewPastResult(h as any)} className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {txt.score}: {h.total_score}/30
                    </p>
                    {h.pending && (
                      <Badge variant="outline" className="gap-1 text-[10px] py-0 h-5">
                        <CloudOff className="h-3 w-3" /> {txt.pending}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleDateString()}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Object.entries(h.scores as Record<string, number>).map(([cat, score]) => (
                      <span key={cat} className={`text-xs font-bold ${getScoreColor(score as number)}`}>
                        {score as number}
                      </span>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAssessment(h.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
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
          <Button variant="ghost" size="sm" onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : resetQuiz}>
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
          <h3 className="font-bold text-foreground text-base sm:text-lg">{q.text[l]}</h3>
          <div className="space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                  answers[q.id] === opt.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-primary/50 text-foreground"
                }`}
              >
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
        <Brain className="h-8 w-8 mx-auto text-primary" />
        <h2 className="text-2xl font-extrabold text-foreground">{totalScore}/30</h2>
        <p className="text-sm text-muted-foreground">{getOverallLabel(totalScore)}</p>

        <div className="py-2">
          <MentalRadarChart
            scores={scores}
            labels={Object.fromEntries(Object.entries(categoryLabels).map(([k, v]) => [k, v[l]]))}
            previousScores={history.length > 0 ? (history[0].scores as Record<string, number>) : undefined}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
          {Object.entries(scores).map(([cat, score]) => (
            <div key={cat} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
              {categoryIcons[cat]}
              <span className="text-[10px] text-muted-foreground">{categoryLabels[cat][l]}</span>
              <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
          ))}
        </div>
      </Card>

      {generating ? (
        <Card className="p-6 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">{txt.generating}</p>
        </Card>
      ) : advice ? (
        <>
          <Card className="p-4 space-y-2">
            <p className="text-sm text-foreground">{advice.summary}</p>
          </Card>

          {advice.strengths?.length > 0 && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
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
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> {area.area}
                <span className={`text-xs ml-auto ${getScoreColor(area.score)}`}>{area.score}/5</span>
              </h3>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{txt.techniques}</p>
                <ul className="space-y-1">
                  {area.techniques?.map((tech: string, j: number) => (
                    <li key={j} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {tech}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs font-semibold text-muted-foreground">{txt.dailyHabit}</p>
                <p className="text-sm text-foreground">{area.dailyHabit}</p>
              </div>
            </Card>
          ))}

          {advice.preCompetitionRoutine && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> {txt.preCompRoutine}
              </h3>
              <p className="text-sm text-foreground whitespace-pre-line">{advice.preCompetitionRoutine}</p>
            </Card>
          )}

          {advice.affirmations?.length > 0 && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" /> {txt.affirmations}
              </h3>
              <ul className="space-y-2">
                {advice.affirmations.map((a: string, i: number) => (
                  <li key={i} className="text-sm text-foreground italic bg-primary/5 p-2 rounded-lg">
                    "{a}"
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      ) : pendingAdvice ? (
        <Card className="p-4 space-y-2 border-primary/30 bg-primary/5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            <CloudOff className="h-4 w-4 text-primary" /> {txt.pending}
          </h3>
          <p className="text-sm text-muted-foreground">{txt.adviceWillSyncOnline}</p>
        </Card>
      ) : null}

      {advice && !diarySaved && (
        <Card className="p-4 space-y-2 border-primary/30 bg-primary/5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-primary" /> {txt.saveToDiary}
          </h3>
          <p className="text-xs text-muted-foreground">{txt.saveToDiaryPrompt}</p>
          <Button onClick={saveToDiary} disabled={savingDiary} size="sm" className="w-full">
            {savingDiary ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <NotebookPen className="h-4 w-4 mr-2" />}
            {txt.saveToDiary}
          </Button>
        </Card>
      )}

      {diarySaved && (
        <Card className="p-3 border-green-500/30 bg-green-500/10 text-center">
          <p className="text-sm text-foreground font-medium">✓ {txt.savedToDiary}</p>
        </Card>
      )}

      <div className="flex gap-2">
        {advice && (
          <Button onClick={downloadPDF} className="flex-1">
            <Download className="h-4 w-4 mr-2" /> {txt.downloadPlan}
          </Button>
        )}
        <Button variant="outline" onClick={resetQuiz} className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" /> {txt.retake}
        </Button>
      </div>
    </div>
  );
}
