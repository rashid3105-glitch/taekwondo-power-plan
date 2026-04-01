import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, Target, Clock, Activity, Quote, Timer } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const metrics = [
  { label: "caseMetricJump", before: "38 cm", after: "42 cm", change: "+10.5%", icon: TrendingUp, positive: true },
  { label: "caseMetricFatigue", before: "7/10", after: "3/10", change: "−57%", icon: TrendingDown, positive: true },
  { label: "caseMetricPain", before: "6/10", after: "1/10", change: "−83%", icon: Activity, positive: true },
  { label: "caseMetricKick", before: "Baseline", after: "−14%", change: "−14% faster", icon: Timer, positive: true },
];

export const CaseStudy = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-3xl mx-auto px-5 pb-16 sm:pb-20" aria-label="Case study">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-speed/30 bg-speed/10 px-3 py-1 mb-4">
          <Target className="h-3 w-3 text-speed" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-speed">
            {t("caseStudyBadge" as any)}
          </span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground leading-tight">
          {t("caseHeadline" as any)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          {t("caseSubheadline" as any)}
        </p>
      </motion.div>

      {/* Athlete profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-energy/15 flex items-center justify-center">
            <Shield className="h-4 w-4 text-energy" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{t("caseAthleteName" as any)}</p>
            <p className="text-[11px] text-muted-foreground">{t("caseAthleteInfo" as any)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: t("caseProfileAge" as any), value: "19" },
            { label: t("caseProfileLevel" as any), value: t("caseProfileLevelVal" as any) },
            { label: t("caseProfileFreq" as any), value: t("caseProfileFreqVal" as any) },
            { label: t("caseProfileWeeks" as any), value: "7" },
            { label: t("caseProfilePrevSC" as any), value: t("caseProfilePrevSCVal" as any) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-secondary/60 border border-border/40 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{item.label}</p>
              <p className="text-sm font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground/60 italic text-right">
          {t("caseNameNote" as any)}
        </p>
      </motion.div>

      {/* Problems before */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6 mb-6"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-destructive mb-3 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {t("caseBefore" as any)}
        </h3>
        <ul className="space-y-2">
          {["caseProblem1", "caseProblem2", "caseProblem3", "caseProblem4"].map((key) => (
            <li key={key} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive/60 flex-shrink-0" />
              {t(key as any)}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Intervention */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-energy/20 bg-energy/5 p-5 sm:p-6 mb-6"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-energy mb-3 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" /> {t("caseIntervention" as any)}
        </h3>
        <ul className="space-y-2">
          {["caseChange1", "caseChange2", "caseChange3", "caseChange4"].map((key) => (
            <li key={key} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-energy/60 flex-shrink-0" />
              {t(key as any)}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Results metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mb-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="rounded-xl border border-speed/20 bg-card p-4 text-center"
            >
              <m.icon className="h-4 w-4 text-speed mx-auto mb-2" />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                {t(m.label as any)}
              </p>
              <p className="text-lg font-black text-foreground">{m.after}</p>
              <p className="text-[10px] text-speed font-bold">{m.change}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-2 text-[9px] text-muted-foreground/50 text-center italic">
          {t("caseMethodNote" as any)}
        </p>
      </motion.div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="rounded-xl border border-border bg-secondary/30 p-5 sm:p-6 relative"
      >
        <Quote className="h-6 w-6 text-energy/30 absolute top-4 right-4" />
        <p className="text-sm text-foreground/90 italic leading-relaxed pr-8">
          "{t("caseQuote" as any)}"
        </p>
        <p className="mt-3 text-[11px] text-muted-foreground font-semibold">
          — {t("caseAthleteName" as any)}, {t("caseAthleteInfo" as any)}
        </p>
      </motion.div>
    </section>
  );
};
