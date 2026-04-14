import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";

import { FeatureDiagram } from "@/components/FeatureDiagram";
import trainingImg from "@/assets/features/training-plan.jpg";
import progressImg from "@/assets/features/progress.jpg";
import mentalImg from "@/assets/features/mental.jpg";
import rehabImg from "@/assets/features/rehab.jpg";
import nutritionImg from "@/assets/features/nutrition.jpg";
import libraryImg from "@/assets/features/library.jpg";
import testingImg from "@/assets/features/testing.jpg";

type FeatureKey = "plan" | "progress" | "mental" | "rehab" | "nutrition" | "library" | "testing";
type Lang = "en" | "da" | "sv" | "de" | "ar";
type LangText = Record<Lang, string>;

interface FeatureData {
  titleKey: string;
  descKey: string;
  image: string;
  gradient: string;
  benefits: LangText[];
  longDesc: LangText;
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
      de: "Unsere Programme basieren auf bewährter Periodisierungswissenschaft — dieselbe Methodik, die von Elite-Trainern weltweit verwendet wird. Basierend auf Ihrem Gürtelgrad, Wochenplan, Trainingszielen und aktuellen Verletzungen erstellen wir ein vollständig periodisiertes Kraft- und Konditionsprogramm. Jede Einheit ergänzt Ihr Taekwondo-Training — sie konkurriert nicht damit.",
      ar: "تستند برامجنا إلى علم التقسيم الدوري المثبت — نفس المنهجية المستخدمة من قبل المدربين النخبة حول العالم. بناءً على مستوى حزامك وجدولك الأسبوعي وأهدافك التدريبية وإصاباتك الحالية، نبني برنامج قوة ولياقة مقسم دوريًا بالكامل. كل جلسة مصممة لتكمل تدريب التايكوندو الخاص بك — وليس للتنافس معه.",
    },
    benefits: [
      { en: "Evidence-based periodized programs", da: "Evidensbaserede periodiserede programmer", sv: "Evidensbaserade periodiserade program", de: "Evidenzbasierte periodisierte Programme", ar: "برامج دورية مبنية على الأدلة" },
      { en: "Tailored to your belt level and goals", da: "Skræddersyet til dit bælteniveau og mål", sv: "Anpassat till ditt bältnivå och mål", de: "Angepasst an Ihren Gürtelgrad und Ihre Ziele", ar: "مصممة حسب مستوى حزامك وأهدافك" },
      { en: "Weekly schedule optimization", da: "Ugentlig skemaoptimering", sv: "Veckoschemaoptimering", de: "Wöchentliche Zeitplanoptimierung", ar: "تحسين الجدول الأسبوعي" },
      { en: "Exercise alternatives for every movement", da: "Øvelsesalternativer for hver bevægelse", sv: "Övningsalternativ för varje rörelse", de: "Übungsalternativen für jede Bewegung", ar: "بدائل تمارين لكل حركة" },
      { en: "Injury-aware adjustments built in", da: "Indbyggede skadestilpassede justeringer", sv: "Inbyggda skadeanpassade justeringar", de: "Eingebaute verletzungsbewusste Anpassungen", ar: "تعديلات مدمجة تراعي الإصابات" },
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
      de: "Verfolgen Sie jedes Training, visualisieren Sie Ihr Trainingsvolumen über die Zeit und bauen Sie Konsistenzserien auf. Unser Fortschritts-Dashboard gibt Ihnen klare Einblicke in Abschlussraten, Muskelgruppenbalance und Leistungstrends.",
      ar: "تتبع كل تمرين، وتصور حجم تدريبك بمرور الوقت، وابنِ سلاسل الاتساق. لوحة التقدم الخاصة بنا تمنحك رؤى واضحة حول معدلات الإنجاز وتوازن مجموعات العضلات واتجاهات الأداء.",
    },
    benefits: [
      { en: "Visual training volume charts", da: "Visuelle træningsvolumendiagrammer", sv: "Visuella träningsvolymdiagram", de: "Visuelle Trainingsvolumen-Diagramme", ar: "مخططات بصرية لحجم التدريب" },
      { en: "Workout completion tracking", da: "Sporing af træningsfuldførelse", sv: "Spårning av träningsgenomförande", de: "Trainingsabschluss-Verfolgung", ar: "تتبع إنجاز التمارين" },
      { en: "Consistency streaks and milestones", da: "Konsistensstreaks og milepæle", sv: "Konsistenssviter och milstolpar", de: "Konsistenzserien und Meilensteine", ar: "سلاسل الاتساق والإنجازات" },
      { en: "Muscle group balance analysis", da: "Analyse af muskelgruppebalance", sv: "Analys av muskelgruppsbalans", de: "Muskelgruppenbalance-Analyse", ar: "تحليل توازن مجموعات العضلات" },
      { en: "Week-by-week performance trends", da: "Uge-for-uge præstationstendenser", sv: "Vecka-för-vecka prestationstrender", de: "Woche-für-Woche Leistungstrends", ar: "اتجاهات الأداء أسبوعًا بأسبوع" },
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
      de: "Mentale Stärke trennt gute Athleten von großartigen. Bewerten Sie Ihre psychologische Bereitschaft mit unserem sportpsychologischen Rahmenwerk und erhalten Sie personalisierte Beratung zu Fokus, Visualisierung, Wettkampfangst und mehr.",
      ar: "القوة العقلية تفصل الرياضيين الجيدين عن العظماء. قيّم استعدادك النفسي باستخدام إطار علم النفس الرياضي لدينا، ثم احصل على نصائح مخصصة تغطي التركيز والتصور وقلق المنافسة والمزيد.",
    },
    benefits: [
      { en: "Sports psychology assessments", da: "Sportspsykologiske vurderinger", sv: "Idrottspsykologiska bedömningar", de: "Sportpsychologische Bewertungen", ar: "تقييمات علم النفس الرياضي" },
      { en: "Radar chart for mental dimensions", da: "Radardiagram for mentale dimensioner", sv: "Radardiagram för mentala dimensioner", de: "Radardiagramm für mentale Dimensionen", ar: "مخطط رادار للأبعاد العقلية" },
      { en: "Personalized performance advice", da: "Personlig præstationsrådgivning", sv: "Personlig prestationsrådgivning", de: "Personalisierte Leistungsberatung", ar: "نصائح أداء مخصصة" },
      { en: "Focus and visualization exercises", da: "Fokus- og visualiseringsøvelser", sv: "Fokus- och visualiseringsövningar", de: "Fokus- und Visualisierungsübungen", ar: "تمارين التركيز والتصور" },
      { en: "Competition anxiety management", da: "Håndtering af konkurrenceangst", sv: "Hantering av tävlingsångest", de: "Wettkampfangst-Management", ar: "إدارة قلق المنافسة" },
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
      de: "Verletzungen müssen Ihr Training nicht entgleisen lassen. Beschreiben Sie Ihre Verletzung und erhalten Sie ein phasenbasiertes Rehabilitationsprogramm mit klaren Schmerzrichtlinien, Fortschrittsmeilensteinen und Sicherheitsprotokollen.",
      ar: "الإصابات لا يجب أن تعرقل تدريبك. صِف إصابتك واحصل على برنامج إعادة تأهيل مرحلي مع إرشادات واضحة للألم ومعالم تقدم وبروتوكولات سلامة — مصمم خصيصًا لرياضيي التايكوندو العائدين إلى الحلبة.",
    },
    benefits: [
      { en: "Phased rehab program generation", da: "Generering af fasebaserede genoptræningsprogrammer", sv: "Generering av fasindelade rehabprogram", de: "Phasenbasierte Reha-Programmerstellung", ar: "إنشاء برامج إعادة تأهيل مرحلية" },
      { en: "Pain level guidelines", da: "Retningslinjer for smerteniveau", sv: "Riktlinjer för smärtnivå", de: "Schmerzniveau-Richtlinien", ar: "إرشادات مستوى الألم" },
      { en: "Safe progression milestones", da: "Sikre progressionsmilepæle", sv: "Säkra progressionsmilstolpar", de: "Sichere Fortschrittsmeilensteine", ar: "معالم تقدم آمنة" },
      { en: "TKD-specific recovery protocols", da: "TKD-specifikke genoptræningsprotokoller", sv: "TKD-specifika återhämtningsprotokoll", de: "TKD-spezifische Erholungsprotokolle", ar: "بروتوكولات استشفاء خاصة بالتايكوندو" },
      { en: "Return-to-training planning", da: "Planlægning af tilbagevenden til træning", sv: "Planering av återgång till träning", de: "Planung der Trainingsrückkehr", ar: "تخطيط العودة للتدريب" },
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
      de: "Treiben Sie Ihre Leistung mit athletenfreundlicher Ernährung an. Durchsuchen Sie kuratierte Rezepte mit vollständigen Makronährstoff-Aufschlüsselungen oder erstellen Sie einen kompletten Ernährungsplan.",
      ar: "عزز أداءك بتغذية مناسبة للرياضيين. تصفح وصفات منتقاة مع تفاصيل كاملة للماكرو، أو أنشئ خطة وجبات كاملة مصممة حسب وزنك وحمل التدريب وجدول المنافسات — بناءً على مبادئ التغذية الرياضية لرياضيي الفنون القتالية.",
    },
    benefits: [
      { en: "Personalized meal plans", da: "Personlige kostplaner", sv: "Personliga kostplaner", de: "Personalisierte Ernährungspläne", ar: "خطط وجبات مخصصة" },
      { en: "Full macro breakdowns per recipe", da: "Fuld makronedbrydning per opskrift", sv: "Full makronedbrytning per recept", de: "Vollständige Makronährstoff-Aufschlüsselung pro Rezept", ar: "تفاصيل ماكرو كاملة لكل وصفة" },
      { en: "Training-load adjusted nutrition", da: "Træningsbelastningstilpasset ernæring", sv: "Träningsbelastningsanpassad näring", de: "Trainingsbelastungsangepasste Ernährung", ar: "تغذية معدلة حسب حمل التدريب" },
      { en: "Athlete-friendly recipe library", da: "Atletvenligt opskriftsbibliotek", sv: "Atletvänligt receptbibliotek", de: "Athletenfreundliche Rezeptbibliothek", ar: "مكتبة وصفات مناسبة للرياضيين" },
      { en: "Custom recipe creation", da: "Oprettelse af tilpassede opskrifter", sv: "Skapa egna recept", de: "Eigene Rezepterstellung", ar: "إنشاء وصفات مخصصة" },
    ],
  },
  testing: {
    titleKey: "sectionTestingTitle",
    descKey: "sectionTestingDesc",
    image: testingImg,
    gradient: "from-[hsl(190,85%,50%)] to-[hsl(210,80%,55%)]",
    longDesc: {
      en: "Physical testing is the cornerstone of evidence-based training. Without objective data, you're guessing. Our testing module answers three critical questions: WHAT to test (13 standardized protocols across speed, endurance, strength, and agility), HOW to test (video demonstrations with proper form and timing), and WHY it matters (each test targets a specific athletic quality essential for taekwondo — from explosive first-step speed to sustained round endurance). Track your results over time with gradient charts and trend analysis, compare coach-led vs. individual tests, and pinpoint exactly where your performance is improving or stalling.",
      da: "Fysisk testning er hjørnestenen i evidensbaseret træning. Uden objektive data gætter du bare. Vores testmodul besvarer tre kritiske spørgsmål: HVAD skal testes (13 standardiserede protokoller inden for hastighed, udholdenhed, styrke og smidighed), HVORDAN testes (videodemonstration med korrekt form og timing), og HVORFOR det er vigtigt (hver test målretter en specifik atletisk kvalitet essentiel for taekwondo — fra eksplosiv første-skridt hastighed til vedvarende runde-udholdenhed). Spor dine resultater over tid med gradientdiagrammer og trendanalyse, sammenlign trænerstyrede vs. individuelle tests, og find præcist ud af, hvor din præstation forbedres eller stagnerer.",
      sv: "Fysisk testning är hörnstenen i evidensbaserad träning. Utan objektiva data gissar du bara. Vår testmodul besvarar tre kritiska frågor: VAD ska testas (13 standardiserade protokoll inom hastighet, uthållighet, styrka och smidighet), HUR testar man (videodemonstration med korrekt form och timing), och VARFÖR det spelar roll (varje test riktar sig mot en specifik atletisk kvalitet som är avgörande för taekwondo — från explosiv första-stegs-hastighet till uthållig rond-uthållighet). Spåra dina resultat över tid med gradientdiagram och trendanalys, jämför tränarledda vs. individuella tester, och hitta exakt var din prestation förbättras eller stagnerar.",
      de: "Physische Tests sind der Grundstein evidenzbasierten Trainings. Ohne objektive Daten raten Sie nur. Unser Testmodul beantwortet drei kritische Fragen: WAS getestet werden soll (13 standardisierte Protokolle für Geschwindigkeit, Ausdauer, Kraft und Agilität), WIE getestet wird (Videodemonstrationen mit korrekter Form und Timing), und WARUM es wichtig ist. Verfolgen Sie Ihre Ergebnisse über die Zeit mit Trend-Analyse.",
      ar: "الاختبار البدني هو حجر الأساس للتدريب المبني على الأدلة. بدون بيانات موضوعية، أنت تخمن فقط. وحدة الاختبار لدينا تجيب على ثلاثة أسئلة حاسمة: ماذا تختبر (13 بروتوكولًا موحدًا للسرعة والتحمل والقوة والرشاقة)، وكيف تختبر (عروض فيديو بالشكل والتوقيت الصحيحين)، ولماذا هذا مهم. تتبع نتائجك بمرور الوقت مع تحليل الاتجاهات.",
    },
    benefits: [
      { en: "13 standardized test protocols (sprint, agility, strength, endurance)", da: "13 standardiserede testprotokoller (sprint, smidighed, styrke, udholdenhed)", sv: "13 standardiserade testprotokoll (sprint, smidighet, styrka, uthållighet)", de: "13 standardisierte Testprotokolle (Sprint, Agilität, Kraft, Ausdauer)", ar: "13 بروتوكول اختبار موحد (سرعة، رشاقة، قوة، تحمل)" },
      { en: "Video demonstrations showing proper execution", da: "Videodemonstration der viser korrekt udførelse", sv: "Videodemonstration som visar korrekt utförande", de: "Videodemonstrationen mit korrekter Ausführung", ar: "عروض فيديو توضح التنفيذ الصحيح" },
      { en: "Trend charts with gradient fills and average reference lines", da: "Trenddiagrammer med gradientfyld og gennemsnitlige referencelinjer", sv: "Trenddiagram med gradientfyllning och genomsnittliga referenslinjer", de: "Trenddiagramme mit Gradientenfüllung und Durchschnittsreferenzlinien", ar: "مخططات اتجاه مع خطوط مرجعية" },
      { en: "Coach-led vs. individual test comparison", da: "Sammenligning af trænerstyrede vs. individuelle tests", sv: "Jämförelse av tränarledda vs. individuella tester", de: "Vergleich von trainergeführten vs. individuellen Tests", ar: "مقارنة الاختبارات بإشراف المدرب مقابل الفردية" },
      { en: "Know exactly what, how, and why you're testing", da: "Ved præcist hvad, hvordan og hvorfor du tester", sv: "Vet exakt vad, hur och varför du testar", de: "Wissen Sie genau, was, wie und warum Sie testen", ar: "اعرف بالضبط ماذا وكيف ولماذا تختبر" },
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
      de: "Greifen Sie auf eine kuratierte Sammlung TKD-spezifischer Übungen zu, jede mit detaillierten Anleitungen, Muskelgruppen-Targeting, Tempo-Leitfäden und Videoreferenzen. Jede Übung ist für ihre Relevanz für die Taekwondo-Leistung ausgewählt.",
      ar: "احصل على مجموعة منتقاة من تمارين التايكوندو الخاصة، كل منها مع تعليمات مفصلة واستهداف مجموعات العضلات وأدلة الإيقاع ومراجع الفيديو. كل تمرين مختار لأهميته في أداء التايكوندو — من قوة الورك الانفجارية إلى ثبات الجذع الدوراني.",
    },
    benefits: [
      { en: "Curated TKD-specific exercises", da: "Kuraterede TKD-specifikke øvelser", sv: "Kurerade TKD-specifika övningar", de: "Kuratierte TKD-spezifische Übungen", ar: "تمارين منتقاة خاصة بالتايكوندو" },
      { en: "Muscle group targeting info", da: "Information om muskelgruppemålretning", sv: "Information om muskelgruppsmålning", de: "Muskelgruppen-Targeting-Infos", ar: "معلومات استهداف مجموعات العضلات" },
      { en: "Video references and demos", da: "Videoreferencer og demonstrationer", sv: "Videoreferenser och demos", de: "Videoreferenzen und Demos", ar: "مراجع فيديو وعروض توضيحية" },
      { en: "Custom exercise creation", da: "Oprettelse af tilpassede øvelser", sv: "Skapa egna övningar", de: "Eigene Übungen erstellen", ar: "إنشاء تمارين مخصصة" },
      { en: "Alternative exercise suggestions", da: "Forslag til alternative øvelser", sv: "Förslag på alternativa övningar", de: "Alternative Übungsvorschläge", ar: "اقتراحات تمارين بديلة" },
    ],
  },
};

const backLabel: LangText = { en: "Back", da: "Tilbage", sv: "Tillbaka", de: "Zurück", ar: "رجوع" };
const benefitsLabel: LangText = { en: "Key Benefits", da: "Fordele", sv: "Fördelar", de: "Vorteile", ar: "المزايا الرئيسية" };
const ctaTitle: LangText = { en: "Ready to get started?", da: "Klar til at komme i gang?", sv: "Redo att komma igång?", de: "Bereit loszulegen?", ar: "هل أنت مستعد للبدء؟" };
const ctaDesc: LangText = {
  en: "Create your account and get access to all features right away.",
  da: "Opret din konto og få adgang til alle funktioner med det samme.",
  sv: "Skapa ditt konto och få tillgång till alla funktioner direkt.",
  de: "Erstellen Sie Ihr Konto und erhalten Sie sofort Zugang zu allen Funktionen.",
  ar: "أنشئ حسابك واحصل على الوصول إلى جميع الميزات فورًا.",
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

  const lang = locale as Lang;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta title={t(feature.titleKey)} description={feature.longDesc[lang]} />
      <Watermark />
      <PublicNav />

      <main className="flex-1">
        {/* Back button */}
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {backLabel[lang]}
          </Button>
        </div>

        {/* Hero + Diagram side by side */}
        <section className="max-w-4xl mx-auto px-6 pt-6 pb-10">
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
            <div className="space-y-4 flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {t(feature.titleKey)}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {feature.longDesc[lang]}
              </p>
            </div>
            <div className="w-full md:w-[320px] shrink-0">
              <FeatureDiagram feature={section as string} />
            </div>
          </div>
        </section>

        {/* Gradient transition */}
        <div className="h-20 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

        <div className="theme-light-section">
        {/* Screenshot */}
        <section className="max-w-4xl mx-auto px-6 pb-12 pt-4">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-10`} />
            <img
              src={feature.image}
              alt={t(feature.titleKey)}
              className="w-full h-auto relative z-10"
              loading="lazy"
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {benefitsLabel[lang]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {feature.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${feature.gradient}`}>
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="text-sm text-foreground">{benefit[lang]}</span>
              </div>
            ))}
          </div>
        </section>
        </div>

        {/* CTA — back to dark */}
        <div className="bg-gradient-to-b from-[hsl(210,20%,97%)] to-background h-12" aria-hidden="true" />
        <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
          <div className="rounded-2xl border border-energy/20 bg-energy/5 p-8 sm:p-12 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              {ctaTitle[lang]}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {ctaDesc[lang]}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => navigate("/auth")} size="lg" className="px-8 font-semibold shadow-glow">
                {t("getStarted")} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="px-8 font-semibold">
                {t("viewPricing")}
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
