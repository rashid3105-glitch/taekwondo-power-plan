import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Dumbbell, Shield, Flame, Moon, Calendar, Zap, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/PageMeta";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { CaseStudy } from "@/components/landing/CaseStudy";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FAQSection } from "@/components/landing/FAQSection";
import logo from "@/assets/logo.webp";

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

const benefitKeys = ["landingBenefit1", "landingBenefit2", "landingBenefit3", "landingBenefit4", "landingBenefit5", "landingBenefit6"] as const;
const whoItemKeys = ["landingWhoItem1", "landingWhoItem2", "landingWhoItem3", "landingWhoItem4", "landingWhoItem5"] as const;

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

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Sportstalent" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-sm font-extrabold tracking-tight text-foreground">SPORTSTALENT</span>
        </div>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate("/help")} className="text-xs text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> {t("help")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="text-xs font-semibold">
            {t("signIn")}
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-10 sm:pt-20 sm:pb-14">
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
              className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
            >
               {t("landingHeroDesc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-7 flex flex-col sm:flex-row gap-3"
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
              <Button onClick={() => navigate("/pricing")} size="lg" variant="ghost" className="px-7 font-semibold text-sm text-muted-foreground">
                {t("viewPricing")}
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-3 text-[11px] text-muted-foreground/60"
            >
              {t("ctaSubtext")}
            </motion.p>
          </div>
        </section>

        {/* What is Sportstalent */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-4">
              {t("landingWhatTitle")}
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
              <p>{t("landingWhatP1")}</p>
              <p>{t("landingWhatP2")}</p>
              <p>{t("landingWhatP3")}</p>
            </div>
          </motion.div>
        </section>

        {/* Who is it for */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-4">
              {t("landingWhoTitle")}
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
              <p>{t("landingWhoIntro")}</p>
              <ul className="space-y-2 list-none pl-0">
                {whoItemKeys.map((key, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-energy flex-shrink-0 mt-0.5" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </section>

        {/* What you get */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-4">
              {t("landingWhatYouGetTitle")}
            </h2>
            <div className="grid gap-2.5">
              {benefitKeys.map((key, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="h-7 w-7 rounded-lg bg-energy/10 border border-energy/20 flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="h-3.5 w-3.5 text-energy" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(key)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Weekly Training Plan Example */}
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

          {/* Phase indicator */}
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

          {/* Day cards */}
          <div className="grid gap-2.5">
            {weekPlan.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
                className="rounded-xl border border-border bg-card p-3.5 sm:p-4 flex items-start gap-3"
              >
                <div className={`h-9 w-9 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center flex-shrink-0 ${day.color}`}>
                  <day.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{t(dayKeys[day.dayKey])}</span>
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

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-4">
              {t("landingHowTitle")}
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
              <p>{t("landingHowP1")}</p>
              <p>{t("landingHowP2")}</p>
              <p>{t("landingHowP3")}</p>
            </div>
          </motion.div>
        </section>

        {/* Case Study */}
        <CaseStudy />

        {/* Features */}
        <FeatureGrid />

        {/* FAQ */}
        <FAQSection />

        {/* CTA */}
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
