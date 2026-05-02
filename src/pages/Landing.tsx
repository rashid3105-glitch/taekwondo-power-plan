import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Check,
  User,
  Users,
  AlertTriangle,
  Heart,
  ClipboardX,
  Activity,
  FileDown,
  CalendarPlus,
  Dumbbell,
  TrendingUp,
  Apple,
  Stethoscope,
  Brain,
  Trophy,
  Tag,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageMeta } from "@/components/PageMeta";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { detectCurrency, formatPrice, getTierPrice } from "@/lib/currency";

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left: logo */}
        <Link to="/" className="text-white font-black tracking-tight text-base sm:text-lg shrink-0">
          Sportstalent<span className="text-landing-red">.dk</span>
        </Link>

        {/* Center: pricing link + language switcher (hidden on small to save space) */}
        <div className="hidden md:flex items-center justify-center gap-4 flex-1">
          <a
            href="#priser"
            className="text-sm text-slate-200/80 hover:text-white transition-colors"
          >
            {t("landingV2NavPricing")}
          </a>
          <LanguageSwitcher />
        </div>

        {/* Right: auth buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/10"
            >
              {t("landingV2NavLogIn")}
            </Button>
          </Link>
          <Link to="/signup">
            <Button
              size="sm"
              className="bg-landing-red hover:bg-landing-red-hover text-white font-semibold"
            >
              {t("landingV2NavGetStarted")}
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
          {t("landingV2HeroTitle")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-base sm:text-lg text-slate-200/90 leading-relaxed max-w-2xl mx-auto"
        >
          {t("landingV2HeroSubtitle")}
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
            {t("landingV2HeroCtaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={scrollToWaitlist}
            className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white font-semibold px-7"
          >
            {t("landingV2HeroCtaSecondary")}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-4 text-xs text-slate-300/70"
        >
          {t("landingV2HeroAlready")}{" "}
          <Link to="/login" className="text-landing-red hover:underline font-medium">
            {t("landingV2HeroAlreadyLink")}
          </Link>
        </motion.p>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                     TWO-AUDIENCE SECTION                    */
/* ────────────────────────────────────────────────────────── */

const AudienceCard = ({
  icon: Icon,
  title,
  features,
  cta,
  accent,
  onCta,
}: {
  icon: typeof User;
  title: string;
  features: string[];
  cta: string;
  accent: "red" | "cyan";
  onCta: () => void;
}) => {
  const isCyan = accent === "cyan";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl bg-landing-elevated border p-6 sm:p-7 flex flex-col",
        isCyan ? "border-cyan-400/30" : "border-white/10",
      )}
    >
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl border mb-4",
          isCyan
            ? "bg-cyan-400/10 border-cyan-400/30"
            : "bg-landing-red/10 border-landing-red/30",
        )}
      >
        <Icon className={cn("h-5 w-5", isCyan ? "text-cyan-300" : "text-landing-red")} />
      </div>
      <h3 className="text-xl font-black text-white mb-4">{title}</h3>
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200/90">
            <Check
              className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                isCyan ? "text-cyan-300" : "text-landing-red",
              )}
            />
            <span className="leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={onCta}
        className={cn(
          "w-full font-semibold text-white",
          isCyan
            ? "bg-cyan-500 hover:bg-cyan-600"
            : "bg-landing-red hover:bg-landing-red-hover",
        )}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
};

const TwoAudience = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-landing-navy">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <AudienceCard
          icon={User}
          accent="red"
          title={t("landingV2AthleteCardTitle")}
          features={[
            t("landingV2AthleteFeat1"),
            t("landingV2AthleteFeat2"),
            t("landingV2AthleteFeat3"),
            t("landingV2AthleteFeat4"),
            t("landingV2AthleteFeat5"),
            t("landingV2AthleteFeat6"),
          ]}
          cta={t("landingV2AthleteCta")}
          onCta={() => navigate("/signup")}
        />
        <AudienceCard
          icon={Users}
          accent="cyan"
          title={t("landingV2CoachCardTitle")}
          features={[
            t("landingV2CoachFeat1"),
            t("landingV2CoachFeat2"),
            t("landingV2CoachFeat3"),
            t("landingV2CoachFeat4"),
            t("landingV2CoachFeat5"),
            t("landingV2CoachFeat6"),
          ]}
          cta={t("landingV2CoachCta")}
          onCta={() => navigate("/signup")}
        />
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                  COACH DASHBOARD HIGHLIGHT                  */
/* ────────────────────────────────────────────────────────── */

const CoachHighlight = () => {
  const { t } = useLanguage();

  const tiles = [
    {
      icon: AlertTriangle,
      label: t("landingV2CoachTileAttention"),
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
    },
    {
      icon: Heart,
      label: t("landingV2CoachTileInjured"),
      color: "text-landing-red",
      bg: "bg-landing-red/10",
      border: "border-landing-red/30",
    },
    {
      icon: ClipboardX,
      label: t("landingV2CoachTileNoPlan"),
      color: "text-slate-300",
      bg: "bg-white/5",
      border: "border-white/15",
    },
    {
      icon: Activity,
      label: t("landingV2CoachTileInactive"),
      color: "text-cyan-300",
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/30",
    },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto rounded-2xl bg-landing-elevated border border-white/10 p-6 sm:p-10"
      >
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            {t("landingV2CoachHighlightTitle")}
          </h2>
          <p className="text-sm sm:text-base text-slate-300/85 leading-relaxed">
            {t("landingV2CoachHighlightSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {tiles.map((tile, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border bg-landing-navy p-4 flex flex-col items-start gap-2",
                tile.border,
              )}
            >
              <div
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                  tile.bg,
                )}
              >
                <tile.icon className={cn("h-4.5 w-4.5", tile.color)} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                {tile.label}
              </p>
              <p className={cn("text-2xl font-black", tile.color)}>—</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-200 hover:text-white hover:bg-white/10 border border-white/15"
            disabled
          >
            <FileDown className="h-4 w-4" />
            {t("landingV2CoachActionExport")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-200 hover:text-white hover:bg-white/10 border border-white/15"
            disabled
          >
            <CalendarPlus className="h-4 w-4" />
            {t("landingV2CoachActionBulkComp")}
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                    ATHLETE FEATURES GRID                    */
/* ────────────────────────────────────────────────────────── */

const FeaturesGrid = () => {
  const { t } = useLanguage();

  const items = [
    { icon: Dumbbell, label: t("landingV2FeatPlan"), color: "text-landing-red", bg: "bg-landing-red/10", border: "border-landing-red/30" },
    { icon: TrendingUp, label: t("landingV2FeatProgress"), color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
    { icon: Apple, label: t("landingV2FeatNutrition"), color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
    { icon: Stethoscope, label: t("landingV2FeatRehab"), color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/30" },
    { icon: Brain, label: t("landingV2FeatMental"), color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", border: "border-fuchsia-400/30" },
    { icon: Trophy, label: t("landingV2FeatCompetitions"), color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-landing-navy">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-2xl sm:text-3xl font-black tracking-tight text-white text-center mb-10"
        >
          {t("landingV2FeaturesTitle")}
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className={cn(
                "rounded-2xl bg-landing-elevated border p-4 sm:p-5 flex flex-col items-start gap-3 transition-colors",
                "border-white/10 hover:border-white/25",
              )}
            >
              <div
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-lg border",
                  it.bg,
                  it.border,
                )}
              >
                <it.icon className={cn("h-5 w-5", it.color)} />
              </div>
              <p className="text-sm sm:text-base font-bold text-white leading-tight">
                {it.label}
              </p>
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
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto rounded-2xl bg-landing-elevated border border-white/10 p-7 sm:p-10 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-4">
          {t("landingV2CredibilityTitle")}
        </h2>
        <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
          {t("landingV2CredibilityBody")}
        </p>
      </motion.div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                          PRICING                            */
/* ────────────────────────────────────────────────────────── */

const Pricing = () => {
  const { t, locale } = useLanguage();
  const currency = detectCurrency();

  const tiers: Array<{
    key: "athlete" | "coach_solo" | "team_small";
    nameKey: "landingPricingTierAthlete" | "landingPricingTierCoach" | "landingPricingTierSmall";
    descKey: "landingPricingTierAthleteDesc" | "landingPricingTierCoachDesc" | "landingPricingTierSmallDesc";
    icon: typeof User;
    popular?: boolean;
  }> = [
    { key: "athlete", nameKey: "landingPricingTierAthlete", descKey: "landingPricingTierAthleteDesc", icon: User },
    { key: "coach_solo", nameKey: "landingPricingTierCoach", descKey: "landingPricingTierCoachDesc", icon: Users, popular: true },
    { key: "team_small", nameKey: "landingPricingTierSmall", descKey: "landingPricingTierSmallDesc", icon: Users },
  ];

  return (
    <section id="priser" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-landing-red/15 border border-landing-red/30 text-landing-red text-xs font-semibold mb-4">
            <Tag className="w-3.5 h-3.5" />
            {t("landingPricingTitle")}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            {t("landingPricingSubtitle")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {tiers.map((tier, idx) => {
            const amount = getTierPrice(tier.key, currency, "monthly");
            const priceDisplay = amount != null ? formatPrice(amount, currency, "monthly", locale) : "";
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={cn(
                  "relative rounded-2xl bg-landing-elevated border p-5 flex flex-col gap-3",
                  tier.popular ? "border-landing-red/60 ring-1 ring-landing-red/40" : "border-white/10",
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-landing-red text-white text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                    {t("landingPricingPopular")}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-landing-red" />
                  </div>
                  <div className="text-sm font-bold text-white">{t(tier.nameKey)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-300/70 font-semibold">
                    {t("landingPricingFrom")}
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xl font-black text-white">{priceDisplay}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300/80 leading-relaxed">{t(tier.descKey)}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <Link to="/pricing">
            <Button
              size="lg"
              className="bg-landing-red hover:bg-landing-red-hover text-white font-semibold"
              onClick={() => haptics.tap()}
            >
              {t("landingPricingCta")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <p className="text-xs text-slate-300/70">{t("landingPricingTrialNote")}</p>
        </motion.div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────── */
/*                          WAITLIST                           */
/* ────────────────────────────────────────────────────────── */

const waitlistSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  role: z.enum(["athlete", "coach", "club"]),
});

const Waitlist = () => {
  const { t, locale } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"athlete" | "coach" | "club" | "">("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.tap();

    const parsed = waitlistSchema.safeParse({ name, email, role });
    if (!parsed.success) {
      toast.error(t("landingV2WaitlistInvalid"));
      return;
    }

    setLoading(true);
    try {
      const { name: n, email: e2, role: r } = parsed.data;
      const { error } = await supabase
        .from("waitlist")
        .insert([{ name: n, email: e2, role: r, locale } as any]);
      if (error) throw error;
      setDone(true);
      toast.success(t("landingV2WaitlistSuccess"));
    } catch (err: any) {
      toast.error(err?.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20 bg-landing-navy">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-7"
        >
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            {t("landingV2WaitlistTitle")}
          </h2>
          <p className="text-sm sm:text-base text-slate-300/85 leading-relaxed">
            {t("landingV2WaitlistSubtitle")}
          </p>
        </motion.div>

        <div className="rounded-2xl bg-landing-elevated border border-white/10 p-5 sm:p-6">
          {done ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-landing-red mb-3" />
              <p className="text-base font-semibold text-white">
                {t("landingV2WaitlistSuccess")}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="wl-name" className="text-slate-200 text-sm">
                  {t("landingV2WaitlistName")}
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
                <Label htmlFor="wl-email" className="text-slate-200 text-sm">
                  {t("landingV2WaitlistEmail")}
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

              <div>
                <Label htmlFor="wl-role" className="text-slate-200 text-sm">
                  {t("landingV2WaitlistRole")}
                </Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger
                    id="wl-role"
                    className="mt-1 bg-landing-navy border-white/15 text-white"
                  >
                    <SelectValue placeholder={t("landingV2WaitlistRolePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="athlete">{t("landingV2WaitlistRoleAthlete")}</SelectItem>
                    <SelectItem value="coach">{t("landingV2WaitlistRoleCoach")}</SelectItem>
                    <SelectItem value="club">{t("landingV2WaitlistRoleClub")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-landing-red hover:bg-landing-red-hover text-white font-bold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("landingV2WaitlistSubmit")
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-300/70">
          {t("landingV2WaitlistReadyNow")}{" "}
          <Link to="/signup" className="text-landing-red hover:underline font-medium">
            {t("landingV2WaitlistReadyNowLink")}
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
    <footer className="border-t border-white/10 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300/70">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-white font-black tracking-tight text-sm">
            Sportstalent<span className="text-landing-red">.dk</span>
          </Link>
          <span>{t("landingClubFooterCopy")}</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
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
        title={t("landingV2MetaTitle")}
        description={t("landingV2MetaDesc")}
        canonical="https://sportstalent.dk/"
      />
      <Nav />
      <main>
        <Hero />
        <TwoAudience />
        <CoachHighlight />
        <FeaturesGrid />
        <Credibility />
        <Pricing />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
