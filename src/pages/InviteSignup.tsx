import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageMeta } from "@/components/PageMeta";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { InviteErrorState } from "@/components/InviteErrorState";


import { useLanguage } from "@/i18n/LanguageContext";
import logo from "@/assets/logo.png";

type Step = "welcome" | "account" | "verify";

export default function InviteSignup() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale, t } = useLanguage();

  const [step, setStep] = useState<Step>("welcome");
  const [info, setInfo] = useState<{ valid: boolean; coach_name?: string; club_name?: string; coach_country?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [accepted, setAccepted] = useState(false);

  // Calendar-correct age from the entered birth date (null until valid).
  const age = (() => {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a >= 0 && a < 120 ? a : null;
  })();
  const isMinor = age != null && age < 18;

  useEffect(() => {
    (async () => {
      if (!code) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.rpc("get_invite_by_code" as any, { _code: code });
      setInfo((data as any) || { valid: false });
      setLoading(false);
    })();
  }, [code]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Adgangskoden skal være mindst 8 tegn", variant: "destructive" });
      return;
    }
    if (age == null) {
      toast({ title: "Indtast din fødselsdato", variant: "destructive" });
      return;
    }
    if (isMinor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail.trim())) {
      toast({ title: "Indtast din værges e-mail", variant: "destructive" });
      return;
    }
    if (!accepted) {
      toast({ title: "Du skal acceptere vilkårene", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            birth_date: birthDate,
            // Carry the invite so the profile gets the coach's country and the
            // inviting coach pre-filled as the responsible coach.
            ...(code ? { invite_code: code } : {}),
            ...(info?.coach_country ? { country: info.coach_country } : {}),
            ...(isMinor ? { guardian_email: guardianEmail.trim().toLowerCase() } : {}),
          },
          // Carry the invite code in the confirmation link so it survives
          // confirming the mail on another device than the one used to sign up.
          emailRedirectTo: `${window.location.origin}/auth?tab=signin${code ? `&ic=${encodeURIComponent(code)}` : ""}`,
        },
      });
      if (error) throw error;
      // Stash invite code; applied after the user confirms email & logs in
      if (code) {
        try {
          sessionStorage.setItem("pending_invite_code", code);
          localStorage.setItem("pending_invite_code", code);
        } catch {}
      }
      try { localStorage.setItem("invite_welcome_banner", "1"); } catch {}
      setStep("verify");
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
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

  if (!info?.valid) {
    return <InviteErrorState reason={(info as any)?.reason} />;
  }


  const headline = info.coach_name
    ? `Din træner ${info.coach_name} har inviteret dig til SportsTalent`
    : "Du er blevet inviteret til SportsTalent";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageMeta title="Tilmelding" description="Accepter invitation til Sportstalent" noindex />

      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <img src={logo} alt="Sportstalent" className="h-8 w-8 rounded-lg object-contain" />
        <span className="text-sm font-black tracking-tight">SPORTSTALENT</span>
      </header>

      <main className="flex-1 flex items-start justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          {step === "welcome" && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground leading-tight">{headline}</h1>
                {info.club_name && (
                  <Badge variant="secondary" className="text-[10px] font-semibold">{info.club_name}</Badge>
                )}
                <p className="text-sm text-muted-foreground pt-1">
                  Tager to minutter. Din træner kan se din træningslog og dine testresultater — din dagbog er din egen, medmindre du deler den.
                </p>
              </div>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-bold">Din klub har betalt din plads</span> — appen er gratis for dig. Ingen binding og intet betalingskort.
                  </p>
                </CardContent>
              </Card>


              <div className="space-y-2">
                <Button onClick={() => setStep("account")} className="w-full h-11 rounded-xl font-bold bg-landing-red hover:bg-landing-red/90 text-white">
                  Acceptér invitation
                </Button>
              </div>

            </>
          )}

          {step === "account" && (
            <>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Opret din konto</h1>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Fulde navn</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                  <Input id="email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoCapitalize="none" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium">Adgangskode</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="h-11 rounded-xl pr-10"
                    />
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPw ? "Skjul" : "Vis"}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">{t("passwordRequirementsHint")}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-xs font-medium">Fødselsdato</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    className="h-11 rounded-xl"
                  />
                  {age != null && (
                    <p className="text-[10px] text-muted-foreground/70">{age} år</p>
                  )}
                </div>

                {isMinor && (
                  <div className="space-y-1.5 rounded-xl border border-primary/40 bg-primary/5 p-3">
                    <Label htmlFor="guardianEmail" className="text-xs font-bold">Din værges e-mail</Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Du er under 18, så en forælder eller værge skal godkende, at klubben må bruge dine helbredsdata. Vi holder helbredsfunktionerne lukkede, indtil din værge har sagt ja.
                    </p>
                    <Input
                      id="guardianEmail"
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      required
                      className="h-11 rounded-xl bg-background"
                    />
                  </div>
                )}

                <label className="flex items-start gap-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    required
                  />
                  <span>
                    Din klub og din træner kan se din træning, dine test og dine aftaler. Din dagbog og dine private noter deles ikke. Jeg accepterer{" "}
                    <a href="/terms" target="_blank" rel="noreferrer" className="underline">vilkårene</a> og{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="underline">privatlivspolitikken</a>.
                  </span>
                </label>


                <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-bold bg-landing-red hover:bg-landing-red/90 text-white">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Kom i gang <ArrowRight className="h-4 w-4 ml-1" /></>)}
                </Button>
              </form>
            </>
          )}

          {step === "verify" && (
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Bekræft din email</h1>
              <p className="text-sm text-muted-foreground">
                Vi har sendt et bekræftelseslink til <span className="font-bold text-foreground">{email}</span>. Klik på linket for at aktivere din konto, log derefter ind og din invitation gennemføres automatisk.
              </p>
              <p className="text-xs text-muted-foreground">Tjek også spam-mappen.</p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.resend({
                      type: "signup",
                      email,
                      options: {
                        emailRedirectTo: `${window.location.origin}/auth?tab=signin${code ? `&ic=${encodeURIComponent(code)}` : ""}`,
                      },
                    });
                    if (error) throw error;
                    toast({ title: "Mail sendt igen" });
                  } catch (e: any) {
                    toast({ title: "Fejl", description: e.message, variant: "destructive" });
                  }
                }}
              >
                Send mailen igen
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
