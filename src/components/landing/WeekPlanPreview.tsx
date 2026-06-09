import { motion } from "framer-motion";
import { Shield, Dumbbell, Flame, Moon, Calendar, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const dayKeys = ["landingDayMon", "landingDayTue", "landingDayWed", "landingDayThu", "landingDayFri", "landingDaySat", "landingDaySun"] as const;
const typeKeys = ["landingTypeTechnical", "landingTypeStrength", "landingTypeTechnical", "landingTypePowerSpeed", "landingTypeCompetition", "landingTypeConditioning", "landingTypeRecovery"] as const;

const weekPlan = [
  { dayKey: 0, typeKey: 0, icon: Shield, exercises: ["Sparring drills", "Roundhouse combos", "Footwork patterns"], intensity: 85, color: "text-destructive" },
  { dayKey: 1, typeKey: 1, icon: Dumbbell, exercises: ["Trap bar deadlift 4×4", "Bulgarian split squat 3×6", "Weighted pull-ups 3×5"], intensity: 70, color: "text-energy" },
  { dayKey: 2, typeKey: 2, icon: Shield, exercises: ["Poomsae refinement", "Reaction drills", "Light sparring"], intensity: 55, color: "text-energy" },
  { dayKey: 3, typeKey: 3, icon: Flame, exercises: ["Hang clean 4×3", "Box jumps 4×5", "Band-resisted kicks 3×8"], intensity: 75, color: "text-speed" },
  { dayKey: 4, typeKey: 4, icon: Shield, exercises: ["Full sparring rounds", "Tactical drills", "Match simulation"], intensity: 90, color: "text-destructive" },
  { dayKey: 5, typeKey: 5, icon: Zap, exercises: ["Prowler sprints 6×20m", "Kettlebell complexes", "Core anti-rotation work"], intensity: 65, color: "text-energy" },
  { dayKey: 6, typeKey: 6, icon: Moon, exercises: ["Foam rolling", "Hip mobility flow", "Active recovery walk"], intensity: 15, color: "text-muted-foreground" },
];

export const WeekPlanPreview = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-3xl mx-auto px-5 pb-14" aria-label="Weekly training plan example">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-energy/30 bg-energy/10 px-3 py-1 mb-4">
          <Calendar className="h-3 w-3 text-energy" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-energy">
            {t("landingWeekBadge")}
          </span>
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-2">
          {t("landingWeekTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("landingWeekDesc")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-2 mb-5"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("landingPhase")}</span>
        <span className="rounded-full bg-energy/15 border border-energy/30 px-2.5 py-0.5 text-[11px] font-bold text-energy">
          {t("landingPhaseValue")}
        </span>
        <span className="text-[10px] text-muted-foreground">· {t("landingPhaseWeek")}</span>
      </motion.div>

      <div className="grid gap-2.5">
        {weekPlan.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
            className="rounded-xl border border-border bg-card p-3.5 sm:p-4 flex items-start gap-3 shadow-sm"
          >
            <div className={`h-9 w-9 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center flex-shrink-0 ${day.color}`}>
              <day.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-card-foreground">{t(dayKeys[day.dayKey])}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t(typeKeys[day.typeKey])}</span>
                </div>
                {day.intensity > 20 && (
                  <span className={`text-[10px] font-bold ${day.color}`}>
                    {day.intensity >= 80 ? t("landingIntensityHigh") : day.intensity >= 50 ? t("landingIntensityModerate") : t("landingIntensityLow")}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {day.exercises.map((ex) => (
                  <span key={ex} className="text-[10px] text-muted-foreground bg-secondary/60 rounded-md px-2 py-0.5 border border-border/30">
                    {ex}
                  </span>
                ))}
              </div>
              {day.intensity > 20 && (
                <div className="mt-2 h-1 rounded-full bg-secondary/80 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${day.intensity}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                    className={`h-full rounded-full ${
                      day.intensity >= 80 ? "bg-destructive/70" : day.intensity >= 50 ? "bg-energy/70" : "bg-speed/50"
                    }`}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
