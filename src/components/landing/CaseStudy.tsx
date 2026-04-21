import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Zap, Target, Clock, Activity, Quote, Shield, ChevronLeft, ChevronRight, Users, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { caseStudies, type Locale } from "@/data/caseStudies";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const lt = (obj: Partial<Record<Locale, string>> & { en: string }, locale: string) => obj[locale as Locale] || obj.en;

export const CaseStudy = () => {
  const { locale, t } = useLanguage();

  const dailyIndex = useMemo(() => Math.floor(Date.now() / 86400000) % caseStudies.length, []);
  const [index, setIndex] = useState(dailyIndex);
  const [storyOpen, setStoryOpen] = useState(false);
  const story = caseStudies[index];
  const isCoach = story.type === "coach";

  const accent = isCoach ? "primary" : "speed";
  const accentBg = isCoach ? "bg-primary/10" : "bg-speed/10";
  const accentBorder = isCoach ? "border-primary/30" : "border-speed/30";
  const accentText = isCoach ? "text-primary" : "text-speed";
  const accentDot = isCoach ? "bg-primary" : "bg-speed";

  const prev = () => setIndex((i) => (i - 1 + caseStudies.length) % caseStudies.length);
  const next = () => setIndex((i) => (i + 1) % caseStudies.length);

  const typeBadge = isCoach
    ? { en: "Coach Story", da: "Trænerhistorie", sv: "Tränarberättelse", de: "Trainergeschichte", ar: "قصة مدرب", no: "Trenerhistorie" }
    : { en: "Athlete Story", da: "Atlethistorie", sv: "Atletberättelse", de: "Athletengeschichte", ar: "قصة رياضي", no: "Utøverhistorie" };

  const beforeLabel = t("caseBefore");
  const interventionLabel = t("caseIntervention");

  return (
    <section className="max-w-3xl mx-auto px-5 pb-16 sm:pb-20" aria-label="Case study">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 rounded-full border ${accentBorder} ${accentBg} px-3 py-1`}>
            <Target className={`h-3 w-3 ${accentText}`} />
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${accentText}`}>
              {lt(story.badge, locale)}
            </span>
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-3 py-1`}>
            {isCoach ? <Users className="h-3 w-3 text-muted-foreground" /> : <Shield className="h-3 w-3 text-muted-foreground" />}
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {lt(typeBadge, locale)}
            </span>
          </span>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={story.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
        >
          {/* Headline */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground leading-tight">
              {lt(story.headline, locale)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              {lt(story.subheadline, locale)}
            </p>
          </div>

          {/* Profile card */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-8 w-8 rounded-lg ${isCoach ? "bg-primary/15" : "bg-energy/15"} flex items-center justify-center`}>
                {isCoach
                  ? <Users className={`h-4 w-4 ${isCoach ? "text-primary" : "text-energy"}`} />
                  : <Shield className="h-4 w-4 text-energy" />}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{lt(story.name, locale)}</p>
                <p className="text-[11px] text-muted-foreground">{lt(story.info, locale)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {story.profileStats.map((s) => (
                <div key={lt(s.label, locale)} className="rounded-lg bg-secondary/60 border border-border/40 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{lt(s.label, locale)}</p>
                  <p className="text-sm font-bold text-foreground">{lt(s.value, locale)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground/60 italic text-right">
              {lt(story.nameNote, locale)}
            </p>
          </div>

          {/* Metrics — always visible (the conversion driver) */}
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {story.metrics.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl border ${accentBorder.replace("/30", "/20")} bg-card p-4 text-center`}
                >
                  <m.icon className={`h-4 w-4 ${accentText} mx-auto mb-2`} />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    {lt(m.label, locale)}
                  </p>
                  <p className="text-lg font-black text-foreground">{m.after}</p>
                  <p className={`text-[10px] ${accentText} font-bold`}>{m.change}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[9px] text-muted-foreground/50 text-center italic">
              {lt(story.methodNote, locale)}
            </p>
          </div>

          {/* Collapsible: full story details */}
          <Collapsible open={storyOpen} onOpenChange={setStoryOpen}>
            <div className="flex justify-center mb-4">
              <CollapsibleTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                {t("landingReadFullStory")}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${storyOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="data-[state=open]:animate-slide-up space-y-6">
              {/* Problems */}
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-destructive mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {beforeLabel}
                </h3>
                <ul className="space-y-2">
                  {story.problems.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive/60 flex-shrink-0" />
                      {lt(p, locale)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Intervention */}
              <div className={`rounded-xl border ${isCoach ? "border-primary/20 bg-primary/5" : "border-energy/20 bg-energy/5"} p-5 sm:p-6`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isCoach ? "text-primary" : "text-energy"} mb-3 flex items-center gap-1.5`}>
                  <Zap className="h-3.5 w-3.5" /> {interventionLabel}
                </h3>
                <ul className="space-y-2">
                  {story.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isCoach ? "bg-primary/60" : "bg-energy/60"} flex-shrink-0`} />
                      {lt(c, locale)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quote */}
              <div className="rounded-xl border border-border bg-secondary/30 p-5 sm:p-6 relative">
                <Quote className={`h-6 w-6 ${isCoach ? "text-primary/30" : "text-energy/30"} absolute top-4 right-4`} />
                <p className="text-sm text-foreground/90 italic leading-relaxed pr-8">
                  "{lt(story.quote, locale)}"
                </p>
                <p className="mt-3 text-[11px] text-muted-foreground font-semibold">
                  — {lt(story.name, locale)}, {lt(story.info, locale)}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={prev}
          className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="Previous story"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex gap-1.5">
          {caseStudies.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? `w-6 ${accentDot}`
                  : "w-2 bg-border hover:bg-muted-foreground/40"
              }`}
              aria-label={`Story ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="Next story"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </section>
  );
};
