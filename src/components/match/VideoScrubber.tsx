import { useEffect, useRef, useState } from "react";
import { Play, Pause, Repeat, X } from "lucide-react";

export interface TimelineMarker {
  id: string;
  time: number;
  kind: "tag" | "note";
  color: string;
  label: string;
}

interface VideoScrubberProps {
  currentTime: number;
  duration: number;
  fps: number;
  isPlaying: boolean;
  speed: number;
  markers?: TimelineMarker[];
  loopStart: number | null;
  loopEnd: number | null;
  onSeek: (seconds: number) => void;
  onStep: (frames: number) => void;
  onTogglePlay: () => void;
  onSpeed: (s: number) => void;
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onClearLoop: () => void;
  labels: {
    frame: string;
    loopStart: string;
    loopEnd: string;
    loopClear: string;
  };
}

const TICK_SPACING = 10; // px per frame

function accent() {
  return "hsl(var(--video-analysis-accent))";
}

export function VideoScrubber({
  currentTime, duration, fps, isPlaying, speed, markers = [],
  loopStart, loopEnd, onSeek, onStep, onTogglePlay, onSpeed,
  onSetLoopStart, onSetLoopEnd, onClearLoop, labels,
}: VideoScrubberProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startTime: number } | null>(null);
  const [activeMarker, setActiveMarker] = useState<TimelineMarker | null>(null);

  const currentFrame = Math.round(currentTime * fps);
  const totalFrames = Math.max(0, Math.floor(duration * fps));

  // Draw the tick strip
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (canvas.width !== Math.round(cssWidth * dpr)) {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const centerX = cssWidth / 2;
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const framesEachSide = Math.ceil(cssWidth / 2 / TICK_SPACING) + 2;
    const startFrame = Math.max(0, currentFrame - framesEachSide);
    const endFrame = Math.min(totalFrames, currentFrame + framesEachSide);

    for (let f = startFrame; f <= endFrame; f++) {
      const x = centerX + (f - currentFrame) * TICK_SPACING;
      const isMajor = f % 10 === 0;
      const h = isMajor ? cssHeight * 0.55 : cssHeight * 0.25;
      ctx.strokeStyle = isMajor ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, (cssHeight - h) / 2);
      ctx.lineTo(x, (cssHeight + h) / 2);
      ctx.stroke();
      if (isMajor) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(f), x, cssHeight - 2);
      }
    }

    // Marker dots near the playhead
    for (const m of markers) {
      const x = centerX + (m.time - currentTime) * fps * TICK_SPACING;
      if (x < -5 || x > cssWidth + 5) continue;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(x, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center playhead
    ctx.fillStyle = accent();
    ctx.fillRect(centerX - 1.5, 0, 3, cssHeight);
    ctx.beginPath();
    ctx.moveTo(centerX - 6, 0);
    ctx.lineTo(centerX + 6, 0);
    ctx.lineTo(centerX, 6);
    ctx.closePath();
    ctx.fill();
  }, [currentTime, currentFrame, totalFrames, markers, fps]);

  // Pointer drag scrubbing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = { startX: e.clientX, startTime: currentTime };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const next = Math.max(0, Math.min(duration, dragRef.current.startTime - dx / TICK_SPACING / fps));
      onSeek(next);
    };
    const onUp = () => { dragRef.current = null; };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [currentTime, duration, fps, onSeek]);

  const speeds = [0.1, 0.25, 0.5, 1, 2];
  const pct = (s: number) => (duration > 0 ? Math.min(100, Math.max(0, (s / duration) * 100)) : 0);

  return (
    <div className="space-y-2 select-none">
      {/* Speed pills */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {speeds.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeed(s)}
            className={`px-3 h-9 min-w-11 rounded-full text-xs font-semibold border transition-colors ${
              speed === s
                ? "bg-video-accent text-video-accent-foreground border-video-accent"
                : "bg-video-surface text-video-foreground border-video-border hover:bg-video-card"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-2">
        <ScrubBtn label="«10" onClick={() => onStep(-10)} />
        <ScrubBtn label="‹1" onClick={() => onStep(-1)} />
        <button
          type="button"
          onClick={onTogglePlay}
          className="h-12 w-12 rounded-full flex items-center justify-center text-video-accent-foreground shadow bg-video-accent"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <ScrubBtn label="1›" onClick={() => onStep(1)} />
        <ScrubBtn label="10»" onClick={() => onStep(10)} />
      </div>

      {/* A–B loop */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={onSetLoopStart}
          className={`px-3 h-9 rounded-full text-xs font-semibold border transition-colors ${
            loopStart !== null
              ? "bg-video-accent text-video-accent-foreground border-video-accent"
              : "bg-video-surface text-video-foreground border-video-border"
          }`}
        >
          {labels.loopStart}
        </button>
        <button
          type="button"
          onClick={onSetLoopEnd}
          className={`px-3 h-9 rounded-full text-xs font-semibold border transition-colors ${
            loopEnd !== null
              ? "bg-video-accent text-video-accent-foreground border-video-accent"
              : "bg-video-surface text-video-foreground border-video-border"
          }`}
        >
          {labels.loopEnd}
        </button>
        {(loopStart !== null || loopEnd !== null) && (
          <button
            type="button"
            onClick={onClearLoop}
            className="px-3 h-9 rounded-full text-xs font-semibold border border-video-border bg-video-surface text-video-foreground inline-flex items-center gap-1"
          >
            <Repeat className="h-3.5 w-3.5" />
            <X className="h-3 w-3" />
            {labels.loopClear}
          </button>
        )}
      </div>

      {/* Tick scrubber */}
      <div
        ref={containerRef}
        className="relative w-full rounded-md overflow-hidden border border-border bg-muted/30"
        style={{ touchAction: "none", cursor: "ew-resize" }}
      >
        <canvas ref={canvasRef} className="block w-full" style={{ height: 60 }} />
      </div>

      {/* One unified timeline: tags + notes + loop range */}
      {duration > 0 && (
        <div className="relative h-9">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-muted" />
          {loopStart !== null && loopEnd !== null && loopEnd > loopStart && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-video-accent/60"
              style={{ left: `${pct(loopStart)}%`, width: `${pct(loopEnd) - pct(loopStart)}%` }}
            />
          )}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-foreground/70"
            style={{ left: `${pct(currentTime)}%` }}
          />
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setActiveMarker(m); onSeek(m.time); }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 flex items-center justify-center"
              style={{ left: `${pct(m.time)}%` }}
              aria-label={m.label}
            >
              <span
                className={`block rounded-full ring-2 ring-background ${m.kind === "note" ? "h-2.5 w-2.5 rotate-45 rounded-sm" : "h-3 w-3"}`}
                style={{ background: m.color }}
              />
            </button>
          ))}
          {activeMarker && (
            <div
              className="absolute -top-1 z-10 -translate-x-1/2 px-2 py-0.5 rounded bg-foreground text-background text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-md"
              style={{ left: `${pct(activeMarker.time)}%` }}
            >
              {activeMarker.label}
            </div>
          )}
        </div>
      )}

      <div className="text-center text-[11px] font-mono text-video-accent">
        {labels.frame} {currentFrame} · {fps} fps
      </div>
    </div>
  );
}

function ScrubBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 px-3 min-w-11 rounded-md text-xs font-mono font-semibold border border-video-border bg-video-surface text-video-foreground hover:bg-video-card transition-colors"
    >
      {label}
    </button>
  );
}
