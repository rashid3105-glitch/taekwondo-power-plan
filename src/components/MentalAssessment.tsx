import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";

interface Profile {
  belt_level: string;
  experience_years: number | null;
  age: number | null;
}

interface Question {
  id: string;
  category: string;
  text: { en: string; da: string };
  options: { value: number; label: { en: string; da: string } }[];
}

const questions: Question[] = [
  {
    id: "mt1",
    category: "mentalToughness",
    text: { en: "When training gets extremely hard, I...", da: "Når træningen bliver ekstremt hård, så..." },
    options: [
      { value: 1, label: { en: "Usually quit or give up", da: "Giver jeg normalt op" } },
      { value: 2, label: { en: "Struggle and often stop early", da: "Kæmper og stopper ofte tidligt" } },
      { value: 3, label: { en: "Push through most of the time", da: "Presser mig igennem det meste af tiden" } },
      { value: 4, label: { en: "Almost always push through", da: "Presser mig næsten altid igennem" } },
      { value: 5, label: { en: "Thrive under pressure — I love the challenge", da: "Trives under pres — jeg elsker udfordringen" } },
    ],
  },
  {
    id: "ca1",
    category: "competitionAnxiety",
    text: { en: "Before a competition or sparring match, I feel...", da: "Før en konkurrence eller sparringkamp føler jeg mig..." },
    options: [
      { value: 1, label: { en: "Overwhelmed with anxiety, can't function well", da: "Overvældet af angst, kan ikke fungere godt" } },
      { value: 2, label: { en: "Very nervous, it hurts my performance", da: "Meget nervøs, det påvirker min præstation negativt" } },
      { value: 3, label: { en: "Some nerves but I manage them ok", da: "Lidt nerver, men jeg håndterer dem ok" } },
      { value: 4, label: { en: "Good nerves that help me focus", da: "Gode nerver der hjælper mig med at fokusere" } },
      { value: 5, label: { en: "Calm and excited — I channel energy positively", da: "Rolig og begejstret — jeg kanaliserer energien positivt" } },
    ],
  },
  {
    id: "fc1",
    category: "focusConcentration",
    text: { en: "During a match or intense training, my focus is...", da: "Under en kamp eller intens træning er mit fokus..." },
    options: [
      { value: 1, label: { en: "Easily distracted, mind wanders a lot", da: "Let at distrahere, tankerne vandrer meget" } },
      { value: 2, label: { en: "Often lose focus at critical moments", da: "Mister ofte fokus på kritiske tidspunkter" } },
      { value: 3, label: { en: "Generally focused but sometimes drift", da: "Generelt fokuseret, men driver nogle gange" } },
      { value: 4, label: { en: "Strong focus, rarely lose concentration", da: "Stærkt fokus, mister sjældent koncentrationen" } },
      { value: 5, label: { en: "Laser-focused, nothing breaks my concentration", da: "Laserfokuseret, intet bryder min koncentration" } },
    ],
  },
  {
    id: "rl1",
    category: "recoveryFromLoss",
    text: { en: "After losing a fight or performing poorly, I...", da: "Efter at have tabt en kamp eller præsteret dårligt..." },
    options: [
      { value: 1, label: { en: "Feel devastated for days/weeks, lose motivation", da: "Føler mig knust i dage/uger, mister motivationen" } },
      { value: 2, label: { en: "It affects me a lot, hard to bounce back", da: "Det påvirker mig meget, svært at komme tilbage" } },
      { value: 3, label: { en: "Disappointed but recover within a day or two", da: "Skuffet, men komme mig inden for en dag eller to" } },
      { value: 4, label: { en: "Use it as fuel, analyze and move on quickly", da: "Bruger det som brændstof, analyserer og kommer videre hurtigt" } },
      { value: 5, label: { en: "See losses as the best learning opportunities", da: "Ser nederlag som de bedste læringsmuligheder" } },
    ],
  },
  {
    id: "cf1",
    category: "confidence",
    text: { en: "My belief in my own abilities is...", da: "Min tro på mine egne evner er..." },
    options: [
      { value: 1, label: { en: "Very low — I doubt myself constantly", da: "Meget lav — jeg tvivler konstant på mig selv" } },
      { value: 2, label: { en: "Low — I often feel I'm not good enough", da: "Lav — jeg føler ofte, at jeg ikke er god nok" } },
      { value: 3, label: { en: "Moderate — depends on the situation", da: "Moderat — afhænger af situationen" } },
      { value: 4, label: { en: "High — I trust my training and skills", da: "Høj — jeg stoler på min træning og mine evner" } },
      { value: 5, label: { en: "Very high — I know I can compete with anyone", da: "Meget høj — jeg ved, at jeg kan konkurrere med alle" } },
    ],
  },
  {
    id: "mo1",
    category: "motivation",
    text: { en: "My motivation to train and compete is...", da: "Min motivation til at træne og konkurrere er..." },
    options: [
      { value: 1, label: { en: "Very low, I often skip training", da: "Meget lav, jeg springer ofte træning over" } },
      { value: 2, label: { en: "Inconsistent, comes and goes", da: "Ustabil, kommer og går" } },
      { value: 3, label: { en: "Steady but could be stronger", da: "Stabil, men kunne være stærkere" } },
      { value: 4, label: { en: "Strong, I'm committed to improvement", da: "Stærk, jeg er dedikeret til forbedring" } },
      { value: 5, label: { en: "Burning — TKD is my passion and purpose", da: "Brændende — TKD er min passion og mit formål" } },
    ],
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  mentalToughness: <Shield className="h-4 w-4" />,
  competitionAnxiety: <Target className="h-4 w-4" />,
  focusConcentration: <Eye className="h-4 w-4" />,
  recoveryFromLoss: <RefreshCw className="h-4 w-4" />,
  confidence: <Flame className="h-4 w-4" />,
  motivation: <Trophy className="h-4 w-4" />,
};

const categoryLabels: Record<string, { en: string; da: string }> = {
  mentalToughness: { en: "Mental Toughness", da: "Mental styrke" },
  competitionAnxiety: { en: "Competition Anxiety", da: "Konkurrenceangst" },
  focusConcentration: { en: "Focus & Concentration", da: "Fokus & koncentration" },
  recoveryFromLoss: { en: "Recovery from Loss", da: "Håndtering af nederlag" },
  confidence: { en: "Confidence", da: "Selvtillid" },
  motivation: { en: "Motivation", da: "Motivation" },
};

interface Assessment {
  id: string;
  total_score: number;
  scores: Record<string, number>;
  ai_advice: any;
  created_at: string;
}

export function MentalAssessment({ profile }: { profile: Profile | null }) {
  const [step, setStep] = useState<"intro" | "quiz" | "results" | "history">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  const [advice, setAdvice] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const { locale } = useLanguage();
  const l = locale as "en" | "da";

  const t = {
    en: {
      title: "Mental Performance",
      subtitle: "Assess your mental readiness and get personalized coping strategies",
      startAssessment: "Start Assessment",
      viewHistory: "View History",
      question: "Question",
      of: "of",
      next: "Next",
      back: "Back",
      getResults: "Get My Results & AI Advice",
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
      getResults: "Få mine resultater & AI-råd",
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
    },
  };

  const txt = t[l];

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("mental_assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setHistory(data as unknown as Assessment[]);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAnswer = (value: number) => {
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const calculateScores = () => {
    const catScores: Record<string, number> = {};
    questions.forEach((q) => {
      catScores[q.category] = answers[q.id] || 1;
    });
    const total = Object.values(catScores).reduce((a, b) => a + b, 0);
    setScores(catScores);
    setTotalScore(total);
    return { catScores, total };
  };

  const submitAssessment = async () => {
    const { catScores, total } = calculateScores();
    setStep("results");
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-mental-advice", {
        body: { answers, scores: catScores, totalScore: total, profile, language: locale },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAdvice(data.advice);

      // Save to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("mental_assessments").insert({
          user_id: user.id,
          answers,
          scores: catScores,
          total_score: total,
          ai_advice: data.advice,
        } as any);
        loadHistory();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const deleteAssessment = async (id: string) => {
    await supabase.from("mental_assessments").delete().eq("id", id);
    loadHistory();
  };

  const viewPastResult = (assessment: Assessment) => {
    const catScores = assessment.scores as Record<string, number>;
    setScores(catScores);
    setTotalScore(assessment.total_score);
    setAdvice(assessment.ai_advice);
    setStep("results");
  };

  const resetQuiz = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
    setAdvice(null);
    setScores({});
    setTotalScore(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-500";
    if (score >= 3) return "text-yellow-500";
    return "text-destructive";
  };

  const getOverallLabel = (score: number) => {
    if (l === "da") {
      if (score >= 25) return "Fremragende mental parathed!";
      if (score >= 20) return "God mental styrke";
      if (score >= 15) return "Gennemsnitlig — plads til vækst";
      return "Har brug for arbejde — lad os bygge det op!";
    }
    if (score >= 25) return "Excellent mental readiness!";
    if (score >= 20) return "Good mental strength";
    if (score >= 15) return "Average — room for growth";
    return "Needs work — let's build it up!";
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
            <Button variant="outline" onClick={() => { loadHistory(); setStep("history"); }} className="flex-1">
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
                <button onClick={() => viewPastResult(h)} className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">
                    {txt.score}: {h.total_score}/30
                  </p>
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

      {/* Score overview */}
      <Card className="p-4 sm:p-6 text-center space-y-3">
        <Brain className="h-8 w-8 mx-auto text-primary" />
        <h2 className="text-2xl font-extrabold text-foreground">{totalScore}/30</h2>
        <p className="text-sm text-muted-foreground">{getOverallLabel(totalScore)}</p>

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
          {/* Summary */}
          <Card className="p-4 space-y-2">
            <p className="text-sm text-foreground">{advice.summary}</p>
          </Card>

          {/* Strengths */}
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

          {/* Areas to improve */}
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

          {/* Pre-competition routine */}
          {advice.preCompetitionRoutine && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> {txt.preCompRoutine}
              </h3>
              <p className="text-sm text-foreground whitespace-pre-line">{advice.preCompetitionRoutine}</p>
            </Card>
          )}

          {/* Affirmations */}
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
      ) : null}

      <Button variant="outline" onClick={resetQuiz} className="w-full">
        <RefreshCw className="h-4 w-4 mr-2" /> {txt.retake}
      </Button>
    </div>
  );
}
