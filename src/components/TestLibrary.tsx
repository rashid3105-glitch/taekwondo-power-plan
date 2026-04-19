import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Zap, Wind, Dumbbell, Timer, ClipboardList, Users, User, ChevronDown, ChevronUp, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLocalizedTestName } from "@/components/PhysicalTesting";

interface TestDefinition {
  name: string;
  description: Record<string, string>;
  unit: string;
  category: string;
  type: "individual" | "coach" | "both";
  protocol: Record<string, string>;
}

const TESTS: TestDefinition[] = [
  // Speed
  { name: "30m Sprint", category: "speed", unit: "sec", type: "both",
    description: { en: "Maximal sprint over 30 meters from a standing start.", da: "Maksimal sprint over 30 meter fra stående start.", sv: "Maximal sprint över 30 meter från stående start." },
    protocol: { en: "Stand behind the start line. On 'Go', sprint as fast as possible through the 30m mark. Use a stopwatch or timing gates.", da: "Stå bag startlinjen. På 'Klar–Start', sprint så hurtigt som muligt gennem 30m-mærket. Brug stopur eller tidtagningsceller.", sv: "Stå bakom startlinjen. På 'Gå', sprinta så snabbt som möjligt genom 30m-märket. Använd stoppur eller tidtagningsceller." }
  },
  { name: "10m Sprint", category: "speed", unit: "sec", type: "both",
    description: { en: "Short explosive sprint measuring acceleration over 10 meters.", da: "Kort eksplosiv sprint der måler acceleration over 10 meter.", sv: "Kort explosiv sprint som mäter acceleration över 10 meter." },
    protocol: { en: "Sprint from standing start. Timer starts at first movement and stops at 10m line.", da: "Sprint fra stående start. Tid starter ved første bevægelse og stopper ved 10m linjen.", sv: "Sprint från stående start. Tid startar vid första rörelse och stoppar vid 10m-linjen." }
  },
  { name: "5-10-5 Shuttle", category: "speed", unit: "sec", type: "coach",
    description: { en: "Lateral quickness test: 5 yards left, 10 yards right, 5 yards back to center.", da: "Lateral hurtighedstest: 5 yards til venstre, 10 yards til højre, 5 yards tilbage til midten.", sv: "Lateral snabbhetstest: 5 yards vänster, 10 yards höger, 5 yards tillbaka till mitten." },
    protocol: { en: "Start in a three-point stance at the center cone. Sprint 5 yards left, touch the line, sprint 10 yards right, touch, then sprint 5 yards back to center.", da: "Start i tre-punkts position ved center-kegle. Sprint 5 yards til venstre, rør linjen, sprint 10 yards til højre, rør, sprint derefter 5 yards tilbage til midten.", sv: "Starta i trepunktsposition vid mitten. Sprinta 5 yards vänster, rör linjen, sprinta 10 yards höger, rör, sprinta sedan 5 yards tillbaka till mitten." }
  },
  // Endurance
  { name: "Beep Test", category: "endurance", unit: "level", type: "coach",
    description: { en: "Multi-stage fitness test (20m shuttle run) measuring aerobic endurance.", da: "Multistage fitnesstest (20m pendulløb) der måler aerob udholdenhed.", sv: "Multistage fitnesstest (20m pendellopp) som mäter aerob uthållighet." },
    protocol: { en: "Run back and forth between two lines 20m apart, keeping pace with the audio beeps. Each level gets faster. Test ends when you can't keep up twice.", da: "Løb frem og tilbage mellem to linjer med 20m mellemrum, hold trit med bippene. Hvert niveau bliver hurtigere. Testen stopper når du ikke kan følge med to gange.", sv: "Spring fram och tillbaka mellan två linjer 20m ifrån varandra, håll takten med ljudsignalerna. Varje nivå blir snabbare. Testet slutar när du inte kan hänga med två gånger." }
  },
  { name: "Cooper Test", category: "endurance", unit: "m", type: "both",
    description: { en: "Run as far as possible in 12 minutes to estimate VO2max.", da: "Løb så langt som muligt på 12 minutter for at estimere VO2max.", sv: "Spring så långt som möjligt på 12 minuter för att uppskatta VO2max." },
    protocol: { en: "Run around a track for exactly 12 minutes. Measure the total distance covered. Pacing is key — start at a sustainable speed.", da: "Løb rundt på en bane i præcis 12 minutter. Mål den totale tilbagelagte distance. Pacing er vigtigt — start med en bæredygtig hastighed.", sv: "Spring runt en bana i exakt 12 minuter. Mät den totala distansen. Tempot är nyckeln — börja i en hållbar hastighet." }
  },
  { name: "3 min Step Test", category: "endurance", unit: "bpm", type: "individual",
    description: { en: "Simple heart rate recovery test using a step. Measures cardiovascular fitness.", da: "Simpel pulsrecoverytest med en step. Måler kardiovaskulær fitness.", sv: "Enkel pulåterhämtningstest med ett steg. Mäter kardiovaskulär kondition." },
    protocol: { en: "Step up and down on a 30cm step at a steady pace (24 steps/min) for 3 minutes. Immediately after, sit down and measure resting heart rate after 1 minute.", da: "Step op og ned på en 30cm step i et jævnt tempo (24 step/min) i 3 minutter. Sæt dig straks ned og mål hvilepuls efter 1 minut.", sv: "Stega upp och ner på ett 30cm steg i jämn takt (24 steg/min) i 3 minuter. Sätt dig omedelbart ner och mät vilopulsen efter 1 minut." }
  },
  // Strength
  { name: "1RM Back Squat", category: "strength", unit: "kg", type: "coach",
    description: { en: "Maximum weight lifted for one repetition in back squat. Gold standard for lower body strength.", da: "Maksimal vægt løftet i én gentagelse i back squat. Guldstandard for underkropsstyrke.", sv: "Maximal vikt lyft för en repetition i knäböj. Guldstandard för underkroppsstyrka." },
    protocol: { en: "Warm up progressively. Attempt single reps with increasing weight. Rest 3-5 min between attempts. Max 5 attempts above 90% effort.", da: "Varm op progressivt. Forsøg enkeltreps med stigende vægt. Hvil 3-5 min mellem forsøg. Maks 5 forsøg over 90% belastning.", sv: "Värm upp progressivt. Försök med enstaka reps med ökande vikt. Vila 3-5 min mellan försök. Max 5 försök över 90% belastning." }
  },
  { name: "1RM Deadlift", category: "strength", unit: "kg", type: "coach",
    description: { en: "Maximum weight lifted for one repetition in conventional deadlift.", da: "Maksimal vægt løftet i én gentagelse i konventionel dødløft.", sv: "Maximal vikt lyft för en repetition i konventionellt marklyft." },
    protocol: { en: "Progressive warm-up. Build to max single in 4-6 attempts. Full lockout required. Rest 3-5 minutes between heavy sets.", da: "Progressiv opvarmning. Byg op til max single i 4-6 forsøg. Fuld lockout krævet. Hvil 3-5 minutter mellem tunge sæt.", sv: "Progressiv uppvärmning. Bygg upp till max singel i 4-6 försök. Full lockout krävs. Vila 3-5 minuter mellan tunga set." }
  },
  { name: "Max Push-ups (1 min)", category: "strength", unit: "reps", type: "individual",
    description: { en: "Maximum push-ups completed in 60 seconds with proper form.", da: "Maksimale armstrækninger udført på 60 sekunder med korrekt teknik.", sv: "Maximala armhävningar utförda på 60 sekunder med korrekt teknik." },
    protocol: { en: "Start in plank position. Perform as many push-ups as possible in 60 seconds. Chest must touch the ground, arms fully extended at top. Pausing is allowed.", da: "Start i plankeposition. Udfør så mange armstrækninger som muligt på 60 sekunder. Brystet skal røre gulvet, armene strakt i toppen. Pause er tilladt.", sv: "Starta i plankposition. Utför så många armhävningar som möjligt på 60 sekunder. Bröstet ska röra golvet, armarna fullt sträckta i toppen. Paus är tillåten." }
  },
  { name: "Grip Strength", category: "strength", unit: "kg", type: "both",
    description: { en: "Isometric grip strength measured with a hand dynamometer.", da: "Isometrisk grebsstyrke målt med et hånddynamometer.", sv: "Isometrisk greppstyrka mätt med en handdynamometer." },
    protocol: { en: "Stand upright, arm at side, squeeze the dynamometer as hard as possible. Best of 3 attempts per hand.", da: "Stå oprejst, arm langs siden, klem dynamometret så hårdt som muligt. Bedste af 3 forsøg per hånd.", sv: "Stå upprätt, arm vid sidan, kläm dynamometern så hårt som möjligt. Bäst av 3 försök per hand." }
  },
  // Agility
  { name: "T-Test", category: "agility", unit: "sec", type: "coach",
    description: { en: "Agility test measuring ability to change direction in a T-pattern.", da: "Agility-test der måler evnen til at skifte retning i et T-mønster.", sv: "Agility-test som mäter förmågan att byta riktning i ett T-mönster." },
    protocol: { en: "Sprint forward 10m, shuffle left 5m, shuffle right 10m, shuffle left 5m back to center, backpedal to start. Touch each cone.", da: "Sprint frem 10m, sideløb venstre 5m, sideløb højre 10m, sideløb venstre 5m tilbage til midten, baglæns til start. Rør hver kegle.", sv: "Sprinta framåt 10m, sidsteg vänster 5m, sidsteg höger 10m, sidsteg vänster 5m tillbaka till mitten, spring baklänges till start. Rör varje kon." }
  },
  { name: "Illinois Agility", category: "agility", unit: "sec", type: "coach",
    description: { en: "Complex agility course testing acceleration, deceleration, and turning ability.", da: "Kompleks agility-bane der tester acceleration, deceleration og drejningsevne.", sv: "Komplex agility-bana som testar acceleration, inbromsning och svängförmåga." },
    protocol: { en: "Lie face down at start. On 'Go', sprint the course: straight, weave through 4 cones, sprint back. Total distance ~60m.", da: "Lig på maven ved start. På 'Start', sprint banen: lige ud, slalom gennem 4 kegler, sprint tilbage. Total distance ~60m.", sv: "Ligg på mage vid start. På 'Gå', sprinta banan: rakt fram, slalom genom 4 koner, sprinta tillbaka. Total distans ~60m." }
  },
  { name: "Hexagonal Agility", category: "agility", unit: "sec", type: "individual",
    description: { en: "Jump in and out of a hexagon shape as fast as possible, testing footwork and agility.", da: "Spring ind og ud af en sekskant-form så hurtigt som muligt, tester fodarbejde og agility.", sv: "Hoppa in och ut ur en sexkant så snabbt som möjligt, testar fotarbete och agility." },
    protocol: { en: "Stand in the center of a taped hexagon (60cm sides). Jump over each side and back to center, going clockwise. Complete 3 full rotations.", da: "Stå i midten af en tapet sekskant (60cm sider). Spring over hver side og tilbage til midten, med uret. Fuldfør 3 hele rotationer.", sv: "Stå i mitten av en tejpad sexkant (60cm sidor). Hoppa över varje sida och tillbaka till mitten, medurs. Genomför 3 hela varv." }
  },
];

const CATEGORY_ICONS: Record<string, typeof Timer> = {
  speed: Zap,
  endurance: Wind,
  strength: Dumbbell,
  agility: Timer,
};

export function TestLibrary() {
  const { t, locale } = useLanguage();
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "individual" | "coach">("all");

  const categories = ["speed", "endurance", "strength", "agility"];

  const filteredTests = TESTS.filter(test => {
    if (filterType === "all") return true;
    return test.type === filterType || test.type === "both";
  });

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["all", "individual", "coach"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filterType === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            {f === "coach" ? <Users className="h-3.5 w-3.5" /> : f === "individual" ? <User className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />}
            {f === "all" ? t("ptFilterAll") : f === "individual" ? t("ptIndividualTest") : t("ptCoachTest")}
          </button>
        ))}
      </div>

      {categories.map(cat => {
        const Icon = CATEGORY_ICONS[cat];
        const catTests = filteredTests.filter(t => t.category === cat);
        if (catTests.length === 0) return null;

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">{t(`ptCat_${cat}`)}</h2>
              <Badge variant="secondary" className="text-[10px]">{catTests.length}</Badge>
            </div>

            <div className="space-y-2">
              {catTests.map(test => {
                const isExpanded = expandedTest === test.name;
                return (
                  <div
                    key={test.name}
                    className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between p-4 text-left"
                      onClick={() => setExpandedTest(isExpanded ? null : test.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{getLocalizedTestName(test.name, t)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{test.description[locale] || test.description.en}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(test.name + " physical test")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                          title={`Search "${getLocalizedTestName(test.name, t)}" on YouTube`}
                        >
                          <Youtube className="h-4 w-4 text-destructive" />
                        </a>
                        <Badge variant="outline" className="text-[10px]">
                          {test.type === "both" ? t("ptFilterAll") :
                           test.type === "coach" ? t("ptCoachTest") : t("ptIndividualTest")}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                        <div>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("ptUnit")}</span>
                          <p className="text-sm text-foreground font-mono">{test.unit}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("ptProtocol")}</span>
                          <p className="text-sm text-foreground leading-relaxed">{test.protocol[locale] || test.protocol.en}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
