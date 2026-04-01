import { motion } from "framer-motion";
import { Dumbbell, Shield, Flame, Moon, Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SamplePlanPreview } from "./SamplePlanPreview";

const days = [
  { dayKey: "weekMon", typeKey: "weekTypeTKD", icon: Shield, exercises: ["weekExMon"], intensityKey: "weekIntHigh", intensity: 85, color: "text-destructive" },
  { dayKey: "weekTue", typeKey: "weekTypeStrength", icon: Dumbbell, exercises: ["weekExTue1", "weekExTue2", "weekExTue3"], intensityKey: "weekIntMod", intensity: 60, color: "text-energy" },
  { dayKey: "weekWed", typeKey: "weekTypeTKD", icon: Shield, exercises: ["weekExWed"], intensityKey: "weekIntMod", intensity: 55, color: "text-energy" },
  { dayKey: "weekThu", typeKey: "weekTypeStrength", icon: Dumbbell, exercises: ["weekExThu1", "weekExThu2", "weekExThu3"], intensityKey: "weekIntMod", intensity: 60, color: "text-energy" },
  { dayKey: "weekFri", typeKey: "weekTypeTKD", icon: Shield, exercises: ["weekExFri"], intensityKey: "weekIntHigh", intensity: 85, color: "text-destructive" },
  { dayKey: "weekSat", typeKey: "weekTypePower", icon: Flame, exercises: ["weekExSat1", "weekExSat2", "weekExSat3"], intensityKey: "weekIntHigh", intensity: 80, color: "text-speed" },
  { dayKey: "weekSun", typeKey: "weekTypeRest", icon: Moon, exercises: ["weekExSun"], intensityKey: "weekIntRest", intensity: 0, color: "text-muted-foreground" },
];

export const SampleWeekPlan = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-3xl mx-auto px-5 pb-16 sm:pb-20" aria-label="Sample week">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-energy/30 bg-energy/10 px-3 py-1 mb-4">
          <Calendar className="h-3 w-3 text-energy" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-energy">
            {t("weekBadge" as any)}
          </span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground leading-tight">
          {t("weekHeadline" as any)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          {t("weekSubheadline" as any)}
        </p>
      </motion.div>

      {/* Phase indicator */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center justify-center gap-2 mb-6"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("weekPhaseLabel" as any)}
        </span>
        <span className="rounded-full bg-energy/15 border border-energy/30 px-2.5 py-0.5 text-[11px] font-bold text-energy">
          {t("weekPhaseValue" as any)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          · {t("weekPhaseWeek" as any)}
        </span>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex justify-center mb-5"
      >
        <SamplePlanPreview />
      </motion.div>

      {/* Day cards */}
      <div className="grid gap-2.5">
        {days.map((day, i) => (
          <motion.div
            key={day.dayKey}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.12 + i * 0.05 }}
            className="rounded-xl border border-border bg-card p-3.5 sm:p-4 flex items-start gap-3"
          >
            {/* Day icon */}
            <div className={`h-9 w-9 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center flex-shrink-0 ${day.color}`}>
              <day.icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{t(day.dayKey as any)}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t(day.typeKey as any)}
                  </span>
                </div>
                {day.intensity > 0 && (
                  <span className={`text-[10px] font-bold ${day.color}`}>
                    {t(day.intensityKey as any)}
                  </span>
                )}
              </div>

              {/* Exercises */}
              <div className="flex flex-wrap gap-1.5">
                {day.exercises.map((exKey) => (
                  <span
                    key={exKey}
                    className="text-[10px] text-muted-foreground bg-secondary/60 rounded-md px-2 py-0.5 border border-border/30"
                  >
                    {t(exKey as any)}
                  </span>
                ))}
              </div>

              {/* Intensity bar */}
              {day.intensity > 0 && (
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
