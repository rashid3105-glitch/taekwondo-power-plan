import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail, MessageCircle, RefreshCw, UserPlus } from "lucide-react";
import { useActiveClub } from "@/contexts/ActiveClubContext";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () =>
  Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

interface Props {
  coachId: string;
  clubId: string | null;
  pendingCount: number;
  approvedCount: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function InviteDialog({ coachId, clubId, pendingCount, approvedCount, open: openProp, onOpenChange, hideTrigger }: Props) {
  const { t } = useLanguage();
  const { activeClubId } = useActiveClub();
  const effectiveClubId = activeClubId ?? clubId;
  const { toast } = useToast();
  const [openInner, setOpenInner] = useState(false);
  const open = openProp ?? openInner;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setOpenInner(v); };
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = code ? `https://sportstalent.dk/join/${code}` : "";
  const shareMessage = code
    ? `Jeg inviterer dig til mit hold på Sportstalent.dk. Klik her for at tilmelde dig: ${inviteUrl}`
    : "";

  const ensureInvite = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("coach_invites" as any)
        .select("code")
        .eq("coach_id", coachId)
        .eq("active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && (existing as any).code) {
        setCode((existing as any).code);
      } else {
        const newCode = generateCode();
        const { error } = await supabase.from("coach_invites" as any).insert({
          coach_id: coachId,
          club_id: effectiveClubId,
          code: newCode,
        });
        if (error) throw error;
        setCode(newCode);
        // Fire-and-forget admin notification (don't block UI on failure)
        supabase.functions
          .invoke("notify-admin-coach-invite", { body: { invite_code: newCode } })
          .catch((err) => console.warn("notify-admin-coach-invite failed", err));
      }
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !code) ensureInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const regenerate = async () => {
    if (!confirm(t("confirmRegenerate"))) return;
    setLoading(true);
    try {
      await supabase
        .from("coach_invites" as any)
        .update({ active: false })
        .eq("coach_id", coachId)
        .eq("active", true);
      const newCode = generateCode();
      const { error } = await supabase.from("coach_invites" as any).insert({
        coach_id: coachId,
        club_id: effectiveClubId,
        code: newCode,
      });
      if (error) throw error;
      setCode(newCode);
      supabase.functions
        .invoke("notify-admin-coach-invite", { body: { invite_code: newCode } })
        .catch((err) => console.warn("notify-admin-coach-invite failed", err));
      toast({ title: t("inviteRegenerated") });
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> {t("inviteAthletes")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("inviteHeading")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("inviteLink")}</Label>
            <Input readOnly value={loading ? "…" : inviteUrl} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={copy} disabled={!inviteUrl} className="gap-1">
              <Copy className="h-3.5 w-3.5" />
              {copied ? t("copied") : t("inviteCopyLink")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={!inviteUrl}
              className="gap-1"
            >
              <a href={`whatsapp://send?text=${encodeURIComponent(shareMessage)}`}>
                <MessageCircle className="h-3.5 w-3.5" /> {t("shareWhatsapp")}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild disabled={!inviteUrl} className="gap-1">
              <a href={`mailto:?subject=${encodeURIComponent("Sportstalent invitation")}&body=${encodeURIComponent(shareMessage)}`}>
                <Mail className="h-3.5 w-3.5" /> {t("shareEmail")}
              </a>
            </Button>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {pendingCount} {t("pendingApprovalCount")} · {approvedCount} {t("approvedAthletesCount")}
          </div>

          <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading} className="w-full gap-2">
            <RefreshCw className="h-3.5 w-3.5" /> {t("generateNewLink")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
