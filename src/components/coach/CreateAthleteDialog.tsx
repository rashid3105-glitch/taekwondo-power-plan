import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/passwordValidation";

interface Props {
  disabled?: boolean;
  onCreated: () => Promise<void> | void;
  countLabel?: string;
}

export function CreateAthleteDialog({ disabled, onCreated, countLabel }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [belt, setBelt] = useState("white");
  const [expYears, setExpYears] = useState("");
  const [discipline, setDiscipline] = useState("sparring");
  const [parentEmail, setParentEmail] = useState("");
  const [creating, setCreating] = useState(false);

  // Add by code
  const [code, setCode] = useState("");
  const [adding, setAdding] = useState(false);

  const ageNum = age ? parseInt(age) : NaN;
  const isMinor = Number.isFinite(ageNum) && ageNum < 18;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const parentEmailValid = !isMinor || EMAIL_RE.test(parentEmail.trim());

  const reset = () => {
    setName(""); setEmail(""); setPassword(""); setAge("");
    setBelt("white"); setExpYears(""); setDiscipline("sparring");
    setParentEmail("");
    setCode("");
  };


  const createAthlete = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    const pw = validatePassword(password);
    if (!pw.ok) {
      toast({ title: t("error"), description: t("passwordTooWeak"), variant: "destructive" });
      return;
    }
    if (isMinor && !parentEmailValid) {
      toast({ title: t("error"), description: t("parentEmailRequiredDesc"), variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-athlete", {
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          age: age ? parseInt(age) : null,
          belt_level: belt,
          experience_years: expYears ? parseInt(expYears) : null,
          discipline,
          parent_email: isMinor ? parentEmail.trim() : null,
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: t("athleteCreated"), description: t("athleteCreatedDesc") });
      reset();
      setOpen(false);
      await onCreated();
    } catch (err: any) {
      let description = err.message;
      if (err.message === "COACH_CLUB_REQUIRED") description = t("completeClubBeforeCoach");
      else if (err.message === "WEAK_PASSWORD") description = t("passwordTooWeak");
      else if (err.message === "PARENT_EMAIL_REQUIRED") description = t("parentEmailRequiredDesc");

      toast({ title: t("error"), description, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const addByCode = async () => {
    if (!code.trim()) return;
    setAdding(true);
    try {
      const { data: userId, error: lookupError } = await supabase
        .rpc("lookup_athlete_by_code", { _code: code.trim() });
      if (lookupError || !userId) {
        toast({ title: t("error"), description: t("athleteNotFound"), variant: "destructive" });
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("coach_athletes")
        .insert({ coach_id: user.id, athlete_id: userId as string });
      if (error) {
        if (error.code === "23505") {
          toast({ title: t("error"), description: t("athleteAlreadyAdded"), variant: "destructive" });
        } else if (error.message?.toLowerCase().includes("row-level security")) {
          toast({ title: t("error"), description: t("sameClubRequired"), variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        // If the coach's club has a team default schedule AND the athlete still
        // uses the generic global default, copy the team default to the athlete.
        try {
          const { data: coachProfile } = await supabase
            .from("profiles")
            .select("club_id")
            .eq("user_id", user.id)
            .maybeSingle();
          const clubId = (coachProfile as any)?.club_id;
          if (clubId) {
            const [{ data: clubRow }, { data: athleteRow }] = await Promise.all([
              supabase.from("clubs" as any).select("default_weekly_schedule").eq("id", clubId).maybeSingle(),
              supabase.from("profiles").select("weekly_schedule").eq("user_id", userId as string).maybeSingle(),
            ]);
            const clubDefault = (clubRow as any)?.default_weekly_schedule;
            const athleteSchedule = (athleteRow as any)?.weekly_schedule;
            const GENERIC = [
              { day: "Monday", type: "tkd" },
              { day: "Tuesday", type: "gym" },
              { day: "Wednesday", type: "tkd" },
              { day: "Thursday", type: "gym" },
              { day: "Friday", type: "tkd" },
              { day: "Saturday", type: "gym" },
              { day: "Sunday", type: "rest" },
            ];
            const isGeneric =
              Array.isArray(athleteSchedule) &&
              athleteSchedule.length === GENERIC.length &&
              GENERIC.every((g, i) => {
                const a = athleteSchedule[i];
                return a && a.day === g.day && a.type === g.type &&
                  (!a.sessions || a.sessions.length === 0);
              });
            if (clubDefault && isGeneric) {
              await supabase
                .from("profiles")
                .update({ weekly_schedule: clubDefault as any })
                .eq("user_id", userId as string);
            }
          }
        } catch (e) {
          // Non-fatal: athlete is added even if schedule copy fails.
          console.warn("Team schedule copy skipped:", e);
        }

        toast({ title: t("athleteAdded") });
        reset();
        setOpen(false);
        await onCreated();
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const triggerTitle = `${t("addAthleteAction")}${countLabel ? " · " + countLabel : ""}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          disabled={disabled}
          aria-label={triggerTitle}
          title={triggerTitle}
          className="shrink-0"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> {t("addAthleteAction")}
            {countLabel && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">{countLabel}</span>
            )}
          </DialogTitle>
          <DialogDescription>{t("createAthleteDesc")}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          {/* Add by code */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">{t("orAddByCode")}</p>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("athleteCodePlaceholder")}
                className="flex-1 uppercase"
              />
              <Button onClick={addByCode} disabled={adding || !code.trim()} size="sm" variant="outline">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("add")}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-background px-2 text-muted-foreground">{t("or")}</span>
            </div>
          </div>

          {/* Create new */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">{t("createAthlete")}</p>
            <p className="text-[11px] text-muted-foreground -mt-1">{t("athleteInheritsCoachClub")}</p>

            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("athleteName")} />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("athleteEmail")} />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("athletePassword")} minLength={8} />
            <p className="text-[11px] text-muted-foreground -mt-1">{t("passwordRequirementsHint")}</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("age")}</Label>
                <Input type="number" inputMode="numeric" min={5} max={99} value={age} onChange={(e) => setAge(e.target.value)} placeholder="—" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("yearsOfExperience")}</Label>
                <Input type="number" min={0} max={50} value={expYears} onChange={(e) => setExpYears(e.target.value)} placeholder="—" className="h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("beltLevel")}</Label>
                <Select value={belt} onValueChange={setBelt}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["white", "yellow", "green", "blue", "red", "black"].map((b) => (
                      <SelectItem key={b} value={b}>{t(b)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("discipline")}</Label>
                <Select value={discipline} onValueChange={setDiscipline}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sparring">{t("sparring")}</SelectItem>
                    <SelectItem value="poomsae">{t("poomsae")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={createAthlete} disabled={creating || disabled || !name.trim() || !email.trim() || !password.trim()} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" /> {t("createAccount")}</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
