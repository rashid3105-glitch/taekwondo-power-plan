import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

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
}

export default function AdminApproval() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
    const [profilesRes, emailsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, created_at, is_approved, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week")
        .order("created_at", { ascending: false }),
      supabase.functions.invoke("get-admin-users"),
    ]);

    const profiles = (profilesRes.data || []) as PendingUser[];
    const emailMap: Record<string, string> = emailsRes.data?.emailMap || {};

    setUsers(profiles.map(p => ({ ...p, email: emailMap[p.user_id] || "" })));
    setLoading(false);
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
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
        </Button>

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
