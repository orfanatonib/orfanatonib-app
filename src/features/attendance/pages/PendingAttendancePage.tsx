import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import { getAllPendings } from "../api";
import { useAttendanceResource } from "../hooks/useAttendanceResource";
import {
  attendanceTeamPath,
  normalizeAttendanceSearch,
  pendingToSchedule,
} from "../workspace.utils";
import { EventCategory } from "../types";
import type { TeamScheduleDto } from "../types";
import { formatDateBR } from "../utils";
import { ATTENDANCE_HISTORY_PAGE_SIZE } from "../constants";
import { attendanceCardSx, attendancePrimarySx } from "@/theme/attendance";
import RegisterAttendance from "../components/RegisterAttendance";

export default function PendingAttendancePage() {
  const resource = useAttendanceResource(getAllPendings);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [personal, setPersonal] = useState<TeamScheduleDto | null>(null);
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const entries = useMemo(
    () =>
      (resource.data?.leaderPendings ?? [])
        .flatMap((team) => team.pendings.map((pending) => ({ team, pending })))
        .filter(({ team, pending }) =>
          normalizeAttendanceSearch(
            `${team.shelterName} ${team.teamName} ${pending.lessonContent}`,
          ).includes(normalizeAttendanceSearch(search)),
        )
        .sort((a, b) => a.pending.date.localeCompare(b.pending.date)),
    [resource.data, search],
  );
  const memberPendings = (resource.data?.memberPendings ?? []).filter(
    (pending) =>
      normalizeAttendanceSearch(
        `${pending.shelterName} ${pending.teamName} ${pending.lessonContent}`,
      ).includes(normalizeAttendanceSearch(search)),
  );
  const pageCount = Math.max(
    1,
    Math.ceil(entries.length / ATTENDANCE_HISTORY_PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  return (
    <Box data-testid="pendings-page">
      <Typography component="h2" variant="h6" fontWeight={800}>
        Pendências de presença
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Encontros passados que ainda precisam de marcação, dos mais antigos aos
        mais recentes.
      </Typography>
      <TextField
        label="Buscar abrigo, equipe ou conteúdo"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        fullWidth
        inputProps={{ "data-testid": "pendings-search" }}
        sx={{ mb: 2 }}
      />
      {resource.loading ? (
        <Skeleton
          data-testid="pendings-loading"
          variant="rounded"
          height={180}
        />
      ) : resource.error ? (
        <Alert
          data-testid="pendings-error"
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
        <>
          {!entries.length && !memberPendings.length && (
            <Alert
              data-testid="pendings-empty"
              severity={search ? "info" : "success"}
            >
              {search
                ? "Nenhuma pendência corresponde à busca."
                : "Tudo em dia! Nenhuma presença pendente."}
            </Alert>
          )}
          {memberPendings.length > 0 && (
            <Box sx={{ ...attendanceCardSx, mb: 2 }}>
              <Typography component="h3" variant="subtitle1" fontWeight={700}>
                Minha presença
              </Typography>
              <Stack spacing={1}>
                {memberPendings.map((pending) => (
                  <Button
                    key={`${pending.scheduleId}-${pending.category}`}
                    onClick={() => setPersonal(pendingToSchedule(pending))}
                    sx={{ minHeight: 48, justifyContent: "flex-start" }}
                  >
                    {pending.shelterName} ·{" "}
                    {pending.category === EventCategory.VISIT
                      ? "Visita"
                      : "Reunião"}{" "}
                    · {formatDateBR(pending.date)}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
          <Stack spacing={1.5}>
            {entries
              .slice(
                (currentPage - 1) * ATTENDANCE_HISTORY_PAGE_SIZE,
                currentPage * ATTENDANCE_HISTORY_PAGE_SIZE,
              )
              .map(({ team, pending }) => (
                <Box
                  key={`${pending.scheduleId}-${pending.category}`}
                  data-testid={`attendance-pending-${pending.scheduleId}-${pending.category}`}
                  sx={attendanceCardSx}
                >
                  <Typography variant="caption" color="text.secondary">
                    {team.shelterName} · {team.teamName}
                  </Typography>
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    fontWeight={800}
                  >
                    {pending.category === EventCategory.VISIT
                      ? "Visita"
                      : "Reunião"}{" "}
                    · {formatDateBR(pending.date)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ my: 1 }}
                  >
                    {pending.lessonContent}
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    gap={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Chip
                      variant="outlined"
                      label={`${pending.pendingMembers.length} membro(s) sem registro`}
                    />
                    <Button
                      component={Link}
                      to={attendanceTeamPath(
                        team.teamId,
                        pending.scheduleId,
                        pending.category,
                      )}
                      variant="contained"
                      sx={attendancePrimarySx}
                    >
                      Preencher presença
                    </Button>
                  </Stack>
                </Box>
              ))}
          </Stack>
          {pageCount > 1 && (
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(_, value) => setPage(value)}
              size="small"
              sx={{
                my: 2,
                "& .MuiPaginationItem-root": { minWidth: 44, height: 44 },
              }}
            />
          )}
        </>
      )}
      <Dialog
        data-testid="attendance-personal-dialog"
        open={Boolean(personal)}
        onClose={() => setPersonal(null)}
        fullScreen={mobile}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Minha presença
          <IconButton
            aria-label="Fechar registro de presença"
            onClick={() => setPersonal(null)}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {personal && (
            <RegisterAttendance
              schedules={[personal]}
              onSuccess={() => {
                setPersonal(null);
                resource.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
