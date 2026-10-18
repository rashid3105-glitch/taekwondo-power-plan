import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { WeekPlanPreview } from "@/components/landing/WeekPlanPreview";

const programCards = [
  { icon: Zap, titleKey: "programCompTitle" as const, descKey: "programCompDesc" as const, gradient: "from-speed to-primary" },
  { icon: Target, titleKey: "programSCTitle" as const, descKey: "programSCDesc" as const, gradient: "from-explosive to-energy" },
  { icon: Shield, titleKey: "programPoomsaeTitle" as const, descKey: "programPoomsaeDesc" as const, gradient: "from-tab-mental to-primary" },
];

export default function Programs() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <LandingLayout>
    <div className="theme-public-light">
    <div className="bg-background flex flex-col relative">
      <PageMeta
        title="Training Programs — Sportstalent"
        description="Explore periodized training programs for combat-sport and martial-arts athletes. Competition prep, general S&C, and discipline-specific programs."
        canonical="https://sportstalent.dk/programs"
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-8 sm:pt-20 sm:pb-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.05]"
            >
              {t("programsHeroTitle")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto"
            >
              {t("programsHeroDesc")}
            </motion.p>
          </div>
        </section>

        {/* Gradient transition */}

        <div className="">
          {/* Program cards */}
          <section className="max-w-3xl mx-auto px-5 pb-14">
            <div className="grid gap-5 sm:grid-cols-3">
              {programCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col"
                >
                  <div className={`mb-3 h-10 w-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                    <card.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-sm font-bold text-card-foreground mb-2">{t(card.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{t(card.descKey)}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Sample week preview */}
          <WeekPlanPreview />

          {/* CTA */}
          <section className="max-w-3xl mx-auto px-5 pb-16 text-center">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="px-8 font-bold text-sm shadow-glow relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-energy/20 to-speed/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-1.5">
                {t("getStarted")} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground">{t("ctaSubtext")}</p>
          </section>
        </div>
      </main>
    </div>
    </div>
    </LandingLayout>
  );
}
