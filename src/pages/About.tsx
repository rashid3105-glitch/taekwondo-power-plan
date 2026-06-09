import { motion } from "framer-motion";
import { Target, Users, Heart } from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta
        title="About Sportstalent — Mission & Team"
        description="Learn about Sportstalent's mission to bring sport science-based training to every taekwondo athlete."
        canonical="https://sportstalent.dk/about"
      />
      <Watermark />
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute top-0 inset-x-0 mx-auto w-[700px] h-[400px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-8 sm:pt-20 sm:pb-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.05]"
            >
              {t("aboutHeroTitle")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto"
            >
              {t("aboutHeroDesc")}
            </motion.p>
          </div>
        </section>

        {/* Gradient transition */}
        <div className="h-20 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

        <div className="theme-light-section">
          {/* Mission & Vision */}
          <section id="mission" className="max-w-3xl mx-auto px-5 pb-14">
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { icon: Target, titleKey: "aboutMissionTitle" as const, descKey: "aboutMissionDesc" as const },
                { icon: Heart, titleKey: "aboutVisionTitle" as const, descKey: "aboutVisionDesc" as const },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="mb-3 h-10 w-10 rounded-lg bg-energy/10 border border-energy/20 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-energy" />
                  </div>
                  <h2 className="text-base font-bold text-card-foreground mb-2">{t(item.titleKey)}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Team */}
          <section id="team" className="max-w-3xl mx-auto px-5 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 h-10 w-10 rounded-lg bg-energy/10 border border-energy/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-energy" />
              </div>
              <h2 className="text-base font-bold text-card-foreground mb-2">{t("aboutTeamTitle")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("aboutTeamDesc")}</p>
            </motion.div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
