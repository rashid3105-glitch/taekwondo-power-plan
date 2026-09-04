import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks -----------------------------------------------------------------

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (k: string) => k, locale: "da" }),
}));

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));

vi.mock("@/contexts/ActiveClubContext", () => ({
  useActiveClub: () => ({
    activeClubId: "club-1",
    activeMembership: { club_name: "Test Klub" },
    setActiveClubId: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSportProfile", () => ({
  useSportProfile: () => ({
    profile: { slug: "taekwondo", grades: ["white"], gradeLabelEn: "Belt" },
    loading: false,
  }),
}));

vi.mock("@/components/GradePicker", () => ({
  GradePicker: () => <div data-testid="grade-picker" />,
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { BirthDatePicker } from "@/components/BirthDatePicker";
import { CreateAthleteDialog } from "@/components/coach/CreateAthleteDialog";
import { SetBirthDateDialog } from "@/components/coach/SetBirthDateDialog";

// --- Helpers ---------------------------------------------------------------

/**
 * Picks a full date in the three-select birth date picker.
 * Locale is "da" so month names are Danish and the order is day/month/year.
 */
async function pickBirthDate(
  user: ReturnType<typeof userEvent.setup>,
  root: HTMLElement,
  { day, monthName, year }: { day: string; monthName: string; year: string },
) {
  const [dayTrigger, monthTrigger, yearTrigger] =
    within(root).getAllByRole("combobox");

  await user.click(dayTrigger);
  await user.click(await screen.findByRole("option", { name: day }));

  await user.click(monthTrigger);
  await user.click(await screen.findByRole("option", { name: monthName }));

  await user.click(yearTrigger);
  await user.click(await screen.findByRole("option", { name: year }));
}

function ControlledPicker({ onChange }: { onChange: (iso: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div data-testid="picker">
      <BirthDatePicker
        value={value}
        onChange={(iso) => {
          setValue(iso);
          onChange(iso);
        }}
      />
    </div>
  );
}

// --- Tests -----------------------------------------------------------------

describe("BirthDatePicker end-to-end", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("captures a full day/month/year and emits an ISO date", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledPicker onChange={onChange} />);

    await pickBirthDate(user, screen.getByTestId("picker"), {
      day: "9",
      monthName: "maj",
      year: "2010",
    });

    expect(onChange).toHaveBeenLastCalledWith("2010-05-09");

    // Selections must stick in the triggers, not reset.
    const [dayTrigger, monthTrigger, yearTrigger] = screen.getAllByRole("combobox");
    expect(dayTrigger).toHaveTextContent("9");
    expect(monthTrigger).toHaveTextContent("maj");
    expect(yearTrigger).toHaveTextContent("2010");
  });

  it("enables the CreateAthleteDialog submit once a birth date is picked", async () => {
    const user = userEvent.setup();
    invoke.mockResolvedValue({ data: { ok: true }, error: null });

    render(<CreateAthleteDialog open onOpenChange={() => {}} hideTrigger onCreated={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("athleteName"), "Test Athlete");
    await user.type(within(dialog).getByPlaceholderText("athleteEmail"), "athlete@example.com");
    await user.type(within(dialog).getByPlaceholderText("athletePassword"), "Str0ngPassw0rd!");

    const submit = within(dialog).getByRole("button", { name: /createAccount/i });
    expect(submit).toBeDisabled();

    await pickBirthDate(user, dialog, { day: "9", monthName: "maj", year: "2010" });

    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(invoke).toHaveBeenCalledWith(
      "create-athlete",
      expect.objectContaining({
        body: expect.objectContaining({ birth_date: "2010-05-09" }),
      }),
    );
  });

  it("enables the SetBirthDateDialog save and sends the picked date", async () => {
    const user = userEvent.setup();
    invoke.mockResolvedValue({ data: { ok: true }, error: null });

    render(<SetBirthDateDialog athleteId="athlete-1" athleteName="Test Athlete" clubId="club-1" />);

    await user.click(screen.getByRole("button", { name: /coachSetBirthDate/i }));
    const dialog = await screen.findByRole("dialog");

    const save = within(dialog).getByRole("button", { name: /birthDateGateCta/i });
    expect(save).toBeDisabled();

    await pickBirthDate(user, dialog, { day: "9", monthName: "maj", year: "2010" });

    expect(save).toBeEnabled();

    await user.click(save);
    expect(invoke).toHaveBeenCalledWith(
      "consent-coach-actions",
      expect.objectContaining({
        body: expect.objectContaining({
          action: "set_birth_date",
          athlete_id: "athlete-1",
          birth_date: "2010-05-09",
        }),
      }),
    );
  });
});
