import { Navigate, useSearchParams } from "react-router-dom";
import { ATTENDANCE_PATHS } from "../constants";
import { attendanceTeamPath } from "../workspace.utils";
import { EventCategory } from "../types";
export default function AttendanceIndexRedirect() {
  const [params] = useSearchParams();
  const teamId = params.get("teamId");
  const category =
    params.get("category") === EventCategory.MEETING
      ? EventCategory.MEETING
      : EventCategory.VISIT;
  return (
    <Navigate
      to={
        teamId
          ? attendanceTeamPath(
              teamId,
              params.get("scheduleId") ?? undefined,
              category,
            )
          : ATTENDANCE_PATHS.register
      }
      replace
    />
  );
}
