import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail, MessageCircle, Users, Trash2, Loader2 } from "lucide-react";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () =>
  Array.from({ length: 10 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

interface LinkedParent {
  id: string;
  parent_user_id: string;
  display_name?: string;
  linked_at?: string;
}

export function ParentInviteSection() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [onCooldown, setOnCooldown] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const isFull = parents.length >= 2;

  const inviteUrl = code ? `https://sportstalent.dk/parent-join/${code}` : "";
  const shareMessage = code
    ? `Få adgang til min træningsoversigt på Sportstalent: ${inviteUrl}`
    : "";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      // Load latest active invite
      const { data: existing } = await supabase
        .from("parent_invites" as any)
        .select("code")
        .eq("athlete_id", user.id)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing && (existing as any).code) setCode((existing as any).code);

      const { data: recentUsed } = await supabase
        .from("parent_invites" as any)
        .select("used_at")
        .eq("athlete_id", user.id)
        .not("used_at", "is", null)
        .order("used_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recentUsed && (recentUsed as any).used_at) {
        const usedAt = new Date((recentUsed as any).used_at);
        const until = new Date(usedAt.getTime() + 60 * 60 * 1000);
        if (until > new Date()) {
          setOnCooldown(true);
          setCooldownUntil(until);
        }
      }

      // Load linked parents
      const { data: links } = await supabase
        .from("parent_athletes" as any)
        .select("id, parent_user_id, created_at")
        .eq("athlete_id", user.id);
      if (links && links.length > 0) {
        const ids = (links as any[]).map((l) => l.parent_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", ids);
        const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));
        setParents(
          (links as any[]).map((l) => ({
            id: l.id,
            parent_user_id: l.parent_user_id,
            display_name: nameMap.get(l.parent_user_id) || "—",
            linked_at: l.created_at,
          })),
        );
      }
    })();
  }, []);

  const generate = async () => {
    if (!userId) return;
    if (onCooldown) {
      toast({ title: t("parentLinkCooldown"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const newCode = generateCode();
      const { error } = await supabase.from("parent_invites" as any).insert({
        athlete_id: userId,
        code: newCode,
      });
      if (error) throw error;
      setCode(newCode);
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

  const removeParent = async (id: string) => {
    const { error } = await supabase.from("parent_athletes" as any).delete().eq("id", id);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }
    setParents((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{t("parentPortalTitle")}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("parentPortalDesc")}</p>

      {!code && !onCooldown && (
        <Button size="sm" onClick={generate} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {t("parentGenerateLink")}
        </Button>
      )}
      {!code && onCooldown && cooldownUntil && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground text-center space-y-1">
          <p className="font-medium">{t("parentLinkCooldown")}</p>
          <p>{t("parentLinkCooldownDesc").replace("{{time}}", cooldownUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</p>
        </div>
      )}
      {code && (
        <>
          <Input readOnly value={inviteUrl} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1">
              <Copy className="h-3.5 w-3.5" />
              {copied ? t("copied") : t("inviteCopyLink")}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild className="gap-1">
              <a href={`whatsapp://send?text=${encodeURIComponent(shareMessage)}`}>
                <MessageCircle className="h-3.5 w-3.5" /> {t("shareWhatsapp")}
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild className="gap-1">
              <a href={`mailto:?subject=${encodeURIComponent("Sportstalent")}&body=${encodeURIComponent(shareMessage)}`}>
                <Mail className="h-3.5 w-3.5" /> {t("shareEmail")}
              </a>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">{t("parentLinkSingleUse")}</p>
        </>
      )}

      {parents.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">{t("parentActiveParents")}</div>
          {parents.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm">{p.display_name}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeParent(p.id)} className="h-7 gap-1 text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> {t("parentRemoveAccess")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
