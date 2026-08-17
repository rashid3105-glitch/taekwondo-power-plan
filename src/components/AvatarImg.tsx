import { useEffect, useState } from "react";
import { useAvatarUrl, invalidateAvatarUrl } from "@/hooks/useAvatarUrl";
import { User } from "lucide-react";

interface AvatarImgProps {
  avatarUrl: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
}

export function AvatarImg({ avatarUrl, className = "h-10 w-10 rounded-full object-cover border-2 border-border", fallbackClassName }: AvatarImgProps) {
  // `attempt` bumps when the browser fails to load the signed URL (expired
  // token, stale cache). We then re-sign once instead of leaving a broken
  // image icon on screen.
  const [attempt, setAttempt] = useState(0);
  const [broken, setBroken] = useState(false);
  const signedUrl = useAvatarUrl(avatarUrl, attempt);

  useEffect(() => {
    setAttempt(0);
    setBroken(false);
  }, [avatarUrl]);

  if (signedUrl && !broken) {
    return (
      <img
        src={signedUrl}
        alt=""
        className={className}
        onError={() => {
          invalidateAvatarUrl(avatarUrl);
          if (attempt < 1) setAttempt((a) => a + 1);
          else setBroken(true);
        }}
      />
    );
  }

  return (
    <div className={fallbackClassName || className.replace("object-cover", "") + " bg-muted flex items-center justify-center"}>
      <User className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
