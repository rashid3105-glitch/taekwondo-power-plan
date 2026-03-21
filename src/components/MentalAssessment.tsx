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
  Download,
  NotebookPen,
} from "lucide-react";
import jsPDF from "jspdf";
import { MentalRadarChart, drawRadarOnPDF } from "./MentalRadarChart";

interface Profile {
  belt_level: string;
  experience_years: number | null;
  age: number | null;
  discipline?: string;
}

interface Question {
  id: string;
  category: string;
  text: { en: string; da: string };
  options: { value: number; label: { en: string; da: string } }[];
}

const questions: Question[] = [
  // Mental Toughness (3 questions + 1 new)
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
    id: "mt2",
    category: "mentalToughness",
    text: { en: "When I'm behind on points in a match, I...", da: "Når jeg er bagud på point i en kamp, så..." },
    options: [
      { value: 1, label: { en: "Panic and lose composure completely", da: "Går i panik og mister fatningen helt" } },
      { value: 2, label: { en: "Get frustrated and make more mistakes", da: "Bliver frustreret og laver flere fejl" } },
      { value: 3, label: { en: "Stay calm but struggle to change tactics", da: "Forbliver rolig, men kæmper med at ændre taktik" } },
      { value: 4, label: { en: "Stay composed and adjust my strategy", da: "Bevarer fatningen og justerer min strategi" } },
      { value: 5, label: { en: "Get more determined — being behind fuels me", da: "Bliver mere beslutsom — at være bagud driver mig" } },
    ],
  },
  {
    id: "mt3",
    category: "mentalToughness",
    text: { en: "When I experience pain or discomfort during training, I...", da: "Når jeg oplever smerte eller ubehag under træning, så..." },
    options: [
      { value: 1, label: { en: "Stop immediately and avoid the exercise", da: "Stopper med det samme og undgår øvelsen" } },
      { value: 2, label: { en: "Reduce intensity significantly and feel defeated", da: "Reducerer intensiteten markant og føler mig besejret" } },
      { value: 3, label: { en: "Modify and continue but feel distracted by it", da: "Tilpasser og fortsætter, men er distraheret af det" } },
      { value: 4, label: { en: "Assess if it's safe, then push through with control", da: "Vurderer om det er sikkert, og presser derefter igennem med kontrol" } },
      { value: 5, label: { en: "Embrace it — I know pain is part of growth", da: "Omfavner det — jeg ved smerte er en del af vækst" } },
    ],
  },
  // Competition Anxiety (3 questions + 1 new)
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
    id: "ca2",
    category: "competitionAnxiety",
    text: { en: "My body's physical response to competition stress is...", da: "Min krops fysiske reaktion på konkurrencestress er..." },
    options: [
      { value: 1, label: { en: "Severe — shaking, nausea, can't warm up properly", da: "Alvorlig — rysten, kvalme, kan ikke varme ordentligt op" } },
      { value: 2, label: { en: "Noticeable tension, tight muscles, shallow breathing", da: "Mærkbar spænding, stramme muskler, overfladisk vejrtrækning" } },
      { value: 3, label: { en: "Some butterflies but I can still perform", da: "Lidt sommerfugle, men jeg kan stadig præstere" } },
      { value: 4, label: { en: "Controlled adrenaline, I use breathing techniques", da: "Kontrolleret adrenalin, jeg bruger vejrtræningsteknikker" } },
      { value: 5, label: { en: "I feel energized and physically ready to compete", da: "Jeg føler mig energisk og fysisk klar til at konkurrere" } },
    ],
  },
  {
    id: "ca3",
    category: "competitionAnxiety",
    text: { en: "The night before a competition, my sleep is...", da: "Natten før en konkurrence er min søvn..." },
    options: [
      { value: 1, label: { en: "Terrible — I barely sleep, mind races all night", da: "Forfærdelig — jeg sover næsten ikke, tankerne kører hele natten" } },
      { value: 2, label: { en: "Restless, I wake up multiple times", da: "Urolig, jeg vågner flere gange" } },
      { value: 3, label: { en: "Okay but not great, some difficulty falling asleep", da: "Okay men ikke fantastisk, lidt svært at falde i søvn" } },
      { value: 4, label: { en: "Good — I have a routine that helps me relax", da: "God — jeg har en rutine der hjælper mig med at slappe af" } },
      { value: 5, label: { en: "Great — I sleep well knowing I'm prepared", da: "Fantastisk — jeg sover godt og ved jeg er forberedt" } },
    ],
  },
  // Focus & Concentration (3 questions + 1 new)
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
    id: "fc2",
    category: "focusConcentration",
    text: { en: "When the crowd is loud or my opponent trash-talks, I...", da: "Når publikum er højlydt eller min modstander provokerer, så..." },
    options: [
      { value: 1, label: { en: "Get completely thrown off my game", da: "Bliver fuldstændig distraheret fra min kamp" } },
      { value: 2, label: { en: "It bothers me and affects my decisions", da: "Det generer mig og påvirker mine beslutninger" } },
      { value: 3, label: { en: "Notice it but can refocus after a moment", da: "Bemærker det, men kan genfokusere efter et øjeblik" } },
      { value: 4, label: { en: "Block it out and stay in my zone", da: "Blokerer det og forbliver i min zone" } },
      { value: 5, label: { en: "Use it as fuel — external noise sharpens me", da: "Bruger det som brændstof — ekstern støj skærper mig" } },
    ],
  },
  {
    id: "fc3",
    category: "focusConcentration",
    text: { en: "Between rounds or during breaks, my mind...", da: "Mellem runder eller i pauser er mit sind..." },
    options: [
      { value: 1, label: { en: "Replays mistakes obsessively, I can't let go", da: "Genafspiller fejl tvangsmæssigt, jeg kan ikke slippe" } },
      { value: 2, label: { en: "Wanders to unrelated thoughts, hard to reset", da: "Vandrer til urelaterede tanker, svært at nulstille" } },
      { value: 3, label: { en: "Somewhat focused, but I lose my game plan", da: "Noget fokuseret, men mister min kampplan" } },
      { value: 4, label: { en: "I use breaks to breathe, reset and refocus", da: "Jeg bruger pauser til at trække vejret, nulstille og genfokusere" } },
      { value: 5, label: { en: "I have a clear mental routine for every break", da: "Jeg har en klar mental rutine for hver pause" } },
    ],
  },
  // Recovery from Loss (3 questions + 1 new)
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
    id: "rl2",
    category: "recoveryFromLoss",
    text: { en: "When I watch video of a match I lost, I...", da: "Når jeg ser video af en kamp, jeg tabte, så..." },
    options: [
      { value: 1, label: { en: "Avoid it completely — too painful to watch", da: "Undgår det fuldstændigt — for smertefuldt at se" } },
      { value: 2, label: { en: "Watch but get frustrated and emotional", da: "Ser det, men bliver frustreret og følelsesladet" } },
      { value: 3, label: { en: "Can watch it and notice some mistakes", da: "Kan se det og bemærke nogle fejl" } },
      { value: 4, label: { en: "Analyze calmly and make notes for improvement", da: "Analyserer roligt og tager noter til forbedring" } },
      { value: 5, label: { en: "Love reviewing — I build a detailed improvement plan", da: "Elsker at gennemgå — jeg laver en detaljeret forbedringsplan" } },
    ],
  },
  {
    id: "rl3",
    category: "recoveryFromLoss",
    text: { en: "When a teammate beats me in training, I...", da: "Når en holdkammerat slår mig i træning, så..." },
    options: [
      { value: 1, label: { en: "Feel embarrassed and avoid sparring them again", da: "Føler mig flov og undgår at spar med dem igen" } },
      { value: 2, label: { en: "Get annoyed and it ruins the rest of my session", da: "Bliver irriteret og det ødelægger resten af min træning" } },
      { value: 3, label: { en: "Accept it but don't learn much from it", da: "Accepterer det, men lærer ikke meget af det" } },
      { value: 4, label: { en: "Ask them what they did and learn from it", da: "Spørger dem hvad de gjorde og lærer af det" } },
      { value: 5, label: { en: "Welcome it — training with better athletes makes me grow", da: "Velkomner det — at træne med bedre atleter får mig til at vokse" } },
    ],
  },
  // Confidence (4 questions, 2 new)
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
    id: "cf2",
    category: "confidence",
    text: { en: "When facing a higher-ranked or bigger opponent, I...", da: "Når jeg møder en højere rangeret eller større modstander, så..." },
    options: [
      { value: 1, label: { en: "Feel defeated before the match even starts", da: "Føler mig besejret, før kampen overhovedet begynder" } },
      { value: 2, label: { en: "Feel intimidated and play it too safe", da: "Føler mig skræmt og spiller det for sikkert" } },
      { value: 3, label: { en: "Respect them but still give my best effort", da: "Respekterer dem, men giver stadig mit bedste" } },
      { value: 4, label: { en: "See it as a great test and rise to the occasion", da: "Ser det som en stor test og rejser mig til lejligheden" } },
      { value: 5, label: { en: "Love the challenge — I compete harder against top fighters", da: "Elsker udfordringen — jeg kæmper hårdere mod topkæmpere" } },
    ],
  },
  {
    id: "cf3",
    category: "confidence",
    text: { en: "When I learn a new technique, I...", da: "Når jeg lærer en ny teknik, så..." },
    options: [
      { value: 1, label: { en: "Feel overwhelmed and doubt I'll ever master it", da: "Føler mig overvældet og tvivler på at jeg nogensinde mestrer den" } },
      { value: 2, label: { en: "Try it a few times but give up quickly if it's hard", da: "Prøver det et par gange, men giver hurtigt op hvis det er svært" } },
      { value: 3, label: { en: "Practice it but feel unsure about using it in sparring", da: "Øver den, men føler mig usikker på at bruge den i sparring" } },
      { value: 4, label: { en: "Commit to drilling it until it feels natural", da: "Forpligter mig til at drilbe den indtil den føles naturlig" } },
      { value: 5, label: { en: "Get excited — new techniques are opportunities to evolve", da: "Bliver begejstret — nye teknikker er muligheder for at udvikle mig" } },
    ],
  },
  // Motivation (4 questions, 2 new)
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
  {
    id: "mo2",
    category: "motivation",
    text: { en: "When I hit a training plateau with no visible progress, I...", da: "Når jeg rammer et træningsplateau uden synlige fremskridt, så..." },
    options: [
      { value: 1, label: { en: "Lose interest and consider quitting", da: "Mister interessen og overvejer at stoppe" } },
      { value: 2, label: { en: "Get discouraged and train with less intensity", da: "Bliver modløs og træner med mindre intensitet" } },
      { value: 3, label: { en: "Keep going but feel frustrated", da: "Fortsætter, men føler mig frustreret" } },
      { value: 4, label: { en: "Trust the process and stay consistent", da: "Stoler på processen og forbliver konsekvent" } },
      { value: 5, label: { en: "Get creative — try new approaches and seek coaching", da: "Bliver kreativ — prøver nye tilgange og søger coaching" } },
    ],
  },
  {
    id: "mo3",
    category: "motivation",
    text: { en: "When I see others progressing faster than me, I...", da: "Når jeg ser andre gøre hurtigere fremskridt end mig, så..." },
    options: [
      { value: 1, label: { en: "Feel hopeless and want to quit", da: "Føler mig håbløs og vil stoppe" } },
      { value: 2, label: { en: "Get jealous and it kills my motivation", da: "Bliver misundelig og det dræber min motivation" } },
      { value: 3, label: { en: "Feel a bit envious but keep training", da: "Føler mig lidt misundelig, men fortsætter med at træne" } },
      { value: 4, label: { en: "Use it as inspiration to train harder", da: "Bruger det som inspiration til at træne hårdere" } },
      { value: 5, label: { en: "Celebrate their success and focus on my own journey", da: "Fejrer deres succes og fokuserer på min egen rejse" } },
    ],
  },
  {
    id: "mo4",
    category: "motivation",
    text: { en: "My ability to set and follow through on training goals is...", da: "Min evne til at sætte og følge op på træningsmål er..." },
    options: [
      { value: 1, label: { en: "I don't set goals — I just show up when I feel like it", da: "Jeg sætter ikke mål — jeg dukker bare op når jeg har lyst" } },
      { value: 2, label: { en: "I set goals but rarely follow through", da: "Jeg sætter mål, men følger sjældent op" } },
      { value: 3, label: { en: "I set goals and sometimes achieve them", da: "Jeg sætter mål og opnår dem nogle gange" } },
      { value: 4, label: { en: "I set clear goals and track my progress consistently", da: "Jeg sætter klare mål og følger mine fremskridt konsekvent" } },
      { value: 5, label: { en: "I have a structured plan with short and long-term goals", da: "Jeg har en struktureret plan med kort- og langsigtede mål" } },
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
  const [savingDiary, setSavingDiary] = useState(false);
  const [diarySaved, setDiarySaved] = useState(false);
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
      downloadPlan: "Download Plan",
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
      downloadPlan: "Download plan",
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

    // Radar chart in PDF
    const radarLabels = Object.fromEntries(Object.entries(categoryLabels).map(([k, v]) => [k, v[l]]));
    drawRadarOnPDF(doc, scores, radarLabels, pageWidth / 2, y + 45, 35, 5);
    y += 100;

    // Category scores
    Object.entries(scores).forEach(([cat, score]) => {
      addText(`${categoryLabels[cat][l]}: ${score}/5`, 11, true);
    });
    y += 4;

    // Summary
    if (advice.summary) {
      addText(advice.summary, 10);
      y += 2;
    }

    // Strengths
    if (advice.strengths?.length > 0) {
      addText(txt.strengths, 13, true, [34, 139, 34]);
      advice.strengths.forEach((s: string) => addText(`✓ ${s}`, 10));
      y += 2;
    }

    // Improvement areas
    advice.improvementAreas?.forEach((area: any) => {
      addText(`${area.area} (${area.score}/5)`, 13, true, [30, 64, 175]);
      area.techniques?.forEach((tech: string) => addText(`• ${tech}`, 10));
      if (area.dailyHabit) {
        addText(`${txt.dailyHabit}: ${area.dailyHabit}`, 10, false, [80, 80, 80]);
      }
      y += 2;
    });

    // Pre-competition routine
    if (advice.preCompetitionRoutine) {
      addText(txt.preCompRoutine, 13, true, [30, 64, 175]);
      addText(advice.preCompetitionRoutine, 10);
      y += 2;
    }

    // Affirmations
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

        {/* Radar Chart */}
        <div className="py-2">
          <MentalRadarChart
            scores={scores}
            labels={Object.fromEntries(Object.entries(categoryLabels).map(([k, v]) => [k, v[l]]))}
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
