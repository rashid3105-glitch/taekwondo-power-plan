import { useNavigate } from "react-router-dom";
import { openHealthConsent } from "@/lib/healthConsent";
import { useLanguage } from "@/i18n/LanguageContext";

/** Neutral notice shown instead of readiness/weight inputs without health-data consent. */
export function HealthConsentNotice({ coach = false }: { coach?: boolean }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  if (coach) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        {t("squadConsentMissing")}
      </p>
    );
  }
  return (
    <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
      {t("healthConsentRequiredReadinessWeight")}{" "}
      <button type="button" onClick={() => openHealthConsent(navigate)} className="underline underline-offset-2 text-primary">
        {t("diaryMoodConsentLink")}
      </button>
    </p>
  );
}
