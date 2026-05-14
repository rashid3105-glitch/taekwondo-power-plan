import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Clock } from "lucide-react";

interface InviteInfo {
  valid: boolean;
  athlete_name?: string;
  athlete_belt?: string;
}

export default function ParentJoin() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: inv }, { data: { user } }] = await Promise.all([
        supabase.rpc("get_parent_invite_info" as any, { _code: code }),
        supabase.auth.getUser(),
      ]);
      setInfo((inv as any) || { valid: false });
      setSignedIn(!!user);
      setLoading(false);
    })();
  }, [code]);

  const accept = async () => {
    if (!code) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("accept_parent_invite" as any, { _code: code });
      if (error) throw error;
      const res = data as any;
      if (!res?.ok) throw new Error(res?.error || "Failed");
      toast({ title: t("parentJoinSuccess") });
      navigate("/parent-dashboard");
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {!info?.valid && (
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-extrabold">{t("joinInvalid")}</h1>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              {t("backToHome")}
            </Button>
          </div>
        )}

        {info?.valid && (
          <div className="text-center space-y-5">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">
                {t("parentJoinTitle")} {info.athlete_name}
              </h1>
              {info.athlete_belt && (
                <p className="text-sm text-muted-foreground capitalize mt-1">{info.athlete_belt}</p>
              )}
            </div>

            {signedIn ? (
              <div className="space-y-2">
                <Button onClick={accept} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("parentJoinConfirm")}
                </Button>
                <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
                  {t("noThanks")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => navigate(`/auth?tab=signup&redirect=${encodeURIComponent(`/parent-join/${code}`)}`)}
                  className="w-full"
                >
                  {t("joinSignupCta")}
                </Button>
                <Button
                  onClick={() => navigate(`/auth?tab=signin&redirect=${encodeURIComponent(`/parent-join/${code}`)}`)}
                  variant="outline"
                  className="w-full"
                >
                  {t("joinLoginCta")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
