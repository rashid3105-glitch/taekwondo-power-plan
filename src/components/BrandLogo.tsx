import runnerIcon from "@/assets/runner-icon.png";

/**
 * Sportstalent brand lockup: runner icon + wordmark.
 * The icon is rendered slightly taller than the text for a stronger mark.
 */
export function BrandLogo({
  height = 44,
  withText = true,
  textColor = "#fff",
  accentColor = "#F5C842",
  onClick,
  className,
}: {
  height?: number;
  withText?: boolean;
  textColor?: string;
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}) {
  const iconH = height;
  // Text ~70% of icon height → icon visibly taller than the wordmark.
  const textSize = Math.round(iconH * 0.55);
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
        src={runnerIcon}
        alt=""
        aria-hidden
        style={{
          height: iconH,
          width: "auto",
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
