import { Zap, Flame, Gauge, Dumbbell, StretchHorizontal, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ExerciseCategory } from "@/data/exercises";

export type ExerciseStyleKey = ExerciseCategory | "custom";

export const EXERCISE_CATEGORY_STYLE: Record<ExerciseStyleKey, { Icon: LucideIcon; tile: string; icon: string }> = {
  power:      { Icon: Zap,                tile: "bg-yellow-500/15", icon: "text-yellow-500" },
  plyometric: { Icon: Flame,              tile: "bg-orange-500/15", icon: "text-orange-500" },
  speed:      { Icon: Gauge,              tile: "bg-amber-500/15",  icon: "text-amber-500" },
  strength:   { Icon: Dumbbell,           tile: "bg-sky-500/15",    icon: "text-sky-500" },
  mobility:   { Icon: StretchHorizontal,  tile: "bg-cyan-500/15",   icon: "text-cyan-500" },
  custom:     { Icon: Plus,               tile: "bg-violet-500/15", icon: "text-violet-500" },
};
