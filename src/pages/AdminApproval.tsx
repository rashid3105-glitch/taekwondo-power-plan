import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, ArrowLeft, Download, Shield, Trash2, Users, CreditCard, CalendarIcon, FlaskConical, ChevronDown, KeyRound, Search, Pencil, UserCheck, UserX, Crown, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { format } from "date-fns";
import { COUNTRIES } from "@/data/countries";

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
  demo_full_access?: boolean;
  club_id?: string | null;
  club_name?: string | null;
  email?: string;
  plans?: UserPlan[];
  isCoach?: boolean;
  coachId?: string | null;
  coachName?: string;
  discipline?: string;
  country?: string | null;
  current_injury?: string | null;
}

export default function AdminApproval() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [coaches, setCoaches] = useState<{ user_id: string; display_name: string }[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string; max_athletes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [downloadingPlan, setDownloadingPlan] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "paid" | "demo" | "coach">("all");
  const [sortBy, setSortBy] = useState<"name" | "club">("name");
  const [editingUser, setEditingUser] = useState<PendingUser | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!adminCheck) { navigate("/dashboard"); return; }
    setIsAdmin(true);
    await loadUsers();
  };

  const loadUsers = async () => {
    const [profilesRes, emailsRes, plansRes, rolesRes, coachAthletesRes, clubsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, created_at, is_approved, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week, payment_status, payment_date, is_demo, demo_full_access, club_id, discipline, country, current_injury")
        .order("created_at", { ascending: false }),
      supabase.functions.invoke("get-admin-users"),
      supabase
        .from("training_plans")
        .select("id, name, plan_data, created_at, user_id, is_active")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("coach_athletes").select("coach_id, athlete_id"),
      supabase.from("clubs" as any).select("id, name, max_athletes").order("name"),
    ]);

    const profiles = (profilesRes.data || []) as PendingUser[];
    const emailMap: Record<string, string> = emailsRes.data?.emailMap || {};
    const plans = (plansRes.data || []) as (UserPlan & { user_id: string })[];
    const roles = (rolesRes.data || []) as { user_id: string; role: string }[];
    const coachAthleteLinks = (coachAthletesRes.data || []) as { coach_id: string; athlete_id: string }[];
    const clubsList = ((clubsRes.data as unknown as { id: string; name: string; max_athletes: number }[] | null) ?? []);
    setClubs(clubsList);
    const clubMap = new Map<string, string>(clubsList.map((club) => [club.id, club.name]));

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
    })).sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
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

  const toggleDemoFullAccess = async (userId: string, currentValue: boolean) => {
    await supabase.from("profiles").update({ demo_full_access: !currentValue } as any).eq("user_id", userId);
    toast({ title: !currentValue ? "Fuld demo-adgang aktiveret" : "Fuld demo-adgang deaktiveret" });
    loadUsers();
  };

  const openEditDialog = (u: PendingUser) => {
    setEditForm({
      display_name: u.display_name || "",
      age: u.age ?? "",
      weight_kg: u.weight_kg ?? "",
      belt_level: u.belt_level || "white",
      experience_years: u.experience_years ?? "",
      tkd_sessions_per_week: u.tkd_sessions_per_week || 3,
      discipline: u.discipline || "sparring",
      country: u.country || "",
      current_injury: u.current_injury || "",
      club_id: u.club_id || "",
    });
    setEditingUser(u);
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const updateData: any = {
        display_name: editForm.display_name,
        belt_level: editForm.belt_level,
        discipline: editForm.discipline,
        tkd_sessions_per_week: Number(editForm.tkd_sessions_per_week) || 3,
        age: editForm.age ? Number(editForm.age) : null,
        weight_kg: editForm.weight_kg ? Number(editForm.weight_kg) : null,
        experience_years: editForm.experience_years ? Number(editForm.experience_years) : null,
        country: editForm.country || null,
        current_injury: editForm.current_injury || null,
        club_id: editForm.club_id || null,
      };
      const { error } = await supabase.from("profiles").update(updateData).eq("user_id", editingUser.user_id);
      if (error) throw error;
      toast({ title: "User updated" });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // Stats
  const totalUsers = users.length;
  const pendingCount = users.filter(u => !u.is_approved).length;
  const paidCount = users.filter(u => u.payment_status === "paid").length;
  const demoCount = users.filter(u => u.is_demo).length;
  const coachCount = users.filter(u => u.isCoach).length;

  // Filter & search
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (u.display_name || "").toLowerCase().includes(q) || 
      (u.email || "").toLowerCase().includes(q) ||
      (u.club_name || "").toLowerCase().includes(q);
    
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case "pending": return !u.is_approved;
      case "approved": return u.is_approved;
      case "paid": return u.payment_status === "paid";
      case "demo": return u.is_demo;
      case "coach": return u.isCoach;
      default: return true;
    }
  });

  const sortedFiltered = sortBy === "club"
    ? [...filteredUsers].sort((a, b) => {
        const clubA = (a.club_name || "zzz").toLowerCase();
        const clubB = (b.club_name || "zzz").toLowerCase();
        if (clubA !== clubB) return clubA.localeCompare(clubB);
        return (a.display_name || "").localeCompare(b.display_name || "");
      })
    : filteredUsers;

  const pending = sortedFiltered.filter(u => !u.is_approved);
  const approved = sortedFiltered.filter(u => u.is_approved);

  // Group by club for club sort mode
  const groupByClub = (list: PendingUser[]) => {
    const groups: { clubName: string; users: PendingUser[] }[] = [];
    const map = new Map<string, PendingUser[]>();
    for (const u of list) {
      const key = u.club_name || "No club";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }
    for (const [clubName, users] of map) {
      groups.push({ clubName, users });
    }
    return groups.sort((a, b) => {
      if (a.clubName === "No club") return 1;
      if (b.clubName === "No club") return -1;
      return a.clubName.localeCompare(b.clubName);
    });
  };

  const UserCard = ({ u, actions, showRevoke }: { u: PendingUser; actions: React.ReactNode; showRevoke?: boolean }) => (
    <Collapsible>
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0">
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium text-sm ${u.is_approved ? 'text-foreground' : 'text-yellow-400'}`}>{u.display_name || t("noName")}</p>
                {u.payment_status === "paid" && (
                  <Badge variant="default" className="text-[10px] h-5">
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
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {u.email && <p className="text-xs text-muted-foreground text-left">{u.email}</p>}
                {u.club_name && <span className="text-[10px] text-muted-foreground">• {u.club_name}</span>}
                {u.belt_level && <span className="text-[10px] text-muted-foreground capitalize">• {u.belt_level}</span>}
                {u.age && <span className="text-[10px] text-muted-foreground">• {u.age}y</span>}
              </div>
            </div>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(u)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {actions}
          </div>
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
            {u.discipline && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                {u.discipline}
              </span>
            )}
            {u.country && (
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {u.country}
              </span>
            )}
            {u.current_injury && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                Injury: {u.current_injury}
              </span>
            )}
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
            {u.is_demo && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Fuld adgang</span>
                <Switch
                  checked={!!u.demo_full_access}
                  onCheckedChange={() => toggleDemoFullAccess(u.user_id, !!u.demo_full_access)}
                  className="scale-75"
                />
              </div>
            )}
            {u.is_demo && !u.demo_full_access && (
              <span className="text-[10px] text-amber-500 font-medium">
                Kun træningsplanlægning
              </span>
            )}
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
          {/* Coach role toggle, reset password & delete */}
          <div className="flex items-center gap-2 pt-1 border-t border-border mt-2 flex-wrap">
            <Button
              variant={u.isCoach ? "destructive" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleCoachRole(u.user_id, !!u.isCoach)}
            >
              <Shield className="h-3 w-3 mr-1" />
              {u.isCoach ? t("removeCoach") : t("makeCoach")}
            </Button>
            {u.email && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={resettingPassword === u.user_id}
                onClick={async () => {
                  setResettingPassword(u.user_id);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(u.email!, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast({ title: t("resetPasswordSent" as any) || "Password reset email sent", description: u.email });
                  } catch (err: any) {
                    toast({ title: t("error"), description: err.message, variant: "destructive" });
                  } finally {
                    setResettingPassword(null);
                  }
                }}
              >
                {resettingPassword === u.user_id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <KeyRound className="h-3 w-3 mr-1" />
                )}
                {t("resetPassword" as any) || "Reset Password"}
              </Button>
            )}
            {showRevoke && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={() => revokeUser(u.user_id)}
              >
                <XCircle className="h-3 w-3 mr-1" /> {t("revoke")}
              </Button>
            )}
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
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Top nav */}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/coach")}>
            <Shield className="h-4 w-4 mr-1" /> {t("coachDashboard")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/payments")}>
            <CreditCard className="h-4 w-4 mr-1" /> {t("adminPayments" as any) || "Payments"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/clubs")}>
            <Building className="h-4 w-4 mr-1" /> {t("clubManagement" as any)}
          </Button>
        </div>

        <h1 className="text-xl font-extrabold text-foreground">{t("userApproval")}</h1>

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: totalUsers, icon: Users, color: "text-foreground" },
            { label: "Pending", value: pendingCount, icon: UserX, color: "text-yellow-400" },
            { label: "Paid", value: paidCount, icon: CreditCard, color: "text-green-400" },
            { label: "Demo", value: demoCount, icon: FlaskConical, color: "text-blue-400" },
            { label: "Coaches", value: coachCount, icon: Crown, color: "text-purple-400" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
                <Icon className={`h-4 w-4 mx-auto ${stat.color}`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="demo">Demo</SelectItem>
              <SelectItem value="coach">Coaches</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: A-Z</SelectItem>
              <SelectItem value="club">Sort: Club</SelectItem>
            </SelectContent>
          </Select>
        </div>




        {/* Pending users */}
        {pending.length > 0 && (
          <div>
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

        {pending.length === 0 && filterStatus !== "approved" && (
          <p className="text-sm text-muted-foreground">{t("noPendingUsers")}</p>
        )}

        {/* Approved users */}
        {approved.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t("approvedUsers")} ({approved.length})
            </h2>
            {sortBy === "club" ? (
              <div className="space-y-5">
                {groupByClub(approved).map(group => (
                  <div key={group.clubName}>
                    <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="h-3 w-3" /> {group.clubName} ({group.users.length})
                    </h3>
                    <div className="space-y-3">
                      {group.users.map(u => (
                        <UserCard key={u.user_id} u={u} showRevoke actions={null} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {approved.map(u => (
                  <UserCard key={u.user_id} u={u} showRevoke actions={null} />
                ))}
              </div>
            )}
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No users match your search.</p>
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Edit User: {editingUser?.display_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={editForm.display_name || ""} onChange={(e) => setEditForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" value={editForm.age || ""} onChange={(e) => setEditForm(f => ({ ...f, age: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" value={editForm.weight_kg || ""} onChange={(e) => setEditForm(f => ({ ...f, weight_kg: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Belt Level</Label>
                <Select value={editForm.belt_level || "white"} onValueChange={(v) => setEditForm(f => ({ ...f, belt_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["white", "yellow", "green", "blue", "red", "black", "1st dan", "2nd dan", "3rd dan", "4th dan", "5th dan"].map(b => (
                      <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience (years)</Label>
                <Input type="number" value={editForm.experience_years || ""} onChange={(e) => setEditForm(f => ({ ...f, experience_years: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sessions/week</Label>
                <Input type="number" value={editForm.tkd_sessions_per_week || 3} onChange={(e) => setEditForm(f => ({ ...f, tkd_sessions_per_week: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Discipline</Label>
                <Select value={editForm.discipline || "sparring"} onValueChange={(v) => setEditForm(f => ({ ...f, discipline: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["sparring", "poomsae", "both"].map(d => (
                      <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={editForm.country || "none"} onValueChange={(v) => setEditForm(f => ({ ...f, country: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No country</SelectItem>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Injury</Label>
              <Input value={editForm.current_injury || ""} onChange={(e) => setEditForm(f => ({ ...f, current_injury: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Club</Label>
              <Select value={editForm.club_id || "none"} onValueChange={(v) => setEditForm(f => ({ ...f, club_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No club</SelectItem>
                  {clubs.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={saveEditUser} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
