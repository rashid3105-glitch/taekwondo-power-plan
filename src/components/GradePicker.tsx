/**
 * GradePicker — sport-driven grade / belt selector.
 *
 * For taekwondo clubs: renders the legacy 6-belt dropdown with full i18n labels
 * (identical to the previous behaviour).
 * For other sports: renders the sport's grade ladder from the SportProfile config.
 *
 * Uses the shadcn Select component for consistency with the rest of the app.
 * For ProfileSetup (which uses a native <select>) see GradePickerNative.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { gradeOptions, gradeOptionLabel } from "@/lib/sportGrade";
import type { SportProfile } from "@/config/sportProfiles";

interface GradePickerProps {
  profile: SportProfile;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GradePicker({ profile, value, onChange, disabled, className }: GradePickerProps) {
  const { t } = useLanguage();
  const options = gradeOptions(profile.slug);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {gradeOptionLabel(profile.slug, opt, t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Native <select> variant for pages that use plain HTML selects (ProfileSetup).
 */
export function GradePickerNative({
  profile,
  value,
  onChange,
  id,
  className,
}: {
  profile: SportProfile;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const options = gradeOptions(profile.slug);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {gradeOptionLabel(profile.slug, opt, t)}
        </option>
      ))}
    </select>
  );
}
