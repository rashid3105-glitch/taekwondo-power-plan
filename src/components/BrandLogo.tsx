import logo from "@/assets/logo.png";

/**
 * Sportstalent brand lockup: runner icon + wordmark.
 * The icon is rendered slightly taller than the text for a stronger mark.
 * The baked-in "SPORTSTALENT.DK" caption on the source artwork is cropped
 * away with backgroundSize/Position so only the runner shows.
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
  const textSize = Math.round(iconH * 0.5);
  return (
    <span
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(iconH * 0.18),
        cursor: onClick ? "pointer" : undefined,
        userSelect: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: iconH,
          height: iconH,
          backgroundImage: `url(${logo})`,
          backgroundSize: `${iconH * 1.15}px ${iconH * 1.65}px`,
          backgroundPosition: `center ${-iconH * 0.04}px`,
          backgroundRepeat: "no-repeat",
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
