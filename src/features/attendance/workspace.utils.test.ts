import { describe, expect, it } from "vitest";
import {
  attendancePeriodValid,
  attendanceTeamPath,
  filterAttendanceTeams,
  normalizeAttendanceSearch,
} from "./workspace.utils";
import { EventCategory } from "./types";
describe("attendance navigation and filters", () => {
  it("builds a shareable link that distinguishes meeting and visit", () => {
    expect(attendanceTeamPath("team", "event", EventCategory.MEETING)).toBe(
      "/adm/presenca/equipes/team?evento=event&tipo=meeting",
    );
  });
  it("searches by team number and ignores accents and extra whitespace", () => {
    const data = [
      {
        shelterId: "shelter",
        shelterName: "Esperança",
        teams: [{ teamId: "team", teamNumber: 2, members: [] }],
      },
    ];
    expect(filterAttendanceTeams(data, " Equipe 2 ")).toHaveLength(1);
    expect(filterAttendanceTeams(data, "esperanca")).toHaveLength(1);
    expect(filterAttendanceTeams(data, "Equipe 3")).toHaveLength(0);
    expect(normalizeAttendanceSearch("  João  ")).toBe("joao");
  });
  it("rejects a reversed period", () => {
    expect(attendancePeriodValid("2026-11-20", "2026-11-01")).toBe(false);
    expect(attendancePeriodValid("2026-11-01", "2026-11-01")).toBe(true);
  });
});
