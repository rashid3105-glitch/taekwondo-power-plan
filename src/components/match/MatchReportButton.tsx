import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { generateMatchReportPdf, type MatchReport } from "@/lib/matchReportPdf";

interface Tag {
  technique: string;
  side: string;
  outcome: string;
  timestamp_seconds: number;
  notes: string;
}

interface VideoMeta {
  title: string;
  discipline: string;
  opponent_name?: string | null;
  event_name?: string | null;
  match_date?: string | null;
  duration_seconds?: number | null;
}

interface ProfileMeta {
  display_name: string;
  weight_category?: string | null;
  belt_level?: string | null;
}

interface Props {
  tags: Tag[];
  video: VideoMeta;
  profile: ProfileMeta | null;
}

export function MatchReportButton({ tags, video, profile }: Props) {
  const { toast } = useToast();
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);

  const minTags = 3;
  const enabled = tags.length >= minTags && !loading && !!profile;

  async function handleClick() {
    if (!enabled || !profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-match-report", {
        body: {
          tags: tags.map((tg) => ({
            technique: tg.technique,
            side: tg.side,
            outcome: tg.outcome,
            timestamp_seconds: tg.timestamp_seconds,
            notes: tg.notes || "",
          })),
          video,
          profile,
          language: lang,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "error");
      }
      const report = (data as any)?.report as MatchReport | undefined;
      if (!report) throw new Error("No report");
      generateMatchReportPdf(report, {
        athleteName: profile.display_name,
        videoTitle: video.title,
        matchDate: video.match_date || undefined,
      });
    } catch (e: any) {
      toast({ title: t("matchReportError"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const button = (
    <Button
      onClick={handleClick}
      disabled={!enabled}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      {loading ? t("matchReportGenerating") : t("matchGenerateReport")}
    </Button>
  );

  return (
    <div className="space-y-1">
      {tags.length < minTags ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><span>{button}</span></TooltipTrigger>
            <TooltipContent>{t("matchReportMinTags")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}
      <p className="text-xs text-muted-foreground">{t("matchReportHint")}</p>
    </div>
  );
}
