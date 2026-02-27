import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
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
          options: { data: { display_name: displayName } },
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-energy mb-4">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">TKD POWER</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? t("signInToAccount") : t("createAthleteAccount")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="name">{t("displayName")}</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("yourName")}
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("pleaseWait") : isLogin ? t("signIn") : t("createAccount")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary underline underline-offset-2 cursor-pointer"
          >
            {isLogin ? t("signUp") : t("signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
