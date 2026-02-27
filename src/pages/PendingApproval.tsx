import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-extrabold text-foreground">{t("pendingApproval")}</h1>
        <p className="text-sm text-muted-foreground">{t("pendingApprovalDesc")}</p>
        <Button variant="outline" onClick={handleSignOut} className="w-full">
          <LogOut className="h-4 w-4 mr-2" /> {t("signOut")}
        </Button>
      </div>
    </div>
  );
}
