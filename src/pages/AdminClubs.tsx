import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface Club {
  id: string;
  name: string;
  max_athletes: number;
}

export default function AdminClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!adminCheck) { navigate("/dashboard"); return; }
      setIsAdmin(true);

      const { data, error } = await supabase
        .from("clubs" as any)
        .select("id, name, max_athletes")
        .order("name");

      if (error) {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      } else {
        setClubs((data as unknown as Club[]) ?? []);
      }
      setLoading(false);
    };
    init();
  }, [navigate, t, toast]);

  const updateClubMaxAthletes = async (clubId: string, newMax: number) => {
    try {
      const { error } = await supabase.from("clubs" as any).update({ max_athletes: newMax } as any).eq("id", clubId);
      if (error) throw error;
      toast({ title: t("clubUpdated" as any) });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/approval")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
          </Button>
        </div>

        <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
          <Building className="h-5 w-5" /> {t("clubManagement" as any)}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clubs.map(club => (
            <div key={club.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground truncate">{club.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{t("maxAthletes" as any)}:</span>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={club.max_athletes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1) {
                      setClubs(prev => prev.map(c => c.id === club.id ? { ...c, max_athletes: val } : c));
                    }
                  }}
                  onBlur={() => updateClubMaxAthletes(club.id, club.max_athletes)}
                  className="w-16 h-8 text-xs text-center"
                />
              </div>
            </div>
          ))}
        </div>

        {clubs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No clubs found.</p>
        )}
      </div>
    </div>
  );
}
