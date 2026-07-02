import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Loader2, MessageSquare, Search, Send, Bell, Building,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { ClubSwitcher } from "@/components/ClubSwitcher";
import { useToast } from "@/hooks/use-toast";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { AvatarImg } from "@/components/AvatarImg";
import { CoachSentHistory } from "@/components/coach/CoachSentHistory";

interface Athlete {
  user_id: string;
  display_name: string;
  athlete_code: string | null;
  avatar_url: string | null;
  club_id?: string | null;
  club_name?: string | null;
}

export default function CoachMessages() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { activeClubId } = useActiveClub();

  const [coachUserId, setCoachUserId] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [clubAthletes, setClubAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  const [messageRecipientIds, setMessageRecipientIds] = useState<Set<string>>(new Set());
  const [messageSearch, setMessageSearch] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  const toggleRecipient = (id: string) => {
    setMessageRecipientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isCoach = (roles || []).some((r: any) => r.role === "coach" || r.role === "admin");
      if (!isCoach) { navigate("/dashboard"); return; }

      setCoachUserId(user.id);

      const { data: links } = await supabase
        .from("coach_athletes")
        .select("athlete_id");
      const athleteIds = (links || []).map((l: any) => l.athlete_id);

      const clubsRes = await supabase.from("clubs" as any).select("id, name").order("name");
      const clubMap = new Map<string, string>(
        ((clubsRes.data as unknown as { id: string; name: string }[] | null) ?? []).map((club) => [club.id, club.name])
      );

      let memberIds = new Set<string>();
      if (activeClubId) {
        const { data: memberRows } = await supabase
          .from("club_memberships" as any)
          .select("user_id")
          .eq("club_id", activeClubId)
          .eq("status", "active");
        memberIds = new Set(((memberRows as any[]) ?? []).map((r) => r.user_id as string));
      }

      if (athleteIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, athlete_code, avatar_url, club_id")
          .in("user_id", athleteIds);

        const filtered = ((profiles || []) as any[])
          .filter((a) => !activeClubId || memberIds.has(a.user_id) || a.club_id === activeClubId)
          .map((a) => ({ ...a, club_name: a.club_id ? clubMap.get(a.club_id) || null : null }))
          .sort((a: any, b: any) => (a.display_name || "").localeCompare(b.display_name || ""));
        setAthletes(filtered as Athlete[]);
      }

      if (activeClubId) {
        const { data: clubProfiles } = await supabase
          .rpc("get_club_member_profiles", { _club_id: activeClubId });
        const clubOnly = ((clubProfiles || []) as any[])
          .filter((p) => p.user_id !== user.id && !athleteIds.includes(p.user_id))
          .map((a) => ({ ...a, club_name: a.club_id ? clubMap.get(a.club_id) || null : null }));
        setClubAthletes(clubOnly as Athlete[]);
      }

      setLoading(false);
    })();
  }, [activeClubId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Watermark />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach")} aria-label={t("back")} title={t("back")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="text-base font-extrabold text-card-foreground">{t("messagesTab")}</span>
          <div className="ml-auto"><ClubSwitcher /></div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {athletes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-card-foreground mb-1">{t("messagesTab")}</h3>
            <p className="text-sm text-muted-foreground">{t("messagesNoAthletes")}</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-1">
              <h3 className="font-bold text-card-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> {t("messagesTab")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("messagesTabDescription")}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-card-foreground">{t("recipientsLabel")}</h4>
                <span className="text-xs text-muted-foreground">
                  {t("selectedCount")
                    .replace("{n}", String(messageRecipientIds.size))
                    .replace("{total}", String(athletes.length))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder={t("searchAthletes")}
                    className="pl-8 h-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs whitespace-nowrap"
                  onClick={() => {
                    if (messageRecipientIds.size === athletes.length) {
                      setMessageRecipientIds(new Set());
                    } else {
                      setMessageRecipientIds(new Set(athletes.map((a) => a.user_id)));
                    }
                  }}
                >
                  {messageRecipientIds.size === athletes.length ? t("clearSelection") : t("selectAll")}
                </Button>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-md border border-border divide-y divide-border">
                {athletes
                  .filter((a) =>
                    !messageSearch.trim()
                      ? true
                      : (a.display_name || "").toLowerCase().includes(messageSearch.toLowerCase())
                  )
                  .map((a) => {
                    const checked = messageRecipientIds.has(a.user_id);
                    return (
                      <label
                        key={a.user_id}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleRecipient(a.user_id)} />
                        <AvatarImg avatarUrl={a.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {a.display_name || t("noName")}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {a.club_name && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Building className="h-2.5 w-2.5" />
                                {a.club_name}
                              </span>
                            )}
                            <p className="text-[10px] text-muted-foreground truncate">{a.athlete_code}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
              </div>
            </div>

            {messageRecipientIds.size > 0 && (
              <div className="rounded-xl border-2 border-primary/40 bg-card p-4 sm:p-5 shadow-card space-y-3 animate-fade-in">
                <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> {t("composerTitle")}
                </h4>
                <div className="space-y-1">
                  <Label className="text-xs">{t("messageSubjectLabel")}</Label>
                  <Input
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    maxLength={200}
                    placeholder={t("messageSubjectPlaceholder")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("messageBodyLabel")}</Label>
                  <Textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={5}
                    maxLength={5000}
                    placeholder={t("messageBodyPlaceholder")}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={async () => {
                      if (!messageSubject.trim()) {
                        toast({ title: t("error"), description: t("messageSubjectRequired"), variant: "destructive" });
                        return;
                      }
                      const recipients = athletes.filter((a) => messageRecipientIds.has(a.user_id));
                      if (recipients.length === 0) return;
                      setSendingMessage(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("send-coach-message", {
                          body: {
                            athleteIds: recipients.map((a) => a.user_id),
                            subject: messageSubject.trim(),
                            body: messageBody.trim(),
                          },
                        });
                        if (error || (data as any)?.error) {
                          throw new Error(error?.message || (data as any)?.error);
                        }
                        toast({
                          title: t("messageSent"),
                          description: `${(data as any)?.inserted || 0} ${t("delivered")} · ${(data as any)?.emailed || 0} ${t("emailed")}`,
                        });
                        setMessageSubject("");
                        setMessageBody("");
                        setMessageRecipientIds(new Set());
                      } catch (err: any) {
                        toast({ title: t("error"), description: err.message, variant: "destructive" });
                      } finally {
                        setSendingMessage(false);
                      }
                    }}
                    disabled={sendingMessage}
                    className="flex-1"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" /> {t("bulkSendMessage")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReminderOpen(true)}
                    disabled={sendingMessage}
                    className="flex-1"
                  >
                    <Bell className="h-4 w-4 mr-1" /> {t("sendReminderInstead")}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">{t("messageDeliveryNote")}</p>
              </div>
            )}

            {coachUserId && (
              <CoachSentHistory
                coachId={coachUserId}
                athleteNames={Object.fromEntries(
                  [...athletes, ...clubAthletes].map((a) => [a.user_id, a.display_name])
                )}
              />
            )}
          </>
        )}

        <Dialog open={reminderOpen} onOpenChange={(v) => !sendingReminder && setReminderOpen(v)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> {t("bulkSendReminder")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("sendingTo")} {messageRecipientIds.size} {t("athletes")}
              </p>
              <div className="space-y-1">
                <Label className="text-xs">{t("reminderTitleLabel")}</Label>
                <Input value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("eventDateLabel")}</Label>
                <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("reminderMessageLabel")}</Label>
                <Textarea value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} rows={3} maxLength={1000} />
              </div>
              <Button
                onClick={async () => {
                  if (!reminderTitle.trim() || !reminderDate) {
                    toast({ title: t("error"), description: t("reminderTitleRequired"), variant: "destructive" });
                    return;
                  }
                  const recipients = athletes.filter((a) => messageRecipientIds.has(a.user_id));
                  if (recipients.length === 0) return;
                  setSendingReminder(true);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Not authenticated");
                    const rows = recipients.map((a) => ({
                      coach_id: user.id,
                      athlete_id: a.user_id,
                      title: reminderTitle.trim(),
                      event_date: reminderDate,
                      message: reminderMessage.trim(),
                      ...(activeClubId ? { club_id: activeClubId } : {}),
                    }));
                    const { data: insertedRows, error } = await supabase
                      .from("event_reminders")
                      .insert(rows)
                      .select("id");
                    if (error) throw error;
                    const reminderIds = (insertedRows || []).map((r: any) => r.id);
                    if (reminderIds.length > 0) {
                      try {
                        await supabase.functions.invoke("send-coach-message", {
                          body: { reminderIds },
                        });
                      } catch (e) {
                        console.warn("Email fan-out failed", e);
                      }
                    }
                    toast({ title: t("reminderSent"), description: `${recipients.length} ${t("athletes")}` });
                    setReminderOpen(false);
                    setReminderTitle("");
                    setReminderDate("");
                    setReminderMessage("");
                    setMessageRecipientIds(new Set());
                  } catch (err: any) {
                    toast({ title: t("error"), description: err.message, variant: "destructive" });
                  } finally {
                    setSendingReminder(false);
                  }
                }}
                disabled={sendingReminder}
                className="w-full"
              >
                {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : t("send")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <AppFooter />
    </div>
  );
}
