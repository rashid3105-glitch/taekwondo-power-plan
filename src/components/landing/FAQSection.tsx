import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const allFaqKeys = ["faq1", "faq2", "faq3", "faq4", "faq5"] as const;
const initialFaqKeys = allFaqKeys.slice(0, 3);

export const FAQSection = () => {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const visibleKeys = showAll ? allFaqKeys : initialFaqKeys;

  return (
    <section className="max-w-2xl mx-auto px-5 pb-16 sm:pb-20" aria-label="FAQ">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 mb-4">
          <HelpCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            FAQ
          </span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground leading-tight">
          {t("faqHeadline")}
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Accordion type="single" collapsible className="space-y-2">
          {visibleKeys.map((key) => (
            <AccordionItem
              key={key}
              value={key}
              className="rounded-xl border border-border bg-card px-4 shadow-sm data-[state=open]:border-energy/30"
            >
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                {t(`${key}Q`)}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {t(`${key}A`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {!showAll && (
          <div className="flex justify-center mt-5">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors shadow-sm"
            >
              {t("landingShowAllFAQ")}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
};
