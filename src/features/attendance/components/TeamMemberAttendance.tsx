import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { useTeamAttendance } from "../hooks/useTeamAttendance";
import { AttendanceType, EventCategory } from "../types";
import type { TeamAttendanceProps } from "../workspace.types";
import { ATTENDANCE_MEMBERS_PAGE_SIZE } from "../constants";
import { normalizeAttendanceSearch } from "../workspace.utils";
import { formatScheduleLabel } from "../utils";
import {
  attendanceCardSx,
  attendanceColors,
  attendancePrimarySx,
} from "@/theme/attendance";
import UnsavedChangesDialog from "@/components/common/modal/UnsavedChangesDialog";
import AttendanceMemberRow from "./AttendanceMemberRow";

export default function TeamMemberAttendance({
  shelter,
  team,
  schedules,
  onBack,
  onAttendanceRegistered,
  onBusyChange,
}: TeamAttendanceProps) {
  const form = useTeamAttendance({ team, schedules, onAttendanceRegistered });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const disabled = !form.ready || form.formState.loading;
  const members = Object.values(form.memberAttendances).filter((row) =>
    normalizeAttendanceSearch(row.member.name).includes(
      normalizeAttendanceSearch(search),
    ),
  );
  const pageCount = Math.max(
    1,
    Math.ceil(members.length / ATTENDANCE_MEMBERS_PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  const visible = members.slice(
    (currentPage - 1) * ATTENDANCE_MEMBERS_PAGE_SIZE,
    currentPage * ATTENDANCE_MEMBERS_PAGE_SIZE,
  );
  useEffect(() => {
    onBusyChange?.(form.formState.loading);
    return () => onBusyChange?.(false);
  }, [form.formState.loading, onBusyChange]);
  const changeSelection = (action: () => void) => {
    if (form.formState.loading) return;
    if (form.isDirty) setPendingAction(() => action);
    else action();
  };
  return (
    <Box data-testid="team-attendance-page" sx={{ minWidth: 0 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => changeSelection(onBack)}
        disabled={form.formState.loading}
        sx={{ minHeight: 44, mb: 1, color: attendanceColors.ink }}
      >
        Trocar equipe
      </Button>
      <Box sx={{ ...attendanceCardSx, mb: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Equipe {team.teamNumber} · {shelter.shelterName}
        </Typography>
        <Typography component="h2" variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          Escolha o evento
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} gap={2}>
          <ToggleButtonGroup
            value={form.eventTypeFilter}
            exclusive
            disabled={form.formState.loading}
            aria-label="Tipo de evento"
            onChange={(_, value: EventCategory | null) =>
              value &&
              changeSelection(() => {
                form.setEventTypeFilter(value);
                setPage(1);
              })
            }
            sx={{
              "& .MuiToggleButton-root": {
                flex: 1,
                minHeight: 48,
                minWidth: 110,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton value={EventCategory.VISIT}>Visitas</ToggleButton>
            <ToggleButton value={EventCategory.MEETING}>Reuniões</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            select
            fullWidth
            label="Evento"
            value={form.scheduleId}
            disabled={form.formState.loading || !form.filteredSchedules.length}
            onChange={(event) =>
              changeSelection(() => {
                form.setScheduleId(event.target.value);
                setPage(1);
              })
            }
            sx={{ minWidth: 0 }}
          >
            {form.filteredSchedules.map((schedule) => (
              <MenuItem
                key={`${schedule.id}-${schedule.category}`}
                value={schedule.id}
                sx={{ whiteSpace: "normal" }}
              >
                {formatScheduleLabel(schedule)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {form.selectionError && (
          <Alert
            severity="warning"
            sx={{ mt: 2 }}
            action={
              <Button
                onClick={() => form.setScheduleId("")}
                color="inherit"
                sx={{ minHeight: 44 }}
              >
                Escolher evento
              </Button>
            }
          >
            O evento deste link não está disponível para esta equipe e
            categoria.
          </Alert>
        )}
        {!form.filteredSchedules.length && (
          <Alert
            data-testid="team-attendance-no-events"
            severity="info"
            sx={{ mt: 2 }}
          >
            Nenhuma{" "}
            {form.eventTypeFilter === EventCategory.VISIT
              ? "visita"
              : "reunião"}{" "}
            agendada para esta equipe. Selecione outro tipo de evento ou confira
            a agenda.
          </Alert>
        )}
      </Box>
      {form.loadError ? (
        <Alert
          data-testid="team-attendance-load-error"
          severity="error"
          action={
            <Button
              onClick={form.retryLoad}
              color="inherit"
              sx={{ minHeight: 44 }}
            >
              Tentar novamente
            </Button>
          }
        >
          {form.loadError}
        </Alert>
      ) : form.scheduleId && !form.ready ? (
        <Box data-testid="team-attendance-loading" sx={{ py: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 1 }}>
            Carregando a frequência antes de liberar o preenchimento...
          </Typography>
        </Box>
      ) : (
        form.ready && (
          <>
            <Stack
              direction="row"
              gap={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mb: 2 }}
            >
              <Chip
                label={`${form.counts.present} presentes`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`${form.counts.absent} faltas`}
                color="error"
                variant="outlined"
              />
              <Chip
                label={`${form.counts.pending} por marcar`}
                variant="outlined"
              />
            </Stack>
            {form.hasExistingAttendance && (
              <Alert
                data-testid="team-attendance-existing"
                severity="info"
                sx={{ mb: 2 }}
              >
                Esta frequência já tem registros. Confira as marcações antes de
                atualizar.
              </Alert>
            )}
            <Box sx={{ ...attendanceCardSx, mb: 2 }}>
              <Typography component="h2" variant="h6" fontWeight={800}>
                Marque a presença de cada membro
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                As marcações só são enviadas quando você toca em salvar.
              </Typography>
              <TextField
                label="Buscar membro"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                fullWidth
                size="small"
              />
              <Button
                disabled={disabled || !form.counts.pending}
                onClick={() =>
                  Object.values(form.memberAttendances)
                    .filter((row) => row.type === null)
                    .forEach((row) =>
                      form.handleMemberTypeChange(
                        row.member.id,
                        AttendanceType.PRESENT,
                      ),
                    )
                }
                sx={{ minHeight: 44, mt: 1, color: attendanceColors.accent }}
              >
                Marcar pendentes como presentes
              </Button>
            </Box>
            <Stack spacing={1.5}>
              {visible.map((row) => (
                <AttendanceMemberRow
                  key={`${form.scheduleId}-${form.eventTypeFilter}-${row.member.id}`}
                  row={row}
                  disabled={disabled}
                  onTypeChange={(type) =>
                    form.handleMemberTypeChange(row.member.id, type)
                  }
                  onCommentChange={(comment) =>
                    form.handleMemberCommentChange(row.member.id, comment)
                  }
                />
              ))}
            </Stack>
            {!members.length && (
              <Alert severity="info" data-testid="team-attendance-no-members">
                {search
                  ? "Nenhum membro corresponde à busca."
                  : "Esta equipe ainda não tem membros vinculados."}
              </Alert>
            )}
            {pageCount > 1 && (
              <Pagination
                count={pageCount}
                page={currentPage}
                onChange={(_, value) => setPage(value)}
                size="small"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  my: 2,
                  "& .MuiPaginationItem-root": { minWidth: 44, height: 44 },
                }}
              />
            )}
          </>
        )
      )}
      <Box
        data-testid="team-attendance-save-bar"
        sx={{
          position: "sticky",
          bottom: 0,
          mt: 2,
          p: 2,
          pb: "max(16px, env(safe-area-inset-bottom))",
          borderTop: "1px solid",
          borderColor: attendanceColors.border,
          bgcolor: "background.paper",
          zIndex: 5,
          borderRadius: 2,
        }}
      >
        {form.formState.error && (
          <Alert
            data-testid="team-attendance-error"
            severity="error"
            sx={{ mb: 1 }}
          >
            {form.formState.error}
          </Alert>
        )}
        {form.formState.feedback && (
          <Alert
            data-testid="team-attendance-feedback"
            severity="success"
            sx={{ mb: 1 }}
          >
            {form.formState.feedback.message}
          </Alert>
        )}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          gap={1}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Typography variant="body2" aria-live="polite" color="text.secondary">
            {form.formState.loading
              ? "Salvando, aguarde..."
              : !form.ready
                ? "Selecione e carregue um evento para continuar."
                : form.counts.pending
                  ? `${form.counts.pending} membro(s) ainda por marcar`
                  : form.isDirty
                    ? "Marcações prontas para salvar"
                    : "Nenhuma alteração pendente"}
          </Typography>
          <Button
            data-testid="team-attendance-submit"
            startIcon={
              form.formState.loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveOutlined />
              )
            }
            variant="contained"
            disabled={
              disabled ||
              !form.isDirty ||
              form.counts.pending > 0 ||
              !form.counts.total
            }
            onClick={() => void form.handleSubmit()}
            sx={{ ...attendancePrimarySx, px: 3 }}
          >
            {form.formState.loading
              ? "Salvando..."
              : form.hasExistingAttendance
                ? "Salvar alterações"
                : "Salvar presenças"}
          </Button>
        </Stack>
      </Box>
      <UnsavedChangesDialog
        open={pendingAction !== null}
        onStay={() => setPendingAction(null)}
        onLeave={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
      />
    </Box>
  );
}
