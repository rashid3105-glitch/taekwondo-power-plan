import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Athlete {
  user_id: string;
  display_name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athletes: Athlete[];
  onSent?: () => void;
}

export function SendMessageDialog({ open, onOpenChange, athletes, onSent }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim()) {
      toast({ title: t("error"), description: t("messageSubjectRequired"), variant: "destructive" });
      return;
    }
    if (athletes.length === 0) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-coach-message", {
        body: {
          athleteIds: athletes.map((a) => a.user_id),
          subject: subject.trim(),
          body: body.trim(),
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast({
        title: t("messageSent"),
        description: `${data?.inserted || 0} ${t("delivered")} · ${data?.emailed || 0} ${t("emailed")}`,
      });
      setSubject(""); setBody("");
      onOpenChange(false);
      onSent?.();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> {t("bulkSendMessage")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("sendingTo")} {athletes.length} {t("athletes")}
            {athletes.length > 0 && athletes.length <= 3 && (
              <span className="block mt-1 text-foreground/70">
                {athletes.map((a) => a.display_name).join(", ")}
              </span>
            )}
          </p>
          <div className="space-y-1">
            <Label className="text-xs">{t("messageSubjectLabel")}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder={t("messageSubjectPlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("messageBodyLabel")}</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder={t("messageBodyPlaceholder")}
            />
          </div>
          <Button onClick={send} disabled={sending || athletes.length === 0} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("send")}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            {t("messageDeliveryNote")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
