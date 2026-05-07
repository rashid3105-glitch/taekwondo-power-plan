import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Utensils, Flame, Droplets, Pill, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

const COPY = {
  en: {
    title: "Personal Nutrition Plan",
    eyebrow: "Built for Taekwondo athletes",
    intro:
      "Sportstalent's nutrition planner builds a personal, sport-specific meal plan for every athlete — calibrated to weight class, training load, age and goals. No fad diets, no pork, no guesswork.",
    why: "Why nutrition matters in Taekwondo",
    whyText:
      "Taekwondo combines explosive power, repeated high-intensity efforts and tight weight management. The wrong fuel hurts speed, recovery and decision-making in the ring. A structured plan protects performance and long-term health — especially for young athletes still growing.",
    features: [
      "Daily kcal target tuned to your training week",
      "Protein / carbs / fat split for power & recovery",
      "Pre-, intra- and post-training meals with timing",
      "Hydration plan and supplement guidance",
      "Weekly variation so meals stay realistic",
      "Always pork-free, allergy-aware, available in 5 languages",
    ],
    safety: "Safety first",
    safetyText:
      "If your goal involves weight loss or weight cutting, the plan includes prominent guidance to work with a registered dietitian or doctor. We never recommend extreme calorie restriction.",
    cta: "Start free",
    back: "Back",
  },
  da: {
    title: "Personlig Kostplan",
    eyebrow: "Bygget til Taekwondo-atleter",
    intro:
      "Sportstalents kostplanlægger laver en personlig, sportsspecifik madplan til hver atlet — tilpasset vægtklasse, træningsbelastning, alder og mål. Ingen modediæter, ingen svinekød, intet gætteri.",
    why: "Hvorfor kost betyder noget i Taekwondo",
    whyText:
      "Taekwondo kombinerer eksplosiv kraft, gentagne højintense indsatser og stram vægtkontrol. Forkert brændstof rammer hastighed, restitution og beslutningstagning i ringen. En struktureret plan beskytter præstation og langtidshelbred — især for unge atleter i vækst.",
    features: [
      "Dagligt kcal-mål tilpasset din træningsuge",
      "Protein- / kulhydrat- / fedtfordeling til styrke og restitution",
      "Måltider før, under og efter træning med timing",
      "Væskeplan og kosttilskudsvejledning",
      "Variation hen over ugen så maden er realistisk",
      "Altid svinekødfri, allergi-bevidst, fås på 5 sprog",
    ],
    safety: "Sikkerhed først",
    safetyText:
      "Hvis dit mål involverer vægttab eller vægtcutting, indeholder planen tydelig vejledning om at arbejde med en autoriseret diætist eller læge. Vi anbefaler aldrig ekstrem kalorierestriktion.",
    cta: "Start gratis",
    back: "Tilbage",
  },
  sv: {
    title: "Personlig Kostplan",
    eyebrow: "Byggd för Taekwondo-atleter",
    intro:
      "Sportstalents kostplanerare bygger en personlig, sportspecifik måltidsplan för varje atlet — anpassad till viktklass, träningsbelastning, ålder och mål. Inga modedieter, inget fläsk, inga gissningar.",
    why: "Varför kost spelar roll i Taekwondo",
    whyText:
      "Taekwondo kombinerar explosiv kraft, upprepade högintensiva insatser och hård viktkontroll. Fel bränsle skadar fart, återhämtning och beslutsfattande. En strukturerad plan skyddar prestation och långsiktig hälsa — särskilt för unga växande atleter.",
    features: [
      "Dagligt kcal-mål anpassat efter din träningsvecka",
      "Protein- / kolhydrat- / fettfördelning för kraft & återhämtning",
      "Måltider före, under och efter träning med timing",
      "Vätskeplan och kosttillskottsvägledning",
      "Veckovariation så maten blir realistisk",
      "Alltid fläskfri, allergimedveten, finns på 5 språk",
    ],
    safety: "Säkerhet först",
    safetyText:
      "Om ditt mål är viktnedgång eller viktcutting innehåller planen tydlig vägledning om att samarbeta med dietist eller läkare. Vi rekommenderar aldrig extrem kalorirestriktion.",
    cta: "Kom igång gratis",
    back: "Tillbaka",
  },
  no: {
    title: "Personlig Kostplan",
    eyebrow: "Laget for Taekwondo-utøvere",
    intro:
      "Sportstalents kostplanlegger lager en personlig, sportsspesifikk måltidsplan for hver utøver — tilpasset vektklasse, treningsbelastning, alder og mål. Ingen motediett, ingen svin, ingen gjetting.",
    why: "Hvorfor kosthold er viktig i Taekwondo",
    whyText:
      "Taekwondo kombinerer eksplosiv kraft, gjentatte høyintensive innsatser og stram vektkontroll. Feil drivstoff svekker fart, restitusjon og beslutninger. En strukturert plan beskytter prestasjon og langtidshelse — spesielt for unge utøvere i vekst.",
    features: [
      "Daglig kcal-mål tilpasset treningsuken din",
      "Protein- / karbohydrat- / fettfordeling for styrke & restitusjon",
      "Måltider før, under og etter trening med timing",
      "Væskeplan og veiledning om kosttilskudd",
      "Variasjon gjennom uken så måltidene blir realistiske",
      "Alltid svinefri, allergibevisst, tilgjengelig på 5 språk",
    ],
    safety: "Sikkerhet først",
    safetyText:
      "Hvis målet ditt involverer vekttap eller weight cutting, gir planen tydelig veiledning om å samarbeide med ernæringsfysiolog eller lege. Vi anbefaler aldri ekstrem kalorirestriksjon.",
    cta: "Start gratis",
    back: "Tilbake",
  },
  de: {
    title: "Persönlicher Ernährungsplan",
    eyebrow: "Für Taekwondo-Athleten",
    intro:
      "Der Ernährungsplaner von Sportstalent erstellt einen persönlichen, sportspezifischen Plan für jeden Athleten — abgestimmt auf Gewichtsklasse, Trainingsumfang, Alter und Ziele. Keine Modediäten, kein Schweinefleisch, kein Rätselraten.",
    why: "Warum Ernährung im Taekwondo zählt",
    whyText:
      "Taekwondo verbindet explosive Kraft, wiederholte hochintensive Aktionen und enge Gewichtsführung. Der falsche Treibstoff bremst Tempo, Regeneration und Entscheidungen. Ein strukturierter Plan schützt Leistung und langfristige Gesundheit — besonders bei jungen, wachsenden Athleten.",
    features: [
      "Täglicher kcal-Zielwert passend zur Trainingswoche",
      "Eiweiß- / Kohlenhydrat- / Fettverteilung für Kraft & Erholung",
      "Mahlzeiten vor, während und nach dem Training mit Timing",
      "Hydrationsplan und Hinweise zu Nahrungsergänzungen",
      "Wöchentliche Variation für realistische Mahlzeiten",
      "Immer schweinefleischfrei, allergiebewusst, in 5 Sprachen",
    ],
    safety: "Sicherheit zuerst",
    safetyText:
      "Falls dein Ziel Gewichtsverlust oder Weight Cutting ist, enthält der Plan klare Hinweise, mit Ernährungsberater oder Arzt zu arbeiten. Wir empfehlen niemals extreme Kalorienrestriktion.",
    cta: "Kostenlos starten",
    back: "Zurück",
  },
  ar: {
    title: "خطة تغذية شخصية",
    eyebrow: "مصمّمة لرياضيي التايكوندو",
    intro:
      "يبني مخطّط التغذية في Sportstalent خطة وجبات شخصية ومتخصصة لكل رياضي — مُعايَرة حسب فئة الوزن وحمل التدريب والعمر والأهداف. لا حميات عابرة، لا لحم خنزير، لا تخمين.",
    why: "لماذا التغذية مهمة في التايكوندو",
    whyText:
      "يجمع التايكوندو بين القوة الانفجارية والجهود المتكررة عالية الشدة وإدارة الوزن الدقيقة. الوقود الخاطئ يضرّ بالسرعة والتعافي والقرارات داخل الحلبة. الخطة المنظّمة تحمي الأداء والصحة على المدى الطويل — خاصة لدى الرياضيين الصغار في طور النمو.",
    features: [
      "هدف سعرات يومي مضبوط مع أسبوع تدريبك",
      "توزيع البروتين / الكارب / الدهون للقوة والتعافي",
      "وجبات قبل وأثناء وبعد التدريب مع التوقيت",
      "خطة ترطيب وإرشادات للمكمّلات",
      "تنويع أسبوعي لتبقى الوجبات واقعية",
      "خالية دائماً من لحم الخنزير، تراعي الحساسية، بـ 5 لغات",
    ],
    safety: "السلامة أولاً",
    safetyText:
      "إذا كان هدفك هو إنقاص الوزن أو خفض الوزن، تتضمن الخطة توجيهاً واضحاً للعمل مع أخصائي تغذية أو طبيب. لا نوصي أبداً بتقييد سعرات حراري متطرف.",
    cta: "ابدأ مجاناً",
    back: "رجوع",
  },
} as const;

export default function Kostplan() {
  const { locale } = useLanguage();
  const t = (COPY as Record<string, typeof COPY.en>)[locale] ?? COPY.en;
  const accent = "#16A34A";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageMeta
        title={`${t.title} — Sportstalent`}
        description={t.intro}
        canonical="https://sportstalent.dk/kostplan"
      />

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
          <Link to="/auth?tab=signup">
            <Button size="sm" className="font-semibold" style={{ background: accent, color: "#fff" }}>
              {t.cta}
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:pt-16 pb-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${accent}1A`, color: accent }}
            >
              <Leaf className="h-3 w-3" /> {t.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-foreground">{t.title}</h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">{t.intro}</p>
          </motion.div>
        </section>

        {/* Video */}
        <section className="mx-auto max-w-6xl px-5 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border overflow-hidden shadow-2xl bg-card"
            style={{ boxShadow: `0 30px 80px -20px ${accent}33` }}
          >
            <video
              src="/videos/nutrition-demo.mp4"
              className="w-full h-auto block"
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          </motion.div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-3xl px-5 pb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Flame className="h-6 w-6" style={{ color: accent }} /> {t.why}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{t.whyText}</p>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-3xl px-5 pb-12">
          <ul className="grid sm:grid-cols-2 gap-3">
            {t.features.map((b, i) => {
              const Icon = [Utensils, Flame, Droplets, Pill, Leaf, Check][i] ?? Check;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-4"
                >
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accent }} />
                  <span className="text-sm text-foreground">{b}</span>
                </motion.li>
              );
            })}
          </ul>
        </section>

        {/* Safety */}
        <section className="mx-auto max-w-3xl px-5 pb-16">
          <div className="rounded-xl border-l-4 p-5 bg-card border border-border" style={{ borderLeftColor: accent }}>
            <h3 className="font-bold text-foreground">{t.safety}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.safetyText}</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-20 text-center">
          <Button
            asChild
            size="lg"
            className="px-8 font-bold"
            style={{ background: accent, color: "#fff" }}
          >
            <Link to="/auth?tab=signup">
              {t.cta} <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
