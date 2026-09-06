import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  TrainingStatusRow,
  TrainingStatusValue,
  getLatestTrainingStatus,
  isTrainingStatusOutdated,
  recordTrainingStatus,
  trainingStatusTone,
} from "@/lib/trainingStatus";

const OPTIONS: TrainingStatusValue[] = ["cleared", "cleared_with_limits", "not_cleared"];

interface Props {
  athleteUserId: string;
  /** false = read-only view (e.g. coach reading an athlete's page) */
  canEdit?: boolean;
  /** Shown for coaches: status is registered from what they were told verbally */
  coachHint?: boolean;
  className?: string;
}

export function TrainingStatusLabel({ status }: { status: TrainingStatusValue }) {
  const { t } = useLanguage();
  if (status === "cleared") return <>{t("trainStatusCleared")}</>;
  if (status === "cleared_with_limits") return <>{t("trainStatusClearedLimits")}</>;
  return <>{t("trainStatusNotCleared")}</>;
}

export function TrainingStatusBadge({
  row,
  className,
}: {
  row: TrainingStatusRow | null;
  className?: string;
}) {
  const { t } = useLanguage();
  if (!row) return null;
  const outdated = isTrainingStatusOutdated(row);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        trainingStatusTone(row.status),
        outdated && "opacity-70 border-dashed",
        className,
      )}
      title={outdated ? t("trainStatusOutdated") : undefined}
    >
      <ShieldCheck className="h-3 w-3" />
      <TrainingStatusLabel status={row.status} />
      {outdated && <span>· {t("trainStatusOutdatedShort")}</span>}
    </span>
  );
}

export function TrainingStatusCard({ athleteUserId, canEdit = true, coachHint, className }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<TrainingStatusRow | null>(null);
  const [status, setStatus] = useState<TrainingStatusValue>("cleared");
  const [limitations, setLimitations] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const row = await getLatestTrainingStatus(athleteUserId);
      setCurrent(row);
      if (row) {
        setStatus(row.status);
        setLimitations(row.limitations || "");
        setReviewDate(row.review_date || "");
      }
    } catch {
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (athleteUserId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteUserId]);

  const save = async () => {
    setSaving(true);
    try {
      await recordTrainingStatus({
        athleteUserId,
        status,
        limitations,
        reviewDate: reviewDate || null,
      });
      toast({ title: t("trainStatusSaved") });
      await load();
    } catch {
      toast({ title: t("trainStatusSaveError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const outdated = isTrainingStatusOutdated(current);

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t("trainStatusTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{t("trainStatusDesc")}</p>
        </div>
        {current && <TrainingStatusBadge row={current} />}
      </div>

      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {!current && <p className="text-xs text-muted-foreground">{t("trainStatusNone")}</p>}

          {current && (
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
              <p className="text-xs text-foreground">
                {t("trainStatusUpdated").replace(
                  "{date}",
                  new Date(current.created_at).toLocaleDateString(),
                )}
              </p>
              {current.limitations && (
                <p className="text-xs text-muted-foreground">{current.limitations}</p>
              )}
              {current.review_date && (
                <p className="text-xs text-muted-foreground">
                  {t("trainStatusReviewOn").replace(
                    "{date}",
                    new Date(current.review_date).toLocaleDateString(),
                  )}
                </p>
              )}
              {outdated && (
                <p className="text-xs font-semibold text-primary">{t("trainStatusOutdated")}</p>
              )}
            </div>
          )}

          {canEdit && (
            <div className="space-y-3">
              {coachHint && (
                <p className="text-[11px] text-muted-foreground flex gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-px text-primary" />
                  {t("trainStatusCoachHint")}
                </p>
              )}

              <div className="grid gap-2">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatus(opt)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      status === opt
                        ? "border-primary bg-primary/10 text-foreground font-semibold"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <TrainingStatusLabel status={opt} />
                  </button>
                ))}
              </div>

              {status === "cleared_with_limits" && (
                <div>
                  <Label htmlFor="ts-limitations" className="text-xs">
                    {t("trainStatusLimitations")}
                  </Label>
                  <Textarea
                    id="ts-limitations"
                    value={limitations}
                    maxLength={300}
                    onChange={(e) => setLimitations(e.target.value.slice(0, 300))}
                    placeholder={t("trainStatusLimitationsPlaceholder")}
                    className="mt-1"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{limitations.length}/300</p>
                </div>
              )}

              <div>
                <Label htmlFor="ts-review" className="text-xs">
                  {t("trainStatusReviewDate")}
                </Label>
                <Input
                  id="ts-review"
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? t("saving") : t("trainStatusSave")}
              </Button>
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-muted-foreground border-t border-border/60 pt-2">
            {t("trainStatusNotMedical")}
          </p>
        </>
      )}
    </Card>
  );
}
