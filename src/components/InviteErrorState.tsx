import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { Clock, LinkIcon, Mail, Home } from "lucide-react";

interface Props {
  /** "expired" when the link existed but ran out, otherwise unknown/wrong link */
  reason?: string | null;
}

/**
 * Friendly, non-technical error screen for broken or expired invite links.
 * Used on /join, /invite and on 404s that look like invite links.
 */
export function InviteErrorState({ reason }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const expired = reason === "expired";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
          {expired ? (
            <Clock className="h-8 w-8 text-destructive" />
          ) : (
            <LinkIcon className="h-8 w-8 text-destructive" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-foreground">
            {expired ? t("inviteErrExpiredTitle") : t("inviteErrInvalidTitle")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {expired ? t("inviteErrExpiredDesc") : t("inviteErrInvalidDesc")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-left space-y-2">
          <p className="text-xs font-bold text-card-foreground">{t("inviteErrWhatToDo")}</p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
            <li>{t("inviteErrStep1")}</li>
            <li>{t("inviteErrStep2")}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full h-11 rounded-xl gap-2">
            <a href="mailto:kontakt@sportstalent.dk?subject=Invitationslink">
              <Mail className="h-4 w-4" /> {t("inviteErrContact")}
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl gap-2"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4" /> {t("backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
