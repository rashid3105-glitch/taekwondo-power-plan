import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { platformStrings, type PlatformSlug } from "./platformPageStrings";

import coachDashboardImg from "@/assets/screenshots/coach-dashboard.png";
import coachAttendanceImg from "@/assets/screenshots/coach-attendance.png";
import athleteDashboardImg from "@/assets/screenshots/athlete-dashboard.png";
import diaryImg from "@/assets/screenshots/diary.png";
import healthImg from "@/assets/screenshots/health.png";
import seasonImg from "@/assets/screenshots/season-plan.png";
import libraryImg from "@/assets/screenshots/library.png";

type Slug = PlatformSlug;

const META: Record<Slug, { audience: "coach" | "athlete"; image: string }> = {
  "coach-dashboard": { audience: "coach", image: coachDashboardImg },
  "plan-builder": { audience: "coach", image: seasonImg },
  "squad-reports": { audience: "coach", image: coachAttendanceImg },
  roster: { audience: "coach", image: coachDashboardImg },
  diary: { audience: "athlete", image: diaryImg },
  readiness: { audience: "athlete", image: healthImg },
  progress: { audience: "athlete", image: athleteDashboardImg },
  library: { audience: "athlete", image: libraryImg },
};

const ORDER: Slug[] = [
  "coach-dashboard",
  "plan-builder",
  "squad-reports",
  "roster",
  "diary",
  "readiness",
  "progress",
  "library",
];

export default function PlatformPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { locale } = useLanguage();

  const meta =
    slug && (META as Record<string, { audience: "coach" | "athlete"; image: string }>)[slug];
  const localeBundle = platformStrings[locale] ?? platformStrings.en;
  const data = slug ? localeBundle.content[slug as Slug] : undefined;
  const ui = localeBundle.ui;
  if (!meta || !data) return <Navigate to="/" replace />;

  const idx = ORDER.indexOf(slug as Slug);
  const next = ORDER[(idx + 1) % ORDER.length];
  const audienceColor = meta.audience === "coach" ? "#E63946" : "#0EA5E9";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageMeta
        title={`${data.title} — Sportstalent`}
        description={data.metaDesc}
        canonical={`https://sportstalent.dk/platform/${slug}`}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {ui.back}
          </Link>
          <Link to="/auth?tab=signup">
            <Button size="sm" className="font-semibold">{ui.getStarted}</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:pt-16 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${audienceColor}1A`, color: audienceColor }}
            >
              {meta.audience === "coach" ? ui.forCoaches : ui.forAthletes}
            </span>
            <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              {data.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {data.intro}
            </p>
          </motion.div>
        </section>

        {/* Real screenshot */}
        <section className="mx-auto max-w-6xl px-5 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            style={{ boxShadow: `0 30px 80px -20px ${audienceColor}33` }}
          >
            <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/40 border-b border-border">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-[11px] text-muted-foreground font-mono">
                sportstalent.dk
              </span>
            </div>
            <img
              src={meta.image}
              alt={data.imageAlt}
              className="w-full h-auto block"
              loading="lazy"
            />
          </motion.div>
          <p className="mt-3 text-center text-xs text-muted-foreground italic">
            {ui.screenshotCaption}
          </p>
        </section>

        {/* Bullets */}
        <section className="mx-auto max-w-3xl px-5 pb-16">
          <ul className="grid sm:grid-cols-2 gap-3">
            {data.bullets.map((b, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-4"
              >
                <Check
                  className="h-4 w-4 shrink-0 mt-0.5"
                  style={{ color: audienceColor }}
                />
                <span className="text-sm text-foreground">{b}</span>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* CTA + next */}
        <section className="mx-auto max-w-3xl px-5 pb-20 text-center">
          <Button
            onClick={() => navigate("/auth?tab=signup")}
            size="lg"
            className="px-8 font-bold"
            style={{ background: audienceColor, color: "#fff" }}
          >
            {t("getStarted") || "Start free"} <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            14-day trial · no credit card required
          </p>

          <div className="mt-12 flex items-center justify-center">
            <Link
              to={`/platform/${next}`}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              Next: {CONTENT[next].title} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
