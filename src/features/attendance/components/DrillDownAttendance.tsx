import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getSheltersTeamsMembers } from "../api";
import { useAttendanceResource } from "../hooks/useAttendanceResource";
import { attendanceTeamPath, filterAttendanceTeams } from "../workspace.utils";
import TeamSelection from "./TeamSelection";

export default function DrillDownAttendance() {
  const navigate = useNavigate();
  const resource = useAttendanceResource(getSheltersTeamsMembers);
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => filterAttendanceTeams(resource.data ?? [], search),
    [resource.data, search],
  );
  return (
    <Box data-testid="attendance-page">
      <Typography component="h2" variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
        Qual equipe participou?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Escolha o abrigo e a equipe. Na próxima etapa, selecione a visita ou
        reunião.
      </Typography>
      <TextField
        label="Buscar abrigo, equipe ou membro"
        fullWidth
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        inputProps={{ "data-testid": "attendance-search" }}
        sx={{ mb: 2 }}
      />
      {resource.loading ? (
        <Skeleton
          data-testid="attendance-loading"
          variant="rounded"
          height={180}
        />
      ) : resource.error ? (
        <Alert
          data-testid="attendance-error"
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
      ) : (
        <TeamSelection
          data={filtered}
          searchTerm={search}
          onTeamSelect={(_, team) => navigate(attendanceTeamPath(team.teamId))}
        />
      )}
    </Box>
  );
}
