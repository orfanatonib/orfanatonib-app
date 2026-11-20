import { useCallback, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";
import { getHierarchicalSheets } from "../api";
import { useAttendanceResource } from "../hooks/useAttendanceResource";
import {
  attendancePeriodValid,
  attendanceTeamPath,
  currentAttendanceMonth,
  normalizeAttendanceSearch,
} from "../workspace.utils";
import { EventCategory, AttendanceType } from "../types";
import { formatDateBR } from "../utils";
import { ATTENDANCE_HISTORY_PAGE_SIZE } from "../constants";
import {
  attendanceCardSx,
  attendanceColors,
  attendancePrimarySx,
} from "@/theme/attendance";

export default function ListSheets() {
  const [period, setPeriod] = useState(currentAttendanceMonth);
  const [start, setStart] = useState(period.startDate ?? "");
  const [end, setEnd] = useState(period.endDate ?? "");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [page, setPage] = useState(1);
  const load = useCallback(() => getHierarchicalSheets(period), [period]);
  const resource = useAttendanceResource(load);
  const valid = attendancePeriodValid(start, end);
  const entries = useMemo(
    () =>
      (resource.data ?? [])
        .flatMap((shelter) =>
          shelter.teams.flatMap((team) =>
            team.schedules.map((schedule) => ({ shelter, team, schedule })),
          ),
        )
        .filter(
          ({ shelter, team, schedule }) =>
            (!category || schedule.category === category) &&
            normalizeAttendanceSearch(
              `${shelter.shelterName} Equipe ${team.teamNumber} ${team.teamName} ${schedule.lessonContent}`,
            ).includes(normalizeAttendanceSearch(search)),
        )
        .sort((a, b) => b.schedule.date.localeCompare(a.schedule.date)),
    [resource.data, category, search],
  );
  const pageCount = Math.max(
    1,
    Math.ceil(entries.length / ATTENDANCE_HISTORY_PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  return (
    <Box data-testid="attendance-history-page">
      <Typography component="h2" variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        Histórico de presenças
      </Typography>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) {
            setPeriod({
              startDate: start || undefined,
              endDate: end || undefined,
            });
            setPage(1);
          }
        }}
        sx={{ ...attendanceCardSx, mb: 2 }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "minmax(0, 1fr) minmax(0, 1fr) auto",
            },
            gap: 1.5,
            alignItems: "start",
            "& .MuiInputBase-root": { minWidth: 0 },
            "& input": { minWidth: 0, px: { xs: 1, sm: 1.75 } },
          }}
        >
          <TextField
            label="De"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Até"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            error={!valid}
            helperText={
              !valid
                ? "A data final deve ser igual ou posterior à inicial."
                : undefined
            }
          />
          <Button
            type="submit"
            disabled={!valid || resource.loading}
            variant="contained"
            sx={{
              ...attendancePrimarySx,
              minWidth: 120,
              gridColumn: { xs: "1 / -1", sm: "auto" },
            }}
          >
            Aplicar
          </Button>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mt: 2 }}>
          <TextField
            label="Buscar abrigo, equipe ou conteúdo"
            value={search}
            fullWidth
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <TextField
            select
            label="Tipo de evento"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as EventCategory | "");
              setPage(1);
            }}
            sx={{ minWidth: { sm: 180 } }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value={EventCategory.VISIT}>Visitas</MenuItem>
            <MenuItem value={EventCategory.MEETING}>Reuniões</MenuItem>
          </TextField>
        </Stack>
      </Box>
      {resource.loading ? (
        <Skeleton
          data-testid="attendance-history-loading"
          variant="rounded"
          height={180}
        />
      ) : resource.error ? (
        <Alert
          data-testid="attendance-history-error"
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {entries.length} encontro(s) no período aplicado
          </Typography>
          {!entries.length && (
            <Alert data-testid="attendance-history-empty" severity="info">
              Nenhum encontro encontrado. Ajuste o período ou os filtros.
            </Alert>
          )}
          <Stack spacing={1.5}>
            {entries
              .slice(
                (currentPage - 1) * ATTENDANCE_HISTORY_PAGE_SIZE,
                currentPage * ATTENDANCE_HISTORY_PAGE_SIZE,
              )
              .map(({ shelter, team, schedule }) => (
                <Accordion
                  data-testid={`attendance-history-event-${schedule.scheduleId}-${schedule.category}`}
                  key={`${schedule.scheduleId}-${schedule.category}`}
                  disableGutters
                  elevation={0}
                  sx={{
                    ...attendanceCardSx,
                    p: 0,
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{ minHeight: 88 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: attendanceColors.muted }}
                      >
                        {shelter.shelterName} · Equipe {team.teamNumber}
                      </Typography>
                      <Typography fontWeight={800}>
                        {schedule.category === EventCategory.VISIT
                          ? "Visita"
                          : "Reunião"}{" "}
                        · {formatDateBR(schedule.date)}
                      </Typography>
                      <Stack
                        direction="row"
                        useFlexGap
                        flexWrap="wrap"
                        gap={0.75}
                        sx={{ mt: 1 }}
                      >
                        <Chip
                          size="small"
                          label={`${schedule.presentCount} presentes`}
                          color="success"
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={`${schedule.absentCount} faltas`}
                          color="error"
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={`${schedule.pendingCount} pendentes`}
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {schedule.lessonContent}
                    </Typography>
                    {!schedule.attendanceRecords.length && (
                      <Typography color="text.secondary">
                        Nenhuma presença registrada neste encontro.
                      </Typography>
                    )}
                    <Stack
                      component="ul"
                      spacing={1}
                      sx={{ p: 0, m: 0, listStyle: "none" }}
                    >
                      {schedule.attendanceRecords.map((record) => (
                        <Box
                          component="li"
                          key={record.id}
                          sx={{
                            borderBottom: "1px solid",
                            borderColor: attendanceColors.border,
                            pb: 1,
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            gap={1}
                          >
                            <Typography sx={{ overflowWrap: "anywhere" }}>
                              {record.memberName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={
                                record.type === AttendanceType.PRESENT
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {record.type === AttendanceType.PRESENT
                                ? "Presente"
                                : "Faltou"}
                            </Typography>
                          </Stack>
                          {record.comment && (
                            <Typography
                              variant="body2"
                              sx={{
                                overflowWrap: "anywhere",
                                color: attendanceColors.muted,
                              }}
                            >
                              {record.comment}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                    <Button
                      component={Link}
                      to={attendanceTeamPath(
                        team.teamId,
                        schedule.scheduleId,
                        schedule.category,
                      )}
                      sx={{
                        minHeight: 48,
                        mt: 2,
                        color: attendanceColors.accent,
                      }}
                    >
                      Abrir frequência da equipe
                    </Button>
                  </AccordionDetails>
                </Accordion>
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
    </Box>
  );
}
