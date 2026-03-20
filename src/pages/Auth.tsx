import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, FlaskConical } from "lucide-react";
import logo from "@/assets/logo.png";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageMeta } from "@/components/PageMeta";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [wantsCoach, setWantsCoach] = useState(false);
  const [wantsDemo, setWantsDemo] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName, wants_coach: wantsCoach, wants_demo: wantsDemo } },
        });
        if (error) throw error;
        toast({ title: t("accountCreated"), description: t("youreSignedIn") });
        navigate("/profile-setup");
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <PageMeta
        title={isLogin ? "Sign In" : "Create Account"}
        description="Sign in or create your TKD Power account to access AI-powered training plans."
      />

      {/* Subtle background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.4), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <img src={logo} alt="TKD Power" className="h-12 w-12 rounded-xl object-contain mx-auto mb-3 shadow-lg" />
          <h1 className="text-xl font-black tracking-tight text-foreground">TKD POWER</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isLogin ? t("signInToAccount") : t("createAthleteAccount")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">{t("displayName")}</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("yourName")}
                required={!isLogin}
                className="h-10"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
              required
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="h-10"
            />
          </div>

          {!isLogin && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-3">
                <Checkbox
                  id="coach"
                  checked={wantsCoach}
                  onCheckedChange={(checked) => setWantsCoach(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <label htmlFor="coach" className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Users className="h-3.5 w-3.5" /> {t("iAmACoach")}
                  </label>
                  <p className="text-[10px] text-muted-foreground leading-tight">{t("iAmACoachDesc")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-3">
                <Checkbox
                  id="demo"
                  checked={wantsDemo}
                  onCheckedChange={(checked) => setWantsDemo(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <label htmlFor="demo" className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <FlaskConical className="h-3.5 w-3.5" /> {t("requestDemo" as any)}
                  </label>
                  <p className="text-[10px] text-muted-foreground leading-tight">{t("requestDemoDesc" as any)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-primary-foreground">PP</span>
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

          <Button type="submit" className="w-full h-10 font-bold text-sm shadow-glow" disabled={loading}>
            {loading ? t("pleaseWait") : isLogin ? t("signIn") : t("createAccount")}
          </Button>
        </form>

        {isLogin && (
          <div className="text-center">
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
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 cursor-pointer"
            >
              {t("forgotPassword")}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold underline underline-offset-4 cursor-pointer hover:text-primary/80 transition-colors"
          >
            {isLogin ? t("signUp") : t("signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
