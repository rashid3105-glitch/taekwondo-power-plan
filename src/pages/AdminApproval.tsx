import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, ArrowLeft, Download, Shield, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

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
    const [profilesRes, emailsRes, plansRes, rolesRes, coachAthletesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, created_at, is_approved, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week")
        .order("created_at", { ascending: false }),
      supabase.functions.invoke("get-admin-users"),
      supabase
        .from("training_plans")
        .select("id, name, plan_data, created_at, user_id, is_active")
        .eq("is_active", true),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("coach_athletes").select("coach_id, athlete_id"),
    ]);

    const profiles = (profilesRes.data || []) as PendingUser[];
    const emailMap: Record<string, string> = emailsRes.data?.emailMap || {};
    const plans = (plansRes.data || []) as (UserPlan & { user_id: string })[];
    const roles = (rolesRes.data || []) as { user_id: string; role: string }[];
    const coachAthleteLinks = (coachAthletesRes.data || []) as { coach_id: string; athlete_id: string }[];

    const coachSet = new Set(roles.filter(r => r.role === "coach").map(r => r.user_id));

    // Build athlete->coach mapping
    const athleteCoachMap: Record<string, string> = {};
    for (const link of coachAthleteLinks) {
      athleteCoachMap[link.athlete_id] = link.coach_id;
    }

    // Build coach display name map
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
      email: emailMap[p.user_id] || "",
      plans: plansByUser[p.user_id] || [],
      isCoach: coachSet.has(p.user_id),
      coachId: athleteCoachMap[p.user_id] || null,
      coachName: athleteCoachMap[p.user_id] ? (profileNameMap[athleteCoachMap[p.user_id]] || "") : undefined,
    })));
    setLoading(false);
  };

  const [downloadingPlan, setDownloadingPlan] = useState<string | null>(null);

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

  const [deletingUser, setDeletingUser] = useState<string | null>(null);

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
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm text-foreground">{u.display_name || t("noName")}</p>
          {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
        </div>
        {actions}
      </div>
      <div className="flex flex-wrap gap-1.5">
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
      {u.plans && u.plans.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border mt-2">
          {u.plans.map((plan) => (
            <Button
              key={plan.id}
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
          ))}
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
        {u.isCoach && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
            {t("coach")}
          </span>
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
    </div>
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
