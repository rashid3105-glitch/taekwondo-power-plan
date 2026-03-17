import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, CheckCircle, XCircle, ArrowLeft, Download, Shield, Trash2, Users, CreditCard, CalendarIcon, FlaskConical, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { format } from "date-fns";

interface UserPlan {
  id: string;
  name: string;
  plan_data: any;
  created_at: string;
}

interface PendingUser {
  user_id: string;
  display_name: string;
  created_at: string;
  is_approved: boolean;
  age: number | null;
  weight_kg: number | null;
  belt_level: string;
  experience_years: number | null;
  goals: string[] | null;
  tkd_sessions_per_week: number;
  payment_status: string;
  payment_date: string | null;
  is_demo: boolean;
  club_id?: string | null;
  club_name?: string | null;
  email?: string;
  plans?: UserPlan[];
  isCoach?: boolean;
  coachId?: string | null;
  coachName?: string;
}

export default function AdminApproval() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [coaches, setCoaches] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [downloadingPlan, setDownloadingPlan] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    if (user.email !== "rashid3105@gmail.com") { navigate("/dashboard"); return; }
    setIsAdmin(true);
    await loadUsers();
  };

  const loadUsers = async () => {
    const [profilesRes, emailsRes, plansRes, rolesRes, coachAthletesRes, clubsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, created_at, is_approved, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week, payment_status, payment_date, is_demo, club_id")
        .order("created_at", { ascending: false }),
      supabase.functions.invoke("get-admin-users"),
      supabase
        .from("training_plans")
        .select("id, name, plan_data, created_at, user_id, is_active")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("coach_athletes").select("coach_id, athlete_id"),
      supabase.from("clubs" as any).select("id, name"),
    ]);

    const profiles = (profilesRes.data || []) as PendingUser[];
    const emailMap: Record<string, string> = emailsRes.data?.emailMap || {};
    const plans = (plansRes.data || []) as (UserPlan & { user_id: string })[];
    const roles = (rolesRes.data || []) as { user_id: string; role: string }[];
    const coachAthleteLinks = (coachAthletesRes.data || []) as { coach_id: string; athlete_id: string }[];
    const clubMap = new Map<string, string>(
      ((((clubsRes.data as unknown as { id: string; name: string }[] | null) ?? [])).map((club) => [club.id, club.name]))
    );

    const coachSet = new Set(roles.filter(r => r.role === "coach").map(r => r.user_id));

    const athleteCoachMap: Record<string, string> = {};
    for (const link of coachAthleteLinks) {
      athleteCoachMap[link.athlete_id] = link.coach_id;
    }

    const coachProfiles = profiles.filter(p => coachSet.has(p.user_id));
    setCoaches(coachProfiles.map(p => ({ user_id: p.user_id, display_name: p.display_name })));

    const plansByUser: Record<string, UserPlan[]> = {};
    for (const p of plans) {
      if (!plansByUser[p.user_id]) plansByUser[p.user_id] = [];
      plansByUser[p.user_id].push(p);
    }

    const profileNameMap: Record<string, string> = {};
    for (const p of profiles) profileNameMap[p.user_id] = p.display_name;

    setUsers(profiles.map(p => ({
      ...p,
      club_name: p.club_id ? clubMap.get(p.club_id) || "" : "",
      email: emailMap[p.user_id] || "",
      plans: plansByUser[p.user_id] || [],
      isCoach: coachSet.has(p.user_id),
      coachId: athleteCoachMap[p.user_id] || null,
      coachName: athleteCoachMap[p.user_id] ? (profileNameMap[athleteCoachMap[p.user_id]] || "") : undefined,
    })));
    setLoading(false);
  };

  const handleDownloadPlan = async (plan: UserPlan) => {
    setDownloadingPlan(plan.id);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const schedule = plan.plan_data?.weeklySchedule || [];
      const margin = 15;
      const pageW = 210 - margin * 2;
      let y = margin;
      const addPage = () => { doc.addPage(); y = margin; };
      const checkSpace = (needed: number) => { if (y + needed > 280) addPage(); };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(plan.name, margin, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Generated ${new Date(plan.created_at).toLocaleDateString()}`, margin, y);
      y += 12;
      doc.setTextColor(0);

      for (const day of schedule) {
        checkSpace(30);
        doc.setFillColor(30, 35, 50);
        doc.roundedRect(margin, y, pageW, 10, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255);
        doc.text(`${day.dayOfWeek} — ${day.label}`, margin + 4, y + 7);
        doc.setTextColor(0);
        y += 14;

        if (day.exercises?.length > 0) {
          for (let j = 0; j < day.exercises.length; j++) {
            const ex = day.exercises[j];
            checkSpace(20);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(`${j + 1}. ${ex.name || ""}`, margin + 2, y);
            doc.setFont("helvetica", "normal");
            doc.text(`${ex.sets}×${ex.reps}  Rest: ${ex.rest || "—"}`, margin + 90, y);
            y += 5;
            if (ex.coachingCue) {
              doc.setFontSize(8);
              doc.setTextColor(80);
              const lines = doc.splitTextToSize(`Coaching: ${ex.coachingCue}`, pageW - 12);
              doc.text(lines, margin + 6, y);
              y += lines.length * 3.5;
              doc.setTextColor(0);
            }
            y += 2;
          }
        }
        y += 4;
      }

      doc.save(`${plan.name.replace(/\s+/g, "_")}.pdf`);
      toast({ title: "PDF downloaded!" });
    } catch {
      toast({ title: "PDF export failed", variant: "destructive" });
    } finally {
      setDownloadingPlan(null);
    }
  };

  const approveUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: true } as any)
      .eq("user_id", userId);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("userApproved") });
      loadUsers();
    }
  };

  const revokeUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: false } as any)
      .eq("user_id", userId);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("accessRevoked") });
      loadUsers();
    }
  };

  const toggleCoachRole = async (userId: string, isCurrentlyCoach: boolean) => {
    if (isCurrentlyCoach) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "coach" as any);
      toast({ title: t("coachRoleRevoked") });
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "coach" as any } as any);
      toast({ title: t("coachRoleGranted") });
    }
    loadUsers();
  };

  const deleteUser = async (userId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${displayName || "this user"}"? This cannot be undone.`)) return;
    setDeletingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "User deleted" });
      loadUsers();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setDeletingUser(null);
    }
  };

  const reassignAthlete = async (athleteId: string, newCoachId: string | null) => {
    setReassigning(athleteId);
    try {
      await supabase.from("coach_athletes").delete().eq("athlete_id", athleteId);
      if (newCoachId) {
        const { error } = await supabase.from("coach_athletes").insert({
          coach_id: newCoachId,
          athlete_id: athleteId,
        });
        if (error) throw error;
      }
      toast({ title: t("athleteReassigned") });
      await loadUsers();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setReassigning(null);
    }
  };

  const togglePayment = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    const updateData: any = { payment_status: newStatus };
    if (newStatus === "paid" && !users.find(u => u.user_id === userId)?.payment_date) {
      updateData.payment_date = new Date().toISOString().split("T")[0];
    }
    if (newStatus === "unpaid") {
      updateData.payment_date = null;
    }
    await supabase.from("profiles").update(updateData).eq("user_id", userId);
    toast({ title: newStatus === "paid" ? t("markedAsPaid" as any) : t("markedAsUnpaid" as any) });
    loadUsers();
  };

  const setPaymentDate = async (userId: string, date: Date | undefined) => {
    if (!date) return;
    await supabase.from("profiles").update({ payment_date: format(date, "yyyy-MM-dd"), payment_status: "paid" } as any).eq("user_id", userId);
    toast({ title: t("paymentDateUpdated" as any) });
    loadUsers();
  };

  const toggleDemo = async (userId: string, currentlyDemo: boolean) => {
    await supabase.from("profiles").update({ is_demo: !currentlyDemo } as any).eq("user_id", userId);
    toast({ title: !currentlyDemo ? t("markedAsDemo" as any) : t("demoRemoved" as any) });
    loadUsers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const pending = users.filter(u => !u.is_approved);
  const approved = users.filter(u => u.is_approved);

  const UserCard = ({ u, actions }: { u: PendingUser; actions: React.ReactNode }) => (
    <Collapsible>
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0">
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-foreground">{u.display_name || t("noName")}</p>
                {u.payment_status === "paid" && (
                  <Badge variant="default" className="text-[10px] h-5 bg-green-600">
                    <CreditCard className="h-2.5 w-2.5 mr-0.5" /> {t("paid" as any)}
                  </Badge>
                )}
                {u.is_demo && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    <FlaskConical className="h-2.5 w-2.5 mr-0.5" /> {t("demo" as any)}
                  </Badge>
                )}
                {u.isCoach && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> {t("coach")}
                  </Badge>
                )}
              </div>
              {u.email && <p className="text-xs text-muted-foreground text-left">{u.email}</p>}
              {u.club_name && <p className="text-[11px] text-muted-foreground text-left">{t("club")}: {u.club_name}</p>}
            </div>
          </CollapsibleTrigger>
          {actions}
        </div>

        <CollapsibleContent className="space-y-2">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {u.club_name && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {t("club")}: {u.club_name}
              </span>
            )}
            {u.belt_level && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                {u.belt_level} {t("belt")}
              </span>
            )}
            {u.age && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {u.age}y
              </span>
            )}
            {u.weight_kg && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {u.weight_kg}kg
              </span>
            )}
            {u.experience_years != null && u.experience_years > 0 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {u.experience_years}yr exp
              </span>
            )}
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {u.tkd_sessions_per_week}x {t("tkdPerWeek")}
            </span>
          </div>
          {u.goals && u.goals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {u.goals.map((g) => (
                <span key={g} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {t(g as any) || g}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            Joined: {new Date(u.created_at).toLocaleDateString()}
          </p>

          {/* Payment & Demo controls */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border mt-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t("paid" as any)}</span>
              <Switch
                checked={u.payment_status === "paid"}
                onCheckedChange={() => togglePayment(u.user_id, u.payment_status)}
                className="scale-75"
              />
            </div>
            {u.payment_status === "paid" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {u.payment_date ? format(new Date(u.payment_date), "dd/MM/yyyy") : t("setDate" as any)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={u.payment_date ? new Date(u.payment_date) : undefined}
                    onSelect={(date) => setPaymentDate(u.user_id, date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
            <div className="flex items-center gap-2">
              <FlaskConical className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t("demo" as any)}</span>
              <Switch
                checked={u.is_demo}
                onCheckedChange={() => toggleDemo(u.user_id, u.is_demo)}
                className="scale-75"
              />
            </div>
            {u.is_demo && u.payment_status !== "paid" && (
              <span className="text-[10px] text-destructive font-medium">
                {t("demoExpires14Days" as any)}
              </span>
            )}
          </div>

          {u.plans && u.plans.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border mt-2">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Plans ({u.plans.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {u.plans.map((plan) => (
                  <div key={plan.id} className="flex items-center gap-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={downloadingPlan === plan.id}
                      onClick={() => handleDownloadPlan(plan)}
                    >
                      {downloadingPlan === plan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      {plan.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      disabled={deletingPlan === plan.id}
                      onClick={async () => {
                        if (!confirm(`Delete plan "${plan.name}"?`)) return;
                        setDeletingPlan(plan.id);
                        try {
                          await supabase.from("training_plans").delete().eq("id", plan.id);
                          toast({ title: "Plan deleted" });
                          loadUsers();
                        } catch {
                          toast({ title: "Failed to delete", variant: "destructive" });
                        } finally {
                          setDeletingPlan(null);
                        }
                      }}
                    >
                      {deletingPlan === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Coach assignment */}
          {!u.isCoach && (
            <div className="flex items-center gap-2 pt-1 border-t border-border mt-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t("assignToCoach")}:</span>
              <Select
                value={u.coachId || "none"}
                onValueChange={(val) => reassignAthlete(u.user_id, val === "none" ? null : val)}
                disabled={reassigning === u.user_id}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder={t("selectCoach")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noCoach")}</SelectItem>
                  {coaches.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>{c.display_name || t("noName")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reassigning === u.user_id && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
          )}
          {/* Coach role toggle & delete */}
          <div className="flex items-center gap-2 pt-1 border-t border-border mt-2">
            <Button
              variant={u.isCoach ? "destructive" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleCoachRole(u.user_id, !!u.isCoach)}
            >
              <Shield className="h-3 w-3 mr-1" />
              {u.isCoach ? t("removeCoach") : t("makeCoach")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive ml-auto"
              disabled={deletingUser === u.user_id}
              onClick={() => deleteUser(u.user_id, u.display_name)}
            >
              {deletingUser === u.user_id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <><Trash2 className="h-3 w-3 mr-1" /> Delete</>
              )}
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/coach")}>
            <Shield className="h-4 w-4 mr-1" /> {t("coachDashboard")}
          </Button>
        </div>

        <h1 className="text-xl font-extrabold text-foreground mb-6">{t("userApproval")}</h1>

        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t("pendingUsers")} ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map(u => (
                <UserCard key={u.user_id} u={u} actions={
                  <Button size="sm" onClick={() => approveUser(u.user_id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> {t("approve")}
                  </Button>
                } />
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground mb-6">{t("noPendingUsers")}</p>
        )}

        {approved.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t("approvedUsers")} ({approved.length})
            </h2>
            <div className="space-y-3">
              {approved.map(u => (
                <UserCard key={u.user_id} u={u} actions={
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revokeUser(u.user_id)}>
                    <XCircle className="h-4 w-4 mr-1" /> {t("revoke")}
                  </Button>
                } />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
