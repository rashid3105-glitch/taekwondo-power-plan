import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, FlaskConical, Zap, Shield, BarChart3, Brain, ArrowLeft, ChevronRight, Fingerprint, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageMeta } from "@/components/PageMeta";
import { motion } from "framer-motion";
import { validatePassword } from "@/lib/passwordValidation";
import {
  passkeysSupported,
  platformAuthenticatorAvailable,
  signInWithPasskey,
} from "@/lib/passkeys";
import { haptics } from "@/lib/haptics";
import { useRole } from "@/contexts/RoleContext";

const features = [
  { icon: Zap, labelKey: "pricingFeatureAiPlans" as const },
  { icon: BarChart3, labelKey: "pricingFeatureProgress" as const },
  { icon: Brain, labelKey: "pricingFeatureMental" as const },
  { icon: Shield, labelKey: "pricingFeatureRehab" as const },
];

export default function AuthPage() {
  const initialTab = new URLSearchParams(window.location.search).get("tab");
  const [isLogin, setIsLogin] = useState(initialTab !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [wantsCoach, setWantsCoach] = useState(false);
  const [wantsDemo, setWantsDemo] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Read redirect param so we can send user back after login
  const redirectTo = new URLSearchParams(window.location.search).get("redirect");
  const inviteCode = new URLSearchParams(window.location.search).get("invite");

  useEffect(() => {
    if (inviteCode) sessionStorage.setItem("pending_invite_code", inviteCode);
  }, [inviteCode]);

  useEffect(() => {
    (async () => {
      if (!passkeysSupported()) return;
      const ok = await platformAuthenticatorAvailable();
      setPasskeyAvailable(ok);
    })();
  }, []);

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    haptics.tap();
    try {
      await signInWithPasskey(email || undefined);
      navigate(redirectTo || "/dashboard");
    } catch (e: any) {
      toast({
        title: t("passkeyLoginFailed"),
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const pendingInvite = sessionStorage.getItem("pending_invite_code");
        if (pendingInvite) {
          sessionStorage.removeItem("pending_invite_code");
          await supabase.rpc("apply_invite_to_my_profile" as any, { _code: pendingInvite });
          await supabase.auth.signOut();
          toast({ title: t("joinRequestSent") });
          navigate("/");
          return;
        }
        navigate(redirectTo || "/dashboard");
      } else {
        const pwCheck = validatePassword(password);
        if (!pwCheck.ok) {
          toast({ title: t("error"), description: t("passwordTooWeak"), variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName, wants_coach: wantsCoach, wants_demo: wantsDemo } },
        });
        if (error) throw error;

        try {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'new-user-notification',
              recipientEmail: 'rashid3105@gmail.com',
              idempotencyKey: `new-user-${signUpData.user?.id || Date.now()}`,
              templateData: {
                userName: displayName,
                userEmail: email,
                isDemo: wantsDemo,
              },
            },
          });
        } catch (emailErr) {
          console.error('Failed to send admin notification email', emailErr);
        }

        toast({ title: t("accountCreated"), description: t("youreSignedIn") });
        navigate(redirectTo ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}` : "/onboarding");
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative">
      <PageMeta
        title={isLogin ? "Sign In" : "Create Account"}
        description="Sign in or create your Sportstalent account to access periodized training plans."
        noindex
      />

      {/* Left branded panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10">
        {/* Background effects */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 30%, hsl(190 95% 50% / 0.4), transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(160 80% 45% / 0.25), transparent 60%)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/60 pointer-events-none" />

        {/* Top — Logo & back */}
        <div className="relative z-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-12 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToSignIn").includes("Sign In") ? "Back to Home" : t("backToSignIn")}
          </button>

          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="Sportstalent" className="h-10 w-10 rounded-xl object-contain shadow-lg" />
            <span className="text-lg font-black tracking-tight text-foreground">SPORTSTALENT</span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-black tracking-tight text-foreground leading-tight mb-3"
          >
            {t("landingHeroTitle")}{" "}
            <span className="text-gradient-energy">{t("landingHeroHighlight")}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-muted-foreground leading-relaxed max-w-sm"
          >
            {t("heroDescription")}
          </motion.p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {features.map((f, i) => (
            <motion.div
              key={f.labelKey}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-3"
            >
              <div className="h-8 w-8 rounded-lg bg-energy/10 border border-energy/20 flex items-center justify-center flex-shrink-0">
                <f.icon className="h-4 w-4 text-energy" />
              </div>
              <span className="text-sm font-medium text-foreground/90">{t(f.labelKey)}</span>
            </motion.div>
          ))}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-[10px] text-muted-foreground pt-2"
          >
            {t("ctaSubtext")}
          </motion.p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 relative">
        {/* Mobile background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] opacity-10 pointer-events-none lg:hidden"
          style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.4), transparent 70%)" }}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-6 relative z-10"
        >
          {/* Mobile header */}
          <div className="flex items-center justify-between lg:hidden">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <LanguageSwitcher />
          </div>

          {/* Desktop language switcher */}
          <div className="hidden lg:flex justify-end">
            <LanguageSwitcher />
          </div>

          {/* Logo & title */}
          <div className="text-center">
            <div className="lg:hidden">
              <img src={logo} alt="Sportstalent" className="h-12 w-12 rounded-xl object-contain mx-auto mb-3 shadow-lg" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              {isLogin ? t("signInToAccount") : t("createAthleteAccount")}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold underline underline-offset-4 cursor-pointer hover:text-primary/80 transition-colors"
              >
                {isLogin ? t("signUp") : t("signIn")}
              </button>
            </p>
          </div>

          {/* Passkey login (returning users on this device) */}
          {isLogin && passkeyAvailable && (
            <>
              <Button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="w-full h-11 font-bold text-sm rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                variant="outline"
              >
                {passkeyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    {t("continueWithFaceId")}
                  </>
                )}
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("usePasswordInstead")}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">{t("displayName")}</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("yourName")}
                  required={!isLogin}
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  className="h-11 rounded-xl bg-secondary/40 border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                className="h-11 rounded-xl bg-secondary/40 border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">{t("password")}</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        toast({ title: t("error"), description: t("email"), variant: "destructive" });
                        return;
                      }
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast({ title: t("resetLinkSent"), description: t("resetLinkSentDesc") });
                      } catch (err: any) {
                        toast({ title: t("error"), description: err.message, variant: "destructive" });
                      }
                    }}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {t("forgotPassword")}
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={isLogin ? 6 : 8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                enterKeyHint={isLogin ? "go" : "done"}
                className="h-11 rounded-xl bg-secondary/40 border-border/60 focus:border-primary/50 transition-colors"
              />
              {!isLogin && (
                <p className="text-[10px] text-muted-foreground/70 leading-tight">{t("passwordRequirementsHint")}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-3.5 hover:border-border/60 transition-colors">
                  <Checkbox
                    id="coach"
                    checked={wantsCoach}
                    onCheckedChange={(checked) => setWantsCoach(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="coach" className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                      <Users className="h-3.5 w-3.5 text-energy" /> {t("iAmACoach")}
                    </label>
                    <p className="text-[10px] text-muted-foreground leading-tight">{t("iAmACoachDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-3.5 hover:border-border/60 transition-colors">
                  <Checkbox
                    id="demo"
                    checked={wantsDemo}
                    onCheckedChange={(checked) => setWantsDemo(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="demo" className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                      <FlaskConical className="h-3.5 w-3.5 text-speed" /> {t("requestDemo")}
                    </label>
                    <p className="text-[10px] text-muted-foreground leading-tight">{t("requestDemoDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-primary-foreground">PP</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">{t("paypalTitle")}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{t("paypalInstruction")}</p>
                    <p className="text-sm font-bold text-primary font-mono tracking-wide">rashid3105@gmail.com</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{t("paypalReference")}</p>
                  </div>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-medium text-muted-foreground">{t("logInAs") ?? "Log ind som"}</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: "athlete", label: "🥋 Atlet" },
                    { key: "coach", label: "⭐ Coach" },
                  ] as const).map((opt) => {
                    const active = selectedRole === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => { haptics.tap(); setSelectedRole(opt.key); }}
                        className={`h-10 rounded-full text-xs font-semibold transition-colors border ${
                          active
                            ? "bg-primary text-primary-foreground border-transparent"
                            : "bg-transparent text-muted-foreground border-border/60 hover:border-border"
                        }`}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}



            <Button
              type="submit"
              className="w-full h-11 font-bold text-sm shadow-glow rounded-xl relative overflow-hidden group"
              disabled={loading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-energy/20 to-speed/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-1.5">
                {loading ? t("pleaseWait") : isLogin ? t("signIn") : t("createAccount")}
                {!loading && <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />}
              </span>
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground pt-2">
            {t("ctaSubtext")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
