import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Video as VideoIcon, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Watermark } from "@/components/Watermark";
import { AppFooter } from "@/components/AppFooter";
import { PageMeta } from "@/components/PageMeta";
import { MatchSummary } from "@/components/match/MatchSummary";
import { techniquesFor, type Discipline } from "@/lib/tkdTechniques";

interface SharedTag {
  id: string;
  timestamp_seconds: number;
  technique: string;
  side: "left" | "right" | "n/a";
  outcome: "scored" | "conceded" | "penalty" | "none";
  notes: string;
}

interface SharedVideo {
  id: string;
  title: string;
  notes: string;
  discipline: Discipline;
  opponent_name: string | null;
  event_name: string | null;
  match_date: string | null;
  duration_seconds: number | null;
}

export default function MatchShare() {
  const { token } = useParams<{ token: string }>();
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<SharedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<SharedTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [token]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/get-shared-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Not available");
      } else {
        setVideo(data.video);
        setVideoUrl(data.video_url);
        setTags(data.tags || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const techList = useMemo(() => techniquesFor((video?.discipline || "sparring") as Discipline), [video?.discipline]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  function jumpTo(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      <PageMeta title={video?.title ? `${video.title} · Match clip` : "Shared match clip"} description="Shared Taekwondo match clip" noindex />
      <Watermark />
      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto mt-12" />
        ) : error ? (
          <Card><CardContent className="pt-8 pb-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-amber-500" />
            <div className="text-sm text-muted-foreground">{t("matchShareUnavailable")}</div>
            <div className="text-xs text-muted-foreground mt-1">{error}</div>
          </CardContent></Card>
        ) : video ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <VideoIcon className="h-4 w-4 text-primary" />
                  {video.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {video.discipline === "poomsae" ? t("matchDisciplinePoomsae") : t("matchDisciplineSparring")}
                  </Badge>
                  {video.opponent_name && <Badge variant="outline" className="text-[10px]">vs {video.opponent_name}</Badge>}
                  {video.event_name && <Badge variant="outline" className="text-[10px]">{video.event_name}</Badge>}
                  {video.match_date && <Badge variant="outline" className="text-[10px]">{video.match_date}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {videoUrl && (
                  <video ref={videoRef} src={videoUrl} controls className="w-full rounded-lg border border-border bg-black" preload="metadata" />
                )}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("matchTagsCount", { count: String(tags.length) })}
                  </div>
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {tags.map((tag) => {
                      const techDef = techList.find((x) => x.key === tag.technique);
                      return (
                        <button key={tag.id} onClick={() => jumpTo(tag.timestamp_seconds)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-xs">
                          <span className="font-mono text-primary font-bold w-12">{fmt(tag.timestamp_seconds)}</span>
                          <span className="font-medium">{techDef ? t(techDef.labelKey as any) : tag.technique}</span>
                          {tag.side !== "n/a" && <Badge variant="outline" className="text-[9px] h-4">{tag.side === "left" ? "L" : "R"}</Badge>}
                          {tag.outcome !== "none" && <Badge variant="outline" className="text-[9px] h-4">{tag.outcome}</Badge>}
                          {tag.notes && <span className="text-muted-foreground truncate flex-1">{tag.notes}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            {tags.length > 0 && <MatchSummary tags={tags} discipline={video.discipline} />}
          </>
        ) : null}
      </div>
      <AppFooter />
    </div>
  );
}
