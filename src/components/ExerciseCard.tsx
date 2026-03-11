import { useState } from "react";
import { type Exercise, CATEGORY_LABELS } from "@/data/exercises";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";
import { MuscleGroupBadges } from "./MuscleIcon";

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || "";
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onVideoChange?: (exerciseId: string, newVideoId: string) => void;
}

export function ExerciseCard({ exercise, index, onVideoChange }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const handleEditVideo = () => {
    setVideoUrl(exercise.videoId ? `https://www.youtube.com/watch?v=${exercise.videoId}` : "");
    setEditingVideo(true);
  };

  const handleSaveVideo = () => {
    const newId = extractYouTubeId(videoUrl) || videoUrl.trim();
    onVideoChange?.(exercise.id, newId);
    setEditingVideo(false);
  };

  return (
    <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className={cn("h-2 w-2 rounded-full flex-shrink-0", CATEGORY_DOT[exercise.category])} />
        <span className="font-semibold text-sm text-foreground flex-1 text-left">{exercise.name}</span>
        <span className="text-xs text-muted-foreground mr-2">
          {exercise.sets}×{exercise.reps}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline px-2 py-0.5 rounded bg-muted">
          {CATEGORY_LABELS[exercise.category]}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 animate-slide-up">
          {/* Video embed */}
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
              {exercise.videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${exercise.videoId}`}
                  title={exercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  No video set
                </div>
              )}
            </div>
            {/* Edit video URL */}
            {editingVideo ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveVideo()}
                />
                <button onClick={handleSaveVideo} className="h-7 w-7 rounded-md bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingVideo(false)} className="h-7 w-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditVideo}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Change video
              </button>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-muted p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sets × Reps</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rest</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tempo</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>

          {/* Coaching notes */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Coaching: </span>
              {exercise.notes}
            </p>
            <p className="text-xs leading-relaxed text-primary/80">
              <span className="font-semibold text-primary">Why it matters for TKD: </span>
              {exercise.whyItMatters}
            </p>
          </div>

          {/* Alternatives */}
          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Alternatives</p>
              {exercise.alternatives.map((alt, k) => (
                <p key={k} className="text-xs text-foreground">
                  <span className="font-semibold">{alt.name}</span>
                  <span className="text-muted-foreground"> — {alt.reason}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
