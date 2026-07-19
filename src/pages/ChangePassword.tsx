import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, KeyRound } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { validatePassword } from "@/lib/passwordValidation";

const cardCls = "rounded-xl bg-white/[0.03] border border-white/10 p-5 sm:p-6";
const sectionTitleCls = "text-xs uppercase tracking-wider text-white/55 mb-4";
const inputCls = "bg-white/[0.04] border-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/20";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error(t("passwordsDoNotMatch" as any) || "Adgangskoderne matcher ikke");
      return;
    }
    const v = validatePassword(next);
    if (!v.ok) {
      toast.error(t(v.messageKey as any) || "Adgangskode for svag");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInErr) {
        toast.error(t("currentPasswordWrong" as any) || "Nuværende adgangskode er forkert");
        setSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;

      toast.success(t("passwordUpdated" as any) || "Adgangskode opdateret");
      navigate("/profile");
    } catch (e: any) {
      toast.error(e?.message || "Fejl");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0a0a0a" }}>
      <PageMeta title="Skift adgangskode · Sportstalent" description="Change password" noindex />
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
          <h2 className={sectionTitleCls}>
            <KeyRound className="inline h-3 w-3 mr-1" />
            {t("profileChangePassword" as any)}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/65">
                {t("currentPassword" as any) || "Nuværende adgangskode"}
              </Label>
              <Input
                type="password"
                className={inputCls}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/65">
                {t("newPassword" as any) || "Ny adgangskode"}
              </Label>
              <Input
                type="password"
                className={inputCls}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/65">
                {t("confirmNewPassword" as any) || "Bekræft ny adgangskode"}
              </Label>
              <Input
                type="password"
                className={inputCls}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-11 text-black font-medium"
              style={{ backgroundColor: "var(--accent-hex)" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("save" as any) || "Gem"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
