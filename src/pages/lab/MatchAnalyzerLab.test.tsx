import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import MatchAnalyzerLab from "./MatchAnalyzerLab";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  athleteFilter: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from },
}));
vi.mock("@/i18n/matchLab", () => ({ useMatchLabT: () => (key: string) => key }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("official match analysis uses online athlete data", () => {
  it.each([
    ["/match-analysis/me", "signed-in-athlete"],
    ["/match-analysis/another-athlete", "another-athlete"],
  ])("loads %s from the cloud for %s, never local demo storage", async (url, athlete) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "signed-in-athlete" } } });
    mocks.athleteFilter.mockClear();
    mocks.from.mockImplementation((table: string) => {
      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((column: string, value: string) => {
          if (table === "match_videos" && column === "athlete_id") mocks.athleteFilter(value);
          return query;
        }),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      };
      return query;
    });
    const localRead = vi.spyOn(Storage.prototype, "getItem");
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path="/match-analysis/me" element={<MatchAnalyzerLab />} />
            <Route path="/match-analysis/:athleteId" element={<MatchAnalyzerLab />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );
    await waitFor(() => expect(mocks.athleteFilter).toHaveBeenCalledWith(athlete));
    await screen.findByText("recent");
    expect(localRead).not.toHaveBeenCalledWith("match_lab_matches_v1");
    expect(screen.queryByText("pol")).not.toBeInTheDocument();
  });
});