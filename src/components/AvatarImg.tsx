import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { User } from "lucide-react";

interface AvatarImgProps {
  avatarUrl: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
}

export function AvatarImg({ avatarUrl, className = "h-10 w-10 rounded-full object-cover border-2 border-border", fallbackClassName }: AvatarImgProps) {
  const signedUrl = useAvatarUrl(avatarUrl);

  if (signedUrl) {
    return <img src={signedUrl} alt="" className={className} />;
  }

  return (
    <div className={fallbackClassName || className.replace("object-cover", "") + " bg-muted flex items-center justify-center"}>
      <User className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
