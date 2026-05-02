import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, User, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("rejection_reason")
        .eq("user_id", user.id)
        .maybeSingle();
      setRejectionReason((data as any)?.rejection_reason || null);
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isRejected = !!rejectionReason;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full mx-auto ${isRejected ? "bg-destructive/10" : "bg-muted"}`}>
          {isRejected ? <XCircle className="h-8 w-8 text-destructive" /> : <Clock className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h1 className="text-xl font-extrabold text-foreground">
          {isRejected ? t("requestRejected") : t("pendingApproval")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRejected ? t("requestRejectedDesc") : t("pendingApprovalDesc")}
        </p>
        {isRejected && rejectionReason && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {rejectionReason}
          </div>
        )}
        {!isRejected && (
          <Button variant="outline" onClick={() => navigate("/profile-setup")} className="w-full">
            <User className="h-4 w-4 mr-2" /> {t("athleteProfile")}
          </Button>
        )}
        <Button variant="ghost" onClick={handleSignOut} className="w-full">
          <LogOut className="h-4 w-4 mr-2" /> {t("signOut")}
        </Button>
      </div>
    </div>
  );
}
