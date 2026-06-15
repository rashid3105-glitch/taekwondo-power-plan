import { useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface VideoScrubberProps {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  speed: number;
  noteFrames?: number[];
  onSeek: (frame: number) => void;
  onStep: (delta: number) => void;
  onTogglePlay: () => void;
  onSpeed: (s: number) => void;
}

const ACCENT = "#F5A623";
const TICK_SPACING = 10; // px per frame

export function VideoScrubber({
  currentFrame, totalFrames, isPlaying, speed,
  noteFrames = [], onSeek, onStep, onTogglePlay, onSpeed,
}: VideoScrubberProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startFrame: number } | null>(null);

  // Draw the tick strip
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (canvas.width !== cssWidth * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const centerX = cssWidth / 2;
    // Background
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Compute visible frame range
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

    // Note dots
    ctx.fillStyle = ACCENT;
    for (const nf of noteFrames) {
      const x = centerX + (nf - currentFrame) * TICK_SPACING;
      if (x < -5 || x > cssWidth + 5) continue;
      ctx.beginPath();
      ctx.arc(x, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center orange marker
    ctx.fillStyle = ACCENT;
    ctx.fillRect(centerX - 1.5, 0, 3, cssHeight);
    ctx.beginPath();
    ctx.moveTo(centerX - 6, 0);
    ctx.lineTo(centerX + 6, 0);
    ctx.lineTo(centerX, 6);
    ctx.closePath();
    ctx.fill();
  }, [currentFrame, totalFrames, noteFrames]);

  // Pointer events for drag scrubbing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = { startX: e.clientX, startFrame: currentFrame };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const newFrame = Math.max(
        0,
        Math.min(totalFrames, Math.round(dragRef.current.startFrame - dx / TICK_SPACING)),
      );
      if (newFrame !== currentFrame) onSeek(newFrame);
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
  }, [currentFrame, totalFrames, onSeek]);

  const speeds = [0.25, 0.5, 1, 2];

  return (
    <div className="space-y-2 select-none">
      {/* Speed pills */}
      <div className="flex justify-center gap-1.5">
        {speeds.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeed(s)}
            className="px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors"
            style={{
              background: speed === s ? ACCENT : "transparent",
              color: speed === s ? "#000" : "hsl(var(--foreground))",
              borderColor: speed === s ? ACCENT : "hsl(var(--border))",
            }}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <ScrubBtn label="«10" onClick={() => onStep(-10)} />
        <ScrubBtn label="‹1" onClick={() => onStep(-1)} />
        <button
          type="button"
          onClick={onTogglePlay}
          className="h-10 w-10 rounded-full flex items-center justify-center text-black shadow"
          style={{ background: ACCENT }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <ScrubBtn label="1›" onClick={() => onStep(1)} />
        <ScrubBtn label="10»" onClick={() => onStep(10)} />
      </div>

      {/* Tick scrubber */}
      <div
        ref={containerRef}
        className="relative w-full rounded-md overflow-hidden border border-white/10 bg-white/[0.02]"
        style={{ touchAction: "none", cursor: "ew-resize" }}
      >
        <canvas ref={canvasRef} className="block w-full" style={{ height: 60 }} />
      </div>
      <div className="text-center text-[11px] font-mono" style={{ color: ACCENT }}>
        Frame {currentFrame}
      </div>
    </div>
  );
}

function ScrubBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-2.5 rounded-md text-[11px] font-mono border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] transition-colors"
    >
      {label}
    </button>
  );
}
