import type { MuscleGroup } from "@/data/exercises";

import glutesImg from "@/assets/muscles/glutes.png";
import quadsImg from "@/assets/muscles/quads.png";
import hamstringsImg from "@/assets/muscles/hamstrings.png";
import calvesImg from "@/assets/muscles/calves.png";
import coreImg from "@/assets/muscles/core.png";
import hipFlexorsImg from "@/assets/muscles/hip-flexors.png";
import shouldersImg from "@/assets/muscles/shoulders.png";
import backImg from "@/assets/muscles/back.png";
import chestImg from "@/assets/muscles/chest.png";

const MUSCLE_IMAGES: Record<MuscleGroup, string> = {
  glutes: glutesImg,
  quads: quadsImg,
  hamstrings: hamstringsImg,
  calves: calvesImg,
  core: coreImg,
  "hip-flexors": hipFlexorsImg,
  shoulders: shouldersImg,
  back: backImg,
  chest: chestImg,
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  core: "Core",
  "hip-flexors": "Hip Flexors",
  shoulders: "Shoulders",
  back: "Back",
  chest: "Chest",
};

interface MuscleIconProps {
  muscle: MuscleGroup;
  size?: number;
  showLabel?: boolean;
}

export function MuscleIcon({ muscle, size = 28, showLabel = false }: MuscleIconProps) {
  const src = MUSCLE_IMAGES[muscle];
  const label = MUSCLE_LABELS[muscle];

  if (!src) return null;

  return (
    <div className="flex flex-col items-center gap-0.5" title={label}>
      <img
        src={src}
        alt={label}
        width={size}
        height={size}
        className="rounded-sm object-contain"
        loading="lazy"
      />
      {showLabel && (
        <span className="text-[8px] text-muted-foreground font-medium leading-none">{label}</span>
      )}
    </div>
  );
}

interface MuscleGroupBadgesProps {
  muscles: MuscleGroup[];
  size?: number;
  showLabels?: boolean;
}

export function MuscleGroupBadges({ muscles, size = 22, showLabels = false }: MuscleGroupBadgesProps) {
  if (!muscles || muscles.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {muscles.map((m) => (
        <MuscleIcon key={m} muscle={m} size={size} showLabel={showLabels} />
      ))}
    </div>
  );
}
