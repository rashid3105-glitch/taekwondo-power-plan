import type { SVGProps } from "react";

/**
 * Tournament bracket icon (red, no background). Rendered as inline SVG
 * so it inherits `currentColor` and scales cleanly at any size.
 */
export function BracketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Left column: 4 competitors */}
      <line x1="2" y1="4" x2="6" y2="4" />
      <line x1="2" y1="9" x2="6" y2="9" />
      <line x1="2" y1="15" x2="6" y2="15" />
      <line x1="2" y1="20" x2="6" y2="20" />
      {/* Left brackets */}
      <path d="M6 4v2.5h3V6.5" />
      <path d="M6 9V6.5" />
      <path d="M6 15v2.5h3V17.5" />
      <path d="M6 20v-2.5" />
      {/* Semifinals */}
      <line x1="9" y1="6.5" x2="12" y2="6.5" />
      <line x1="9" y1="17.5" x2="12" y2="17.5" />
      {/* Final connector */}
      <path d="M12 6.5v5.5h3v0" />
      <path d="M12 17.5v-5.5" />
      {/* Winner */}
      <line x1="15" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export default BracketIcon;
