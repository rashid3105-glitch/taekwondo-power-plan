import { motion } from "framer-motion";
import { UserPlus, Sparkles, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const steps = [
  { icon: UserPlus, titleKey: "howItWorksStep1Title", descKey: "howItWorksStep1Desc", color: "text-energy" },
  { icon: Sparkles, titleKey: "howItWorksStep2Title", descKey: "howItWorksStep2Desc", color: "text-power" },
  { icon: TrendingUp, titleKey: "howItWorksStep3Title", descKey: "howItWorksStep3Desc", color: "text-speed" },
] as const;

export const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-2xl mx-auto px-5 pb-12 sm:pb-16" aria-label="How it works">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="text-lg font-extrabold text-foreground text-center mb-8 tracking-tight"
      >
        {t("howItWorksTitle" as any)}
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.titleKey}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative text-center"
          >
            {/* Step number */}
            <div className="flex items-center justify-center mb-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-secondary/80 border border-border/40 flex items-center justify-center">
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                </div>
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
            </div>

            {/* Connector line (desktop) */}
            {i < 2 && (
              <div className="hidden sm:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-border/60" />
            )}

            <h3 className="text-[13px] font-bold text-foreground mb-1">{t(step.titleKey as any)}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto">{t(step.descKey as any)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
