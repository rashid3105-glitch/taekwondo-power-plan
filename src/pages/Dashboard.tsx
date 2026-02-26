import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, User, BookOpen, Plus, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIPlanCard } from "@/components/AIPlanCard";

interface Profile {
  display_name: string;
  age: number | null;
  weight_kg: number | null;
  belt_level: string;
  goals: string[];
  tkd_sessions_per_week: number;
  experience_years: number | null;
}

interface TrainingPlan {
  id: string;
  name: string;
  plan_data: any;
  is_active: boolean;
  created_at: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const [profileRes, plansRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("training_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
    if (plansRes.data) setPlans(plansRes.data as unknown as TrainingPlan[]);
    setLoading(false);
  };

  const generatePlan = async () => {
    if (!profile) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { profile },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("training_plans").insert({
        user_id: user.id,
        name: data.plan.planName || "AI Generated Plan",
        plan_data: data.plan,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast({ title: "Plan generated!", description: "Your AI-powered training plan is ready." });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activePlan = plans.find((p) => p.is_active);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-extrabold text-foreground">TKD POWER</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile-setup")}>
              <User className="h-4 w-4 mr-1" /> Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
              <BookOpen className="h-4 w-4 mr-1" /> Library
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile summary */}
        {profile && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground">
                  {profile.display_name || "Athlete"}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.belt_level && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full capitalize">
                      {profile.belt_level} belt
                    </span>
                  )}
                  {profile.age && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {profile.age} years old
                    </span>
                  )}
                  {profile.weight_kg && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {profile.weight_kg} kg
                    </span>
                  )}
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {profile.tkd_sessions_per_week}x TKD/week
                  </span>
                </div>
                {profile.goals?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.goals.map((g) => (
                      <span key={g} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={generatePlan} disabled={generating} size="sm">
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-1" /> Generate Plan</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Active plan */}
        {activePlan ? (
          <AIPlanCard plan={activePlan} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">No Training Plan Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Generate Plan" above to create an AI-powered training plan tailored to your profile.
            </p>
          </div>
        )}

        {/* Previous plans */}
        {plans.filter(p => !p.is_active).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Previous Plans</h3>
            <div className="space-y-3">
              {plans.filter(p => !p.is_active).map((plan) => (
                <div key={plan.id} className="rounded-lg border border-border bg-card/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(plan.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await supabase.from("training_plans").update({ is_active: false }).eq("user_id", user.id);
                    await supabase.from("training_plans").update({ is_active: true }).eq("id", plan.id);
                    loadData();
                  }}>
                    Activate
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
