import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Shield, Dumbbell, Battery, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

const TYPE_CONFIG: Record<string, { icon: typeof Shield; className: string }> = {
  tkd: { icon: Shield, className: "text-energy" },
  gym: { icon: Dumbbell, className: "text-primary" },
  recovery: { icon: Battery, className: "text-speed" },
};

// Realistic fictional 6-day sparring program
const SAMPLE_PLAN = {
  en: {
    name: "Sparring Power & Speed — 8 Weeks",
    phase: "Accumulation · Week 3 of 8",
    schedule: [
      {
        day: "Monday", label: "TKD Technical Sparring", type: "tkd",
        focus: "Footwork patterns, reaction drills, and light sparring rounds",
        exercises: [],
      },
      {
        day: "Tuesday", label: "Lower Body Power", type: "gym",
        focus: "Explosive hip extension and lateral force production",
        exercises: [
          { name: "Trap Bar Deadlift", category: "strength", sets: 4, reps: "4", tempo: "20X0", rest: "3 min", cue: "Drive through full foot, fast lockout", why: "Develops posterior chain power for turning kicks" },
          { name: "Bulgarian Split Squat", category: "strength", sets: 3, reps: "6/side", tempo: "3010", rest: "90s", cue: "Control the eccentric, explode up", why: "Unilateral stability for kicking stance" },
          { name: "Lateral Banded Jumps", category: "plyometric", sets: 3, reps: "5/side", tempo: null, rest: "2 min", cue: "Stick the landing, minimize ground contact", why: "Lateral power for sidestep-to-kick transitions" },
          { name: "Nordic Hamstring Curl", category: "mobility", sets: 3, reps: "4-6", tempo: "3010", rest: "90s", cue: "Control descent as far as possible", why: "Injury prevention for high-velocity kicking" },
        ],
      },
      {
        day: "Wednesday", label: "TKD Tactical Sparring", type: "tkd",
        focus: "Combination strategy and counter-attack timing",
        exercises: [],
      },
      {
        day: "Thursday", label: "Upper Body & Core", type: "gym",
        focus: "Trunk rotational power and clinch strength",
        exercises: [
          { name: "Landmine Rotational Press", category: "power", sets: 3, reps: "6/side", tempo: null, rest: "90s", cue: "Rotate from hips, punch through", why: "Rotational force for spinning techniques" },
          { name: "Pull-Up (Weighted)", category: "strength", sets: 4, reps: "5", tempo: "2010", rest: "2 min", cue: "Full range, chin over bar", why: "Clinch and grip endurance in close combat" },
          { name: "Pallof Press Hold", category: "strength", sets: 3, reps: "20s/side", tempo: null, rest: "60s", cue: "Resist rotation, brace core", why: "Anti-rotation stability during kicking" },
          { name: "Med Ball Rotational Slam", category: "power", sets: 3, reps: "5/side", tempo: null, rest: "90s", cue: "Full hip rotation, slam with intent", why: "Explosive trunk rotation for roundhouse kicks" },
        ],
      },
      {
        day: "Friday", label: "TKD Competition Sparring", type: "tkd",
        focus: "Full-intensity sparring rounds with video analysis",
        exercises: [],
      },
      {
        day: "Saturday", label: "Speed & Plyometrics", type: "gym",
        focus: "Rate of force development and reactive ability",
        exercises: [
          { name: "Depth Jump to Box", category: "plyometric", sets: 4, reps: "4", tempo: null, rest: "2 min", cue: "Minimize ground contact time", why: "Reactive power for explosive kick initiation" },
          { name: "Band-Resisted Knee Drive", category: "speed", sets: 3, reps: "8/side", tempo: null, rest: "90s", cue: "Fast knee to chest, fight the band", why: "Hip flexor speed for front and axe kicks" },
          { name: "Single-Leg Hip Thrust", category: "strength", sets: 3, reps: "8/side", tempo: "2011", rest: "60s", cue: "Full hip extension, squeeze glute at top", why: "Unilateral hip power for back kick drive" },
        ],
      },
      {
        day: "Sunday", label: "Active Recovery", type: "recovery",
        focus: "Mobility, foam rolling, light stretching",
        exercises: [],
      },
    ],
  },
  da: {
    name: "Sparring Power & Speed — 8 uger",
    phase: "Akkumulation · Uge 3 af 8",
    schedule: [
      {
        day: "Mandag", label: "TKD Teknisk Sparring", type: "tkd",
        focus: "Fodarbejdsmønstre, reaktionsøvelser og let sparring",
        exercises: [],
      },
      {
        day: "Tirsdag", label: "Underkrop Power", type: "gym",
        focus: "Eksplosiv hofteekstension og lateral kraftproduktion",
        exercises: [
          { name: "Trap Bar Dødløft", category: "strength", sets: 4, reps: "4", tempo: "20X0", rest: "3 min", cue: "Driv igennem hele foden, hurtig lockout", why: "Udvikler posterior kæde-kraft til drejespark" },
          { name: "Bulgarsk Split Squat", category: "strength", sets: 3, reps: "6/side", tempo: "3010", rest: "90s", cue: "Kontrollér den excentriske fase, eksplodér op", why: "Unilateral stabilitet til sparke-stance" },
          { name: "Laterale Band-Hop", category: "plyometric", sets: 3, reps: "5/side", tempo: null, rest: "2 min", cue: "Lav landing, minimer kontakttid", why: "Lateral kraft til sidestep-til-spark overgange" },
          { name: "Nordisk Hamstring Curl", category: "mobility", sets: 3, reps: "4-6", tempo: "3010", rest: "90s", cue: "Kontrollér nedstigningen så langt som muligt", why: "Skadeforebyggelse til højhastighedsspark" },
        ],
      },
      {
        day: "Onsdag", label: "TKD Taktisk Sparring", type: "tkd",
        focus: "Kombinationsstrategi og kontraangrebstiming",
        exercises: [],
      },
      {
        day: "Torsdag", label: "Overkrop & Core", type: "gym",
        focus: "Rotationskraft i trunk og clinch-styrke",
        exercises: [
          { name: "Landmine Rotational Press", category: "power", sets: 3, reps: "6/side", tempo: null, rest: "90s", cue: "Rotér fra hoften, pres igennem", why: "Rotationskraft til spinning-teknikker" },
          { name: "Pull-Up (Vægtet)", category: "strength", sets: 4, reps: "5", tempo: "2010", rest: "2 min", cue: "Fuld range, hage over stangen", why: "Clinch- og grebsudholdenhed i nærkamp" },
          { name: "Pallof Press Hold", category: "strength", sets: 3, reps: "20s/side", tempo: null, rest: "60s", cue: "Modstå rotation, spænd core", why: "Anti-rotationsstabilitet under spark" },
          { name: "Med Ball Rotational Slam", category: "power", sets: 3, reps: "5/side", tempo: null, rest: "90s", cue: "Fuld hofterotation, slam med intention", why: "Eksplosiv trunkrotation til rundekick" },
        ],
      },
      {
        day: "Fredag", label: "TKD Konkurrence-Sparring", type: "tkd",
        focus: "Fuld-intensitet sparring-runder med videoanalyse",
        exercises: [],
      },
      {
        day: "Lørdag", label: "Speed & Plyometrics", type: "gym",
        focus: "Rate of force development og reaktiv evne",
        exercises: [
          { name: "Depth Jump til Boks", category: "plyometric", sets: 4, reps: "4", tempo: null, rest: "2 min", cue: "Minimer kontakttid med gulvet", why: "Reaktiv kraft til eksplosiv sparkigangsætning" },
          { name: "Band-Modstand Knædrive", category: "speed", sets: 3, reps: "8/side", tempo: null, rest: "90s", cue: "Hurtigt knæ til bryst, kæmp mod båndet", why: "Hoftefleksorhastighed til front- og økse-spark" },
          { name: "Single-Leg Hip Thrust", category: "strength", sets: 3, reps: "8/side", tempo: "2011", rest: "60s", cue: "Fuld hofteekstension, klem gluteus i toppen", why: "Unilateral hoftekraft til bagspark" },
        ],
      },
      {
        day: "Søndag", label: "Aktiv Restitution", type: "recovery",
        focus: "Mobilitet, foam rolling, let udstrækning",
        exercises: [],
      },
    ],
  },
  sv: {
    name: "Sparring Power & Speed — 8 veckor",
    phase: "Ackumulation · Vecka 3 av 8",
    schedule: [
      {
        day: "Måndag", label: "TKD Teknisk Sparring", type: "tkd",
        focus: "Fotarbetsmönster, reaktionsövningar och lätt sparring",
        exercises: [],
      },
      {
        day: "Tisdag", label: "Underkropp Power", type: "gym",
        focus: "Explosiv höftextension och lateral kraftproduktion",
        exercises: [
          { name: "Trap Bar Marklyft", category: "strength", sets: 4, reps: "4", tempo: "20X0", rest: "3 min", cue: "Driv genom hela foten, snabb lockout", why: "Utvecklar posterior kedjekraft för vridande sparkar" },
          { name: "Bulgarisk Split Squat", category: "strength", sets: 3, reps: "6/sida", tempo: "3010", rest: "90s", cue: "Kontrollera excentriska fasen, explodera upp", why: "Unilateral stabilitet för sparkställning" },
          { name: "Laterala Bandhopp", category: "plyometric", sets: 3, reps: "5/sida", tempo: null, rest: "2 min", cue: "Mjuk landing, minimera kontakttid", why: "Lateral kraft för sidosteg-till-spark övergångar" },
          { name: "Nordisk Hamstring Curl", category: "mobility", sets: 3, reps: "4-6", tempo: "3010", rest: "90s", cue: "Kontrollera nedstigningen så långt som möjligt", why: "Skadeförebyggande för höghastighets-sparkar" },
        ],
      },
      {
        day: "Onsdag", label: "TKD Taktisk Sparring", type: "tkd",
        focus: "Kombinationsstrategi och kontraattacks-timing",
        exercises: [],
      },
      {
        day: "Torsdag", label: "Överkropp & Core", type: "gym",
        focus: "Rotationskraft i bål och clinch-styrka",
        exercises: [
          { name: "Landmine Rotational Press", category: "power", sets: 3, reps: "6/sida", tempo: null, rest: "90s", cue: "Rotera från höften, tryck igenom", why: "Rotationskraft för spinning-tekniker" },
          { name: "Pull-Up (Viktad)", category: "strength", sets: 4, reps: "5", tempo: "2010", rest: "2 min", cue: "Fullt rörelseomfång, haka över stången", why: "Clinch- och grepputhållighet i närstrid" },
          { name: "Pallof Press Hold", category: "strength", sets: 3, reps: "20s/sida", tempo: null, rest: "60s", cue: "Motstå rotation, spänn core", why: "Anti-rotationsstabilitet under sparkar" },
          { name: "Med Ball Rotational Slam", category: "power", sets: 3, reps: "5/sida", tempo: null, rest: "90s", cue: "Full höftrotation, slå med intention", why: "Explosiv bålrotation för roundhouse-sparkar" },
        ],
      },
      {
        day: "Fredag", label: "TKD Tävlings-Sparring", type: "tkd",
        focus: "Full-intensitet sparring-rundor med videoanalys",
        exercises: [],
      },
      {
        day: "Lördag", label: "Speed & Plyometrics", type: "gym",
        focus: "Rate of force development och reaktiv förmåga",
        exercises: [
          { name: "Depth Jump till Box", category: "plyometric", sets: 4, reps: "4", tempo: null, rest: "2 min", cue: "Minimera kontakttid med golvet", why: "Reaktiv kraft för explosiv sparkinitiering" },
          { name: "Band-Motstånd Knädrive", category: "speed", sets: 3, reps: "8/sida", tempo: null, rest: "90s", cue: "Snabbt knä till bröst, kämpa mot bandet", why: "Höftflexorhastighet för front- och yxsparkar" },
          { name: "Single-Leg Hip Thrust", category: "strength", sets: 3, reps: "8/sida", tempo: "2011", rest: "60s", cue: "Full höftextension, kläm gluteus i toppen", why: "Unilateral höftkraft för bakspark" },
        ],
      },
      {
        day: "Söndag", label: "Aktiv Återhämtning", type: "recovery",
        focus: "Mobilitet, foam rolling, lätt stretching",
        exercises: [],
      },
    ],
  },
};

export function SamplePlanPreview() {
  const [open, setOpen] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // Tuesday open by default
  const isMobile = useIsMobile();
  const { locale, t } = useLanguage();

  const plan = SAMPLE_PLAN[locale] || SAMPLE_PLAN.en;

  const toggleDay = (i: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const content = (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{plan.phase}</p>
      </div>

      {plan.schedule.map((day, i) => {
        const config = TYPE_CONFIG[day.type] || TYPE_CONFIG.gym;
        const Icon = config.icon;
        const isExpanded = expandedDays.has(i);

        return (
          <div key={i} className="rounded-lg border border-border bg-secondary/20 overflow-hidden">
            <button
              onClick={() => toggleDay(i)}
              className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 hover:bg-secondary/40 transition-colors cursor-pointer"
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", config.className)} />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-8">
                {day.day.slice(0, 3)}
              </span>
              <span className="text-sm font-semibold text-foreground flex-1 text-left truncate">
                {day.label}
              </span>
              {day.exercises.length > 0 && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                  {day.exercises.length}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border animate-slide-up">
                {day.focus && (
                  <p className="text-xs text-muted-foreground italic">Focus: {day.focus}</p>
                )}

                {day.exercises.length > 0 ? (
                  day.exercises.map((ex, j) => (
                    <div key={j} className="rounded-md border border-border bg-card p-2.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono w-5">
                          {String(j + 1).padStart(2, "0")}
                        </span>
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[ex.category] || "bg-muted"}`} />
                        <span className="text-sm font-semibold text-foreground flex-1 truncate">
                          {ex.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-muted-foreground">
                        <span>
                          <strong className="text-foreground">{ex.sets}×{ex.reps}</strong>
                        </span>
                        <span>Rest: {ex.rest}</span>
                        {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                      </div>
                      {ex.cue && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Coaching:</span> {ex.cue}
                        </p>
                      )}
                      {ex.why && (
                        <p className="text-xs text-primary/80">
                          <span className="font-semibold text-primary">Why for TKD:</span> {ex.why}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic py-1">
                    {locale === "da"
                      ? "Følg din dojangs programmering for denne session."
                      : locale === "sv"
                        ? "Följ din dojangs programmering för detta pass."
                        : "Follow your dojang's programming for this session."}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const trigger = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="gap-1.5 text-xs font-semibold"
    >
      <Eye className="h-3.5 w-3.5" />
      {t("samplePlanCTA" as any)}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>{t("samplePlanTitle" as any)}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">{content}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("samplePlanTitle" as any)}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}
