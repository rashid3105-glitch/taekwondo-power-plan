import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl mx-auto text-center px-5 pt-14 pb-10 sm:pt-20 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 backdrop-blur-sm px-3 py-1 mb-5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-speed animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {t("aiGenerated")} · {t("tkdSpecific")}
          </span>
        </motion.div>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-[1.05]"
        >
          {t("heroTitle")}{" "}
          <span className="text-gradient-energy">{t("heroHighlight")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-4 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed"
        >
          {t("heroDescription")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-7 flex flex-col sm:flex-row justify-center gap-3"
        >
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="px-7 font-bold text-sm shadow-glow relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-energy/20 to-speed/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-1.5">
              {t("getStarted")} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Button>
          <Button onClick={() => navigate("/methodology")} size="lg" variant="outline" className="px-7 font-semibold text-sm border-border/60">
            {t("methCta" as any)}
          </Button>
          <Button onClick={() => navigate("/pricing")} size="lg" variant="ghost" className="px-7 font-semibold text-sm text-muted-foreground">
            {t("viewPricing" as any)}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-3 text-[11px] text-muted-foreground/60"
        >
          {t("ctaSubtext" as any)}
        </motion.p>
      </div>
    </section>
  );
};
