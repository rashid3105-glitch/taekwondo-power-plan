import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Clock } from "lucide-react";
import { validatePassword } from "@/lib/passwordValidation";

interface InviteInfo {
  valid: boolean;
  athlete_name?: string;
  athlete_belt?: string;
}

type Phase = "signup" | "login" | "confirm";

export default function ParentJoin() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<Phase>("signup");

  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [{ data: inv }, { data: { user } }] = await Promise.all([
        supabase.rpc("get_parent_invite_info" as any, { _code: code }),
        supabase.auth.getUser(),
      ]);
      setInfo((inv as any) || { valid: false });
      setPhase(user ? "confirm" : "signup");
      setLoading(false);
    })();
  }, [code]);

  const acceptInvite = async () => {
    const { data, error } = await supabase.rpc("accept_parent_invite" as any, { _code: code });
    if (error) throw error;
    const res = data as any;
    if (!res?.ok) throw new Error(res?.error || "Failed");
  };

  const handleConfirm = async () => {
    if (!code) return;
    setSubmitting(true);
    try {
      await acceptInvite();
      toast({ title: t("parentJoinSuccess") });
      navigate("/parent-dashboard");
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const validateSignup = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = t("required" as any) || "Required";
    if (!lastName.trim()) e.lastName = t("required" as any) || "Required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("invalidEmail" as any) || "Invalid email";
    if (!phone.trim()) e.phone = t("required" as any) || "Required";
    const pw = validatePassword(password);
    if (!pw.ok) e.password = t(pw.messageKey as any) || "Password too weak";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!code || !validateSignup()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-signup", {
        body: {
          code,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "signup_failed");

      // Establish session for the auto-confirmed user
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) throw signInErr;

      toast({ title: t("parentJoinSuccess") });
      navigate("/parent-dashboard");
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const validateLogin = () => {
    const e: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t("invalidEmail" as any) || "Invalid email";
    if (!password) e.password = t("required" as any) || "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!code || !validateLogin()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      await acceptInvite();
      toast({ title: t("parentJoinSuccess") });
      navigate("/parent-dashboard");
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {!info?.valid && (
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-extrabold">{t("joinInvalid")}</h1>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              {t("backToHome")}
            </Button>
          </div>
        )}

        {info?.valid && (
          <>
            <div className="text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold">
                  {t("parentJoinTitle")} {info.athlete_name}
                </h1>
                {info.athlete_belt && (
                  <p className="text-sm text-muted-foreground capitalize mt-1">{info.athlete_belt}</p>
                )}
              </div>
            </div>

            {phase === "confirm" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">{t("parentConfirmDesc")}</p>
                <Button onClick={handleConfirm} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("parentJoinConfirm")}
                </Button>
                <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
                  {t("noThanks")}
                </Button>
              </div>
            )}

            {phase === "signup" && (
              <form onSubmit={handleSignup} className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">{t("parentSignupDesc")}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">{t("firstName" as any) || "First name"}</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">{t("lastName" as any) || "Last name"}</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">{t("email" as any) || "Email"}</Label>
                  <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone">{t("phone" as any) || "Phone"}</Label>
                  <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">{t("password" as any) || "Password"}</Label>
                  <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("createAccount")}
                </Button>

                <button
                  type="button"
                  onClick={() => { setErrors({}); setPhase("login"); }}
                  className="block w-full text-center text-sm text-primary hover:underline"
                >
                  {t("alreadyHaveAccount")}
                </button>
              </form>
            )}

            {phase === "login" && (
              <form onSubmit={handleLogin} className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">{t("loginToLinkParent")}</p>

                <div className="space-y-1">
                  <Label htmlFor="loginEmail">{t("email" as any) || "Email"}</Label>
                  <Input id="loginEmail" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="loginPassword">{t("password" as any) || "Password"}</Label>
                  <Input id="loginPassword" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("joinLoginCta")}
                </Button>

                <button
                  type="button"
                  onClick={() => { setErrors({}); setPhase("signup"); }}
                  className="block w-full text-center text-sm text-primary hover:underline"
                >
                  {t("noAccountYet")}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
