import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Download, Trash2, AlertTriangle } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const cardCls = "rounded-xl bg-white/[0.03] border border-white/10 p-5 sm:p-6";
const sectionTitleCls = "text-xs uppercase tracking-wider text-white/35 mb-4";
const inputCls = "bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20";

const CONFIRM_PHRASE = "SLET";

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile({ ...data, email: user.email });
    })();
  }, [navigate]);

  const handleExport = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canDelete = confirmInput.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-my-account", {
        body: { confirmation: "DELETE MY ACCOUNT" },
      });
      if (error) throw error;
      toast.success(t("accountDeleted" as any) || "Konto slettet");
      await supabase.auth.signOut();
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Fejl");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0a0a0a" }}>
      <PageMeta title="Slet konto · Sportstalent" description="Delete account" noindex />
      <div className="mx-auto max-w-md px-4 py-6 space-y-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/profile")}
          className="-ml-2 text-white/70 hover:text-white hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("profileBack" as any)}
        </Button>

        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileExportData" as any) || "Download mine data"}</h2>
          <p className="text-sm text-white/60 mb-4">
            {t("exportBeforeDelete" as any) ||
              "Vi anbefaler at du downloader en kopi af dine data, før du sletter kontoen."}
          </p>
          <Button
            type="button"
            onClick={handleExport}
            variant="ghost"
            className="w-full h-11 border border-white/10 text-white hover:bg-white/5"
          >
            <Download className="h-4 w-4 mr-2" />
            {t("profileExportData" as any) || "Download mine data"}
          </Button>
        </div>

        <div
          className="rounded-xl p-5 sm:p-6 border"
          style={{ backgroundColor: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.3)" }}
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-red-400 mb-1">
                {t("deleteAccountConfirmTitle" as any) || "Slet konto permanent"}
              </h2>
              <p className="text-sm text-white/70">
                {t("deleteAccountConfirmDesc" as any) ||
                  "Denne handling sletter alle dine data permanent: træning, dagbog, vurderinger og profil."}
              </p>
              <p className="text-sm font-semibold text-red-400 mt-2">
                {t("deleteAccountIrreversible" as any) || "Handlingen kan ikke fortrydes."}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label className="text-xs uppercase tracking-wider text-white/45">
              {t("typeToConfirm" as any) || "Skriv"} <span className="text-red-400 font-bold">{CONFIRM_PHRASE}</span>{" "}
              {t("toConfirm" as any) || "for at bekræfte"}
            </Label>
            <Input
              className={inputCls}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
            />
          </div>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="w-full h-11 text-white font-medium"
            style={{ backgroundColor: canDelete ? "#dc2626" : "rgba(220,38,38,0.4)" }}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            {t("profileDeleteAccount" as any) || "Slet min konto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
