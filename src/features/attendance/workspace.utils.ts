import { AttendanceType, EventCategory } from "./types";
import type {
  AttendanceResponseDto,
  TeamMemberDto,
  TeamScheduleDto,
  SheltersTeamsMembersResponse,
} from "./types";
import type { AttendanceRow } from "./workspace.types";

export const normalizeAttendanceSearch = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
export const filterAttendanceTeams = (
  shelters: SheltersTeamsMembersResponse,
  search: string,
): SheltersTeamsMembersResponse => {
  const term = normalizeAttendanceSearch(search);
  if (!term) return shelters;
  return shelters
    .map((shelter) => ({
      ...shelter,
      teams: shelter.teams.filter((team) =>
        normalizeAttendanceSearch(
          `${shelter.shelterName} Equipe ${team.teamNumber} ${team.description || ""} ${team.members.map((member) => member.name).join(" ")}`,
        ).includes(term),
      ),
    }))
    .filter((shelter) => shelter.teams.length > 0);
};
export const buildAttendanceRows = (
  members: TeamMemberDto[],
  records: AttendanceResponseDto[],
): Record<string, AttendanceRow> =>
  Object.fromEntries(
    members.map((member) => {
      const record = records.find((item) => item.memberId === member.id);
      return [
        member.id,
        { member, type: record?.type ?? null, comment: record?.comment ?? "" },
      ];
    }),
  );
export const attendanceSnapshot = (
  rows: Record<string, AttendanceRow>,
): string =>
  JSON.stringify(
    Object.values(rows)
      .map((row) => [row.member.id, row.type, row.comment])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
export const schedulesForCategory = (
  schedules: TeamScheduleDto[],
  category: EventCategory,
): TeamScheduleDto[] =>
  schedules.filter((schedule) => schedule.category === category);
export const countAttendanceRows = (rows: Record<string, AttendanceRow>) => {
  const values = Object.values(rows);
  return {
    total: values.length,
    present: values.filter((row) => row.type === AttendanceType.PRESENT).length,
    absent: values.filter((row) => row.type === AttendanceType.ABSENT).length,
    pending: values.filter((row) => row.type === null).length,
  };
};

export const attendanceTeamPath = (
  teamId: string,
  scheduleId?: string,
  category?: EventCategory,
): string => {
  const query = new URLSearchParams();
  if (scheduleId) query.set("evento", scheduleId);
  if (category) query.set("tipo", category);
  return `/adm/presenca/equipes/${encodeURIComponent(teamId)}${query.size ? `?${query}` : ""}`;
};

export const currentAttendanceMonth = (): import("./types").PeriodQuery => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${lastDay}`,
  };
};
export const attendancePeriodValid = (start: string, end: string): boolean =>
  !start || !end || start <= end;
export const pendingToSchedule = (
  pending: import("./types").PendingForMemberDto,
): TeamScheduleDto => ({
  id: pending.scheduleId,
  category: pending.category,
  date: pending.date,
  visitNumber: pending.visitNumber,
  lessonContent: pending.lessonContent,
  location: pending.location,
  teamId: pending.teamId,
  teamNumber: pending.teamNumber,
  teamName: pending.teamName,
  shelterName: pending.shelterName,
  visitDate:
    pending.category === EventCategory.VISIT ? pending.date : undefined,
  meetingDate:
    pending.category === EventCategory.MEETING ? pending.date : undefined,
});
