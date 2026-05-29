import { Dumbbell, TrendingUp, Trophy, MessageCircle, Brain, Apple, HeartPulse, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AthleteModule {
  key: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const ATHLETE_MODULES: AthleteModule[] = [
  { key: "plan",      label: "Træningsplan",       icon: Dumbbell,      desc: "Strukturerede træningsprogrammer" },
  { key: "progress",  label: "Fremgang",           icon: TrendingUp,    desc: "Statistik og udvikling over tid" },
  { key: "compete",   label: "Stævner",            icon: Trophy,        desc: "Kommende og tidligere stævner" },
  { key: "chat",      label: "Beskeder",           icon: MessageCircle, desc: "Kommunikation med din coach" },
  { key: "mental",    label: "Mental",             icon: Brain,         desc: "Mentalt fokus og velvære" },
  { key: "nutrition", label: "Ernæring",           icon: Apple,         desc: "Kost og næringsstoffer" },
  { key: "rehab",     label: "Skade-genoptræning", icon: HeartPulse,    desc: "Skadesopfølgning og genoptræning" },
  { key: "video",     label: "Match-analyse",      icon: Video,         desc: "Videoanalyse af kampe og teknik" },
];
