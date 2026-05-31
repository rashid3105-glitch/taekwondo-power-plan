import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Share2, Video, Tag, Copy, Check, WifiOff, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { techniquesFor, OUTCOMES, SIDES, type Discipline } from "@/lib/tkdTechniques";
import { MatchSummary } from "./MatchSummary";
import { MatchReportButton } from "./MatchReportButton";
import { ClubTechniquesDialog, type ClubTechnique } from "./ClubTechniquesDialog";
import { Settings2 } from "lucide-react";
import {
  getCachedVideo, queueTagInsert, queueTagDelete, listPendingTagInsertsForVideo,
  removePendingTagInsert, makeTempId, type PendingTagInsert,
} from "@/lib/matchOfflineDB";
import { VideoScrubber } from "./VideoScrubber";
import { NoteEditor, NotesList, NoteOverlayMarkers, useVideoNotes } from "./VideoNotes";

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
  poomsae_type?: "individual" | "pair" | "team" | null;
  athlete_age?: string | null;
}

interface MatchTag {
  id: string;
  video_id: string;
  timestamp_seconds: number;
  technique: string;
  side: "left" | "right" | "n/a";
  outcome: "scored" | "conceded" | "penalty" | "none";
  notes: string;
  __pending?: boolean;
}

interface VideoTaggerProps {
  video: MatchVideo;
  isCoach: boolean;
  /** True only for the actual video owner (coach). Gates destructive/share actions. */
  isOwner?: boolean;
  isOffline?: boolean;
  isCached?: boolean;
  onChanged?: () => void;
  onDeleted?: () => void;
}

export function VideoTagger({ video, isCoach, isOwner = false, isOffline = false, isCached = false, onChanged, onDeleted }: VideoTaggerProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [tags, setTags] = useState<MatchTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const [duration, setDuration] = useState<number>(video.duration_seconds || 0);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [speed, setSpeed] = useState<number>(1);
  const [hoverTag, setHoverTag] = useState<MatchTag | null>(null);
  const [myProfile, setMyProfile] = useState<{ display_name: string; belt_level?: string | null; weight_category?: string | null } | null>(null);

  // Tag draft
  const [technique, setTechnique] = useState<string>("");
  const [side, setSide] = useState<"left" | "right" | "n/a">("n/a");
  const [outcome, setOutcome] = useState<"scored" | "conceded" | "penalty" | "none">("none");
  const [tagNote, setTagNote] = useState("");

  // Share state
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Club-defined techniques
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubTechs, setClubTechs] = useState<ClubTechnique[]>([]);
  const [techDialogOpen, setTechDialogOpen] = useState(false);

  // Frame stepping
  const FPS = 30;
  const FRAME = 1 / FPS;
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const totalFrames = Math.max(0, Math.floor((duration || 0) * FPS));

  // Per-user notes
  const { notes, reload: reloadNotes } = useVideoNotes(video.id);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteFrame, setNoteFrame] = useState(0);

  function stepFrame(dir: number) {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration || videoRef.current.duration || 0, videoRef.current.currentTime + dir * FRAME),
    );
  }

  function seekToFrame(frame: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration || videoRef.current.duration || 0, frame / FPS));
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }

  function openNoteEditor() {
    setNoteFrame(currentFrame);
    if (videoRef.current) videoRef.current.pause();
    setNoteEditorOpen(true);
  }

  // Annotation state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const [savedPaths, setSavedPaths] = useState<{ points: [number, number][]; color: string }[]>([]);
  const DRAW_COLOR = "#ef4444";

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const redrawCanvas = (paths: { points: [number, number][]; color: string }[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const path of paths) {
      if (!path.points?.length) continue;
      ctx.beginPath();
      ctx.strokeStyle = path.color ?? DRAW_COLOR;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(path.points[0][0] * canvas.width, path.points[0][1] * canvas.height);
      for (const [x, y] of path.points.slice(1)) {
        ctx.lineTo(x * canvas.width, y * canvas.height);
      }
      ctx.stroke();
    }
  };

  const loadAnnotations = async () => {
    if (!videoRef.current) return;
    const ts = Math.round(videoRef.current.currentTime * 10) / 10;
    const { data } = await (supabase.from as any)("video_annotations")
      .select("paths, color")
      .eq("video_id", video.id)
      .gte("timestamp_seconds", ts - 2)
      .lte("timestamp_seconds", ts + 2)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data?.[0]) {
      const paths = (data[0].paths as any[]).map((p: any) => ({ points: p.points, color: p.color ?? DRAW_COLOR }));
      setSavedPaths(paths);
      redrawCanvas(paths);
    } else {
      setSavedPaths([]);
      clearCanvas();
    }
  };

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement): [number, number] => {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return [(clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height];
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawMode || !canvasRef.current) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getCanvasPos(e, canvasRef.current);
    setCurrentPath([pos]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !drawMode || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e, canvas);
    setCurrentPath((prev) => {
      const next = [...prev, pos];
      if (prev.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = DRAW_COLOR;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.moveTo(prev[prev.length - 1][0] * canvas.width, prev[prev.length - 1][1] * canvas.height);
        ctx.lineTo(pos[0] * canvas.width, pos[1] * canvas.height);
        ctx.stroke();
      }
      return next;
    });
  };

  const endDraw = async () => {
    if (!isDrawing || !drawMode) return;
    setIsDrawing(false);
    if (currentPath.length < 2) {
      setCurrentPath([]);
      return;
    }
    const newPath = { points: currentPath, color: DRAW_COLOR };
    const allPaths = [...savedPaths, newPath];
    setSavedPaths(allPaths);
    setCurrentPath([]);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !videoRef.current) return;
    const ts = Math.round(videoRef.current.currentTime * 10) / 10;
    await (supabase.from as any)("video_annotations").insert({
      video_id: video.id,
      created_by: user.id,
      timestamp_seconds: ts,
      paths: allPaths,
      color: DRAW_COLOR,
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const clearAnnotations = async () => {
    setSavedPaths([]);
    clearCanvas();
    await (supabase.from as any)("video_annotations")
      .delete()
      .eq("video_id", video.id);
  };

  const techList = useMemo(() => techniquesFor(video.discipline), [video.discipline]);

  useEffect(() => {
    if (techList.length && !technique) setTechnique(techList[0].key);
  }, [techList, technique]);

  useEffect(() => {
    void load();
    void loadMyProfile();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      loadedKeyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id, isOffline, isCached]);

  async function loadMyProfile() {
    if (isOffline) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, belt_level, weight_kg, club_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setMyProfile({
        display_name: (data as any).display_name || "Athlete",
        belt_level: (data as any).belt_level || null,
        weight_category: (data as any).weight_kg ? `${(data as any).weight_kg} kg` : null,
      });
      const cid = (data as any).club_id as string | null;
      setClubId(cid);
      if (cid) void loadClubTechs(cid);
    }
  }

  async function loadClubTechs(cid: string) {
    const { data } = await (supabase.from as any)("club_techniques")
      .select("id, name, category, discipline")
      .eq("club_id", cid)
      .in("discipline", [video.discipline, "both"])
      .order("name");
    setClubTechs((data ?? []) as ClubTechnique[]);
  }

  async function load() {
    // Skip if we already loaded this exact source – prevents the <video>
    // element from being torn down (and restarting at 0) on parent re-renders
    // that happen after adding/deleting a tag.
    const key = `${video.id}|${isOffline ? "off" : "on"}|${isCached ? "c" : "n"}`;
    if (loadedKeyRef.current === key && videoSrc) {
      return;
    }
    loadedKeyRef.current = key;
    setLoading(true);
    // Clean up previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Resolve playback source: prefer cached blob if available; fall back to signed URL when online.
    let src: string | null = null;
    let serverTags: MatchTag[] = [];

    if (isCached) {
      const cached = await getCachedVideo(video.id);
      if (cached) {
        const url = URL.createObjectURL(cached.blob);
        objectUrlRef.current = url;
        src = url;
      }
    }
    if (!src && !isOffline) {
      const { data: signed } = await supabase.storage
        .from("match_videos").createSignedUrl(video.storage_path, 60 * 60);
      if (signed?.signedUrl) src = signed.signedUrl;
    }
    setVideoSrc(src);

    if (!isOffline) {
      const { data: tagsRes } = await supabase
        .from("match_tags").select("*").eq("video_id", video.id).order("timestamp_seconds");
      serverTags = (tagsRes || []) as MatchTag[];
    }

    // Merge with locally-pending tag inserts for this video
    const pending = await listPendingTagInsertsForVideo(video.id);
    const pendingTags: MatchTag[] = pending.map((p) => ({
      id: p.id,
      video_id: video.id,
      timestamp_seconds: p.timestamp_seconds,
      technique: p.technique,
      side: p.side as MatchTag["side"],
      outcome: p.outcome as MatchTag["outcome"],
      notes: p.notes,
      __pending: true,
    }));

    const merged = [...serverTags, ...pendingTags].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
    setTags(merged);
    setLoading(false);
  }

  async function addTag() {
    if (!videoRef.current) return;
    if (!technique) return;
    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(false); return; }
    const ts = Math.round(videoRef.current.currentTime * 10) / 10;

    if (navigator.onLine && !isOffline) {
      const { data: inserted, error } = await supabase.from("match_tags").insert({
        video_id: video.id,
        timestamp_seconds: ts,
        technique, side, outcome, notes: tagNote,
        created_by: user.id,
      }).select().single();
      if (error) {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      } else {
        setTagNote("");
        if (inserted) {
          setTags((prev) => [...prev, inserted as MatchTag].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
        }
        onChanged?.();
      }
    } else {
      const pending: PendingTagInsert = {
        id: makeTempId("tag"),
        video_id: video.id,
        timestamp_seconds: ts,
        technique, side, outcome, notes: tagNote,
        created_by: user.id,
        created_at: Date.now(),
      };
      await queueTagInsert(pending);
      toast({ title: t("matchOfflinePendingTag") });
      setTagNote("");
      setTags((prev) => [...prev, {
        id: pending.id,
        video_id: video.id,
        timestamp_seconds: ts,
        technique, side, outcome, notes: tagNote,
        __pending: true,
      }].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      onChanged?.();
    }
    setAdding(false);
  }

  async function deleteTag(id: string, isPending: boolean) {
    if (isPending) {
      await removePendingTagInsert(id);
      setTags((prev) => prev.filter((x) => x.id !== id));
      onChanged?.();
      return;
    }
    if (navigator.onLine && !isOffline) {
      const { error } = await supabase.from("match_tags").delete().eq("id", id);
      if (error) {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      } else {
        setTags((prev) => prev.filter((x) => x.id !== id));
        onChanged?.();
      }
    } else {
      await queueTagDelete({
        id: makeTempId("del"),
        tag_id: id,
        video_id: video.id,
        created_at: Date.now(),
      });
      toast({ title: t("matchOfflineDeleteQueued") });
      setTags((prev) => prev.filter((x) => x.id !== id));
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

  const onlineActionsDisabled = isOffline || !navigator.onLine;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4 text-primary" />
                {video.title}
                {isCached && (
                  <Badge variant="outline" className="text-[9px] h-4">
                    {t("matchOfflineCached")}
                  </Badge>
                )}
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
            {isCoach && !onlineActionsDisabled && (
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
            {onlineActionsDisabled && (
              <Badge variant="outline" className="gap-1 text-destructive border-destructive/40">
                <WifiOff className="h-3 w-3" /> {t("matchOfflineNoConnection")}
              </Badge>
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
          <div className={isCoach ? "grid gap-4 lg:grid-cols-[1fr_320px]" : ""}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : videoSrc ? (
              <div className="space-y-2">
                <div className="flex justify-center bg-black rounded-lg border border-border overflow-hidden">
                  <div className="relative inline-block">
                    <video
                      ref={videoRef}
                      src={videoSrc}
                      controls
                      playsInline
                      tabIndex={0}
                      {...({ "webkit-playsinline": "true" } as any)}
                      x-webkit-airplay="allow"
                      controlsList="nodownload"
                      className="max-h-[70vh] max-w-full h-auto w-auto object-contain block"
                      style={{ aspectRatio: String(aspectRatio) }}
                      preload="metadata"
                      onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") { e.preventDefault(); stepFrame(-1); }
                        if (e.key === "ArrowRight") { e.preventDefault(); stepFrame(1); }
                      }}
                      onLoadedMetadata={(e) => {
                        const v = e.target as HTMLVideoElement;
                        if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
                        if (v.videoWidth > 0 && v.videoHeight > 0) {
                          setAspectRatio(v.videoWidth / v.videoHeight);
                        }
                        try { v.playbackRate = speed; } catch {}
                        if (lastTimeRef.current > 0 && Math.abs(v.currentTime - lastTimeRef.current) > 0.25) {
                          try { v.currentTime = lastTimeRef.current; } catch {}
                        }
                        if (wasPlayingRef.current) {
                          void v.play().catch(() => {});
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const v = e.target as HTMLVideoElement;
                        lastTimeRef.current = v.currentTime;
                        setCurrentFrame(Math.round(v.currentTime * FPS));
                      }}
                      onPlay={() => { wasPlayingRef.current = true; setIsPlaying(true); }}
                      onPause={(e) => {
                        wasPlayingRef.current = false;
                        setIsPlaying(false);
                        lastTimeRef.current = (e.target as HTMLVideoElement).currentTime;
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={Math.round(800 / aspectRatio)}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                      className="absolute inset-0 w-full h-full"
                      style={{
                        cursor: drawMode ? "crosshair" : "default",
                        pointerEvents: drawMode ? "all" : "none",
                        touchAction: drawMode ? "none" : "auto",
                      }}
                    />
                    {/* Note markers overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <NoteOverlayMarkers notes={notes} totalFrames={totalFrames} onJump={seekToFrame} />
                    </div>
                    {/* + Add note button */}
                    <button
                      type="button"
                      onClick={openNoteEditor}
                      className="absolute bottom-3 right-3 px-3 h-9 rounded-full text-xs font-semibold text-black shadow-lg flex items-center gap-1 z-10"
                      style={{ background: "#F5A623" }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("videoNoteAdd")}
                    </button>
                  </div>
                </div>

                {/* New tick-scrubber with controls + speed pills */}
                <VideoScrubber
                  currentFrame={currentFrame}
                  totalFrames={totalFrames}
                  isPlaying={isPlaying}
                  speed={speed}
                  noteFrames={notes.map((n) => n.frame_number)}
                  onSeek={seekToFrame}
                  onStep={(d) => stepFrame(d)}
                  onTogglePlay={togglePlay}
                  onSpeed={(s) => {
                    setSpeed(s);
                    if (videoRef.current) videoRef.current.playbackRate = s;
                  }}
                />

                {/* Note editor panel */}
                {noteEditorOpen && (
                  <NoteEditor
                    videoId={video.id}
                    frameNumber={noteFrame}
                    onClose={() => setNoteEditorOpen(false)}
                    onSaved={() => void reloadNotes()}
                  />
                )}
                {isCoach && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant={drawMode ? "default" : "outline"}
                      className={`h-7 px-3 text-xs gap-1.5 ${drawMode ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setDrawMode((d) => !d);
                        if (!drawMode) void loadAnnotations();
                      }}
                    >
                      ✏️ {drawMode ? t("annotationModeOn") : t("annotationMode")}
                    </Button>
                    {savedPaths.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs gap-1.5"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clearAnnotations}
                      >
                        🗑 {t("annotationClear")}
                      </Button>
                    )}
                  </div>
                )}
                {/* Clickable timeline markers */}
                {duration > 0 && (
                  <div className="relative h-7 mt-1">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-muted" />
                    {tags.map((tag) => {
                      const pct = Math.min(100, Math.max(0, (tag.timestamp_seconds / duration) * 100));
                      const color =
                        tag.outcome === "scored" ? "bg-emerald-500 hover:bg-emerald-400" :
                        tag.outcome === "conceded" ? "bg-rose-500 hover:bg-rose-400" :
                        tag.outcome === "penalty" ? "bg-amber-500 hover:bg-amber-400" :
                        "bg-primary hover:bg-primary/80";
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => jumpTo(tag.timestamp_seconds)}
                          onMouseEnter={() => setHoverTag(tag)}
                          onMouseLeave={() => setHoverTag((p) => (p?.id === tag.id ? null : p))}
                          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full ring-2 ring-background transition-transform hover:scale-125 ${color}`}
                          style={{ left: `${pct}%` }}
                          title={`${fmt(tag.timestamp_seconds)} — ${tag.notes || tag.technique}`}
                          aria-label={`${fmt(tag.timestamp_seconds)} ${tag.technique}`}
                        />
                      );
                    })}
                    {hoverTag && (
                      <div
                        className="absolute -top-7 z-10 -translate-x-1/2 px-2 py-0.5 rounded bg-foreground text-background text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-md"
                        style={{ left: `${Math.min(100, Math.max(0, (hoverTag.timestamp_seconds / duration) * 100))}%` }}
                      >
                        {fmt(hoverTag.timestamp_seconds)}{hoverTag.notes ? ` · ${hoverTag.notes}` : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{t("matchVideoUnavailable")}</div>
            )}

            {isCoach && (
              <div className="rounded-lg border border-border p-3 space-y-2 lg:max-h-[400px] lg:overflow-auto">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {t("matchAddTag")}
                  {onlineActionsDisabled && (
                    <Badge variant="outline" className="ml-1 text-[9px] h-4">
                      <CloudUpload className="h-2.5 w-2.5 mr-0.5" />
                      {t("matchOfflinePendingTag")}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <Label className="text-xs">{t("matchTechnique")}</Label>
                      {isCoach && clubId && (
                        <button
                          type="button"
                          onClick={() => setTechDialogOpen(true)}
                          className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <Settings2 className="h-3 w-3" />
                          {t("matchManageTechniques")}
                        </button>
                      )}
                    </div>
                    <Select value={technique} onValueChange={setTechnique}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {techList.map((tech) => (
                          <SelectItem key={tech.key} value={tech.key}>{t(tech.labelKey as any)}</SelectItem>
                        ))}
                        {clubTechs.length > 0 && (
                          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-t mt-1 pt-2">
                            {t("matchClubTechniques")}
                          </div>
                        )}
                        {clubTechs.map((ct) => (
                          <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>
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
                <Button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    void addTag();
                  }}
                  disabled={adding}
                  size="sm"
                  className="w-full"
                >
                  {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                  {t("matchTagAtCurrent")}
                </Button>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("matchTagsCount")} ({tags.length})
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {tags.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">{t("matchNoTags")}</div>
              ) : (
                tags.map((tag) => {
                  const techDef = techList.find((x) => x.key === tag.technique);
                  const techLabel = techDef ? t(techDef.labelKey as any) : tag.technique;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => jumpTo(tag.timestamp_seconds)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-xs group"
                    >
                      <span className="font-mono text-primary font-bold w-12">{fmt(tag.timestamp_seconds)}</span>
                      <span className="font-medium">{techLabel}</span>
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
                      {tag.__pending && (
                        <Badge variant="outline" className="text-[9px] h-4">
                          <CloudUpload className="h-2.5 w-2.5 mr-0.5" />
                          {t("matchOfflinePendingBadge")}
                        </Badge>
                      )}
                      {tag.notes && <span className="text-muted-foreground flex-1 whitespace-normal break-words">{tag.notes}</span>}
                      {isCoach && (
                        <Trash2
                          className="h-3 w-3 text-destructive opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); void deleteTag(tag.id, !!tag.__pending); }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Personal notes list */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("videoNoteAdd")} ({notes.length})
            </div>
            <NotesList notes={notes} onJump={seekToFrame} onDeleted={() => void reloadNotes()} />
          </div>
        </CardContent>
      </Card>

      <MatchReportButton
        tags={tags.map((tg) => ({
          technique: tg.technique,
          side: tg.side,
          outcome: tg.outcome,
          timestamp_seconds: tg.timestamp_seconds,
          notes: tg.notes || "",
        }))}
        video={{
          title: video.title,
          discipline: video.discipline,
          opponent_name: video.opponent_name,
          event_name: video.event_name,
          match_date: video.match_date,
          duration_seconds: video.duration_seconds,
          poomsae_type: video.poomsae_type ?? null,
          athlete_age: video.athlete_age ?? null,
        }}
        profile={myProfile}
      />
      {tags.length > 0 && <MatchSummary tags={tags} discipline={video.discipline} />}
      {isCoach && clubId && (
        <ClubTechniquesDialog
          open={techDialogOpen}
          onOpenChange={setTechDialogOpen}
          clubId={clubId}
          discipline={video.discipline}
          onChanged={() => { if (clubId) void loadClubTechs(clubId); }}
        />
      )}
    </div>
  );
}
