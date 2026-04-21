import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardList, BarChart3, Brain, HeartPulse, BookOpen, UtensilsCrossed, Activity, Trophy,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const sections = [
  {
    icon: ClipboardList,
    titleKey: "sectionPlanTitle" as const,
    descKey: "sectionPlanDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(210 90% 56% / 0.12), transparent 70%)",
    iconColor: "text-tab-plan",
    slug: "plan",
  },
  {
    icon: BarChart3,
    titleKey: "sectionProgressTitle" as const,
    descKey: "sectionProgressDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(45 90% 55% / 0.12), transparent 70%)",
    iconColor: "text-tab-progress",
    slug: "progress",
  },
  {
    icon: Brain,
    titleKey: "sectionMentalTitle" as const,
    descKey: "sectionMentalDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(330 60% 72% / 0.12), transparent 70%)",
    iconColor: "text-tab-mental",
    slug: "mental",
  },
  {
    icon: HeartPulse,
    titleKey: "sectionRehabTitle" as const,
    descKey: "sectionRehabDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(0 72% 51% / 0.12), transparent 70%)",
    iconColor: "text-tab-rehab",
    slug: "rehab",
  },
  {
    icon: UtensilsCrossed,
    titleKey: "sectionNutritionTitle" as const,
    descKey: "sectionNutritionDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(25 90% 55% / 0.12), transparent 70%)",
    iconColor: "text-orange-400",
    slug: "nutrition",
  },
  {
    icon: Activity,
    titleKey: "sectionTestingTitle" as const,
    descKey: "sectionTestingDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(190 85% 50% / 0.12), transparent 70%)",
    iconColor: "text-cyan-400",
    slug: "testing",
  },
  {
    icon: Trophy,
    titleKey: "sectionCompetitionsTitle" as const,
    descKey: "sectionCompetitionsDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(45 90% 55% / 0.12), transparent 70%)",
    iconColor: "text-primary",
    slug: "competitions",
  },
  {
    icon: BookOpen,
    titleKey: "sectionLibraryTitle" as const,
    descKey: "sectionLibraryDesc" as const,
    gradient: "radial-gradient(circle at 30% 50%, hsl(142 70% 45% / 0.12), transparent 70%)",
    iconColor: "text-tab-nutrition",
    slug: "library",
  },
];

export const FeatureGrid = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="max-w-3xl mx-auto px-5 pb-14 sm:pb-20" aria-label="Features">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {sections.map((s, i) => (
          <motion.button
            key={s.titleKey}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/features/${s.slug}`)}
            className="group relative rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 text-left cursor-pointer overflow-hidden"
          >
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: s.gradient, filter: "blur(40px)", zIndex: -1 }}
            />
            <div className="flex flex-col gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/80 border border-border/40 group-hover:border-primary/30 transition-colors">
                <s.icon className={`h-5 w-5 ${s.iconColor} transition-transform duration-300 group-hover:scale-110`} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight leading-tight">
                {t(s.titleKey)}
              </h3>
              {/* Description: shown on mobile/tablet always, hover-revealed on lg+ */}
              <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2 lg:line-clamp-none lg:max-h-0 lg:opacity-0 lg:group-hover:max-h-20 lg:group-hover:opacity-100 lg:transition-all lg:duration-300">
                {t(s.descKey)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};
