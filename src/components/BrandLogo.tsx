import runnerIcon from "@/assets/runner-icon.png";
import { useClubBranding } from "@/components/ClubThemeProvider";


/**
 * Sportstalent brand lockup: runner icon + wordmark.
 * The icon is rendered slightly taller than the text for a stronger mark.
 */
export function BrandLogo({
  height = 44,
  withText = true,
  textColor = "#fff",
  accentColor = "#D4AF37",
  mode = "default",
  onClick,
  className,
}: {
  height?: number;
  withText?: boolean;
  textColor?: string;
  accentColor?: string;
  mode?: "default" | "club-only";
  onClick?: () => void;
  className?: string;
}) {
  const iconH = height;
  // Text ~70% of icon height → icon visibly taller than the wordmark.
  const textSize = Math.round(iconH * 0.55);
  const branding = useClubBranding();
  const clubLogo = branding.enabled ? branding.logoUrl : null;

  // Club-only mode: show the club logo by itself. Falls back to the runner
  // icon when no club logo has been uploaded yet.
  if (mode === "club-only") {
    return (
      <img
        src={clubLogo || runnerIcon}
        alt={clubLogo ? `${branding.clubName ?? ""} logo` : "Sportstalent logo"}
        onClick={onClick}
        className={className}
        style={{
          height: iconH,
          width: "auto",
          maxWidth: iconH * 2.4,
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
          cursor: onClick ? "pointer" : undefined,
        }}
      />
    );
  }

  return (
    <span
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(iconH * 0.22),
        cursor: onClick ? "pointer" : undefined,
        userSelect: "none",
      }}
    >
      <img
        src={clubLogo || runnerIcon}
        alt={clubLogo ? `${branding.clubName ?? ""} logo` : withText ? "" : "Sportstalent logo"}
        aria-hidden={!clubLogo && (withText || undefined) ? true : undefined}
        style={{
          height: iconH,
          width: "auto",
          maxWidth: iconH * 2.4,
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
        }}
      />

      {withText && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: textColor,
            whiteSpace: "nowrap",
          }}
        >
          Sports<span style={{ color: accentColor }}>talent</span>
        </span>
      )}
    </span>
  );
}
