import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageMeta } from "@/components/PageMeta";
import { Eye, EyeOff, Loader2, Copy, Check, MessageCircle, Mail, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

type Step = "account" | "club" | "invite";
type Band = "1-5" | "6-15" | "16-30" | "30+";
const BANDS: Band[] = ["1-5", "6-15", "16-30", "30+"];

export default function SignupCoach() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("account");
  const [loading, setLoading] = useState(false);

  // Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Club
  const [clubName, setClubName] = useState("");
  const [band, setBand] = useState<Band>("1-5");

  // Invite
  const [inviteCode, setInviteCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const inviteUrl = inviteCode ? `https://sportstalent.dk/invite/${inviteCode}` : "";

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Adgangskoden skal være mindst 8 tegn", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name, wants_coach: true, wants_demo: true } },
      });
      if (error) throw error;
      setStep("club");
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const bootstrap = async (skipClub = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-coach-trial", {
        body: skipClub
          ? {}
          : { club_name: clubName.trim(), athlete_band: band },
      });
      if (error) throw error;
      if (!data?.code) throw new Error("No invite code returned");
      setInviteCode(data.code);
      setStep("invite");
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) {
      toast({ title: "Indtast et klubnavn", variant: "destructive" });
      return;
    }
    bootstrap(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareMsg = `Jeg inviterer dig til mit hold på Sportstalent. Tilmeld dig her: ${inviteUrl}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageMeta title="Opret coach-konto" description="Kom i gang gratis med Sportstalent." noindex />

      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <img src={logo} alt="Sportstalent" className="h-8 w-8 rounded-lg object-contain" />
        <span className="text-sm font-black tracking-tight">SPORTSTALENT</span>
      </header>

      <main className="flex-1 flex items-start justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          {step === "account" && (
            <>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Kom i gang gratis</h1>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Ingen kreditkort krævet · 14 dages gratis prøveperiode
                </p>
              </div>

              <form onSubmit={submitAccount} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Fulde navn</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    autoCapitalize="words"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    className="h-11 rounded-xl"
                  />
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
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showPw ? "Skjul" : "Vis"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">Minimum 8 tegn</p>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold bg-landing-red hover:bg-landing-red/90 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opret konto"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Har du allerede en konto?{" "}
                  <button type="button" onClick={() => navigate("/auth?tab=signin")} className="text-primary font-semibold underline underline-offset-4">
                    Log ind
                  </button>
                </p>
              </form>
            </>
          )}

          {step === "club" && (
            <>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Fortæl os om din klub</h1>
              </div>

              <form onSubmit={submitClub} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="club" className="text-xs font-medium">Klubnavn</Label>
                  <Input
                    id="club"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="F.eks. København TKD"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Antal atleter du træner</Label>
                  <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-input bg-secondary/40 p-1">
                    {BANDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBand(b)}
                        className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                          band === b
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold bg-landing-red hover:bg-landing-red/90 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Fortsæt <ArrowRight className="h-4 w-4 ml-1" /></>)}
                </Button>

                <button
                  type="button"
                  onClick={() => bootstrap(true)}
                  disabled={loading}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Spring over, jeg gør det senere
                </button>
              </form>
            </>
          )}

          {step === "invite" && (
            <>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Inviter dine atleter</h1>
                <p className="text-xs text-muted-foreground mt-1.5">De betaler selv — du sætter dem i gang</p>
              </div>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4 space-y-3">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Inviter-link</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={inviteUrl} className="font-mono text-xs h-11 rounded-xl" onFocus={(e) => e.target.select()} />
                    <Button type="button" onClick={copyLink} variant="outline" size="icon" className="h-11 w-11 rounded-xl flex-shrink-0">
                      {copied ? <Check className="h-4 w-4 text-energy" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button asChild variant="outline" className="h-11 rounded-xl gap-1.5">
                      <a href={`whatsapp://send?text=${encodeURIComponent(shareMsg)}`}>
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="h-11 rounded-xl gap-1.5">
                      <a href={`mailto:?subject=${encodeURIComponent("Sportstalent invitation")}&body=${encodeURIComponent(shareMsg)}`}>
                        <Mail className="h-4 w-4" /> Email
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => navigate("/coach")} className="w-full h-11 rounded-xl font-bold bg-landing-red hover:bg-landing-red/90 text-white">
                Gå til dit dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
