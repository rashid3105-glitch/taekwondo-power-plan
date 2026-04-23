import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/PageMeta";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { useLanguage } from "@/i18n/LanguageContext";
import { CaseStudy } from "@/components/landing/CaseStudy";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FAQSection } from "@/components/landing/FAQSection";
import { ValuePlanCombo } from "@/components/landing/ValuePlanCombo";
import { PublicNav } from "@/components/PublicNav";
import { WhatsNewInline } from "@/components/landing/WhatsNewInline";
import heroImage from "@/assets/hero-taekwondo-coach.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate("/dashboard");
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta
        title="Strength & Conditioning for Taekwondo Athletes — Periodized Training Plans | Sportstalent"
        description="Periodized strength and conditioning programs built specifically for taekwondo athletes. Sport science-based weekly training plans with TKD-specific exercises for explosive power, speed, and kick performance."
        canonical="https://sportstalent.dk/"
      />
      <Watermark />

      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          {/* Hero background image — bumped opacity for stronger presence */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <img
              src={heroImage}
              alt=""
              width={1920}
              height={1080}
              className="w-full h-full object-cover object-center opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-background/60" />
          </div>
          <div
            className="absolute top-0 inset-x-0 mx-auto w-[700px] h-[450px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-8 sm:pt-20 sm:pb-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 backdrop-blur-sm px-3 py-1 mb-5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-speed animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("landingBadge")}
              </span>
            </motion.div>

            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.05]"
            >
              {t("landingHeroTitle")}{" "}
              <span className="text-gradient-energy">{t("landingHeroHighlight")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              {t("landingHeroDesc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 flex flex-col sm:flex-row gap-3"
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
                {t("methCta")}
              </Button>
            </motion.div>

            {/* Inline social proof chips */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-5 flex flex-wrap items-center gap-2"
            >
              {[
                { icon: Users, text: "landingProofAthletes" as const },
                { icon: TrendingUp, text: "landingProofJump" as const },
                { icon: Award, text: "landingProofLevel" as const },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 backdrop-blur-sm px-2.5 py-1"
                >
                  <item.icon className="h-3 w-3 text-energy" />
                  <span className="text-[11px] font-semibold text-foreground/90">{t(item.text)}</span>
                </div>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-3 text-[11px] text-muted-foreground/60"
            >
              {t("ctaSubtext")}
            </motion.p>

            <WhatsNewInline />
          </div>
        </section>

        {/* Gradient transition: dark → light */}
        <div className="h-24 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

        {/* ── Light content sections ── */}
        <div className="theme-light-section pt-4">
          {/* Combined value props + 3-day plan teaser */}
          <ValuePlanCombo />

          {/* Case Study (compact) */}
          <CaseStudy />

          {/* Features (dense grid) */}
          <FeatureGrid />

          {/* FAQ (top 3) */}
          <FAQSection />
        </div>

        {/* CTA — back to dark */}
        <div className="bg-gradient-to-b from-[hsl(210,20%,97%)] to-background h-16" aria-hidden="true" />
        <section className="max-w-3xl mx-auto px-5 pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-energy/20 bg-energy/5 p-6 sm:p-8 text-center"
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-2">
              {t("landingCtaTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              {t("landingCtaDesc")}
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="px-8 font-bold text-sm shadow-glow relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-energy/20 to-speed/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-1.5">
                {t("landingCtaButton")} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground/60">
              {t("ctaSubtext")}
            </p>
          </motion.div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default Index;
