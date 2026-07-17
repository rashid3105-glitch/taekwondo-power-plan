import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building } from "lucide-react";

export function ClubSwitcher({
  className,
  triggerClassName,
}: {
  className?: string;
  triggerClassName?: string;
}) {
  const { memberships, activeClubId, setActiveClubId } = useActiveClub();
  const { t } = useLanguage();

  // Hidden when user has 0 or 1 membership — preserves identical UX for current users.
  if (memberships.length <= 1) return null;

  return (
    <Select value={activeClubId ?? undefined} onValueChange={setActiveClubId}>
      <SelectTrigger
        className="h-9 min-w-[180px] gap-1.5 border-border bg-card/60 text-xs"
        aria-label={t("switchClub")}
      >
        <Building className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue placeholder={t("activeClub")} />
      </SelectTrigger>
      <SelectContent>
        {memberships.map((m) => (
          <SelectItem key={m.club_id} value={m.club_id} className="text-sm">
            <span className="font-medium">{m.club_name || m.club_id.slice(0, 6)}</span>
            <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.role_in_club}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
