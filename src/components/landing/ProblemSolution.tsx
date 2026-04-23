import { motion } from "framer-motion";
import { Target, AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

type Card = {
  icon: LucideIcon;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  iconClass: string;
  ringClass: string;
};

const CARDS: Card[] = [
  {
    icon: Target,
    titleKey: "psWhoTitle",
    bodyKey: "psWhoBody",
    iconClass: "text-tab-plan",
    ringClass: "bg-tab-plan/10 ring-1 ring-tab-plan/20",
  },
  {
    icon: AlertCircle,
    titleKey: "psProblemTitle",
    bodyKey: "psProblemBody",
    iconClass: "text-tab-rehab",
    ringClass: "bg-tab-rehab/10 ring-1 ring-tab-rehab/20",
  },
  {
    icon: CheckCircle2,
    titleKey: "psSolutionTitle",
    bodyKey: "psSolutionBody",
    iconClass: "text-tab-nutrition",
    ringClass: "bg-tab-nutrition/10 ring-1 ring-tab-nutrition/20",
  },
];

export function ProblemSolution() {
  const { t } = useLanguage();

  return (
    <section className="max-w-5xl mx-auto px-5 py-10 sm:py-14" aria-labelledby="ps-heading">
      <motion.p
        id="ps-heading"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="text-center text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-8"
      >
        {t("psSectionLead")}
      </motion.p>

      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.titleKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-4 ${card.ringClass}`}>
                <Icon className={`h-5 w-5 ${card.iconClass}`} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 tracking-tight">
                {t(card.titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(card.bodyKey)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
