import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight, Check } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { COACH_LANDING_STRINGS } from "./coachLandingStrings";
import sportstalentLogo from "@/assets/sportstalent-logo.jpeg";
import photoCoachCorner from "@/assets/photos/coach-athlete-corner.jpg";
import photoSparringJuniors from "@/assets/photos/sparring-juniors.jpg";
import photoHighKick from "@/assets/photos/high-kick-block.jpg";
import photoCoachTalk from "@/assets/photos/coach-talk-denmark.jpg";
import photoPunch from "@/assets/photos/punch-clinch.jpg";
import photoSideKick from "@/assets/photos/side-kick-referee.jpg";
import photoDenJump from "@/assets/photos/den-jump-kick.jpg";
import photoClash from "@/assets/photos/clash-aerial.jpg";
import photoCoachBench from "@/assets/photos/coach-bench.jpg";

const useCL = () => {
  const { locale } = useLanguage();
  return COACH_LANDING_STRINGS[locale] ?? COACH_LANDING_STRINGS.en;
};

/* ───────────────── Tokens ─────────────────
   Light, sporty palette inspired by modern fitness SaaS (Everfit-style).
   Scoped via inline values so global theme isn't touched.
*/
const C = {
  bg: "#FFFFFF",
  bg2: "#F6F8FB",
  bg3: "#EEF2F7",
  red: "#E63946",
  redDeep: "#0B1220", // used for final CTA band (dark navy)
  blue: "#0EA5E9",
  text: "#0B1220",
  muted: "#5B6678",
  border: "#E4E8EF",
  // Backwards-compat alias for any leftover `gold` references → blue
  gold: "#0EA5E9",
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
        <a href="#top" className="flex items-center" aria-label="Sportstalent">
          <img src={sportstalentLogo} alt="Sportstalent" className="h-8 w-auto object-contain" />
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
            style={{ background: C.red, color: "#FFFFFF" }}
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
                style={{ background: C.red, color: "#FFFFFF" }}
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
              style={{ background: C.red, color: "#FFFFFF" }}
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
  const cl = useCL();
  const stats = [
    { label: cl.mockSessionsLogged, value: "127", sub: cl.mockThisWeek },
    { label: cl.mockAvgReadiness, value: "78%", sub: cl.mockVsLast },
    { label: cl.mockWeeklyLoad, value: "6.2", sub: cl.mockTrimpDay },
  ];
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
        style={{ background: `radial-gradient(ellipse, ${C.red}40, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: C.border, background: C.bg2 }}>
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ borderColor: C.border, background: C.bg3 }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
          <span className={`ml-3 text-[11px] ${body}`} style={{ color: C.muted }}>sportstalent.dk / coach</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={`${headline} text-xl`} style={{ color: C.text }}>{cl.mockSquadPulse}</div>
              <div className={`text-xs ${body}`} style={{ color: C.muted }}>{cl.mockWeek}</div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded ${body}`} style={{ background: `${C.gold}22`, color: C.gold }}>
              {cl.mockOnTrack}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg p-3 border" style={{ borderColor: C.border, background: C.bg }}>
                <div className={`text-[10px] uppercase tracking-wider ${body}`} style={{ color: C.muted }}>{s.label}</div>
                <div className={`${headline} text-2xl mt-1`} style={{ color: C.text }}>{s.value}</div>
                <div className={`text-[10px] ${body}`} style={{ color: C.gold }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {["Mads K. · Black 1st", "Sara L. · Red", "Ali H. · Blue"].map((n, idx) => (
              <div key={n} className="flex items-center justify-between rounded-md p-2.5 border" style={{ borderColor: C.border, background: C.bg }}>
                <div className="flex items-center gap-2.5">
                  <div className={`h-7 w-7 rounded-full ${headline} flex items-center justify-center text-xs`} style={{ background: `${C.red}22`, color: C.red }}>
                    {n[0]}
                  </div>
                  <div className={`text-xs ${body}`} style={{ color: C.text }}>{n}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((b) => (
                    <span key={b} className="h-3 w-1 rounded-sm" style={{ background: b < 4 - idx ? C.red : C.border, opacity: b < 4 - idx ? 0.85 : 1 }} />
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

/* ───────────────── Trust line ───────────────── */
function TrustLine() {
  const cl = useCL();
  return (
    <section className="border-y" style={{ borderColor: C.border, background: C.bg2 }}>
      <div className="mx-auto max-w-5xl px-5 py-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-start">
        <p className={`text-[10px] uppercase tracking-[0.25em] whitespace-nowrap ${body}`} style={{ color: C.muted }}>
          {cl.trustEyebrow}
        </p>
        <p className={`text-sm sm:text-[15px] flex-1 ${body}`} style={{ color: C.text }}>
          {cl.trustLine}
        </p>
      </div>
    </section>
  );
}


/* ───────────────── Features ───────────────── */
const FEATURE_ICONS = ["🥋", "📋", "📊", "📄"];

function Features() {
  const cl = useCL();
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:py-28">
      <div className="max-w-2xl mb-12">
        <h2 className={`${headline} text-4xl sm:text-5xl`} style={{ color: C.text }}>
          {cl.featuresTitle1}
          <br />
          <span style={{ color: C.muted }}>{cl.featuresTitle2}</span>
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {cl.features.map((f, idx) => (
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
            <div className="text-3xl mb-4" style={{ color: C.gold }}>{FEATURE_ICONS[idx]}</div>
            <h3 className={`${headline} text-2xl mb-2`} style={{ color: C.text }}>{f.title}</h3>
            <p className={`text-sm leading-relaxed ${body}`} style={{ color: C.text, opacity: 0.7 }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────── How It Works ───────────────── */
function HowItWorks() {
  const cl = useCL();
  return (
    <section id="how" className="border-y py-20 lg:py-28" style={{ borderColor: C.border, background: C.bg2 }}>
      <div className="mx-auto max-w-7xl px-5">
        <h2 className={`${headline} text-4xl sm:text-5xl mb-14`} style={{ color: C.text }}>{cl.howTitle}</h2>
        <div className="relative grid md:grid-cols-3 gap-10">
          <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-px" style={{ background: `linear-gradient(to right, transparent, ${C.gold}55, transparent)` }} aria-hidden />
          {cl.steps.map((s, idx) => (
            <div key={idx} className="relative">
              <div className={`${headline} text-3xl mb-3 inline-flex items-center justify-center h-12 w-12 rounded-full border`} style={{ borderColor: C.gold, color: C.gold, background: C.bg }}>
                {String(idx + 1).padStart(2, "0")}
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
function SplitSection() {
  const cl = useCL();
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:py-28">
      <h2 className={`${headline} text-4xl sm:text-5xl mb-12 max-w-2xl`} style={{ color: C.text }}>{cl.splitTitle}</h2>
      <div className="grid md:grid-cols-2 gap-5">
        <div id="for-coaches" className="rounded-xl p-8 border" style={{ borderColor: `${C.red}33`, background: `linear-gradient(135deg, ${C.red}10, ${C.bg2})` }}>
          <p className={`text-xs uppercase tracking-[0.2em] mb-3 ${body}`} style={{ color: C.red }}>{cl.coachesLabel}</p>
          <h3 className={`${headline} text-3xl mb-6`} style={{ color: C.text }}>{cl.coachesTitle}</h3>
          <ul className={`space-y-3 ${body}`}>
            {cl.coachFeatures.map((f) => (
              <li key={f} className="flex gap-3 text-sm" style={{ color: C.text }}>
                <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.red }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div id="for-athletes" className="rounded-xl p-8 border" style={{ borderColor: `${C.gold}33`, background: `linear-gradient(135deg, ${C.gold}10, ${C.bg2})` }}>
          <p className={`text-xs uppercase tracking-[0.2em] mb-3 ${body}`} style={{ color: C.gold }}>{cl.athletesLabel}</p>
          <h3 className={`${headline} text-3xl mb-6`} style={{ color: C.text }}>{cl.athletesTitle}</h3>
          <ul className={`space-y-3 ${body}`}>
            {cl.athleteFeatures.map((f) => (
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
function Testimonials() {
  const cl = useCL();
  return (
    <section className="border-y py-20 lg:py-28" style={{ borderColor: C.border, background: C.bg2 }}>
      <div className="mx-auto max-w-7xl px-5">
        <h2 className={`${headline} text-4xl sm:text-5xl mb-12`} style={{ color: C.text }}>{cl.testimonialsTitle}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {cl.testimonials.map((t) => (
            <div key={t.name} className="rounded-xl p-6 border-l-2 border" style={{ borderLeftColor: C.red, borderColor: C.border, background: C.bg }}>
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

/* ───────────────── Story Rows (Everfit-style) ───────────────── */
const STORY_PHOTOS = [photoCoachCorner, photoSideKick, photoCoachTalk, photoDenJump];

function StoryRows() {
  const cl = useCL();
  const rows = cl.storyRows ?? [];
  return (
    <section className="border-y" style={{ borderColor: C.border, background: C.bg }}>
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28 space-y-20 lg:space-y-28">
        {rows.map((row, i) => {
          const reverse = i % 2 === 1;
          const accent = i % 2 === 0 ? C.red : C.gold;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
                  style={{ background: `radial-gradient(ellipse, ${accent}55, transparent 70%)` }}
                  aria-hidden
                />
                <div
                  className="relative aspect-[4/5] sm:aspect-[5/6] rounded-2xl overflow-hidden border shadow-xl"
                  style={{ borderColor: C.border }}
                >
                  <img
                    src={STORY_PHOTOS[i % STORY_PHOTOS.length]}
                    alt={row.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
              <div>
                <p className={`text-xs font-bold tracking-[0.25em] mb-3 ${body}`} style={{ color: accent }}>
                  {row.eyebrow}
                </p>
                <h3 className={`${headline} text-3xl sm:text-4xl lg:text-5xl leading-[1.05]`} style={{ color: C.text }}>
                  {row.title}
                </h3>
                <p className={`mt-5 text-base sm:text-lg max-w-xl leading-relaxed ${body}`} style={{ color: C.text, opacity: 0.75 }}>
                  {row.body}
                </p>
                <ul className={`mt-6 space-y-2.5 ${body}`}>
                  {row.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm" style={{ color: C.text }}>
                      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: accent }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────── Pricing ───────────────── */
const FALLBACK_PRICES = ["49", "99", "399", "699", "999"];
const POPULAR_INDEX = 2;

function PricingTeaser() {
  const cl = useCL();
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <h2 className={`${headline} text-4xl sm:text-5xl mb-3 text-center`} style={{ color: C.text }}>{cl.pricingTitle}</h2>
      <p className={`text-center text-sm mb-12 ${body}`} style={{ color: C.muted }}>{cl.pricingSub}</p>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cl.tiers.map((tier, idx) => {
          const popular = idx === POPULAR_INDEX;
          return (
            <div
              key={tier.name}
              className={`rounded-xl p-7 border relative ${popular ? "border-2" : ""}`}
              style={{ borderColor: popular ? C.red : C.border, background: C.bg2 }}
            >
              {popular && (
                <span className={`absolute -top-3 left-6 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${body}`} style={{ background: C.red, color: "#FFFFFF" }}>
                  {cl.mostPopular}
                </span>
              )}
              <div className={`${headline} text-2xl`} style={{ color: C.text }}>{tier.name}</div>
              <div className={`text-xs uppercase tracking-wider mt-3 ${body}`} style={{ color: C.muted }}>{cl.fromLabel}</div>
              <div className={`${headline} text-4xl mt-1 mb-2`} style={{ color: C.text }}>
                {(cl.prices ?? FALLBACK_PRICES)[idx]} <span className="text-xl" style={{ color: C.muted }}>{cl.perMonth}</span>
              </div>
              <p className={`text-xs mb-5 ${body}`} style={{ color: C.muted }}>{tier.desc}</p>
              <ul className={`space-y-2 mb-7 text-sm ${body}`} style={{ color: C.text }}>
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: popular ? C.red : C.gold }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth?tab=signup"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold ${body}`}
                style={popular ? { background: C.red, color: "#FFFFFF" } : { border: `1px solid ${C.border}`, color: C.text }}
              >
                {tier.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
      <p className={`text-center text-xs mt-8 ${body}`} style={{ color: C.muted }}>
        {cl.pricingFootnoteLead}{" "}
        <Link to="/pricing" className="underline" style={{ color: C.text }}>{cl.pricingFootnoteLink}</Link>
        {" · "}{cl.pricingFootnoteFedLead}{" "}
        <Link to="/contact" className="underline" style={{ color: C.text }}>{cl.pricingFootnoteContact}</Link>.
      </p>
    </section>
  );
}

/* ───────────────── Final CTA Band ───────────────── */
function FinalCTA() {
  const cl = useCL();
  return (
    <section style={{ background: C.redDeep }} className="py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <h2 className={`${headline} text-4xl sm:text-6xl mb-4`} style={{ color: "#FFFFFF" }}>{cl.finalCtaTitle}</h2>
        <p className={`text-base sm:text-lg mb-8 ${body}`} style={{ color: "#FFFFFF", opacity: 0.85 }}>{cl.finalCtaDesc}</p>
        <Link to="/auth?tab=signup" className={`inline-flex items-center gap-2 rounded-md px-8 py-4 text-base font-bold ${body}`} style={{ background: C.red, color: "#FFFFFF" }}>
          {cl.finalCtaButton} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ───────────────── Footer ───────────────── */
function Footer() {
  const cl = useCL();
  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className={`pt-14 pb-8 ${body}`}>
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {cl.footerCols.map((col) => (
            <div key={col.title}>
              <div className={`${headline} text-sm mb-3`} style={{ color: C.text }}>{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") ? (
                      <Link to={l.href} className="text-xs hover:underline" style={{ color: C.muted }}>{l.label}</Link>
                    ) : (
                      <a href={l.href} className="text-xs hover:underline" style={{ color: C.muted }}>{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs" style={{ borderColor: C.border, color: C.muted }}>
          <p>{cl.footerCopy}</p>
          <div className="flex gap-4">
            <Link to="/privacy" style={{ color: C.muted }}>{cl.footerPrivacy}</Link>
            <Link to="/contact" style={{ color: C.muted }}>{cl.footerContact}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────── Page ───────────────── */
export default function CoachLanding() {
  const navigate = useNavigate();
  const cl = useCL();
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
      <PageMeta title={cl.metaTitle} description={cl.metaDesc} canonical="https://sportstalent.dk/" />
      <Nav />
      <main>
        <Hero />
        <TrustLine />
        <Features />
        <HowItWorks />
        <SplitSection />
        <Testimonials />
        <StoryRows />
        <PricingTeaser />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
