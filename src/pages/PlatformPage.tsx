import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

import coachDashboardImg from "@/assets/screenshots/coach-dashboard.png";
import coachAttendanceImg from "@/assets/screenshots/coach-attendance.png";
import athleteDashboardImg from "@/assets/screenshots/athlete-dashboard.png";
import diaryImg from "@/assets/screenshots/diary.png";
import healthImg from "@/assets/screenshots/health.png";
import competitionsImg from "@/assets/screenshots/competitions.png";
import seasonImg from "@/assets/screenshots/season-plan.png";
import libraryImg from "@/assets/screenshots/library.png";

type Slug =
  | "coach-dashboard"
  | "plan-builder"
  | "squad-reports"
  | "roster"
  | "diary"
  | "readiness"
  | "progress"
  | "library";

type Content = {
  audience: "coach" | "athlete";
  title: string;
  intro: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  metaDesc: string;
};

const CONTENT: Record<Slug, Content> = {
  "coach-dashboard": {
    audience: "coach",
    title: "Coach Dashboard",
    intro:
      "One screen for your entire club. See every athlete's status — readiness, plan adherence, last activity — at a glance, ranked by who needs you most today.",
    bullets: [
      "Squad pulse: needs attention, injured, no active plan, inactive 7d+",
      "Search and filter by belt, name, or club role",
      "Quick actions: view profile, edit plan, message — without leaving the list",
      "Bulk competition assignment and weekly PDF export",
    ],
    image: coachDashboardImg,
    imageAlt: "Coach dashboard with squad pulse and athlete roster",
    metaDesc:
      "See your whole taekwondo club from one screen. Squad pulse, readiness flags, plan status — all in real time.",
  },
  "plan-builder": {
    audience: "coach",
    title: "Plan Builder",
    intro:
      "Build a periodized season around the competitions that matter. Sportstalent automatically structures General Prep → Specific Prep → Peak → Deload around every A-priority event.",
    bullets: [
      "Season planner with auto-periodization",
      "4–12 week training blocks tailored to belt level and age",
      "Drag-and-drop weekly editing across TKD, gym, rest days",
      "Peaks and tapers calculated from competition dates and weight goals",
    ],
    image: seasonImg,
    imageAlt: "Season planner with auto-periodization around competitions",
    metaDesc:
      "Build periodized taekwondo plans in minutes. Auto-tapers around competitions, drag-and-drop weekly edits.",
  },
  "squad-reports": {
    audience: "coach",
    title: "Squad Reports",
    intro:
      "Know who's on the mat today before you walk in. Daily attendance, weekly load summaries, and a one-click PDF that's ready for parents, assistant coaches, or federation reviews.",
    bullets: [
      "Today's training: planned session per athlete, mark present/absent",
      "Weekly PDF export for the whole squad",
      "Auto-flag overload, undertrain, and missed readiness check-ins",
      "Athlete-by-athlete summaries with notes you can share",
    ],
    image: coachAttendanceImg,
    imageAlt: "Today's training attendance view for a coach's squad",
    metaDesc:
      "Daily attendance, weekly squad PDFs, load flags — share with parents, federations, or your assistant coaches.",
  },
  roster: {
    audience: "coach",
    title: "Roster Management",
    intro:
      "Add athletes in seconds, group them by club, and keep belts, weight categories, and contact details in one place. Invite via link or create accounts directly.",
    bullets: [
      "Invite athletes by link or email — no friction",
      "Belt, weight class, and birth date tracked per athlete",
      "Assistant coach roles with managed vs view-only athletes",
      "Pending requests reviewed in one click",
    ],
    image: coachDashboardImg,
    imageAlt: "Roster list with belts, clubs, and quick actions",
    metaDesc:
      "Roster management for taekwondo clubs: invite, group by club, manage belts and weight classes.",
  },
  diary: {
    audience: "athlete",
    title: "Daily Diary",
    intro:
      "A 60-second log after every session. Athletes write what worked, what didn't, and how it felt — coach can read and respond directly inside the app.",
    bullets: [
      "Filter by training, mental, general, or hashtag",
      "Coach comments appear inline (read-only for the athlete)",
      "Works offline — entries sync when you're back online",
      "Searchable history across months and seasons",
    ],
    image: diaryImg,
    imageAlt: "Athlete diary with category filters and tag chips",
    metaDesc:
      "Athlete training diary with offline support, coach comments, and tag-based filtering.",
  },
  readiness: {
    audience: "athlete",
    title: "Readiness Check",
    intro:
      "A daily pulse on how the athlete is recovering. Sleep, resting HR, HRV, and steps — entered manually or pulled automatically from Apple Health / Health Connect.",
    bullets: [
      "Auto-syncs from iPhone HealthBridge or Android Health Connect",
      "7-day rolling baselines flag low recovery before injury",
      "Coach sees a recovery sparkline directly in the squad view",
      "Manual entry for athletes without a wearable",
    ],
    image: healthImg,
    imageAlt: "Daily readiness check with sleep, HR, HRV inputs",
    metaDesc:
      "Daily readiness check with sleep, HRV, RHR — auto-synced from Apple Health and Health Connect.",
  },
  progress: {
    audience: "athlete",
    title: "Progress Tracking",
    intro:
      "Belt to belt, season to season. Visualise training volume, recovery trends, mental scores, and competition results in one continuous view.",
    bullets: [
      "Today's hub: next event, next session, recovery, readiness",
      "Personalised quote and pinned modules in one place",
      "Form curve, weekly load, and physical test history",
      "Post-competition reflections with SMART goal tracking",
    ],
    image: athleteDashboardImg,
    imageAlt: "Athlete dashboard with today's training, recovery, and next event",
    metaDesc:
      "Track progress over time: load, recovery, mental scores, competition reflections — for taekwondo athletes.",
  },
  library: {
    audience: "athlete",
    title: "Performance Library",
    intro:
      "100+ taekwondo-specific exercises, mental training drills, recipes, physical tests, and HIIT sessions — built by coaches, organised so athletes actually use them.",
    bullets: [
      "TKD exercises with cues and short demo videos",
      "Mental training: focus, visualisation, mental toughness drills",
      "Athlete-friendly recipes and physical test protocols",
      "Live HIIT sessions you can run in the gym",
    ],
    image: libraryImg,
    imageAlt: "Performance library: exercises, mental training, nutrition, tests, HIIT",
    metaDesc:
      "Taekwondo performance library: exercises, mental training, nutrition, physical tests, HIIT.",
  },
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
  const { t } = useLanguage();

  const data = slug && (CONTENT as Record<string, Content>)[slug];
  if (!data) return <Navigate to="/" replace />;

  const idx = ORDER.indexOf(slug as Slug);
  const next = ORDER[(idx + 1) % ORDER.length];
  const audienceColor = data.audience === "coach" ? "#E63946" : "#0EA5E9";

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
            <ArrowLeft className="h-4 w-4" /> {t("back") || "Back"}
          </Link>
          <Link to="/auth?tab=signup">
            <Button size="sm" className="font-semibold">{t("getStarted") || "Get started"}</Button>
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
              {data.audience === "coach" ? "For Coaches" : "For Athletes"}
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
              src={data.image}
              alt={data.imageAlt}
              className="w-full h-auto block"
              loading="lazy"
            />
          </motion.div>
          <p className="mt-3 text-center text-xs text-muted-foreground italic">
            Real screenshot from inside Sportstalent.
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
