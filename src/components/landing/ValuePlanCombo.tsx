import { motion } from "framer-motion";
import { Calendar, Target, Zap, Shield, Dumbbell, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SamplePlanPreview } from "./SamplePlanPreview";

const VALUE_BULLETS = [
  { icon: Calendar, titleKey: "landingValuePeriodizedTitle" as const, descKey: "landingValuePeriodizedDesc" as const },
  { icon: Target, titleKey: "landingValueSportTitle" as const, descKey: "landingValueSportDesc" as const },
  { icon: Zap, titleKey: "landingValueAITitle" as const, descKey: "landingValueAIDesc" as const },
];

const MINI_DAYS = [
  { dayKey: "landingDayMon" as const, typeKey: "landingTypeTechnical" as const, icon: Shield, intensity: 85, label: "TKD", color: "text-destructive", bar: "bg-destructive/70" },
  { dayKey: "landingDayTue" as const, typeKey: "landingTypeStrength" as const, icon: Dumbbell, intensity: 70, label: "Gym", color: "text-energy", bar: "bg-energy/70" },
  { dayKey: "landingDayWed" as const, typeKey: "landingTypeTechnical" as const, icon: Shield, intensity: 55, label: "TKD", color: "text-energy", bar: "bg-energy/70" },
];

export const ValuePlanCombo = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-3xl mx-auto px-5 pb-14 sm:pb-16" aria-label="Why Sportstalent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: value bullets */}
          <div className="p-6 sm:p-7 border-b md:border-b-0 md:border-r border-border">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-energy/30 bg-energy/10 px-3 py-1 mb-4">
              <Zap className="h-3 w-3 text-energy" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-energy">
                {t("landingValueComboTitle").split(".")[0]}
              </span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-card-foreground leading-tight mb-2">
              {t("landingValueComboTitle")}
            </h2>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              {t("landingValueComboDesc")}
            </p>
            <ul className="space-y-3">
              {VALUE_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-energy/10 border border-energy/20 flex items-center justify-center">
                    <b.icon className="h-4 w-4 text-energy" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-card-foreground leading-tight">{t(b.titleKey)}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{t(b.descKey)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: mini 3-day plan */}
          <div className="p-6 sm:p-7 bg-secondary/30">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-3.5 w-3.5 text-energy" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-energy">
                {t("landingPhaseValue")}
              </span>
              <span className="text-[10px] text-muted-foreground">· {t("landingPhaseWeek")}</span>
            </div>

            <div className="space-y-2.5 mb-4">
              {MINI_DAYS.map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                  className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-sm"
                >
                  <div className={`h-8 w-8 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center flex-shrink-0 ${day.color}`}>
                    <day.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-card-foreground">{t(day.dayKey)}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                          {t(day.typeKey)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold ${day.color} shrink-0`}>
                        {day.intensity >= 80 ? t("landingIntensityHigh") : day.intensity >= 50 ? t("landingIntensityModerate") : t("landingIntensityLow")}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${day.intensity}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                        className={`h-full rounded-full ${day.bar}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-muted-foreground italic">
                + 4 {t("landingDayThu").toLowerCase().slice(0, 3)}/{t("landingDayFri").toLowerCase().slice(0, 3)}/{t("landingDaySat").toLowerCase().slice(0, 3)}/{t("landingDaySun").toLowerCase().slice(0, 3)}
              </span>
              <SamplePlanPreview />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
