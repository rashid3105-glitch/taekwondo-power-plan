import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Calendar as CalendarIcon,
  Target,
  Sparkles,
  Plus,
  Pencil,
  Eye,
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  CircleDashed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type GoalType = "sport" | "training" | "technique";
type GoalStatus = "not_started" | "in_progress" | "achieved";

interface Goal {
  id: string;
  type: GoalType;
  title: string;
  desc: string;
  metric?: string;
  deadline: string; // ISO date
  status: GoalStatus;
}

interface Athlete {
  id: string;
  name: string;
  initials: string;
  belt: string;
  goals: Goal[];
  coachComment: string;
  coachCommentDate: string;
}

const TYPE_META: Record<
  GoalType,
  { label: string; icon: typeof Trophy; ring: string; bg: string; text: string; chip: string }
> = {
  sport: {
    label: "Sportsligt mål",
    icon: Trophy,
    ring: "ring-pink-400/40",
    bg: "bg-pink-500/10",
    text: "text-pink-600 dark:text-pink-300",
    chip: "bg-pink-500/15 text-pink-700 dark:text-pink-200 border-pink-500/30",
  },
  training: {
    label: "Trænings-mål",
    icon: CalendarIcon,
    ring: "ring-emerald-400/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  },
  technique: {
    label: "Teknik-fokus",
    icon: Target,
    ring: "ring-sky-400/40",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-300",
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-200 border-sky-500/30",
  },
};

const STATUS_META: Record<
  GoalStatus,
  { label: string; icon: typeof CircleDashed; cls: string }
> = {
  not_started: {
    label: "Ikke startet",
    icon: CircleDashed,
    cls: "bg-muted text-muted-foreground border-border",
  },
  in_progress: {
    label: "I gang",
    icon: Clock,
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-500/30",
  },
  achieved: {
    label: "Opnået",
    icon: CheckCircle2,
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
  },
};

const today = new Date();
const inDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const INITIAL_ATHLETES: Athlete[] = [
  {
    id: "sara",
    name: "Sara Mikkelsen",
    initials: "SM",
    belt: "Sort 1. dan",
    coachComment:
      "Sara, godt arbejde i tirsdags — du holdt distance bedre. Næste uge: fokus på fodarbejdet i kombinationer.",
    coachCommentDate: inDays(-2),
    goals: [
      {
        id: "g1",
        type: "sport",
        title: "Top 3 ved DM marts",
        desc: "Slå mindst én sort bælte i puljekamp.",
        metric: "Placering top 3",
        deadline: inDays(90),
        status: "in_progress",
      },
      {
        id: "g2",
        type: "training",
        title: "4 træninger/uge i 6 uger",
        desc: "2x klub, 1x styrke, 1x egen teknik.",
        metric: "≥ 4 sessioner/uge",
        deadline: inDays(42),
        status: "in_progress",
      },
      {
        id: "g3",
        type: "technique",
        title: "Forbedre bandal chagi timing",
        desc: "Ramme i counter inden modstanderens spark lander.",
        metric: "5/10 i sparring",
        deadline: inDays(28),
        status: "not_started",
      },
    ],
  },
  {
    id: "liam",
    name: "Liam Sørensen",
    initials: "LS",
    belt: "Rød 1. kup",
    coachComment: "Stærk uge — bliv ved med at logge din søvn.",
    coachCommentDate: inDays(-4),
    goals: [
      {
        id: "g4",
        type: "sport",
        title: "Vinde 2 kampe ved næste klub-stævne",
        desc: "Fokus på rolige åbninger.",
        deadline: inDays(35),
        status: "in_progress",
      },
      {
        id: "g5",
        type: "technique",
        title: "Ren dollyo chagi-kombination",
        desc: "Dobbelt dollyo uden at miste balance.",
        deadline: inDays(21),
        status: "achieved",
      },
    ],
  },
  {
    id: "mia",
    name: "Mia Holm",
    initials: "MH",
    belt: "Blå 2. kup",
    coachComment: "Husk at lave mobility-rutinen tre gange denne uge.",
    coachCommentDate: inDays(-1),
    goals: [
      {
        id: "g6",
        type: "training",
        title: "Bestå fysisk test i april",
        desc: "Sit-ups, push-ups, sprint-test.",
        metric: "Alle 3 delprøver bestået",
        deadline: inDays(55),
        status: "in_progress",
      },
      {
        id: "g7",
        type: "technique",
        title: "Stabil sidespark-højde",
        desc: "Skulderhøjde 8 ud af 10 forsøg.",
        deadline: inDays(30),
        status: "not_started",
      },
    ],
  },
  {
    id: "noah",
    name: "Noah Berg",
    initials: "NB",
    belt: "Grøn 4. kup",
    coachComment: "Du er kommet flot tilbage efter pausen — én ting ad gangen.",
    coachCommentDate: inDays(-3),
    goals: [
      {
        id: "g8",
        type: "training",
        title: "3 træninger/uge stabilt",
        desc: "Ingen aflysninger i 4 uger.",
        metric: "3 sessioner/uge",
        deadline: inDays(28),
        status: "in_progress",
      },
      {
        id: "g9",
        type: "sport",
        title: "Deltag i klub-cup",
        desc: "Bare gennemfør — erfaring først.",
        deadline: inDays(70),
        status: "not_started",
      },
    ],
  },
];

function daysUntil(iso: string) {
  const d = new Date(iso);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  return diff;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
  });
}

export default function MockupAthleteGoals() {
  const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_ATHLETES[0].id);
  const [view, setView] = useState<"coach" | "athlete">("coach");
  const [showGuide, setShowGuide] = useState(true);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [creatingType, setCreatingType] = useState<GoalType | null>(null);

  const selected = athletes.find((a) => a.id === selectedId)!;

  const updateAthlete = (patch: Partial<Athlete>) =>
    setAthletes((prev) =>
      prev.map((a) => (a.id === selectedId ? { ...a, ...patch } : a))
    );

  const upsertGoal = (g: Goal) => {
    const exists = selected.goals.some((x) => x.id === g.id);
    updateAthlete({
      goals: exists
        ? selected.goals.map((x) => (x.id === g.id ? g : x))
        : [...selected.goals, g],
    });
  };

  const deleteGoal = (id: string) =>
    updateAthlete({ goals: selected.goals.filter((g) => g.id !== id) });

  const draft: Goal | null = editing
    ? editing
    : creatingType
      ? {
          id: `g-${Date.now()}`,
          type: creatingType,
          title: "",
          desc: "",
          metric: "",
          deadline: inDays(30),
          status: "not_started",
        }
      : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b sticky top-0 z-20 bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Tilbage
          </Link>
          <div className="text-xs text-muted-foreground hidden sm:block">
            Mockup · individuelle mål
          </div>
          <div className="inline-flex rounded-full border bg-muted/40 p-1">
            <button
              onClick={() => setView("coach")}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full transition",
                view === "coach"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground"
              )}
            >
              Coach
            </button>
            <button
              onClick={() => setView("athlete")}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full transition",
                view === "athlete"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground"
              )}
            >
              Atlet
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Individuelle mål for hver atlet
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {view === "coach"
              ? "Skriv 1–3 mål pr. atlet — sportsligt, træning, teknik. Atleten ser dem dagligt."
              : `Sådan ser ${selected.name.split(" ")[0]} sine mål på telefonen.`}
          </p>
        </div>

        {view === "coach" ? (
          <CoachView
            athletes={athletes}
            selected={selected}
            onSelect={setSelectedId}
            showGuide={showGuide}
            onCloseGuide={() => setShowGuide(false)}
            onEdit={setEditing}
            onDelete={deleteGoal}
            onAdd={(t) => setCreatingType(t)}
            onCommentChange={(v) => updateAthlete({ coachComment: v })}
            onPreview={() => setView("athlete")}
          />
        ) : (
          <AthleteView
            athlete={selected}
            onBack={() => setView("coach")}
          />
        )}
      </div>

      {/* Edit / create sheet */}
      <Sheet
        open={!!draft}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setCreatingType(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {draft && (
            <GoalEditor
              key={draft.id}
              initial={draft}
              onCancel={() => {
                setEditing(null);
                setCreatingType(null);
              }}
              onSave={(g) => {
                upsertGoal(g);
                setEditing(null);
                setCreatingType(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* -------------------- Coach view -------------------- */

function CoachView({
  athletes,
  selected,
  onSelect,
  showGuide,
  onCloseGuide,
  onEdit,
  onDelete,
  onAdd,
  onCommentChange,
  onPreview,
}: {
  athletes: Athlete[];
  selected: Athlete;
  onSelect: (id: string) => void;
  showGuide: boolean;
  onCloseGuide: () => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onAdd: (t: GoalType) => void;
  onCommentChange: (v: string) => void;
  onPreview: () => void;
}) {
  return (
    <>
      {/* Athlete chips */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {athletes.map((a) => {
          const active = a.id === selected.id;
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 min-h-11 transition",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "h-8 w-8 rounded-full grid place-items-center text-xs font-semibold",
                  active ? "bg-primary-foreground/15" : "bg-muted"
                )}
              >
                {a.initials}
              </span>
              <span className="text-sm font-medium">
                {a.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Guide banner */}
      {showGuide && (
        <Card className="p-4 bg-primary/5 border-primary/20 relative">
          <button
            onClick={onCloseGuide}
            className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full hover:bg-muted"
            aria-label="Luk"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium">
                Sådan sætter du individuelle mål i appen i dag
              </p>
              <p className="text-muted-foreground">
                Der findes endnu ikke ét samlet sted til strukturerede mål
                (dette er en mockup af forslaget). I mellemtiden kan du bruge:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Dagbogs-kommentar</strong>{" "}
                  — eneste sted atleten ser din tekst i kontekst.
                </li>
                <li>
                  <strong className="text-foreground">Ugefokus i Sæsonkalender</strong>{" "}
                  — vælg teknikker pr. atlet for en given uge.
                </li>
                <li>
                  <strong className="text-foreground">Send besked</strong>{" "}
                  (påmindelse-knap på atletens side) — vises i atletens
                  notifikationsklokke.
                </li>
                <li>
                  <strong className="text-foreground">Private noter</strong>{" "}
                  bruges kun til dig selv — atleten ser dem ikke.
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Selected athlete header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted grid place-items-center font-semibold">
            {selected.initials}
          </div>
          <div>
            <div className="font-semibold">{selected.name}</div>
            <div className="text-xs text-muted-foreground">{selected.belt}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onPreview} className="gap-2">
          <Eye className="h-4 w-4" /> Se hvad{" "}
          {selected.name.split(" ")[0]} ser
        </Button>
      </div>

      {/* Goals grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["sport", "training", "technique"] as GoalType[]).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const goals = selected.goals.filter((g) => g.type === type);
          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={cn("inline-flex items-center gap-2 text-sm font-medium", meta.text)}>
                  <span
                    className={cn(
                      "h-7 w-7 grid place-items-center rounded-full",
                      meta.bg
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {meta.label}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onAdd(type)}
                  aria-label={`Tilføj ${meta.label}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {goals.length === 0 ? (
                <button
                  onClick={() => onAdd(type)}
                  className="w-full text-left text-xs text-muted-foreground border border-dashed rounded-lg p-3 hover:bg-muted/40 min-h-20"
                >
                  Intet mål endnu — klik for at tilføje.
                </button>
              ) : (
                goals.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onEdit={() => onEdit(g)}
                    onDelete={() => onDelete(g.id)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly comment */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquareQuote className="h-4 w-4 text-primary" />
          Ugens kommentar til {selected.name.split(" ")[0]}
        </div>
        <Textarea
          value={selected.coachComment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={3}
          placeholder="Skriv en kort hilsen, fokus eller anerkendelse til denne uge…"
        />
        <p className="text-xs text-muted-foreground">
          Vises øverst hos atleten med dato.
        </p>
      </Card>
    </>
  );
}

/* -------------------- Athlete view -------------------- */

function AthleteView({
  athlete,
  onBack,
}: {
  athlete: Athlete;
  onBack: () => void;
}) {
  const inProgress = athlete.goals.filter((g) => g.status === "in_progress").length;
  const achieved = athlete.goals.filter((g) => g.status === "achieved").length;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Telefon-preview
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          Tilbage til coach
        </Button>
      </div>

      <Card className="p-4 space-y-3 border-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted grid place-items-center font-semibold text-sm">
            {athlete.initials}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Velkommen</div>
            <div className="font-semibold">{athlete.name.split(" ")[0]}</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-2">Dine mål fra din coach</div>
          <div className="space-y-2">
            {athlete.goals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ingen mål sat endnu.
              </p>
            )}
            {athlete.goals.map((g) => (
              <GoalCard key={g.id} goal={g} compact />
            ))}
          </div>
        </div>

        {athlete.coachComment && (
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-2">
              <MessageSquareQuote className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p>{athlete.coachComment}</p>
                <p className="text-xs text-muted-foreground">
                  Coach · {formatDate(athlete.coachCommentDate)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">
            {inProgress} i gang · {achieved} opnået
          </span>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Dette er en mockup — målene er eksempler.
      </p>
    </div>
  );
}

/* -------------------- Goal card -------------------- */

function GoalCard({
  goal,
  onEdit,
  onDelete,
  compact,
}: {
  goal: Goal;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const meta = TYPE_META[goal.type];
  const status = STATUS_META[goal.status];
  const Icon = meta.icon;
  const StatusIcon = status.icon;
  const d = daysUntil(goal.deadline);

  return (
    <Card className={cn("p-3 space-y-2", meta.bg, "border", meta.ring && `ring-1 ${meta.ring}`)}>
      <div className="flex items-start gap-2">
        <span className={cn("h-7 w-7 grid place-items-center rounded-full bg-background/70", meta.text)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm leading-snug">{goal.title || "Uden titel"}</div>
          {goal.desc && (
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {goal.desc}
            </div>
          )}
        </div>
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 -mt-1 -mr-1"
            onClick={onEdit}
            aria-label="Rediger"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {goal.metric && !compact && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Mål:</span> {goal.metric}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className={cn("gap-1 text-xs", status.cls)}>
          <StatusIcon className="h-3 w-3" /> {status.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {goal.status === "achieved"
            ? `Frist ${formatDate(goal.deadline)}`
            : d < 0
              ? `Forfaldt ${Math.abs(d)} d siden`
              : d === 0
                ? "Forfalder i dag"
                : `Om ${d} dage · ${formatDate(goal.deadline)}`}
        </span>
      </div>

      {onDelete && !compact && (
        <button
          onClick={onDelete}
          className="text-[11px] text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
        >
          Slet mål
        </button>
      )}
    </Card>
  );
}

/* -------------------- Editor -------------------- */

function GoalEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Goal;
  onSave: (g: Goal) => void;
  onCancel: () => void;
}) {
  const [g, setG] = useState<Goal>(initial);
  const meta = TYPE_META[g.type];

  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className={cn("h-7 w-7 grid place-items-center rounded-full", meta.bg, meta.text)}>
            <meta.icon className="h-4 w-4" />
          </span>
          {meta.label}
        </SheetTitle>
        <SheetDescription>
          Sæt ét konkret mål. Hold det enkelt og målbart.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 py-4 overflow-y-auto">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={g.type} onValueChange={(v) => setG({ ...g, type: v as GoalType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sport">Sportsligt mål</SelectItem>
              <SelectItem value="training">Trænings-mål</SelectItem>
              <SelectItem value="technique">Teknik-fokus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Titel</Label>
          <Input
            value={g.title}
            onChange={(e) => setG({ ...g, title: e.target.value })}
            placeholder="Fx Top 3 ved DM marts"
          />
        </div>

        <div className="space-y-2">
          <Label>Beskrivelse</Label>
          <Textarea
            value={g.desc}
            onChange={(e) => setG({ ...g, desc: e.target.value })}
            rows={3}
            placeholder="Kort kontekst eller hvordan…"
          />
        </div>

        <div className="space-y-2">
          <Label>Målbar indikator (valgfri)</Label>
          <Input
            value={g.metric ?? ""}
            onChange={(e) => setG({ ...g, metric: e.target.value })}
            placeholder="Fx ≥ 4 træninger/uge"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={g.deadline}
              onChange={(e) => setG({ ...g, deadline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={g.status}
              onValueChange={(v) => setG({ ...g, status: v as GoalStatus })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Ikke startet</SelectItem>
                <SelectItem value="in_progress">I gang</SelectItem>
                <SelectItem value="achieved">Opnået</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <SheetFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Annullér
        </Button>
        <Button onClick={() => onSave(g)} disabled={!g.title.trim()} className="flex-1">
          Gem mål
        </Button>
      </SheetFooter>
    </div>
  );
}
