import type { ReactNode } from "react";

interface IOSDeviceProps {
  children: ReactNode;
  /** Time shown in the status bar. */
  time?: string;
  /** Dark screen (lock screen) — flips status bar glyph colour. */
  dark?: boolean;
}

/** Presentational iPhone hardware frame. No external dependencies. */
export function IOSDevice({ children, time = "19:45", dark }: IOSDeviceProps) {
  const glyph = dark ? "#f8f4f4" : "#201e1d";
  return (
    <div className="ios-frame">
      <div className="ios-screen" style={{ background: dark ? "#2d2b2b" : "#ffffff" }}>
        <div className="ios-island" />
        <div className="ios-status" style={{ color: glyph }}>
          <span>{time}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {/* signal */}
            <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={i * 4.4} y={8 - i * 2.4} width="3" height={3 + i * 2.4} fill={glyph} />
              ))}
            </svg>
            {/* wifi */}
            <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden="true" fill="none" stroke={glyph}>
              <path d="M1 3.6a9.5 9.5 0 0 1 13 0" strokeWidth="1.4" />
              <path d="M3.6 6.2a6 6 0 0 1 7.8 0" strokeWidth="1.4" />
              <circle cx="7.5" cy="9" r="1.1" fill={glyph} stroke="none" />
            </svg>
            {/* battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
              <rect x="0.5" y="0.5" width="21" height="11" rx="2" fill="none" stroke={glyph} opacity="0.5" />
              <rect x="2.5" y="2.5" width="15" height="7" fill={glyph} />
              <rect x="23" y="4" width="1.6" height="4" fill={glyph} opacity="0.5" />
            </svg>
          </span>
        </div>
        <div className="ios-body">{children}</div>
      </div>
    </div>
  );
}

export default IOSDevice;
