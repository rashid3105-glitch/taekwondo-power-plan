import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight, Check } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { COACH_LANDING_STRINGS } from "./coachLandingStrings";

const useCL = () => {
  const { locale } = useLanguage();
  return COACH_LANDING_STRINGS[locale] ?? COACH_LANDING_STRINGS.en;
};

/* ───────────────── Tokens ─────────────────
   Scoped via inline arbitrary values so global theme isn't touched.
   bg #0A0A0C · red #E8002D · gold #C9A84C · text #F0EDE8 · muted #5A5860 · deep red #8B0019
*/
const C = {
  bg: "#0A0A0C",
  bg2: "#111114",
  bg3: "#17171B",
  red: "#E8002D",
  redDeep: "#8B0019",
  gold: "#C9A84C",
  text: "#F0EDE8",
  muted: "#5A5860",
  border: "#23232A",
};

const headline = "font-['Bebas_Neue'] tracking-wide";
const body = "font-['DM_Sans']";

/* ───────────────── Nav ───────────────── */
function Nav() {
  const cl = useCL();
  const [open, setOpen] = useState(false);
  const links = [
    { label: cl.navFeatures, href: "#features" },
    { label: cl.navForCoaches, href: "#for-coaches" },
    { label: cl.navForAthletes, href: "#for-athletes" },
    { label: cl.navPricing, href: "#pricing" },
  ];
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{ background: `${C.bg}cc`, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="#top" className={`${headline} text-2xl flex items-center gap-2`} style={{ color: C.text }}>
          Sportstalent <span aria-hidden>🥋</span>
        </a>
        <nav className={`hidden md:flex items-center gap-8 ${body}`}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors hover:opacity-100"
              style={{ color: C.text, opacity: 0.75 }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className={`hidden md:flex items-center gap-4 ${body}`}>
          <LanguageSwitcher />
          <Link to="/auth" className="text-sm" style={{ color: C.muted }}>{cl.navLogin}</Link>
          <Link
            to="/auth?tab=signup"
            className="text-sm font-semibold rounded-md px-4 py-2 transition-transform active:scale-[0.98]"
            style={{ background: C.red, color: C.text }}
          >
            {cl.navGetStarted}
          </Link>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="p-2 rounded-md"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            style={{ color: C.text }}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className={`md:hidden border-t ${body}`} style={{ borderColor: C.border, background: C.bg }}>
          <div className="px-5 py-3 space-y-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium"
                style={{ color: C.text }}
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-3 border-t" style={{ borderColor: C.border }}>
              <Link to="/auth" onClick={() => setOpen(false)} className="text-sm py-2" style={{ color: C.muted }}>
                {cl.navLogin}
              </Link>
              <Link
                to="/auth?tab=signup"
                onClick={() => setOpen(false)}
                className="ml-auto text-sm font-semibold rounded-md px-4 py-2"
                style={{ background: C.red, color: C.text }}
              >
                {cl.navGetStarted}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
function Hero() {
  const cl = useCL();
  const phrases = cl.heroPhrases;
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    if (m.matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % phrases.length), 2500);
    return () => clearInterval(t);
  }, [phrases.length]);

  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-30"
        style={{ background: `radial-gradient(ellipse, ${C.red}55, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
        <div>
          <p className={`text-xs font-semibold tracking-[0.25em] mb-5 ${body}`} style={{ color: C.red }}>
            {cl.heroBadge}
          </p>
          <h1 className={`${headline} text-5xl sm:text-6xl lg:text-7xl leading-[0.95]`} style={{ color: C.text }}>
            {cl.heroTitle}
            <br />
            <span className="relative inline-block min-h-[1.05em]" style={{ color: C.red }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={reduced ? 0 : i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="inline-block"
                >
                  {phrases[reduced ? 0 : i]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className={`mt-6 text-base sm:text-lg max-w-xl ${body}`} style={{ color: C.text, opacity: 0.75 }}>
            {cl.heroDesc}
          </p>
          <div className={`mt-8 flex flex-col sm:flex-row gap-3 ${body}`}>
            <Link
              to="/auth?tab=signup"
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold transition-transform active:scale-[0.98]"
              style={{ background: C.red, color: C.text }}
            >
              {cl.heroCtaPrimary} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold border transition-colors"
              style={{ borderColor: C.border, color: C.text }}
            >
              {cl.heroCtaSecondary}
            </a>
          </div>
          <p className={`mt-4 text-xs ${body}`} style={{ color: C.muted }}>
            {cl.heroFinePrint}
          </p>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
        style={{ background: `radial-gradient(ellipse, ${C.red}40, transparent 70%)` }}
        aria-hidden
      />
      <div
        className="relative rounded-2xl overflow-hidden border shadow-2xl"
        style={{ borderColor: C.border, background: C.bg2 }}
      >
        {/* window chrome */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 border-b"
          style={{ borderColor: C.border, background: C.bg3 }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
          <span className={`ml-3 text-[11px] ${body}`} style={{ color: C.muted }}>
            sportstalent.dk / coach
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={`${headline} text-xl`} style={{ color: C.text }}>Squad Pulse</div>
              <div className={`text-xs ${body}`} style={{ color: C.muted }}>Week 14 · 18 athletes</div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded ${body}`}
              style={{ background: `${C.gold}22`, color: C.gold }}
            >
              ON TRACK
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sessions logged", value: "127", sub: "this week" },
              { label: "Avg readiness", value: "78%", sub: "+4 vs last" },
              { label: "Weekly load", value: "6.2", sub: "TRIMP/day" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3 border"
                style={{ borderColor: C.border, background: C.bg }}
              >
                <div className={`text-[10px] uppercase tracking-wider ${body}`} style={{ color: C.muted }}>
                  {s.label}
                </div>
                <div className={`${headline} text-2xl mt-1`} style={{ color: C.text }}>
                  {s.value}
                </div>
                <div className={`text-[10px] ${body}`} style={{ color: C.gold }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {["Mads K. · Black 1st", "Sara L. · Red", "Ali H. · Blue"].map((n, idx) => (
              <div
                key={n}
                className="flex items-center justify-between rounded-md p-2.5 border"
                style={{ borderColor: C.border, background: C.bg }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-7 w-7 rounded-full ${headline} flex items-center justify-center text-xs`}
                    style={{ background: `${C.red}22`, color: C.red }}
                  >
                    {n[0]}
                  </div>
                  <div className={`text-xs ${body}`} style={{ color: C.text }}>{n}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((b) => (
                    <span
                      key={b}
                      className="h-3 w-1 rounded-sm"
                      style={{
                        background: b < 4 - idx ? C.red : C.border,
                        opacity: b < 4 - idx ? 0.85 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Marquee ───────────────── */
const CLUBS = [
  "Copenhagen TKD", "Aarhus Taekwondo", "Oslo Kampsport", "Malmö TKD",
  "Odense Taekwondo", "Stockholm Kampsport", "Vejle TKD", "Bergen Taekwondo",
];

function Marquee() {
  return (
    <section className="border-y" style={{ borderColor: C.border, background: C.bg2 }}>
      <div className="mx-auto max-w-7xl px-5 py-6 flex flex-col md:flex-row items-center gap-5">
        <p className={`text-xs uppercase tracking-[0.2em] whitespace-nowrap ${body}`} style={{ color: C.muted }}>
          Trusted by clubs across Scandinavia
        </p>
        <div className="relative flex-1 overflow-hidden w-full">
          <div className="flex gap-3 animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
            {[...CLUBS, ...CLUBS].map((c, i) => (
              <span
                key={i}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium border ${body}`}
                style={{ borderColor: C.border, color: C.text, background: C.bg }}
              >
                {c}
              </span>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-12"
            style={{ background: `linear-gradient(to right, ${C.bg2}, transparent)` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-12"
            style={{ background: `linear-gradient(to left, ${C.bg2}, transparent)` }}
          />
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </section>
  );
}

/* ───────────────── Features ───────────────── */
const FEATURES = [
  {
    icon: "🥋",
    title: "Coaching Assistant",
    desc: "Get session recommendations, technique guidance, and training advice drawn from deep sport-specific knowledge. Like having a second coach in the room.",
  },
  {
    icon: "📋",
    title: "Training Plan Builder",
    desc: "Build periodized plans for any belt level in minutes. Tailored to age, competition schedule, and individual goals.",
  },
  {
    icon: "📊",
    title: "Athlete Progress Tracker",
    desc: "Every session logged. Every readiness check recorded. Spot patterns before they become injuries.",
  },
  {
    icon: "📄",
    title: "Weekly Performance Reports",
    desc: "A clear, shareable summary of each athlete's week — ready for parents, assistant coaches, or federation reviews.",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:py-28">
      <div className="max-w-2xl mb-12">
        <h2 className={`${headline} text-4xl sm:text-5xl`} style={{ color: C.text }}>
          Everything your club needs.
          <br />
          <span style={{ color: C.muted }}>Nothing it doesn't.</span>
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {FEATURES.map((f, idx) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="relative rounded-xl p-6 border overflow-hidden"
            style={{ borderColor: C.border, background: C.bg2 }}
          >
            <div className="absolute top-0 inset-x-0 h-px" style={{ background: C.red }} />
            <div className="text-3xl mb-4" style={{ color: C.gold }}>{f.icon}</div>
            <h3 className={`${headline} text-2xl mb-2`} style={{ color: C.text }}>{f.title}</h3>
            <p className={`text-sm leading-relaxed ${body}`} style={{ color: C.text, opacity: 0.7 }}>
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────── How It Works ───────────────── */
const STEPS = [
  { n: "01", title: "Add your athletes", desc: "Set up your club roster in under 5 minutes" },
  { n: "02", title: "Athletes log their training", desc: "Session type, effort level, how they feel — takes 60 seconds after practice" },
  { n: "03", title: "You coach with clarity", desc: "Weekly summaries, load trends, and guidance surface automatically so you can focus on the mat" },
];

function HowItWorks() {
  return (
    <section id="how" className="border-y py-20 lg:py-28" style={{ borderColor: C.border, background: C.bg2 }}>
      <div className="mx-auto max-w-7xl px-5">
        <h2 className={`${headline} text-4xl sm:text-5xl mb-14`} style={{ color: C.text }}>
          How it works
        </h2>
        <div className="relative grid md:grid-cols-3 gap-10">
          <div
            className="hidden md:block absolute top-6 left-[16%] right-[16%] h-px"
            style={{ background: `linear-gradient(to right, transparent, ${C.gold}55, transparent)` }}
            aria-hidden
          />
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div
                className={`${headline} text-3xl mb-3 inline-flex items-center justify-center h-12 w-12 rounded-full border`}
                style={{ borderColor: C.gold, color: C.gold, background: C.bg }}
              >
                {s.n}
              </div>
              <h3 className={`${headline} text-xl mb-2`} style={{ color: C.text }}>{s.title}</h3>
              <p className={`text-sm ${body}`} style={{ color: C.text, opacity: 0.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Split For Coaches / Athletes ───────────────── */
const COACH_FEATURES = [
  "Full roster view across all athletes",
  "Training load trends and recovery flags",
  "One-click weekly reports per athlete",
  "Drill and technique library with 100+ taekwondo-specific entries",
  "Competition prep planning tools",
];
const ATHLETE_FEATURES = [
  "Personal session diary",
  "Daily readiness check-in",
  "Progress over time — belt to belt",
  "See this week's training focus from your coach",
];

function SplitSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:py-28">
      <h2 className={`${headline} text-4xl sm:text-5xl mb-12 max-w-2xl`} style={{ color: C.text }}>
        Built for both sides of the equation
      </h2>
      <div className="grid md:grid-cols-2 gap-5">
        <div
          id="for-coaches"
          className="rounded-xl p-8 border"
          style={{ borderColor: `${C.red}33`, background: `linear-gradient(135deg, ${C.red}10, ${C.bg2})` }}
        >
          <p className={`text-xs uppercase tracking-[0.2em] mb-3 ${body}`} style={{ color: C.red }}>
            For Coaches
          </p>
          <h3 className={`${headline} text-3xl mb-6`} style={{ color: C.text }}>Run your whole club from one screen</h3>
          <ul className={`space-y-3 ${body}`}>
            {COACH_FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-sm" style={{ color: C.text }}>
                <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.red }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div
          id="for-athletes"
          className="rounded-xl p-8 border"
          style={{ borderColor: `${C.gold}33`, background: `linear-gradient(135deg, ${C.gold}10, ${C.bg2})` }}
        >
          <p className={`text-xs uppercase tracking-[0.2em] mb-3 ${body}`} style={{ color: C.gold }}>
            For Athletes
          </p>
          <h3 className={`${headline} text-3xl mb-6`} style={{ color: C.text }}>Train with structure and feedback</h3>
          <ul className={`space-y-3 ${body}`}>
            {ATHLETE_FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-sm" style={{ color: C.text }}>
                <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.gold }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Testimonials ───────────────── */
const TESTIMONIALS = [
  { stat: "20 years", quote: "Finally a platform that actually understands taekwondo — not just generic fitness.", name: "Coach Mads", club: "Copenhagen TKD" },
  { stat: "+3 hrs/week", quote: "My athletes log sessions themselves now. I get back 3 hours every week.", name: "Coach Lena", club: "Aarhus Taekwondo" },
  { stat: "Parents on-board", quote: "The weekly report alone is worth it. Parents finally understand what we're building.", name: "Coach Tariq", club: "Oslo Kampsport" },
];

function Testimonials() {
  return (
    <section className="border-y py-20 lg:py-28" style={{ borderColor: C.border, background: C.bg2 }}>
      <div className="mx-auto max-w-7xl px-5">
        <h2 className={`${headline} text-4xl sm:text-5xl mb-12`} style={{ color: C.text }}>
          Coaches who switched, didn't switch back
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl p-6 border-l-2 border"
              style={{ borderLeftColor: C.red, borderColor: C.border, background: C.bg }}
            >
              <div className={`${headline} text-3xl mb-3`} style={{ color: C.gold }}>{t.stat}</div>
              <p className={`text-sm leading-relaxed mb-5 ${body}`} style={{ color: C.text, opacity: 0.85 }}>
                <span className={`${headline} text-2xl mr-1`} style={{ color: C.gold }}>"</span>
                {t.quote}
              </p>
              <div className={`text-xs ${body}`} style={{ color: C.text }}>
                <div className="font-semibold">{t.name}</div>
                <div style={{ color: C.muted }}>{t.club}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Pricing ───────────────── */
const PRICING_TIERS = [
  {
    name: "Athlete",
    price: "49",
    desc: "For individual athletes",
    features: ["Single athlete seat", "Core training & progress", "1 active plan", "Mental & recovery tracking"],
    cta: "Get started",
    popular: false,
  },
  {
    name: "Coach Solo",
    price: "99",
    desc: "For independent coaches",
    features: ["Coach seat", "All modules unlocked", "1 active plan", "Full performance library"],
    cta: "Get started",
    popular: false,
  },
  {
    name: "Team Small",
    price: "399",
    desc: "Up to 5 athletes",
    features: ["5 athlete seats", "All modules unlocked", "Unlimited plans", "Bulk plan creation", "Squad overview"],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Team Medium",
    price: "699",
    desc: "Up to 15 athletes",
    features: ["15 athlete seats", "All modules", "Unlimited plans", "Bulk planning", "Onboarding included"],
    cta: "Start free trial",
    popular: false,
  },
  {
    name: "Team Large",
    price: "999",
    desc: "Up to 25 athletes",
    features: ["25 athlete seats", "All modules", "Unlimited plans", "Onboarding", "Priority support"],
    cta: "Start free trial",
    popular: false,
  },
];

function PricingTeaser() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <h2 className={`${headline} text-4xl sm:text-5xl mb-3 text-center`} style={{ color: C.text }}>
        Simple pricing
      </h2>
      <p className={`text-center text-sm mb-12 ${body}`} style={{ color: C.muted }}>
        14-day free trial · no commitment · cancel anytime
      </p>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl p-7 border relative ${tier.popular ? "border-2" : ""}`}
            style={{
              borderColor: tier.popular ? C.red : C.border,
              background: C.bg2,
            }}
          >
            {tier.popular && (
              <span
                className={`absolute -top-3 left-6 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${body}`}
                style={{ background: C.red, color: C.text }}
              >
                Most popular
              </span>
            )}
            <div className={`${headline} text-2xl`} style={{ color: C.text }}>{tier.name}</div>
            <div className={`text-xs uppercase tracking-wider mt-3 ${body}`} style={{ color: C.muted }}>From</div>
            <div className={`${headline} text-4xl mt-1 mb-2`} style={{ color: C.text }}>
              {tier.price} <span className="text-xl" style={{ color: C.muted }}>DKK/mo</span>
            </div>
            <p className={`text-xs mb-5 ${body}`} style={{ color: C.muted }}>{tier.desc}</p>
            <ul className={`space-y-2 mb-7 text-sm ${body}`} style={{ color: C.text }}>
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: tier.popular ? C.red : C.gold }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/auth?tab=signup"
              className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold ${body}`}
              style={
                tier.popular
                  ? { background: C.red, color: C.text }
                  : { border: `1px solid ${C.border}`, color: C.text }
              }
            >
              {tier.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
      <p className={`text-center text-xs mt-8 ${body}`} style={{ color: C.muted }}>
        See full plans & yearly discounts on the{" "}
        <Link to="/pricing" className="underline" style={{ color: C.text }}>pricing page</Link>
        {" · "}Federation setup?{" "}
        <Link to="/contact" className="underline" style={{ color: C.text }}>Contact us</Link>.
      </p>
    </section>
  );
}

/* ───────────────── Final CTA Band ───────────────── */
function FinalCTA() {
  return (
    <section style={{ background: C.redDeep }} className="py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <h2 className={`${headline} text-4xl sm:text-6xl mb-4`} style={{ color: C.text }}>
          Your next champion is already in your club.
        </h2>
        <p className={`text-base sm:text-lg mb-8 ${body}`} style={{ color: C.text, opacity: 0.85 }}>
          Give every athlete the coaching they deserve — without burning out doing it.
        </p>
        <Link
          to="/auth?tab=signup"
          className={`inline-flex items-center gap-2 rounded-md px-8 py-4 text-base font-bold ${body}`}
          style={{ background: C.text, color: C.redDeep }}
        >
          Start Free Today <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ───────────────── Footer ───────────────── */
const FOOTER_COLS = [
  { title: "Platform", links: ["Features", "Pricing", "Methodology", "Help"] },
  { title: "For Coaches", links: ["Coach Dashboard", "Reports", "Roster", "Plan Builder"] },
  { title: "For Athletes", links: ["Diary", "Readiness", "Progress", "Library"] },
  { title: "Company", links: ["About", "Contact", "Privacy", "Sign in"] },
];

function Footer() {
  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className={`pt-14 pb-8 ${body}`}>
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className={`${headline} text-sm mb-3`} style={{ color: C.text }}>{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs" style={{ color: C.muted }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="pt-6 border-t flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs"
          style={{ borderColor: C.border, color: C.muted }}
        >
          <p>© 2025 Sportstalent.dk · Made for taekwondo, by people who love the sport 🥋</p>
          <div className="flex gap-4">
            <Link to="/privacy" style={{ color: C.muted }}>Privacy</Link>
            <Link to="/contact" style={{ color: C.muted }}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────── Page ───────────────── */
export default function CoachLanding() {
  const navigate = useNavigate();
  // If user is already logged in, send them to the dashboard
  useEffect(() => {
    let mounted = true;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (mounted && user) navigate("/dashboard");
      });
    });
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div style={{ background: C.bg, color: C.text }} className="min-h-screen">
      <PageMeta
        title="Sportstalent — Coaching Platform Built for Taekwondo Clubs"
        description="The coaching platform built for taekwondo clubs. Run your roster, track readiness, build periodized plans, and send weekly reports — all in one place."
        canonical="https://sportstalent.dk/"
      />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <HowItWorks />
        <SplitSection />
        <Testimonials />
        <PricingTeaser />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
