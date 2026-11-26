import { useCallback } from "react";
import { Alert, Box, Button, Skeleton } from "@mui/material";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  getSheltersTeamsMembers,
  getTeamMembers,
  getTeamSchedules,
} from "../api";
import { useAttendanceResource } from "../hooks/useAttendanceResource";
import { ATTENDANCE_PATHS } from "../constants";
import type {
  AttendanceLayoutContext,
  AttendanceSelection,
} from "../workspace.types";
import TeamMemberAttendance from "../components/TeamMemberAttendance";

export default function AttendanceTeamPage() {
  const { teamId = "" } = useParams();
  const navigate = useNavigate();
  const { setBusy } = useOutletContext<AttendanceLayoutContext>();
  const load = useCallback(async (): Promise<AttendanceSelection | null> => {
    const hierarchy = await getSheltersTeamsMembers();
    const shelter = hierarchy.find((item) =>
      item.teams.some((team) => team.teamId === teamId),
    );
    const team = shelter?.teams.find((item) => item.teamId === teamId);
    if (!shelter || !team) return null;
    const [members, schedules] = await Promise.all([
      getTeamMembers(teamId),
      getTeamSchedules(teamId),
    ]);
    return { shelter, team: { ...team, members: members.members }, schedules };
  }, [teamId]);
  const resource = useAttendanceResource(load);
  return (
    <Box data-testid="attendance-team-route">
      {resource.loading ? (
        <Skeleton
          data-testid="attendance-team-loading"
          height={240}
          variant="rounded"
        />
      ) : resource.error ? (
        <Alert
          severity="error"
          action={
            <Button
              onClick={resource.reload}
              color="inherit"
              sx={{ minHeight: 44 }}
            >
              Tentar novamente
            </Button>
          }
        >
          {resource.error}
        </Alert>
      ) : resource.data ? (
        <TeamMemberAttendance
          key={teamId}
          {...resource.data}
          onBack={() => navigate(ATTENDANCE_PATHS.register)}
          onAttendanceRegistered={() => undefined}
          onBusyChange={setBusy}
        />
      ) : (
        <Alert severity="info">
          Equipe não encontrada ou indisponível para seu acesso.{" "}
          <Button component={Link} to={ATTENDANCE_PATHS.register}>
            Escolher outra equipe
          </Button>
        </Alert>
      )}
    </Box>
  );
}
