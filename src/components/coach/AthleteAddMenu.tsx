import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Mail, IdCard } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CreateAthleteDialog } from "@/components/coach/CreateAthleteDialog";
import { InviteDialog } from "@/components/coach/InviteDialog";

interface Props {
  coachId: string;
  clubId: string | null;
  disabled?: boolean;
  countLabel?: string;
  approvedCount: number;
  onCreated: () => Promise<void> | void;
}

/**
 * Combined "Tilføj atlet" dropdown menu — merges Invite (share code) and
 * Create Athlete (manual account) into a single UI, with the existing
 * `UserPlus` icon as the anchor (as requested).
 */
export function AthleteAddMenu({ coachId, clubId, disabled, countLabel, approvedCount, onCreated }: Props) {
  const { t } = useLanguage();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const label = t("addAthleteAction");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            disabled={disabled}
            aria-label={label}
            title={`${label}${countLabel ? " · " + countLabel : ""}`}
            className="shrink-0"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onSelect={() => setInviteOpen(true)} className="gap-2 cursor-pointer">
            <Mail className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t("inviteAthletes")}</span>
              <span className="text-[11px] text-muted-foreground">
                {t("inviteAthletesShortDesc") || "Del link/kode så atleten selv opretter sig"}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCreateOpen(true)} className="gap-2 cursor-pointer">
            <IdCard className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t("createAthleteAction") || t("addAthleteAction")}</span>
              <span className="text-[11px] text-muted-foreground">
                {t("createAthleteShortDesc") || "Opret konto direkte for atleten"}
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteDialog
        coachId={coachId}
        clubId={clubId}
        pendingCount={0}
        approvedCount={approvedCount}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        hideTrigger
      />
      <CreateAthleteDialog
        disabled={disabled}
        countLabel={countLabel}
        onCreated={onCreated}
        open={createOpen}
        onOpenChange={setCreateOpen}
        hideTrigger
      />
    </>
  );
}
