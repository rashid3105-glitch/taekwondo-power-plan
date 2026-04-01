import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Shield,
  Zap,
  Moon,
  Target,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/PageMeta";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.webp";
import { SampleProgramDialog } from "@/components/SampleProgramDialog";

const fade = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" as const }, transition: { duration: 0.5 } };

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5">
    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </li>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-4">{children}</h2>
);

const weekExample = [
  { day: "Monday", label: "Lower body strength + mobility", icon: Dumbbell, color: "text-primary" },
  { day: "Tuesday", label: "Taekwondo training", icon: Shield, color: "text-accent" },
  { day: "Wednesday", label: "Explosive power + core", icon: Zap, color: "text-destructive" },
  { day: "Thursday", label: "Taekwondo training", icon: Shield, color: "text-accent" },
  { day: "Friday", label: "Upper body + injury prevention", icon: Target, color: "text-primary" },
  { day: "Saturday", label: "Sparring / technical", icon: Shield, color: "text-accent" },
  { day: "Sunday", label: "Recovery", icon: Moon, color: "text-muted-foreground" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sportstalent",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Get a structured strength and conditioning program tailored to your taekwondo training. Improve performance, reduce injuries, and train smarter with Sportstalent.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "24", bestRating: "5" },
};

const SeoLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta
        title="Smart Training Program for Taekwondo Athletes | Sportstalent"
        description="Get a structured strength and conditioning program tailored to your taekwondo training. Improve performance, reduce injuries, and train smarter with Sportstalent."
      />
      <Watermark />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Sportstalent" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-sm font-extrabold tracking-tight text-foreground">SPORTSTALENT</span>
        </div>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="text-xs font-semibold">
            Sign in
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* ───── HERO ───── */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-10 sm:pt-20 sm:pb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 backdrop-blur-sm px-3 py-1 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Strength &amp; Conditioning for Combat Sports
              </span>
            </motion.div>

            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.05]"
            >
              Smart training programs for{" "}
              <span className="text-gradient-energy">taekwondo athletes</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
            >
              Get a structured strength and conditioning plan tailored to your level, training schedule, and injuries — in under 60&nbsp;seconds.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-5 space-y-2 text-sm text-muted-foreground"
            >
              <Bullet>Built specifically for combat sports</Bullet>
              <Bullet>Adapts to your weekly training load</Bullet>
              <Bullet>Designed to improve performance and reduce injury risk</Bullet>
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-7 flex flex-col sm:flex-row gap-3"
            >
              <Button onClick={() => navigate("/auth")} size="lg"
                className="px-7 font-bold text-sm shadow-glow relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-1.5">
                  Get your training plan <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Button>
              <Button onClick={() => {
                document.getElementById("example-section")?.scrollIntoView({ behavior: "smooth" });
              }} size="lg" variant="outline" className="px-7 font-semibold text-sm border-border/60">
                See example program
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ───── SECTION 1: Strength & conditioning for taekwondo ───── */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div {...fade}>
            <SectionHeading>Strength and conditioning for taekwondo</SectionHeading>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

              {/* Sub-topic 1: Why general strength training doesn't work */}
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Why general strength training doesn't work
                </p>
                <p>
                  Most gym programs are built for bodybuilding or general fitness — slow, bilateral movements with high volume and long rest periods. For a taekwondo athlete, this creates problems:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span><strong>Too much muscle fatigue</strong> before technical training — heavy squats on Monday means poor kicks on Tuesday</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span><strong>Wrong movement patterns</strong> — bench press and bicep curls don't develop rotational power or hip speed</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span><strong>No periodization</strong> — generic programs don't account for competition cycles, sparring load, or recovery needs</span>
                  </li>
                </ul>
                <p>
                  The result? Athletes get sore, not better. Strength work competes with sport training instead of supporting it.
                </p>
              </div>

              {/* Sub-topic 2: What is specific to taekwondo */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  What makes taekwondo different
                </p>
                <p>
                  Taekwondo demands a very specific physical profile. It's not about max strength — it's about <strong>rate of force development</strong>, reactive agility, and the ability to repeat explosive efforts over 3×2-minute rounds.
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Unilateral power</strong> — every kick is a single-leg movement requiring hip extension, rotation, and balance simultaneously</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Elastic energy and fast-twitch dominance</strong> — roundhouse kicks rely on stretch-shortening cycles, not slow grinding force</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>High injury exposure</strong> — ankles, knees, and hips absorb massive impact; prehab must be built into every session</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Recovery constraints</strong> — athletes train 5–6× per week; strength work must enhance, not drain</span>
                  </li>
                </ul>
              </div>

              {/* Sub-topic 3: How Sportstalent is different */}
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground flex items-center gap-2">
                  <Target className="h-3.5 w-3.5" />
                  How Sportstalent solves this
                </p>
                <p>
                  Sportstalent doesn't give you a generic program and call it "sport-specific." Every plan is generated based on combat sport science and your actual training week:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Sessions are placed around your taekwondo schedule</strong> — not on top of it. Heavy loads never fall before technical or sparring days</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Exercises target fight-relevant qualities</strong> — single-leg power, rotational stability, hip mobility, and reactive strength</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Injury history shapes the plan</strong> — if you have a knee issue, your program adjusts loading, adds prehab, and avoids aggravating patterns</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Built-in periodization</strong> — volume and intensity progress across weeks to peak for competition, not burn you out</span>
                  </li>
                </ul>
                <p className="text-sm font-semibold text-foreground">
                  You get a program that fits <strong>around</strong> your taekwondo — not against it.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ───── SECTION 2: What you get ───── */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div {...fade}>
            <SectionHeading>What your training plan includes</SectionHeading>
            <p className="text-sm text-muted-foreground mb-5">
              Each program is built to support performance in combat sports. Your plan includes:
            </p>
            <div className="grid gap-2.5">
              {[
                "Weekly structure aligned with your training schedule",
                "Strength and power sessions for explosive kicking",
                "Mobility and injury prevention work",
                "Load management to avoid overtraining",
                "Progression over multiple weeks",
              ].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-5 text-sm font-semibold text-foreground">
              No guessing. No generic fitness plans. Just structured progression.
            </p>
          </motion.div>
        </section>

        {/* ───── SECTION 3: Who it is for ───── */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div {...fade}>
            <SectionHeading>Built for taekwondo athletes who want to improve</SectionHeading>
            <p className="text-sm text-muted-foreground mb-4">Sportstalent is designed for:</p>
            <ul className="space-y-2.5 text-sm text-muted-foreground list-none pl-0">
              <Bullet>Competitive taekwondo athletes</Bullet>
              <Bullet>Fighters training 4–6 times per week</Bullet>
              <Bullet>Athletes who want to improve explosiveness and endurance</Bullet>
              <Bullet>Anyone dealing with recurring injuries or fatigue</Bullet>
            </ul>
            <p className="mt-5 text-sm font-semibold text-foreground">
              If you are serious about improving performance, structure matters.
            </p>
          </motion.div>
        </section>

        {/* ───── SECTION 4: How it works ───── */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div {...fade}>
            <SectionHeading>How it works</SectionHeading>
            <div className="grid gap-3">
              {[
                { step: "1", text: "Enter your level and weekly training schedule" },
                { step: "2", text: "Add injuries or limitations" },
                { step: "3", text: "Get a complete weekly training plan" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-primary">{item.step}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Your program is generated instantly and built to fit your actual training load.
            </p>
          </motion.div>
        </section>

        {/* ───── SECTION 5: Example week ───── */}
        <section id="example-section" className="max-w-3xl mx-auto px-5 pb-14" aria-label="Example weekly training structure">
          <motion.div {...fade} className="mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-4">
              <Calendar className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Sample week</span>
            </span>
            <SectionHeading>Example weekly training structure</SectionHeading>
          </motion.div>

          <div className="grid gap-2.5">
            {weekExample.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
                className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3"
              >
                <div className={`h-9 w-9 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center flex-shrink-0 ${d.color}`}>
                  <d.icon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground w-24">{d.day}</span>
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground italic">
            This is not random — it is structured to support performance and recovery.
          </p>
          <SampleProgramDialog />
        </section>

        {/* ───── SECTION 6: Problem vs solution ───── */}
        <section className="max-w-3xl mx-auto px-5 pb-14">
          <motion.div {...fade}>
            <SectionHeading>Why most athletes don't improve as fast as they could</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Without structure */}
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-destructive">Without structure</p>
                <ul className="space-y-2 text-sm text-muted-foreground list-none pl-0">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span>Training becomes inconsistent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span>Fatigue builds up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span>Injuries increase</span>
                  </li>
                </ul>
              </div>
              {/* With structure */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">With structure</p>
                <ul className="space-y-2 text-sm text-muted-foreground list-none pl-0">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Training load is balanced</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Performance improves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Recovery is built in</span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-foreground">
              Sportstalent gives you that structure.
            </p>
          </motion.div>
        </section>

        {/* ───── SECTION 7: Final CTA ───── */}
        <section className="max-w-3xl mx-auto px-5 pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center"
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-2">
              Start training with structure
            </h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Stop guessing your training. Get a plan that is built for your sport and your schedule.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="px-8 font-bold text-sm shadow-glow relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-1.5">
                Build your training plan <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
          </motion.div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default SeoLanding;
