import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.webp";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";

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
  benefits: { en: string; da: string; sv: string }[];
  longDesc: { en: string; da: string; sv: string };
}

const features: Record<FeatureKey, FeatureData> = {
  plan: {
    titleKey: "sectionPlanTitle",
    descKey: "sectionPlanDesc",
    image: trainingImg,
    gradient: "from-[hsl(190,95%,50%)] to-[hsl(210,90%,56%)]",
    longDesc: {
      en: "Our programs are rooted in proven periodization science — the same methodology used by elite coaches worldwide. Based on your belt level, weekly schedule, training goals, and current injuries, we build a fully periodized strength & conditioning program. Each session is designed to complement your taekwondo training — not compete with it.",
      da: "Vores programmer er baseret på gennemprøvet periodiseringsvidenskab — den samme metodik brugt af elitetrænere verden over. Baseret på dit bælteniveau, ugentlige skema, træningsmål og nuværende skader bygger vi et fuldt periodiseret styrke- og konditionsprogram. Hver session er designet til at supplere din taekwondo-træning — ikke konkurrere med den.",
      sv: "Våra program är grundade i beprövad periodiseringsvetenskap — samma metodik som används av elittränare världen över. Baserat på ditt bältnivå, veckoschema, träningsmål och nuvarande skador bygger vi ett fullt periodiserat styrke- och konditionsprogram. Varje pass är utformat för att komplettera din taekwondo-träning — inte konkurrera med den.",
    },
    benefits: [
      { en: "Evidence-based periodized programs", da: "Evidensbaserede periodiserede programmer", sv: "Evidensbaserade periodiserade program" },
      { en: "Tailored to your belt level and goals", da: "Skræddersyet til dit bælteniveau og mål", sv: "Anpassat till ditt bältnivå och mål" },
      { en: "Weekly schedule optimization", da: "Ugentlig skemaoptimering", sv: "Veckoschemaoptimering" },
      { en: "Exercise alternatives for every movement", da: "Øvelsesalternativer for hver bevægelse", sv: "Övningsalternativ för varje rörelse" },
      { en: "Injury-aware adjustments built in", da: "Indbyggede skadestilpassede justeringer", sv: "Inbyggda skadeanpassade justeringar" },
    ],
  },
  progress: {
    titleKey: "sectionProgressTitle",
    descKey: "sectionProgressDesc",
    image: progressImg,
    gradient: "from-[hsl(45,90%,55%)] to-[hsl(35,90%,50%)]",
    longDesc: {
      en: "Track every workout, visualize your training volume over time, and build consistency streaks. Our progress dashboard gives you clear insights into completion rates, muscle group balance, and performance trends — so you and your coach always know what's working.",
      da: "Spor hver træning, visualiser dit træningsvolumen over tid, og opbyg konsistensstreaks. Vores fremskridts-dashboard giver dig klare indsigter i fuldførelsesrater, muskelgruppebalance og præstationstendenser — så du og din træner altid ved, hvad der virker.",
      sv: "Spåra varje träningspass, visualisera din träningsvolym över tid och bygg konsistenssviter. Vår framstegspanel ger dig tydliga insikter i genomförandegrad, muskelgruppsbalans och prestationstrender — så du och din tränare alltid vet vad som fungerar.",
    },
    benefits: [
      { en: "Visual training volume charts", da: "Visuelle træningsvolumendiagrammer", sv: "Visuella träningsvolymdiagram" },
      { en: "Workout completion tracking", da: "Sporing af træningsfuldførelse", sv: "Spårning av träningsgenomförande" },
      { en: "Consistency streaks and milestones", da: "Konsistensstreaks og milepæle", sv: "Konsistenssviter och milstolpar" },
      { en: "Muscle group balance analysis", da: "Analyse af muskelgruppebalance", sv: "Analys av muskelgruppsbalans" },
      { en: "Week-by-week performance trends", da: "Uge-for-uge præstationstendenser", sv: "Vecka-för-vecka prestationstrender" },
    ],
  },
  mental: {
    titleKey: "sectionMentalTitle",
    descKey: "sectionMentalDesc",
    image: mentalImg,
    gradient: "from-[hsl(330,60%,72%)] to-[hsl(280,60%,65%)]",
    longDesc: {
      en: "Mental strength separates good athletes from great ones. Assess your psychological readiness with our sports psychology framework, then receive personalized advice covering focus, visualization, competition anxiety, and more — built on the same principles used in elite combat sports.",
      da: "Mental styrke adskiller gode atleter fra de bedste. Vurder din psykologiske parathed med vores sportspsykologiske rammeværk, og modtag derefter personlig rådgivning om fokus, visualisering, konkurrenceangst og mere — bygget på de samme principper brugt i elite-kampsport.",
      sv: "Mental styrka skiljer bra atleter från de bästa. Bedöm din psykologiska beredskap med vårt idrottspsykologiska ramverk och få personlig rådgivning om fokus, visualisering, tävlingsångest och mer — byggt på samma principer som används inom elit-kampsport.",
    },
    benefits: [
      { en: "Sports psychology assessments", da: "Sportspsykologiske vurderinger", sv: "Idrottspsykologiska bedömningar" },
      { en: "Radar chart for mental dimensions", da: "Radardiagram for mentale dimensioner", sv: "Radardiagram för mentala dimensioner" },
      { en: "Personalized performance advice", da: "Personlig præstationsrådgivning", sv: "Personlig prestationsrådgivning" },
      { en: "Focus and visualization exercises", da: "Fokus- og visualiseringsøvelser", sv: "Fokus- och visualiseringsövningar" },
      { en: "Competition anxiety management", da: "Håndtering af konkurrenceangst", sv: "Hantering av tävlingsångest" },
    ],
  },
  rehab: {
    titleKey: "sectionRehabTitle",
    descKey: "sectionRehabDesc",
    image: rehabImg,
    gradient: "from-[hsl(0,72%,51%)] to-[hsl(15,80%,50%)]",
    longDesc: {
      en: "Injuries don't have to derail your training. Describe your injury and receive a phased rehabilitation program with clear pain guidelines, progression milestones, and safety protocols — designed specifically for taekwondo athletes returning to the mat.",
      da: "Skader behøver ikke at afspore din træning. Beskriv din skade og modtag et fasebaseret rehabiliteringsprogram med klare smerteretningslinjer, progressionsmilepæle og sikkerhedsprotokoller — designet specifikt til taekwondo-atleter der vender tilbage til måtten.",
      sv: "Skador behöver inte spåra ur din träning. Beskriv din skada och få ett fasindelat rehabiliteringsprogram med tydliga smärtriktlinjer, progressionsmilstolpar och säkerhetsprotokoll — designat specifikt för taekwondo-atleter som återvänder till mattan.",
    },
    benefits: [
      { en: "Phased rehab program generation", da: "Generering af fasebaserede genoptræningsprogrammer", sv: "Generering av fasindelade rehabprogram" },
      { en: "Pain level guidelines", da: "Retningslinjer for smerteniveau", sv: "Riktlinjer för smärtnivå" },
      { en: "Safe progression milestones", da: "Sikre progressionsmilepæle", sv: "Säkra progressionsmilstolpar" },
      { en: "TKD-specific recovery protocols", da: "TKD-specifikke genoptræningsprotokoller", sv: "TKD-specifika återhämtningsprotokoll" },
      { en: "Return-to-training planning", da: "Planlægning af tilbagevenden til træning", sv: "Planering av återgång till träning" },
    ],
  },
  nutrition: {
    titleKey: "sectionNutritionTitle",
    descKey: "sectionNutritionDesc",
    image: nutritionImg,
    gradient: "from-[hsl(25,90%,55%)] to-[hsl(15,85%,50%)]",
    longDesc: {
      en: "Fuel your performance with athlete-friendly nutrition. Browse curated recipes with full macro breakdowns, or generate a complete meal plan tailored to your weight, training load, and competition schedule — based on sports nutrition principles for combat athletes.",
      da: "Fuel din præstation med atletvenlig ernæring. Gennemse kuraterede opskrifter med fuld makronedbrydning, eller generer en komplet kostplan skræddersyet til din vægt, træningsmængde og konkurrencekalender — baseret på sportsernæringsprincipper for kampsportsatleter.",
      sv: "Driva din prestation med atletvänlig näring. Bläddra bland kurerade recept med full makronedbrytning, eller generera en komplett kostplan anpassad till din vikt, träningsbelastning och tävlingsschema — baserad på idrottsnäringsprinciper för kampsportsatleter.",
    },
    benefits: [
      { en: "Personalized meal plans", da: "Personlige kostplaner", sv: "Personliga kostplaner" },
      { en: "Full macro breakdowns per recipe", da: "Fuld makronedbrydning per opskrift", sv: "Full makronedbrytning per recept" },
      { en: "Training-load adjusted nutrition", da: "Træningsbelastningstilpasset ernæring", sv: "Träningsbelastningsanpassad näring" },
      { en: "Athlete-friendly recipe library", da: "Atletvenligt opskriftsbibliotek", sv: "Atletvänligt receptbibliotek" },
      { en: "Custom recipe creation", da: "Oprettelse af tilpassede opskrifter", sv: "Skapa egna recept" },
    ],
  },
  library: {
    titleKey: "sectionLibraryTitle",
    descKey: "sectionLibraryDesc",
    image: libraryImg,
    gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,60%,40%)]",
    longDesc: {
      en: "Access a curated collection of TKD-specific exercises, each with detailed instructions, muscle group targeting, tempo guides, and video references. Every exercise is selected for its relevance to taekwondo performance — from explosive hip power to rotational core stability.",
      da: "Få adgang til en kurateret samling af TKD-specifikke øvelser, hver med detaljerede instruktioner, muskelgruppemålretning, tempoguider og videoreferencer. Hver øvelse er udvalgt for sin relevans for taekwondo-præstation — fra eksplosiv hoftekraft til rotationel core-stabilitet.",
      sv: "Få tillgång till en kurerad samling TKD-specifika övningar, var och en med detaljerade instruktioner, muskelgruppsmålning, tempoguider och videoreferenser. Varje övning är utvald för sin relevans för taekwondo-prestation — från explosiv höftkraft till rotationell core-stabilitet.",
    },
    benefits: [
      { en: "Curated TKD-specific exercises", da: "Kuraterede TKD-specifikke øvelser", sv: "Kurerade TKD-specifika övningar" },
      { en: "Muscle group targeting info", da: "Information om muskelgruppemålretning", sv: "Information om muskelgruppsmålning" },
      { en: "Video references and demos", da: "Videoreferencer og demonstrationer", sv: "Videoreferenser och demos" },
      { en: "Custom exercise creation", da: "Oprettelse af tilpassede øvelser", sv: "Skapa egna övningar" },
      { en: "Alternative exercise suggestions", da: "Forslag til alternative øvelser", sv: "Förslag på alternativa övningar" },
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
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta title={t(feature.titleKey as any)} description={feature.longDesc[locale]} />
      <Watermark />
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Sportstalent" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-sm font-extrabold tracking-tight text-foreground">SPORTSTALENT</span>
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
            {locale === "da" ? "Tilbage" : locale === "sv" ? "Tillbaka" : "Back"}
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
            {locale === "da" ? "Fordele" : locale === "sv" ? "Fördelar" : "Key Benefits"}
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
              {locale === "da" ? "Klar til at komme i gang?" : locale === "sv" ? "Redo att komma igång?" : "Ready to get started?"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {locale === "da"
                ? "Opret din konto og få adgang til alle funktioner med det samme."
                : locale === "sv"
                ? "Skapa ditt konto och få tillgång till alla funktioner direkt."
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

      <AppFooter />
    </div>
  );
};

export default FeatureDetail;
