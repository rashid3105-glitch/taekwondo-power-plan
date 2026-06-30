import { useEffect, useState } from "react";
import splashLogo from "@/assets/runner-icon.png";

interface SplashScreenProps {
  /** Duration in ms before fade-out begins. Default 2500. */
  duration?: number;
  /** Called after the fade-out transition completes. */
  onFinish?: () => void;
}

/**
 * Branded splash screen shown on app load.
 *
 * - Dark #0a0a0a background
 * - "Sports" + "Talent" wordmark in Bebas Neue
 * - Logo badge (preserves original cream/red/blue colors against dark bg)
 * - Animated 3-dot loader
 * - Auto fades out after `duration` (default 2.5s)
 */
export const SplashScreen = ({ duration = 2500, onFinish }: SplashScreenProps) => {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), duration);
    const removeTimer = window.setTimeout(() => {
      setHidden(true);
      onFinish?.();
    }, duration + 500);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [duration, onFinish]);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      style={{ backgroundColor: "#0a0a0a" }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo badge — cream background preserves original artwork colors */}
      <div className="rounded-3xl bg-[#f5f1e8] p-5 shadow-2xl shadow-black/60">
        <img
          src={splashLogo}
          alt=""
          className="h-32 w-32 object-contain sm:h-40 sm:w-40"
          draggable={false}
        />
      </div>

      {/* Wordmark */}
      <h1
        className="mt-8 text-5xl tracking-[0.15em] sm:text-6xl"
        style={{ fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1 }}
      >
        <span style={{ color: "#ffffff" }}>SPORTS</span>
        <span style={{ color: "#e63946" }}>TALENT</span>
      </h1>

      {/* 3-dot loader */}
      <div className="mt-10 flex items-center gap-2" role="status" aria-label="Loading">
        <Dot delay="0s" />
        <Dot delay="0.15s" />
        <Dot delay="0.3s" />
      </div>

      <style>{`
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const Dot = ({ delay }: { delay: string }) => (
  <span
    style={{
      backgroundColor: "#e63946",
      animation: "splashDot 1.2s ease-in-out infinite",
      animationDelay: delay,
    }}
    className="inline-block h-2.5 w-2.5 rounded-full"
  />
);

export default SplashScreen;
