import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";

import trainingImg from "@/assets/features/training-plan.jpg";
import progressImg from "@/assets/features/progress.jpg";
import mentalImg from "@/assets/features/mental.jpg";
import rehabImg from "@/assets/features/rehab.jpg";
import nutritionImg from "@/assets/features/nutrition.jpg";
import libraryImg from "@/assets/features/library.jpg";

type FeatureKey = "plan" | "progress" | "mental" | "rehab" | "nutrition" | "library";

interface FeatureData {
  titleKey: string;
  descKey: string;
  image: string;
  gradient: string;
  benefits: { en: string; da: string }[];
  longDesc: { en: string; da: string };
}

const features: Record<FeatureKey, FeatureData> = {
  plan: {
    titleKey: "sectionPlanTitle",
    descKey: "sectionPlanDesc",
    image: trainingImg,
    gradient: "from-[hsl(190,95%,50%)] to-[hsl(210,90%,56%)]",
    longDesc: {
      en: "Our AI analyzes your belt level, weekly schedule, training goals, and current injuries to generate a fully periodized strength & conditioning program. Each session is designed to complement your taekwondo training — not compete with it.",
      da: "Vores AI analyserer dit bælteniveau, ugentlige skema, træningsmål og nuværende skader for at generere et fuldt periodiseret styrke- og konditionsprogram. Hver session er designet til at supplere din taekwondo-træning — ikke konkurrere med den.",
    },
    benefits: [
      { en: "AI-generated periodized programs", da: "AI-genererede periodiserede programmer" },
      { en: "Tailored to your belt level and goals", da: "Skræddersyet til dit bælteniveau og mål" },
      { en: "Weekly schedule optimization", da: "Ugentlig skemaoptimering" },
      { en: "Exercise alternatives for every movement", da: "Øvelsesalternativer for hver bevægelse" },
      { en: "Automatic injury-aware adjustments", da: "Automatiske skadestilpassede justeringer" },
    ],
  },
  progress: {
    titleKey: "sectionProgressTitle",
    descKey: "sectionProgressDesc",
    image: progressImg,
    gradient: "from-[hsl(45,90%,55%)] to-[hsl(35,90%,50%)]",
    longDesc: {
      en: "Track every workout, visualize your training volume over time, and build consistency streaks. Our progress dashboard gives you clear insights into completion rates, muscle group balance, and performance trends.",
      da: "Spor hver træning, visualiser dit træningsvolumen over tid, og opbyg konsistensstreaks. Vores fremskridts-dashboard giver dig klare indsigter i fuldførelsesrater, muskelgruppebalance og præstationstendenser.",
    },
    benefits: [
      { en: "Visual training volume charts", da: "Visuelle træningsvolumendiagrammer" },
      { en: "Workout completion tracking", da: "Sporing af træningsfuldførelse" },
      { en: "Consistency streaks and milestones", da: "Konsistensstreaks og milepæle" },
      { en: "Muscle group balance analysis", da: "Analyse af muskelgruppebalance" },
      { en: "Week-by-week performance trends", da: "Uge-for-uge præstationstendenser" },
    ],
  },
  mental: {
    titleKey: "sectionMentalTitle",
    descKey: "sectionMentalDesc",
    image: mentalImg,
    gradient: "from-[hsl(330,60%,72%)] to-[hsl(280,60%,65%)]",
    longDesc: {
      en: "Mental strength separates good athletes from great ones. Assess your psychological readiness with our sports psychology framework, then receive personalized AI advice covering focus, visualization, competition anxiety, and more.",
      da: "Mental styrke adskiller gode atleter fra de bedste. Vurder din psykologiske parathed med vores sportspsykologiske rammeværk, og modtag derefter personlig AI-rådgivning om fokus, visualisering, konkurrenceangst og mere.",
    },
    benefits: [
      { en: "Sports psychology assessments", da: "Sportspsykologiske vurderinger" },
      { en: "Radar chart for mental dimensions", da: "Radardiagram for mentale dimensioner" },
      { en: "AI-powered personalized advice", da: "AI-drevet personlig rådgivning" },
      { en: "Focus and visualization exercises", da: "Fokus- og visualiseringsøvelser" },
      { en: "Competition anxiety management", da: "Håndtering af konkurrenceangst" },
    ],
  },
  rehab: {
    titleKey: "sectionRehabTitle",
    descKey: "sectionRehabDesc",
    image: rehabImg,
    gradient: "from-[hsl(0,72%,51%)] to-[hsl(15,80%,50%)]",
    longDesc: {
      en: "Injuries don't have to derail your training. Describe your injury and our AI builds a phased rehabilitation program with clear pain guidelines, progression milestones, and safety protocols — so you come back stronger.",
      da: "Skader behøver ikke at afspore din træning. Beskriv din skade, og vores AI bygger et fasebaseret rehabiliteringsprogram med klare smerteretningslinjer, progressionsmilepæle og sikkerhedsprotokoller — så du kommer stærkere tilbage.",
    },
    benefits: [
      { en: "Phased rehab program generation", da: "Generering af fasebaserede genoptræningsprogrammer" },
      { en: "Pain level guidelines", da: "Retningslinjer for smerteniveau" },
      { en: "Safe progression milestones", da: "Sikre progressionsmilepæle" },
      { en: "TKD-specific recovery protocols", da: "TKD-specifikke genoptræningsprotokoller" },
      { en: "Return-to-training planning", da: "Planlægning af tilbagevenden til træning" },
    ],
  },
  nutrition: {
    titleKey: "sectionNutritionTitle",
    descKey: "sectionNutritionDesc",
    image: nutritionImg,
    gradient: "from-[hsl(25,90%,55%)] to-[hsl(15,85%,50%)]",
    longDesc: {
      en: "Fuel your performance with athlete-friendly nutrition. Browse curated recipes with full macro breakdowns, or let AI generate a complete meal plan tailored to your weight, training load, and competition schedule.",
      da: "Fuel din præstation med atletvenlig ernæring. Gennemse kuraterede opskrifter med fuld makronedbrydning, eller lad AI generere en komplet kostplan skræddersyet til din vægt, træningsmængde og konkurrencekalender.",
    },
    benefits: [
      { en: "AI-generated meal plans", da: "AI-genererede kostplaner" },
      { en: "Full macro breakdowns per recipe", da: "Fuld makronedbrydning per opskrift" },
      { en: "Training-load adjusted nutrition", da: "Træningsbelastningstilpasset ernæring" },
      { en: "Athlete-friendly recipe library", da: "Atletvenligt opskriftsbibliotek" },
      { en: "Custom recipe creation", da: "Oprettelse af tilpassede opskrifter" },
    ],
  },
  library: {
    titleKey: "sectionLibraryTitle",
    descKey: "sectionLibraryDesc",
    image: libraryImg,
    gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,60%,40%)]",
    longDesc: {
      en: "Access a curated collection of TKD-specific exercises, each with detailed instructions, muscle group targeting, tempo guides, and video references. Add your own custom exercises to build a personalized training toolkit.",
      da: "Få adgang til en kurateret samling af TKD-specifikke øvelser, hver med detaljerede instruktioner, muskelgruppemålretning, tempoguider og videoreferencer. Tilføj dine egne øvelser for at opbygge et personligt træningsværktøj.",
    },
    benefits: [
      { en: "Curated TKD-specific exercises", da: "Kuraterede TKD-specifikke øvelser" },
      { en: "Muscle group targeting info", da: "Information om muskelgruppemålretning" },
      { en: "Video references and demos", da: "Videoreferencer og demonstrationer" },
      { en: "Custom exercise creation", da: "Oprettelse af tilpassede øvelser" },
      { en: "Alternative exercise suggestions", da: "Forslag til alternative øvelser" },
    ],
  },
};

const FeatureDetail = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();

  const feature = features[section as FeatureKey];

  if (!feature) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-energy">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">TKD POWER</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs">
            {t("signIn")}
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Back button */}
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {locale === "da" ? "Tilbage" : "Back"}
          </Button>
        </div>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-6 pb-10">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t(feature.titleKey as any)}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {feature.longDesc[locale]}
            </p>
          </div>
        </section>

        {/* Screenshot */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-10`} />
            <img
              src={feature.image}
              alt={t(feature.titleKey as any)}
              className="w-full h-auto relative z-10"
              loading="lazy"
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {locale === "da" ? "Fordele" : "Key Benefits"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {feature.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4"
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${feature.gradient}`}>
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="text-sm text-foreground">{benefit[locale]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-8 sm:p-12 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              {locale === "da" ? "Klar til at komme i gang?" : "Ready to get started?"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {locale === "da"
                ? "Opret din konto og få adgang til alle funktioner med det samme."
                : "Create your account and get access to all features right away."}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => navigate("/auth")} size="lg" className="px-8 font-semibold">
                {t("getStarted")} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="px-8 font-semibold">
                {t("viewPricing" as any)}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-5">
        <p className="text-center text-[11px] text-muted-foreground tracking-wide">
          {t("footerText")}
        </p>
      </footer>
    </div>
  );
};

export default FeatureDetail;
