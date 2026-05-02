import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  TrendingUp,
  BookOpen,
  MessageSquare,
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMeta } from "@/components/PageMeta";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────── */
/*                          NAVBAR                             */
/* ────────────────────────────────────────────────────────── */

const Nav = () => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-landing-navy/95 backdrop-blur-md border-b border-white/10"
          : "bg-transparent",
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="text-white font-black tracking-tight text-base sm:text-lg">
          Sportstalent<span className="text-landing-red">.dk</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher />
          <Link to="/login" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/10"
            >
              {t("landingClubLogIn")}
            </Button>
          </Link>
          <Link to="/signup">
            <Button
              size="sm"
              className="bg-landing-red hover:bg-landing-red-hover text-white font-semibold"
            >
              {t("landingClubGetStarted")}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                           HERO                              */
/* ────────────────────────────────────────────────────────── */

const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const scrollToWaitlist = () => {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--landing-red) / 0.15), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white leading-[1.05]"
        >
          {t("landingClubHeroTitle")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-base sm:text-lg text-slate-200/90 leading-relaxed max-w-2xl mx-auto"
        >
          {t("landingClubHeroSubtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            size="lg"
            onClick={() => navigate("/signup")}
            className="bg-landing-red hover:bg-landing-red-hover text-white font-bold px-7"
          >
            {t("landingClubHeroCtaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={scrollToWaitlist}
            className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white font-semibold px-7"
          >
            {t("landingClubHeroCtaSecondary")}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-4 text-xs text-slate-300/70"
        >
          {t("landingClubHeroAlready")}{" "}
          <Link to="/login" className="text-landing-red hover:underline font-medium">
            {t("landingClubHeroAlreadyLink")}
          </Link>
        </motion.p>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                       PAIN POINTS                           */
/* ────────────────────────────────────────────────────────── */

const PainPoints = () => {
  const { t } = useLanguage();

  const items = [
    { icon: Clock, title: t("landingClubPain1Title"), body: t("landingClubPain1Body") },
    { icon: TrendingUp, title: t("landingClubPain2Title"), body: t("landingClubPain2Body") },
    { icon: BookOpen, title: t("landingClubPain3Title"), body: t("landingClubPain3Body") },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-landing-navy">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="text-center sm:text-left"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-landing-red/10 border border-landing-red/30 mb-4">
              <it.icon className="h-5 w-5 text-landing-red" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{it.title}</h3>
            <p className="text-sm text-slate-300/85 leading-relaxed">{it.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                          FEATURES                           */
/* ────────────────────────────────────────────────────────── */

const Features = () => {
  const { t } = useLanguage();

  const items = [
    { icon: MessageSquare, title: t("landingClubFeat1Title"), body: t("landingClubFeat1Body") },
    { icon: CalendarDays, title: t("landingClubFeat2Title"), body: t("landingClubFeat2Body") },
    { icon: BookOpen, title: t("landingClubFeat3Title"), body: t("landingClubFeat3Body") },
    { icon: Users, title: t("landingClubFeat4Title"), body: t("landingClubFeat4Body") },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-2xl sm:text-3xl font-black tracking-tight text-white text-center mb-10 sm:mb-12"
        >
          {t("landingClubFeaturesTitle")}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl bg-landing-elevated border border-white/10 p-5 sm:p-6 hover:border-landing-red/40 transition-colors"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-landing-red/10 border border-landing-red/30 mb-3">
                <it.icon className="h-5 w-5 text-landing-red" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">{it.title}</h3>
              <p className="text-sm text-slate-300/85 leading-relaxed">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                        CREDIBILITY                          */
/* ────────────────────────────────────────────────────────── */

const Credibility = () => {
  const { t } = useLanguage();
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-landing-navy">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto rounded-2xl bg-landing-elevated border border-white/10 p-7 sm:p-10 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-4">
          {t("landingClubCredibilityTitle")}
        </h2>
        <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
          {t("landingClubCredibilityBody")}
        </p>
      </motion.div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                          WAITLIST                           */
/* ────────────────────────────────────────────────────────── */

const waitlistSchema = z.object({
  name: z.string().trim().min(1).max(120),
  club: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
});

const Waitlist = () => {
  const { t, locale } = useLanguage();
  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.tap();

    const parsed = waitlistSchema.safeParse({ name, club, email });
    if (!parsed.success) {
      toast.error(t("landingClubWaitlistInvalid"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ ...parsed.data, locale });
      if (error) throw error;
      setDone(true);
      toast.success(t("landingClubWaitlistSuccess"));
    } catch (err: any) {
      toast.error(err?.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-7"
        >
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            {t("landingClubWaitlistTitle")}
          </h2>
          <p className="text-sm sm:text-base text-slate-300/85 leading-relaxed">
            {t("landingClubWaitlistBody")}
          </p>
        </motion.div>

        <div className="rounded-2xl bg-landing-elevated border border-white/10 p-5 sm:p-6">
          {done ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-landing-red mb-3" />
              <p className="text-base font-semibold text-white">
                {t("landingClubWaitlistSuccess")}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="wl-name" className="text-slate-200 text-sm">
                  {t("landingClubWaitlistName")}
                </Label>
                <Input
                  id="wl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  required
                  className="mt-1 bg-landing-navy border-white/15 text-white placeholder:text-slate-400"
                  autoComplete="name"
                />
              </div>

              <div>
                <Label htmlFor="wl-club" className="text-slate-200 text-sm">
                  {t("landingClubWaitlistClub")}
                </Label>
                <Input
                  id="wl-club"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  maxLength={120}
                  required
                  className="mt-1 bg-landing-navy border-white/15 text-white placeholder:text-slate-400"
                  autoComplete="organization"
                />
              </div>

              <div>
                <Label htmlFor="wl-email" className="text-slate-200 text-sm">
                  {t("landingClubWaitlistEmail")}
                </Label>
                <Input
                  id="wl-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  required
                  className="mt-1 bg-landing-navy border-white/15 text-white placeholder:text-slate-400"
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-landing-red hover:bg-landing-red-hover text-white font-bold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("landingClubWaitlistSubmit")
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-300/70">
          {t("landingClubWaitlistReadyNow")}{" "}
          <Link to="/signup" className="text-landing-red hover:underline font-medium">
            {t("landingClubWaitlistReadyNowLink")}
          </Link>
        </p>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                           FOOTER                            */
/* ────────────────────────────────────────────────────────── */

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 py-8 px-4 sm:px-6 bg-landing-navy">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300/70">
        <p className="text-center sm:text-left">{t("landingClubFooterCopy")}</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-white transition-colors">
            {t("landingClubFooterPrivacy")}
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors">
            {t("landingClubFooterContact")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                            PAGE                             */
/* ────────────────────────────────────────────────────────── */

const Landing = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate("/dashboard");
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-landing-navy text-white">
      <PageMeta
        title={t("landingClubMetaTitle")}
        description={t("landingClubMetaDesc")}
        canonical="https://sportstalent.dk/"
      />
      <Nav />
      <main>
        <Hero />
        <PainPoints />
        <Features />
        <Credibility />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
