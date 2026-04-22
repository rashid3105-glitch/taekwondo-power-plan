import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Share2, Video, Tag, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { techniquesFor, OUTCOMES, SIDES, type Discipline } from "@/lib/tkdTechniques";
import { MatchSummary } from "./MatchSummary";

interface MatchVideo {
  id: string;
  athlete_id: string;
  coach_id: string;
  title: string;
  notes: string;
  storage_path: string;
  duration_seconds: number | null;
  discipline: Discipline;
  opponent_name: string | null;
  event_name: string | null;
  match_date: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  created_at: string;
}

interface MatchTag {
  id: string;
  video_id: string;
  timestamp_seconds: number;
  technique: string;
  side: "left" | "right" | "n/a";
  outcome: "scored" | "conceded" | "penalty" | "none";
  notes: string;
}

interface VideoTaggerProps {
  video: MatchVideo;
  isCoach: boolean;
  onChanged?: () => void;
  onDeleted?: () => void;
}

export function VideoTagger({ video, isCoach, onChanged, onDeleted }: VideoTaggerProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<MatchTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Tag draft
  const [technique, setTechnique] = useState<string>("");
  const [side, setSide] = useState<"left" | "right" | "n/a">("n/a");
  const [outcome, setOutcome] = useState<"scored" | "conceded" | "penalty" | "none">("none");
  const [tagNote, setTagNote] = useState("");

  // Share state
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const techList = useMemo(() => techniquesFor(video.discipline), [video.discipline]);

  useEffect(() => {
    if (techList.length && !technique) setTechnique(techList[0].key);
  }, [techList, technique]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  async function load() {
    setLoading(true);
    const [signedRes, tagsRes] = await Promise.all([
      supabase.storage.from("match_videos").createSignedUrl(video.storage_path, 60 * 60),
      supabase.from("match_tags").select("*").eq("video_id", video.id).order("timestamp_seconds"),
    ]);
    if (signedRes.data?.signedUrl) setSignedUrl(signedRes.data.signedUrl);
    setTags((tagsRes.data || []) as MatchTag[]);
    setLoading(false);
  }

  async function addTag() {
    if (!videoRef.current) return;
    if (!technique) return;
    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(false); return; }
    const ts = Math.round(videoRef.current.currentTime * 10) / 10;
    const { error } = await supabase.from("match_tags").insert({
      video_id: video.id,
      timestamp_seconds: ts,
      technique,
      side,
      outcome,
      notes: tagNote,
      created_by: user.id,
    });
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      setTagNote("");
      await load();
      onChanged?.();
    }
    setAdding(false);
  }

  async function deleteTag(id: string) {
    const { error } = await supabase.from("match_tags").delete().eq("id", id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      await load();
      onChanged?.();
    }
  }

  function jumpTo(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  }

  async function shareClip() {
    setSharing(true);
    try {
      const { data, error } = await supabase.functions.invoke("share-match-video", {
        body: { video_id: video.id, action: "create" },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast({ title: t("matchShareCreated") });
      onChanged?.();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSharing(false);
    }
  }

  async function revokeShare() {
    setSharing(true);
    try {
      await supabase.functions.invoke("share-match-video", {
        body: { video_id: video.id, action: "revoke" },
      });
      toast({ title: t("matchShareRevoked") });
      onChanged?.();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSharing(false);
    }
  }

  async function deleteVideo() {
    if (!confirm(t("matchDeleteConfirm"))) return;
    await supabase.storage.from("match_videos").remove([video.storage_path]);
    await supabase.from("match_videos").delete().eq("id", video.id);
    onDeleted?.();
  }

  const shareUrl = video.share_token
    ? `${window.location.origin}/match/share/${video.share_token}`
    : "";

  function copyShareLink() {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4 text-primary" />
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
            </div>
            {isCoach && (
              <div className="flex gap-2">
                {video.share_token ? (
                  <Button size="sm" variant="outline" onClick={revokeShare} disabled={sharing}>
                    {t("matchRevokeShare")}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={shareClip} disabled={sharing}>
                    {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                    {t("matchShare")}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={deleteVideo}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          {shareUrl && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded text-xs">
              <span className="truncate flex-1 font-mono">{shareUrl}</span>
              <Button size="sm" variant="ghost" onClick={copyShareLink}>
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : signedUrl ? (
            <video
              ref={videoRef}
              src={signedUrl}
              controls
              className="w-full rounded-lg border border-border bg-black"
              preload="metadata"
            />
          ) : (
            <div className="text-sm text-muted-foreground">{t("matchVideoUnavailable")}</div>
          )}

          {isCoach && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {t("matchAddTag")}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">{t("matchTechnique")}</Label>
                  <Select value={technique} onValueChange={setTechnique}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {techList.map((tech) => (
                        <SelectItem key={tech.key} value={tech.key}>{t(tech.labelKey as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("matchSide")}</Label>
                  <Select value={side} onValueChange={(v) => setSide(v as any)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIDES.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{t(s.labelKey as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("matchOutcome")}</Label>
                  <Select value={outcome} onValueChange={(v) => setOutcome(v as any)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OUTCOMES.map((o) => (
                        <SelectItem key={o.key} value={o.key}>{t(o.labelKey as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("matchNoteOptional")}</Label>
                  <Input value={tagNote} onChange={(e) => setTagNote(e.target.value)} className="h-9" placeholder="…" />
                </div>
              </div>
              <Button onClick={addTag} disabled={adding} size="sm" className="w-full">
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                {t("matchTagAtCurrent")}
              </Button>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("matchTagsCount", { count: String(tags.length) })}
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {tags.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">{t("matchNoTags")}</div>
              ) : (
                tags.map((tag) => {
                  const techDef = techList.find((x) => x.key === tag.technique);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => jumpTo(tag.timestamp_seconds)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-xs group"
                    >
                      <span className="font-mono text-primary font-bold w-12">{fmt(tag.timestamp_seconds)}</span>
                      <span className="font-medium">{techDef ? t(techDef.labelKey as any) : tag.technique}</span>
                      {tag.side !== "n/a" && (
                        <Badge variant="outline" className="text-[9px] h-4">
                          {tag.side === "left" ? "L" : "R"}
                        </Badge>
                      )}
                      {tag.outcome !== "none" && (
                        <Badge
                          className={`text-[9px] h-4 ${
                            tag.outcome === "scored" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" :
                            tag.outcome === "conceded" ? "bg-rose-500/20 text-rose-700 dark:text-rose-300" :
                            "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          }`}
                          variant="outline"
                        >
                          {t(`matchOutcome${tag.outcome.charAt(0).toUpperCase() + tag.outcome.slice(1)}` as any)}
                        </Badge>
                      )}
                      {tag.notes && <span className="text-muted-foreground truncate flex-1">{tag.notes}</span>}
                      {isCoach && (
                        <Trash2
                          className="h-3 w-3 text-destructive opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); void deleteTag(tag.id); }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {tags.length > 0 && <MatchSummary tags={tags} discipline={video.discipline} />}
    </div>
  );
}
