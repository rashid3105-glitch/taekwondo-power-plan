import { Target, Eye, Wind, Sparkles, Moon, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MentalCategory } from "@/data/mentalExercises";

export const MENTAL_CATEGORY_STYLE: Record<MentalCategory, { Icon: LucideIcon; tile: string; icon: string }> = {
  focus:         { Icon: Target,   tile: "bg-violet-500/15", icon: "text-violet-500" },
  visualization: { Icon: Eye,      tile: "bg-sky-500/15",    icon: "text-sky-500" },
  breathing:     { Icon: Wind,     tile: "bg-cyan-500/15",   icon: "text-cyan-500" },
  confidence:    { Icon: Sparkles, tile: "bg-amber-500/15",  icon: "text-amber-500" },
  recovery:      { Icon: Moon,     tile: "bg-teal-500/15",   icon: "text-teal-500" },
  toughness:     { Icon: Shield,   tile: "bg-rose-500/15",   icon: "text-rose-500" },
};
