import { describe, expect, it } from "vitest";
import {
  attendancePeriodValid,
  attendanceTeamPath,
  normalizeAttendanceSearch,
} from "./workspace.utils";
import { EventCategory } from "./types";
describe("attendance navigation and filters", () => {
  it("builds a shareable link that distinguishes meeting and visit", () => {
    expect(attendanceTeamPath("team", "event", EventCategory.MEETING)).toBe(
      "/adm/presenca/equipes/team?evento=event&tipo=meeting",
    );
  });
  it("normalizes accents and extra whitespace", () => {
    expect(normalizeAttendanceSearch("  João  ")).toBe("joao");
  });
  it("rejects a reversed period", () => {
    expect(attendancePeriodValid("2026-11-20", "2026-11-01")).toBe(false);
    expect(attendancePeriodValid("2026-11-01", "2026-11-01")).toBe(true);
  });
});
