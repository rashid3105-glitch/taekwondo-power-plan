import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, Check, Calendar as CalendarIcon, Sparkles, Layers, Trophy, Target, FilePlus, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// --- Mock athletes + individual overlays ----------------------
type AthleteId = "sara" | "jonas" | "mikkel" | "layla";
type Overlay = { week: number; dow: number; tag: string };

const ATHLETES: { id: AthleteId; name: string }[] = [
  { id: "sara", name: "Sara K." },
  { id: "jonas", name: "Jonas M." },
  { id: "mikkel", name: "Mikkel A." },
  { id: "layla", name: "Layla H." },
];

const ATHLETE_OVERLAYS: Record<AthleteId, Overlay[]> = {
  sara: [
    { week: 2, dow: 1, tag: "Ekstra bandal chagi" },
    { week: 3, dow: 4, tag: "Sparring vs. højre" },
  ],
  jonas: [
    { week: 1, dow: 2, tag: "Knæ-rehab let" },
    { week: 4, dow: 0, tag: "Eksplosivitet" },
  ],
  mikkel: [{ week: 2, dow: 5, tag: "Poomsae detail" }],
  layla: [{ week: 3, dow: 2, tag: "Mental: pres-scenarie" }],
};

const WEEKDAY_LABELS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
const TYPE_LABEL: Record<string, string> = { sky: "TKD", emerald: "Styrke", rose: "Stævne", muted: "Hvile" };
// Per-weekday focus tags (Mon..Sun)
const DAY_FOCUS: Record<string, string[][]> = {
  sky: [
    ["Teknik", "Sparring"],
    ["Teknik", "Kondition"],
    ["Sparring", "Mental"],
    ["Teknik", "Sparring"],
    ["Sparring", "Konkurrenceforberedelse"],
    ["Teknik"],
    ["Teknik", "Mental"],
  ],
  emerald: [
    ["Styrke", "Kondition"],
    ["Styrke", "Eksplosivitet"],
    ["Styrke", "Core"],
    ["Styrke", "Kondition"],
    ["Styrke", "Mobilitet"],
    ["Styrke"],
    ["Styrke", "Kondition"],
  ],
  rose: Array(7).fill(["Konkurrenceforberedelse", "Mental"]),
  muted: Array(7).fill(["Restitution"]),
};

function DayFocusContent({
  week,
  dow,
  type,
  overlayTag,
  athleteName,
}: {
  week: number;
  dow: number;
  type: string;
  overlayTag?: string;
  athleteName?: string;
}) {
  const tags = DAY_FOCUS[type]?.[dow] ?? [];
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        Uge {week} · {WEEKDAY_LABELS[dow]}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", dotClass(type))} />
        <span className="text-sm font-bold text-popover-foreground">{TYPE_LABEL[type]}</span>
      </div>
      {type === "muted" ? (
        <p className="text-xs text-muted-foreground">Hviledag — fokus på restitution.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((f) => (
            <span key={f} className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-popover-foreground">
              {f}
            </span>
          ))}
        </div>
      )}
      {overlayTag && athleteName && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 mb-1">
            Individuelt fokus
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-popover-foreground">
              <span className="font-semibold">{athleteName}:</span> {overlayTag}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// MOCKUP — Season Onboarding (sandbox, not linked in navigation)
// Route: /mockup/season-onboarding
// All data is local — no backend, no DB calls.
// =============================================================

type FocusTag =
  | "Kondition"
  | "Styrke"
  | "Teknik"
  | "Sparring"
  | "Konkurrenceforberedelse"
  | "Mental"
  | "Restitution";

type Phase = {
  name: string;
  weekStart: number;
  weekEnd: number;
  focus: FocusTag[];
  color: string; // tailwind bg class
  ring: string;
};

type Template = {
  id: "comp" | "base" | "peak" | "scratch";
  title: string;
  weeks: number;
  blurb: string;
  icon: typeof Trophy;
  phases: Phase[];
};

const phaseColors = [
  { color: "bg-sky-500/15 text-sky-700 dark:text-sky-300", ring: "ring-sky-500/30" },
  { color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500/30" },
  { color: "bg-amber-500/15 text-amber-700 dark:text-amber-300", ring: "ring-amber-500/30" },
  { color: "bg-rose-500/15 text-rose-700 dark:text-rose-300", ring: "ring-rose-500/30" },
];

const TEMPLATES: Template[] = [
  {
    id: "comp",
    title: "Konkurrencesæson",
    weeks: 16,
    blurb: "Peak mod et mål-stævne.",
    icon: Trophy,
    phases: [
      { name: "Grundform", weekStart: 1, weekEnd: 5, focus: ["Kondition", "Styrke", "Teknik"], ...phaseColors[0] },
      { name: "Specifik forberedelse", weekStart: 6, weekEnd: 11, focus: ["Teknik", "Sparring", "Konkurrenceforberedelse"], ...phaseColors[1] },
      { name: "Peak / Stævneforberedelse", weekStart: 12, weekEnd: 15, focus: ["Sparring", "Konkurrenceforberedelse", "Mental"], ...phaseColors[2] },
      { name: "Restitution", weekStart: 16, weekEnd: 16, focus: ["Restitution"], ...phaseColors[3] },
    ],
  },
  {
    id: "base",
    title: "Grundtræning",
    weeks: 8,
    blurb: "Off-season basis.",
    icon: Layers,
    phases: [
      { name: "Genopbygning", weekStart: 1, weekEnd: 3, focus: ["Kondition", "Styrke"], ...phaseColors[0] },
      { name: "Grundform", weekStart: 4, weekEnd: 8, focus: ["Styrke", "Teknik", "Kondition"], ...phaseColors[1] },
    ],
  },
  {
    id: "peak",
    title: "Peak mod stævne",
    weeks: 6,
    blurb: "Kort skærpningsblok.",
    icon: Target,
    phases: [
      { name: "Skærpning", weekStart: 1, weekEnd: 3, focus: ["Teknik", "Sparring"], ...phaseColors[0] },
      { name: "Taper & peak", weekStart: 4, weekEnd: 5, focus: ["Sparring", "Konkurrenceforberedelse", "Mental"], ...phaseColors[1] },
      { name: "Stævneuge", weekStart: 6, weekEnd: 6, focus: ["Konkurrenceforberedelse", "Restitution"], ...phaseColors[2] },
    ],
  },
  {
    id: "scratch",
    title: "Start fra bunden",
    weeks: 0,
    blurb: "Byg en tom plan selv.",
    icon: FilePlus,
    phases: [],
  },
];

// Dot color per "day type" used in the calendar legend
const dayLegend = [
  { label: "TKD", cls: "bg-sky-500" },
  { label: "Styrke", cls: "bg-emerald-500" },
  { label: "Stævne", cls: "bg-rose-500" },
  { label: "Hvile", cls: "bg-muted-foreground/30" },
];

// Pseudo-pattern: weekday -> dot type (Mon=0 ... Sun=6)
const weekPattern = ["sky", "emerald", "sky", "muted", "sky", "emerald", "muted"];
const dotClass = (k: string) =>
  k === "sky" ? "bg-sky-500" : k === "emerald" ? "bg-emerald-500" : k === "rose" ? "bg-rose-500" : "bg-muted-foreground/30";

function MiniMonthCalendar({
  highlightWeek = 2,
  compFinalWeek,
  overlays = [],
  athleteName,
}: {
  highlightWeek?: number;
  compFinalWeek?: number;
  overlays?: Overlay[];
  athleteName?: string;
}) {
  const weeks = [1, 2, 3, 4, 5];
  const [openKey, setOpenKey] = useState<string | null>(null);
  const overlayFor = (w: number, i: number) =>
    overlays.find((o) => o.week === w && o.dow === i)?.tag;
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-card-foreground uppercase tracking-wider">Måned</div>
        <div className="text-[10px] text-muted-foreground">5 uger vist</div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-[10px] text-muted-foreground font-medium mb-1">
        {["M", "T", "O", "T", "F", "L", "S"].map((d, i) => (
          <div key={i} className="text-center">{d}</div>
        ))}
      </div>
      <div className="space-y-1.5">
        {weeks.map((w) => {
          const isHighlight = w === highlightWeek;
          return (
            <div
              key={w}
              className={cn(
                "grid grid-cols-7 gap-1.5 rounded-md px-1 py-1.5",
                isHighlight && "bg-primary/10 ring-1 ring-primary/40"
              )}
            >
              {weekPattern.map((p, i) => {
                const isComp = compFinalWeek === w && i >= 5;
                const type = isComp ? "rose" : p;
                const key = `${w}-${i}`;
                const overlayTag = overlayFor(w, i);
                return (
                  <Popover key={i} open={openKey === key} onOpenChange={(o) => setOpenKey(o ? key : null)}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        onMouseEnter={() => setOpenKey(key)}
                        onMouseLeave={() => setOpenKey((k) => (k === key ? null : k))}
                        className="flex flex-col items-center gap-1 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded relative"
                      >
                        <div className="text-[10px] text-muted-foreground">{w * 7 - 6 + i}</div>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            dotClass(type),
                            overlayTag && "ring-2 ring-amber-500 ring-offset-1 ring-offset-card"
                          )}
                        />
                        {overlayTag && (
                          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-56 p-3" onMouseEnter={() => setOpenKey(key)} onMouseLeave={() => setOpenKey(null)}>
                      <DayFocusContent
                        week={w}
                        dow={i}
                        type={type}
                        overlayTag={overlayTag}
                        athleteName={athleteName}
                      />
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        Hold musen over (eller tap) en dag for at se fokus.
        {athleteName && <span className="text-amber-600 dark:text-amber-400"> Gul ring = individuelt fokus.</span>}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-bold text-card-foreground uppercase tracking-wider mb-3">Legende</div>
      <ul className="space-y-2">
        {dayLegend.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-xs text-card-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-full", d.cls)} />
            <span>{d.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground leading-relaxed">
        Den fremhævede uge er den aktuelle uge.
      </div>
    </div>
  );
}

// ---------- COACH VIEW ----------
function CoachView() {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [selected, setSelected] = useState<Template["id"] | null>(null);

  const tpl = useMemo(() => TEMPLATES.find((t) => t.id === selected) ?? null, [selected]);

  return (
    <div className="space-y-6">
      {bannerOpen && (
        <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-4 pr-10">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-card-foreground leading-relaxed">
              <span className="font-semibold">Byg din sæson:</span> vælg en skabelon eller start fra bunden. Atleterne ser planen automatisk.
            </p>
          </div>
          <button
            onClick={() => setBannerOpen(false)}
            className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:bg-background/50"
            aria-label="Luk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Template picker */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Vælg en skabelon</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const active = selected === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  "text-left rounded-xl border bg-card p-4 shadow-sm transition-all",
                  "hover:border-primary/50 hover:shadow-md",
                  active ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {active && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      <Check className="h-3 w-3" /> Valgt
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-card-foreground">
                  {t.title}
                  {t.weeks > 0 && <span className="text-muted-foreground font-normal"> · {t.weeks} uger</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result */}
      {tpl && tpl.phases.length > 0 ? (
        <div className="space-y-4">
          {/* Phase list */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-sm font-bold text-card-foreground">Faser</h3>
              <span className="text-[11px] text-muted-foreground">{tpl.weeks} uger</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              En fase er en periode med ét fokus, fx Grundform eller Stævneforberedelse.
            </p>
            <ul className="space-y-2">
              {tpl.phases.map((p, idx) => (
                <li
                  key={idx}
                  className={cn("rounded-lg p-3 ring-1", p.color, p.ring)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">{p.name}</div>
                    <div className="text-[11px] font-medium opacity-80">
                      uge {p.weekStart}{p.weekEnd !== p.weekStart ? `–${p.weekEnd}` : ""}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.focus.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-semibold"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              Træningsfokus = de temaer du vil prioritere i fasen. Dukker op som tags på dagene.
            </p>
          </div>

          {/* Calendar + legend */}
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <MiniMonthCalendar highlightWeek={2} compFinalWeek={tpl.id === "comp" ? 5 : undefined} />
            <Legend />
          </div>
        </div>
      ) : tpl ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <FilePlus className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-card-foreground font-semibold">Tom plan</p>
          <p className="text-xs text-muted-foreground mt-1">Tilføj din første fase for at komme i gang.</p>
          <Button size="sm" className="mt-4">Tilføj fase</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <CalendarIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-card-foreground font-semibold">Ingen plan endnu</p>
          <p className="text-xs text-muted-foreground mt-1">Vælg en skabelon ovenfor for at se hvordan din sæson kan se ud.</p>
        </div>
      )}
    </div>
  );
}

// ---------- ATHLETE VIEW ----------
function AthleteView() {
  const [bannerOpen, setBannerOpen] = useState(true);
  return (
    <div className="space-y-6">
      {bannerOpen && (
        <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-4 pr-10">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-card-foreground leading-relaxed">
              <span className="font-semibold">Din træners plan.</span> Farverne viser hvad du laver hver dag. Den aktuelle uge er markeret.
            </p>
          </div>
          <button
            onClick={() => setBannerOpen(false)}
            className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:bg-background/50"
            aria-label="Luk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* This week summary */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Denne uge</div>
        <div className="text-sm text-card-foreground">
          I denne uge: <span className="font-bold">4× TKD</span> · <span className="font-bold">1× Styrke</span> ·
          {" "}Fase: <span className="font-bold">Intensiv</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Teknik", "Sparring", "Styrke"].map((t) => (
            <span key={t} className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-card-foreground">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Read-only calendar + legend */}
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <MiniMonthCalendar highlightWeek={2} />
        <Legend />
      </div>
    </div>
  );
}

// ---------- PAGE ----------
export default function MockupSeasonOnboarding() {
  const [role, setRole] = useState<"coach" | "athlete">("coach");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Mockup · sandbox</div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">Sæsonkalender — onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Forslag til en selvforklarende onboarding. Ikke koblet til den rigtige sæsonkalender.
          </p>
        </div>

        {/* Role toggle */}
        <div className="inline-flex rounded-lg border border-border bg-card p-1 mb-6 shadow-sm">
          {(["coach", "athlete"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-colors",
                role === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              )}
            >
              {r === "coach" ? "Coach" : "Atlet"}
            </button>
          ))}
        </div>

        {role === "coach" ? <CoachView /> : <AthleteView />}
      </div>
    </div>
  );
}
