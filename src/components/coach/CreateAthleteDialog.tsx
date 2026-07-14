import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, Building } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/passwordValidation";
import { useActiveClub } from "@/contexts/ActiveClubContext";

interface Props {
  disabled?: boolean;
  onCreated: () => Promise<void> | void;
  countLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function CreateAthleteDialog({ disabled, onCreated, countLabel, open: openProp, onOpenChange, hideTrigger }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { activeClubId, activeMembership, setActiveClubId } = useActiveClub();
  const [openInner, setOpenInner] = useState(false);
  const open = openProp ?? openInner;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setOpenInner(v); };

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

  // Cross-club confirm dialog state
  const [crossClubInfo, setCrossClubInfo] = useState<
    | { targetClubName: string; otherClubNames: string[] }
    | null
  >(null);

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
          club_id: activeClubId,
        },
      });

      // supabase-js sets `error` on non-2xx and puts the real JSON body on
      // error.context. Parse it so we can surface backend error codes instead
      // of a generic "Edge Function returned a non-2xx status code".
      let payload: any = (data as any) ?? {};
      if (error && (error as any).context && typeof (error as any).context.clone === "function") {
        try {
          payload = await (error as any).context.clone().json();
        } catch { /* keep empty */ }
      }
      const errCode: string | undefined = payload?.error || (error ? error.message : undefined);
      if (errCode) throw new Error(errCode);

      toast({ title: t("athleteCreated"), description: t("athleteCreatedDesc") });
      reset();
      setOpen(false);
      await onCreated();
    } catch (err: any) {
      let description = err.message;
      if (err.message === "COACH_CLUB_REQUIRED") description = t("completeClubBeforeCoach");
      else if (err.message === "WEAK_PASSWORD") description = t("passwordTooWeak");
      else if (err.message === "PARENT_EMAIL_REQUIRED") description = t("parentEmailRequiredDesc");
      else if (err.message === "EMAIL_ALREADY_EXISTS") description = t("athleteEmailExistsUseCode");
      else if (err.message === "MAX_ATHLETES_REACHED") description = t("maxAthletesReached");

      toast({ title: t("error"), description, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const addByCode = async (confirmCrossClub = false) => {
    if (!code.trim()) return;
    if (!activeClubId) {
      toast({ title: t("error"), description: t("noClubSelected") ?? "Vælg en aktiv klub først", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("add-athlete-by-code", {
        body: { code: code.trim(), club_id: activeClubId, confirm_cross_club: confirmCrossClub },
      });

      // supabase-js sets `error` on any non-2xx and leaves `data` null. The real
      // JSON body lives on error.context (a Response) — parse it so we can react
      // to CROSS_CLUB_CONFIRM (409) and show specific backend messages instead
      // of a generic "Edge Function returned a non-2xx status code".
      let payload: any = (data as any) ?? {};
      if (error && (error as any).context && typeof (error as any).context.clone === "function") {
        try {
          payload = await (error as any).context.clone().json();
        } catch {
          // keep payload empty; fall back to generic error message below
        }
      }

      const errMsg: string | undefined = payload?.error || error?.message;
      const clubName: string = payload?.club_name || activeMembership?.club_name || "";
      const returnedClubId: string | undefined = payload?.club_id;

      if (payload?.ok && payload?.already) {
        toast({
          title: t("athleteAlreadyAdded"),
          description: t("athleteAlreadyAddedInClub").replace("{club}", clubName),
        });
        if (returnedClubId && returnedClubId !== activeClubId) setActiveClubId(returnedClubId);
        reset();
        setOpen(false);
        await onCreated();
      } else if (payload?.error === "CROSS_CLUB_CONFIRM") {
        setCrossClubInfo({
          targetClubName: payload?.target_club_name || activeMembership?.club_name || "",
          otherClubNames: Array.isArray(payload?.other_club_names) ? payload.other_club_names : [],
        });
      } else if (errMsg) {
        let description: string = errMsg;
        if (payload?.error === "ATHLETE_NOT_FOUND") description = t("athleteNotFound");
        else if (payload?.error === "ALREADY_IN_CLUB") description = t("athleteAlreadyAddedInClub").replace("{club}", clubName);
        else if (payload?.error === "MAX_ATHLETES_REACHED") description = t("maxAthletesReached") ?? errMsg;
        else if (payload?.error === "forbidden") description = t("sameClubRequired");
        else if (
          payload?.error === "MEMBERSHIP_UPSERT_FAILED" ||
          payload?.error === "COACH_LINK_FAILED" ||
          payload?.error === "VERIFY_FAILED"
        ) {
          description = payload?.detail || payload.error;
        }
        toast({ title: t("error"), description, variant: "destructive" });
      } else {
        toast({
          title: t("athleteAdded"),
          description: clubName ? `→ ${clubName}` : undefined,
        });
        if (returnedClubId && returnedClubId !== activeClubId) setActiveClubId(returnedClubId);
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
      {!hideTrigger && (
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
      )}
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> {t("addAthleteAction")}
            {countLabel && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">{countLabel}</span>
            )}
          </DialogTitle>
          <DialogDescription>{t("createAthleteDesc")}</DialogDescription>
          {activeMembership?.club_name && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
              <Building className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("addingToClub")}
                </p>
                <p className="truncate text-sm font-semibold text-primary">
                  {activeMembership.club_name}
                </p>
              </div>
            </div>
          )}
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
              <Button onClick={() => addByCode(false)} disabled={adding || !code.trim()} size="sm" variant="outline">
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

            {isMinor && (
              <div className="space-y-1 rounded-md border border-border bg-muted/30 p-2">
                <Label className="text-xs">{t("parentEmailLabel")} *</Label>
                <Input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder={t("parentEmailPlaceholder")}
                  className="h-9"
                />
                <p className="text-[11px] text-muted-foreground">{t("parentEmailHint")}</p>
              </div>
            )}


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

            <Button onClick={createAthlete} disabled={creating || disabled || !name.trim() || !email.trim() || !password.trim() || (isMinor && !parentEmailValid)} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" /> {t("createAccount")}</>}
            </Button>
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={crossClubInfo !== null}
        onOpenChange={(o) => { if (!o) setCrossClubInfo(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("addAthleteCrossClubTitle").replace("{club}", crossClubInfo?.targetClubName ?? "")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("addAthleteCrossClubBody")
                .replace("{otherClubs}", (crossClubInfo?.otherClubNames ?? []).join(", "))
                .replace("{targetClub}", crossClubInfo?.targetClubName ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={adding}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={adding}
              onClick={async (e) => {
                e.preventDefault();
                setCrossClubInfo(null);
                await addByCode(true);
              }}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("addAthleteCrossClubConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
