import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { isNativeApp } from "@/lib/platform";

import { FeatureDiagram } from "@/components/FeatureDiagram";
import trainingImg from "@/assets/features/training-plan.jpg";
import progressImg from "@/assets/features/progress.jpg";
import mentalImg from "@/assets/features/mental.jpg";
import rehabImg from "@/assets/features/rehab.jpg";
import nutritionImg from "@/assets/features/nutrition.jpg";
import libraryImg from "@/assets/features/library.jpg";
import testingImg from "@/assets/features/testing.jpg";

type FeatureKey = "plan" | "progress" | "mental" | "rehab" | "nutrition" | "library" | "testing" | "competitions";
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
      en: "Every athlete in the club trains on a plan built for elite development, not a generic template. Sportstalent turns your training calendar, competition schedule and current injury status into a fully periodized programme. Sessions are built to support the sport-specific work already happening on the field, not compete with it.",
      da: "Alle atleter i klubben træner efter en plan bygget til talentudvikling i elitesport, ikke en skabelon. Sportstalent omsætter din træningskalender, konkurrenceplan og aktuelle skadesstatus til et fuldt periodiseret program. Sessionerne er bygget til at understøtte det sportsspecifikke arbejde på banen, ikke konkurrere med det.",
      sv: "Varje idrottare i klubben tränar enligt en plan byggd för elitutveckling, inte en mall. Sportstalent omvandlar din träningskalender, tävlingsschema och aktuella skadestatus till ett fullt periodiserat program. Passen stödjer det sportspecifika arbetet på planen, i stället för att konkurrera med det.",
      de: "Jeder Athlet im Verein trainiert nach einem Plan für die Talententwicklung im Spitzensport, nicht nach einer Vorlage. Sportstalent verwandelt Trainingskalender, Wettkampfplan und aktuellen Verletzungsstatus in ein vollständig periodisiertes Programm. Die Einheiten unterstützen die sportartspezifische Arbeit auf dem Platz, statt mit ihr zu konkurrieren.",
      ar: "كل رياضي في النادي يتدرب وفق خطة مبنية لتطوير المواهب في الرياضة النخبوية، وليست قالبًا عامًا. سبورتستالنت يحوّل تقويم التدريب وجدول المنافسات وحالة الإصابات الحالية إلى برنامج مقسم دوريًا بالكامل. الحصص مصممة لدعم العمل الخاص بالرياضة على الملعب، لا لمنافسته.",
    },
    benefits: [
      { en: "Periodized programme for every athlete", da: "Periodiseret program til hver atlet", sv: "Periodiserat program för varje idrottare", de: "Periodisiertes Programm für jeden Athleten", ar: "برنامج دوري لكل رياضي" },
      { en: "Built from calendar, load and injuries", da: "Bygget ud fra kalender, belastning og skader", sv: "Byggt utifrån kalender, belastning och skador", de: "Erstellt aus Kalender, Belastung und Verletzungen", ar: "مبني على التقويم والحمل والإصابات" },
      { en: "Coach sees the whole squad's plans", da: "Træneren ser hele holdets planer", sv: "Tränaren ser hela truppens planer", de: "Trainer sieht die Pläne des ganzen Kaders", ar: "المدرب يرى خطط الفريق بالكامل" },
      { en: "Exercise alternatives for every movement", da: "Alternative øvelser til hver bevægelse", sv: "Alternativa övningar för varje rörelse", de: "Alternativübungen für jede Bewegung", ar: "بدائل تمارين لكل حركة" },
      { en: "Automatically adjusts around injuries", da: "Justerer automatisk ved skader", sv: "Justerar automatiskt vid skador", de: "Passt sich automatisch bei Verletzungen an", ar: "يتكيف تلقائيًا مع الإصابات" },
    ],
  },
  progress: {
    titleKey: "sectionProgressTitle",
    descKey: "sectionProgressDesc",
    image: progressImg,
    gradient: "from-[hsl(45,90%,55%)] to-[hsl(35,90%,50%)]",
    longDesc: {
      en: "You see development, not just attendance. Every completed session feeds a picture of training volume, consistency and balance across muscle groups. Coaches spot who is progressing and who needs a change before a season is lost.",
      da: "Du ser udvikling, ikke bare fremmøde. Hver gennemført session bidrager til et billede af træningsmængde, konsistens og balance på tværs af muskelgrupper. Trænere ser, hvem der udvikler sig, og hvem der har brug for en ændring, før en sæson går tabt.",
      sv: "Du ser utveckling, inte bara närvaro. Varje genomfört pass bidrar till en bild av träningsvolym, konsistens och balans mellan muskelgrupper. Tränare ser vem som utvecklas och vem som behöver en ändring innan en säsong går förlorad.",
      de: "Sie sehen Entwicklung, nicht nur Anwesenheit. Jede abgeschlossene Einheit trägt zu einem Bild aus Trainingsvolumen, Konsistenz und Balance zwischen Muskelgruppen bei. Trainer erkennen frühzeitig, wer sich entwickelt und wer eine Anpassung braucht.",
      ar: "أنت ترى التطور، لا الحضور فقط. كل حصة مكتملة تضيف إلى صورة شاملة عن حجم التدريب والاتساق والتوازن بين مجموعات العضلات. المدربون يرون من يتقدم ومن يحتاج تعديلًا قبل ضياع الموسم.",
    },
    benefits: [
      { en: "Clear view of training volume over time", da: "Klart overblik over træningsmængde over tid", sv: "Tydlig bild av träningsvolym över tid", de: "Klarer Überblick über Trainingsvolumen über Zeit", ar: "رؤية واضحة لحجم التدريب عبر الوقت" },
      { en: "Session completion tracked automatically", da: "Automatisk sporing af gennemførte sessioner", sv: "Automatisk spårning av genomförda pass", de: "Automatische Verfolgung abgeschlossener Einheiten", ar: "تتبع تلقائي لإنجاز الحصص" },
      { en: "Consistency streaks and milestones", da: "Konsistensstreaks og milepæle", sv: "Konsistenssviter och milstolpar", de: "Konsistenzserien und Meilensteine", ar: "سلاسل الاتساق والإنجازات" },
      { en: "Muscle group balance at a glance", da: "Muskelgruppebalance med ét blik", sv: "Muskelgruppsbalans med en blick", de: "Muskelgruppenbalance auf einen Blick", ar: "توازن مجموعات العضلات بنظرة واحدة" },
      { en: "Trends the whole coaching team can read", da: "Tendenser hele trænerteamet kan aflæse", sv: "Trender hela tränarteamet kan läsa av", de: "Trends, die das ganze Trainerteam versteht", ar: "اتجاهات يفهمها فريق التدريب كله" },
    ],
  },
  mental: {
    titleKey: "sectionMentalTitle",
    descKey: "sectionMentalDesc",
    image: mentalImg,
    gradient: "from-[hsl(330,60%,72%)] to-[hsl(280,60%,65%)]",
    longDesc: {
      en: "Talent is not only physical, and Sportstalent treats mental preparation the same way it treats a training plan. Athletes work through a structured readiness assessment, then get personalised guidance on focus, visualisation and competition nerves. Coaches gain a way to talk about mindset with real substance behind it.",
      da: "Talent er ikke kun fysisk, og Sportstalent behandler mental forberedelse på samme måde som en træningsplan. Atleter gennemgår en struktureret parathedsvurdering og får derefter personlig vejledning i fokus, visualisering og konkurrencenerver. Trænere får et redskab til at tale om mindset med reelt indhold bag.",
      sv: "Talang är inte bara fysiskt, och Sportstalent behandlar mental förberedelse på samma sätt som en träningsplan. Idrottare går igenom en strukturerad beredskapsbedömning och får sedan personlig vägledning kring fokus, visualisering och tävlingsnerver. Tränare får ett sätt att prata om mindset med verkligt innehåll bakom.",
      de: "Talent ist nicht nur körperlich, und Sportstalent behandelt mentale Vorbereitung genauso wie einen Trainingsplan. Athleten durchlaufen eine strukturierte Bereitschaftsbewertung und erhalten personalisierte Hinweise zu Fokus, Visualisierung und Wettkampfnervosität. Trainer bekommen ein Werkzeug, um Mindset mit echtem Inhalt zu besprechen.",
      ar: "الموهبة ليست جسدية فقط، وسبورتستالنت يتعامل مع الإعداد الذهني كما يتعامل مع خطة التدريب. يمر الرياضيون بتقييم استعداد منظم، ثم يحصلون على توجيه مخصص حول التركيز والتصور وتوتر المنافسة. يحصل المدربون على أداة للحديث عن الحالة الذهنية بمحتوى حقيقي.",
    },
    benefits: [
      { en: "Structured readiness assessments", da: "Struktureret parathedsvurdering", sv: "Strukturerad beredskapsbedömning", de: "Strukturierte Bereitschaftsbewertung", ar: "تقييم استعداد منظم" },
      { en: "Clear overview of mental dimensions", da: "Klart overblik over mentale dimensioner", sv: "Tydlig översikt över mentala dimensioner", de: "Klarer Überblick über mentale Dimensionen", ar: "نظرة واضحة على الأبعاد الذهنية" },
      { en: "Personalised guidance, not generic tips", da: "Personlig vejledning, ikke generiske tips", sv: "Personlig vägledning, inte generella tips", de: "Personalisierte Hinweise statt generischer Tipps", ar: "توجيه مخصص لا نصائح عامة" },
      { en: "Focus and visualisation exercises", da: "Fokus- og visualiseringsøvelser", sv: "Fokus- och visualiseringsövningar", de: "Fokus- und Visualisierungsübungen", ar: "تمارين التركيز والتصور" },
      { en: "Tools for handling competition nerves", da: "Redskaber til at håndtere konkurrencenerver", sv: "Verktyg för att hantera tävlingsnerver", de: "Werkzeuge gegen Wettkampfnervosität", ar: "أدوات للتعامل مع توتر المنافسة" },
    ],
  },
  rehab: {
    titleKey: "sectionRehabTitle",
    descKey: "sectionRehabDesc",
    image: rehabImg,
    gradient: "from-[hsl(0,72%,51%)] to-[hsl(15,80%,50%)]",
    longDesc: {
      en: "An injury should never mean guesswork. Describe the injury and get a phased return plan with clear pain limits, progression steps and safety checks at each stage. Coach and athlete follow the same plan, so return-to-play decisions are never made on a hunch.",
      da: "En skade bør aldrig betyde gætværk. Beskriv skaden og få en fasedelt genoptræningsplan med klare smertegrænser, progressionstrin og sikkerhedstjek ved hvert trin. Træner og atlet følger samme plan, så beslutninger om tilbagevenden aldrig tages på mavefornemmelse.",
      sv: "En skada ska aldrig innebära gissningar. Beskriv skadan och få en fasindelad återgångsplan med tydliga smärtgränser, progressionssteg och säkerhetskontroller vid varje steg. Tränare och idrottare följer samma plan, så beslut om återgång aldrig fattas på magkänsla.",
      de: "Eine Verletzung sollte nie Rätselraten bedeuten. Beschreiben Sie die Verletzung und erhalten Sie einen phasenweisen Rückkehrplan mit klaren Schmerzgrenzen, Fortschrittsschritten und Sicherheitschecks bei jedem Schritt. Trainer und Athlet folgen demselben Plan.",
      ar: "الإصابة يجب ألا تعني التخمين أبدًا. صِف الإصابة واحصل على خطة عودة مرحلية بحدود ألم واضحة وخطوات تقدم وفحوصات سلامة في كل مرحلة. المدرب والرياضي يتبعان نفس الخطة، فقرارات العودة لا تُتخذ بالحدس.",
    },
    benefits: [
      { en: "Phased return-to-play plans", da: "Fasedelte planer for tilbagevenden", sv: "Fasindelade återgångsplaner", de: "Phasenweise Rückkehrpläne", ar: "خطط عودة مرحلية" },
      { en: "Clear pain-level guidelines", da: "Klare retningslinjer for smerteniveau", sv: "Tydliga riktlinjer för smärtnivå", de: "Klare Schmerzniveau-Richtlinien", ar: "إرشادات واضحة لمستوى الألم" },
      { en: "Progression steps with built-in safety checks", da: "Progressionstrin med indbyggede sikkerhedstjek", sv: "Progressionssteg med inbyggda säkerhetskontroller", de: "Fortschrittsschritte mit eingebauten Sicherheitschecks", ar: "خطوات تقدم مع فحوصات سلامة مدمجة" },
      { en: "Same plan for coach and athlete", da: "Samme plan for træner og atlet", sv: "Samma plan för tränare och idrottare", de: "Gleicher Plan für Trainer und Athlet", ar: "خطة واحدة للمدرب والرياضي" },
      { en: "Structured path back to full training", da: "Struktureret vej tilbage til fuld træning", sv: "Strukturerad väg tillbaka till full träning", de: "Strukturierter Weg zurück ins volle Training", ar: "مسار منظم للعودة للتدريب الكامل" },
    ],
  },
  nutrition: {
    titleKey: "sectionNutritionTitle",
    descKey: "sectionNutritionDesc",
    image: nutritionImg,
    gradient: "from-[hsl(25,90%,55%)] to-[hsl(15,85%,50%)]",
    longDesc: {
      en: "Food is part of the training plan, not an afterthought. Browse a recipe library with full macro breakdowns, or generate a meal plan built around bodyweight, training load and the competition calendar. Every athlete eats to support the work they are actually doing that week.",
      da: "Mad er en del af træningsplanen, ikke en eftertanke. Gennemse et opskriftsbibliotek med fuld makronedbrydning, eller generér en kostplan bygget op om kropsvægt, træningsmængde og konkurrencekalender. Hver atlet spiser til at understøtte det arbejde, de rent faktisk laver den uge.",
      sv: "Mat är en del av träningsplanen, inte en eftertanke. Bläddra i ett receptbibliotek med full makronedbrytning, eller skapa en kostplan byggd kring kroppsvikt, träningsbelastning och tävlingskalender. Varje idrottare äter för att stödja det arbete de faktiskt gör den veckan.",
      de: "Ernährung ist Teil des Trainingsplans, kein Nachgedanke. Durchsuchen Sie eine Rezeptbibliothek mit vollständiger Makronährstoff-Aufschlüsselung oder erstellen Sie einen Ernährungsplan rund um Körpergewicht, Trainingsbelastung und Wettkampfkalender. Jeder Athlet isst passend zur tatsächlichen Belastung der Woche.",
      ar: "الغذاء جزء من خطة التدريب، لا فكرة لاحقة. تصفح مكتبة وصفات بتفاصيل ماكرو كاملة، أو أنشئ خطة وجبات مبنية على وزن الجسم وحمل التدريب وتقويم المنافسات. كل رياضي يأكل ليدعم العمل الذي يقوم به فعليًا هذا الأسبوع.",
    },
    benefits: [
      { en: "Meal plans matched to training load", da: "Kostplaner tilpasset træningsmængden", sv: "Kostplaner matchade mot träningsbelastning", de: "Ernährungspläne passend zur Trainingsbelastung", ar: "خطط وجبات متوافقة مع حمل التدريب" },
      { en: "Full macro breakdown on every recipe", da: "Fuld makronedbrydning på hver opskrift", sv: "Full makronedbrytning på varje recept", de: "Vollständige Makro-Aufschlüsselung pro Rezept", ar: "تفاصيل ماكرو كاملة لكل وصفة" },
      { en: "Adjusts around the competition calendar", da: "Justerer efter konkurrencekalenderen", sv: "Justerar utifrån tävlingskalendern", de: "Passt sich dem Wettkampfkalender an", ar: "يتكيف مع تقويم المنافسات" },
      { en: "Recipe library built for athletes", da: "Opskriftsbibliotek bygget til atleter", sv: "Receptbibliotek byggt för idrottare", de: "Rezeptbibliothek für Athleten", ar: "مكتبة وصفات مصممة للرياضيين" },
      { en: "Add and adapt your own recipes", da: "Tilføj og tilpas dine egne opskrifter", sv: "Lägg till och anpassa egna recept", de: "Eigene Rezepte hinzufügen und anpassen", ar: "أضف وعدّل وصفاتك الخاصة" },
    ],
  },
  testing: {
    titleKey: "sectionTestingTitle",
    descKey: "sectionTestingDesc",
    image: testingImg,
    gradient: "from-[hsl(190,85%,50%)] to-[hsl(210,80%,55%)]",
    longDesc: {
      en: "Without measurement, you are guessing which athletes are actually improving. The testing module covers standardised protocols across speed, endurance, strength and agility, each with a short video showing correct execution. Results are logged over time so coaches can compare squads, spot trends and see exactly where an athlete is moving forward or stuck.",
      da: "Uden måling gætter du på, hvilke atleter der faktisk udvikler sig. Testmodulet dækker standardiserede protokoller inden for hastighed, udholdenhed, styrke og smidighed, hver med en kort video, der viser korrekt udførelse. Resultater logges over tid, så trænere kan sammenligne hold, se tendenser og se præcis, hvor en atlet rykker sig eller går i stå.",
      sv: "Utan mätning gissar du vilka idrottare som faktiskt utvecklas. Testmodulen omfattar standardiserade protokoll inom hastighet, uthållighet, styrka och smidighet, var och en med en kort video som visar korrekt utförande. Resultat loggas över tid så tränare kan jämföra trupper, se trender och se exakt var en idrottare går framåt eller står still.",
      de: "Ohne Messung raten Sie nur, welche Athleten sich tatsächlich verbessern. Das Testmodul umfasst standardisierte Protokolle für Geschwindigkeit, Ausdauer, Kraft und Agilität, jeweils mit einem kurzen Video zur korrekten Ausführung. Ergebnisse werden über die Zeit erfasst, sodass Trainer Kader vergleichen und Trends erkennen können.",
      ar: "بدون قياس، أنت تخمن أي الرياضيين يتحسنون فعليًا. تشمل وحدة الاختبار بروتوكولات موحدة للسرعة والتحمل والقوة والرشاقة، كل منها بفيديو قصير يوضح التنفيذ الصحيح. تُسجَّل النتائج بمرور الوقت ليتمكن المدربون من مقارنة الفرق ورؤية الاتجاهات بدقة.",
    },
    benefits: [
      { en: "Standardised protocols for speed, strength, endurance", da: "Standardiserede protokoller til hastighed, styrke, udholdenhed", sv: "Standardiserade protokoll för hastighet, styrka, uthållighet", de: "Standardisierte Protokolle für Geschwindigkeit, Kraft, Ausdauer", ar: "بروتوكولات موحدة للسرعة والقوة والتحمل" },
      { en: "Video shows exactly how to test", da: "Video viser præcis hvordan der testes", sv: "Video visar exakt hur man testar", de: "Video zeigt genau, wie getestet wird", ar: "فيديو يوضح كيفية الاختبار بدقة" },
      { en: "Trend charts across the whole squad", da: "Trenddiagrammer for hele holdet", sv: "Trenddiagram för hela truppen", de: "Trenddiagramme für den gesamten Kader", ar: "مخططات اتجاه لكامل الفريق" },
      { en: "Compare coach-led and individual results", da: "Sammenlign trænerstyrede og individuelle resultater", sv: "Jämför tränarledda och individuella resultat", de: "Vergleich trainergeführter und individueller Ergebnisse", ar: "قارن النتائج بإشراف المدرب والفردية" },
      { en: "See exactly who is progressing", da: "Se præcis hvem der udvikler sig", sv: "Se exakt vem som utvecklas", de: "Sehen Sie genau, wer sich verbessert", ar: "اعرف بدقة من يتقدم" },
    ],
  },
  library: {
    titleKey: "sectionLibraryTitle",
    descKey: "sectionLibraryDesc",
    image: libraryImg,
    gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,60%,40%)]",
    longDesc: {
      en: "A shared exercise library keeps every coach in the club speaking the same language. Each exercise includes clear instructions, the muscle groups it targets, tempo guidance and a video reference. Coaches build sessions faster and athletes always know exactly what to do.",
      da: "Et fælles øvelsesbibliotek gør, at alle trænere i klubben taler samme sprog. Hver øvelse indeholder klare instruktioner, de muskelgrupper den rammer, tempovejledning og en videoreference. Trænere bygger sessioner hurtigere, og atleter ved altid præcis, hvad de skal gøre.",
      sv: "Ett gemensamt övningsbibliotek gör att alla tränare i klubben talar samma språk. Varje övning innehåller tydliga instruktioner, muskelgrupper den riktar sig mot, temporåd och en videoreferens. Tränare bygger pass snabbare och idrottare vet alltid exakt vad de ska göra.",
      de: "Eine gemeinsame Übungsbibliothek sorgt dafür, dass alle Trainer im Verein dieselbe Sprache sprechen. Jede Übung enthält klare Anweisungen, die angesprochenen Muskelgruppen, Tempohinweise und eine Videoreferenz. Trainer bauen Einheiten schneller auf, und Athleten wissen immer genau, was zu tun ist.",
      ar: "مكتبة تمارين مشتركة تجعل كل مدربي النادي يتحدثون بنفس اللغة. كل تمرين يتضمن تعليمات واضحة، ومجموعات العضلات المستهدفة، وإرشاد إيقاع، ومرجع فيديو. المدربون يبنون الحصص بشكل أسرع، والرياضيون يعرفون دائمًا بالضبط ما عليهم فعله.",
    },
    benefits: [
      { en: "Shared library across the whole club", da: "Fælles bibliotek for hele klubben", sv: "Gemensamt bibliotek för hela klubben", de: "Gemeinsame Bibliothek für den ganzen Verein", ar: "مكتبة مشتركة لكل النادي" },
      { en: "Clear muscle group targeting for each exercise", da: "Klar muskelgruppemålretning for hver øvelse", sv: "Tydlig muskelgruppsmålning för varje övning", de: "Klares Muskelgruppen-Targeting je Übung", ar: "استهداف واضح لمجموعات العضلات لكل تمرين" },
      { en: "Video reference for every movement", da: "Videoreference til hver bevægelse", sv: "Videoreferens för varje rörelse", de: "Videoreferenz für jede Bewegung", ar: "مرجع فيديو لكل حركة" },
      { en: "Add your own club-specific exercises", da: "Tilføj dine egne klubspecifikke øvelser", sv: "Lägg till egna klubbspecifika övningar", de: "Eigene vereinsspezifische Übungen hinzufügen", ar: "أضف تمارين خاصة بناديك" },
      { en: "Suggested alternatives for every movement", da: "Foreslåede alternativer til hver bevægelse", sv: "Föreslagna alternativ för varje rörelse", de: "Vorgeschlagene Alternativen für jede Bewegung", ar: "بدائل مقترحة لكل حركة" },
    ],
  },
  competitions: {
    titleKey: "sectionCompetitionsTitle",
    descKey: "sectionCompetitionsDesc",
    image: trainingImg,
    gradient: "from-[hsl(45,90%,55%)] to-[hsl(35,90%,50%)]",
    longDesc: {
      en: "Peaking for the right moment takes more than a training plan. Add each event with its priority and date, and Sportstalent builds a taper schedule, weight-management plan and a peak-day protocol around it. A daily readiness check keeps the plan honest by adapting training to how the athlete actually feels.",
      da: "At toppe på det rette tidspunkt kræver mere end en træningsplan. Tilføj hvert stævne med prioritet og dato, og Sportstalent bygger et taperskema, en vægtstyringsplan og en konkurrencedag-protokol omkring det. Et dagligt beredskabstjek holder planen ærlig ved at tilpasse træningen til, hvordan atleten faktisk har det.",
      sv: "Att nå toppform vid rätt tillfälle kräver mer än en träningsplan. Lägg till varje tävling med prioritet och datum, så bygger Sportstalent ett taperschema, en viktplan och ett tävlingsdagsprotokoll kring den. En daglig beredskapskoll håller planen ärlig genom att anpassa träningen till hur idrottaren faktiskt mår.",
      de: "Zum richtigen Zeitpunkt in Topform zu sein, braucht mehr als einen Trainingsplan. Fügen Sie jeden Wettkampf mit Priorität und Datum hinzu, und Sportstalent erstellt einen Tapering-Plan, einen Gewichtsplan und ein Wettkampftag-Protokoll dazu. Ein täglicher Bereitschaftscheck hält den Plan ehrlich, indem er das Training an die tatsächliche Verfassung anpasst.",
      ar: "الوصول للذروة في اللحظة المناسبة يتطلب أكثر من خطة تدريب. أضف كل حدث مع أولويته وتاريخه، وسبورتستالنت يبني حوله جدول تخفيف وخطة إدارة وزن وبروتوكول يوم الذروة. فحص الجاهزية اليومي يحافظ على واقعية الخطة بتكييف التدريب مع شعور الرياضي الفعلي.",
    },
    benefits: [
      { en: "Priority events with dates in one calendar", da: "Prioriterede stævner med datoer ét sted", sv: "Prioriterade tävlingar med datum på ett ställe", de: "Priorisierte Wettkämpfe mit Datum an einem Ort", ar: "أحداث ذات أولوية بتواريخها في مكان واحد" },
      { en: "Auto-generated taper and peaking schedule", da: "Auto-genereret taper- og peakingskema", sv: "Auto-genererat taper- och peakingschema", de: "Automatisch generierter Taper- und Peaking-Plan", ar: "جدول تخفيف وذروة يُنشأ تلقائيًا" },
      { en: "Weight-management plan with daily targets", da: "Vægtstyringsplan med daglige mål", sv: "Viktplan med dagliga mål", de: "Gewichtsplan mit täglichen Zielen", ar: "خطة إدارة وزن بأهداف يومية" },
      { en: "Quick weight-log right on the page", da: "Hurtig vægtlogning direkte på siden", sv: "Snabb viktloggning direkt på sidan", de: "Schnelles Gewichts-Log direkt auf der Seite", ar: "تسجيل وزن سريع على الصفحة نفسها" },
      { en: "Daily readiness check shapes today's session", da: "Dagligt beredskabstjek former dagens session", sv: "Daglig beredskapskoll formar dagens pass", de: "Täglicher Bereitschaftscheck prägt die heutige Einheit", ar: "فحص الجاهزية اليومي يحدد شكل حصة اليوم" },
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
      <PageMeta title={t(feature.titleKey)} description={feature.longDesc[lang]} canonical={`https://sportstalent.dk/features/${section}`} />
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
              {!isNativeApp() && (
                <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="px-8 font-semibold">
                  {t("viewPricing")}
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default FeatureDetail;
