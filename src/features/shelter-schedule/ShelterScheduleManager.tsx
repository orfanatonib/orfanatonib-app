import { useCallback, useMemo, useState } from "react";
import { Alert, Button, Fab, useMediaQuery, useTheme } from "@mui/material";
import { Add as AddIcon, EventNote as EventNoteIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";
import {
  AdminCardGrid,
  AdminListScreen,
  useAdminList,
  type AdminFilterField,
} from "@/components/common/admin-shell";

import { useMyTeams } from "./hooks";
import {
  apiCreateShelterSchedule,
  apiDeleteShelterSchedule,
  apiListShelterSchedulesPage,
  apiUpdateShelterSchedule,
} from "./api";
import { CreateShelterScheduleDto, ShelterScheduleResponseDto, UpdateShelterScheduleDto } from "./types";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";
import ShelterScheduleFormModal from "./components/ShelterScheduleFormModal";
import ShelterScheduleDeleteDialog from "./components/ShelterScheduleDeleteDialog";
import LeaderInfoBanner from "./components/LeaderInfoBanner";
import VisitCard from "./components/VisitCard";
import ScheduleDetailsModal from "./components/ScheduleDetailsModal";
import NoTeamLinked from "@/components/common/NoTeamLinked";

export const SCHEDULE_TEST_ID_PREFIX = "shelter-schedule";
const DEFAULT_SORT = "shelterName:ASC";
const ERROR_MESSAGE = "Erro ao carregar agendamentos";

const SORT_OPTIONS = [
  { value: "shelterName:ASC", label: "Abrigo (A–Z)" },
  { value: "shelterName:DESC", label: "Abrigo (Z–A)" },
  { value: "eventDate:ASC", label: "Data do evento (mais antiga)" },
  { value: "eventDate:DESC", label: "Data do evento (mais recente)" },
  { value: "visitNumber:ASC", label: "Número da visita (menor)" },
  { value: "visitNumber:DESC", label: "Número da visita (maior)" },
  { value: "createdAt:DESC", label: "Criados recentemente" },
  { value: "createdAt:ASC", label: "Criados há mais tempo" },
];

const KIND_OPTIONS = [
  { value: "visit", label: "Visita" },
  { value: "meeting", label: "Reunião" },
];

export default function ShelterScheduleManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isLeader = user?.role === UserRole.LEADER;

  const list = useAdminList<ShelterScheduleResponseDto>({
    fetcher: apiListShelterSchedulesPage,
    defaultFilters: { sort: DEFAULT_SORT },
    errorMessage: ERROR_MESSAGE,
  });
  const { reload } = list;

  const { teams, loading: teamsLoading, error: teamsError } = useMyTeams();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ShelterScheduleResponseDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<ShelterScheduleResponseDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ShelterScheduleResponseDto | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const shelterOptions = useMemo(() => {
    const byId = new Map<string, string>();
    teams.forEach((team) => byId.set(team.shelter.id, team.shelter.name));
    return [...byId.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teams]);

  const fields: AdminFilterField[] = useMemo(
    () => [
      { kind: "select", key: "shelterId", label: "Abrigo", options: shelterOptions, allLabel: "Todos os abrigos" },
      { kind: "select", key: "kind", label: "Tipo de evento", options: KIND_OPTIONS, allLabel: "Visitas e reuniões" },
      { kind: "date", key: "eventFrom", label: "Evento a partir de" },
      { kind: "date", key: "eventTo", label: "Evento até" },
      { kind: "select", key: "sort", label: "Ordenar por", options: SORT_OPTIONS, allLabel: null },
    ],
    [shelterOptions],
  );

  const getVisitColor = useCallback(
    (visitNumber: number) => {
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.error.main,
      ];
      return colors[(visitNumber - 1) % colors.length];
    },
    [theme],
  );

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (schedule: ShelterScheduleResponseDto) => {
    setEditingSchedule(schedule);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingSchedule(null);
  };

  const handleOpenDelete = (schedule: ShelterScheduleResponseDto) => {
    setDeletingSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingSchedule(null);
  };

  const handleViewDetails = (schedule: ShelterScheduleResponseDto) => {
    setSelectedSchedule(schedule);
    setDetailsModalOpen(true);
  };

  const handleSubmit = async (data: CreateShelterScheduleDto | UpdateShelterScheduleDto) => {
    setSubmitting(true);
    try {
      if (editingSchedule) {
        await apiUpdateShelterSchedule(editingSchedule.id, data as UpdateShelterScheduleDto);
      } else {
        await apiCreateShelterSchedule(data as CreateShelterScheduleDto);
      }
      handleCloseForm();
      reload();
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    setSubmitting(true);
    try {
      await apiDeleteShelterSchedule(deletingSchedule.id);
      handleCloseDelete();
      if (selectedSchedule?.id === deletingSchedule.id) setSelectedSchedule(null);
      reload();
    } catch (err: unknown) {
      handleCloseDelete();
      setActionError(getApiErrorMessage(err, "Não foi possível excluir o agendamento."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!teamsLoading && !isAdmin && teams.length === 0) {
    return <NoTeamLinked showBackButton={false} />;
  }

  const p = SCHEDULE_TEST_ID_PREFIX;

  return (
    <AdminListScreen
      testIdPrefix={p}
      title="Agendamentos de Visitas"
      searchLabel="Buscar agendamento"
      searchPlaceholder="Buscar por abrigo, lição, observação ou sala..."
      fields={fields}
      list={list}
      emptyMessage="Nenhum agendamento cadastrado ainda."
      emptyIcon={<EventNoteIcon fontSize="large" />}
      skeletonWithCover={false}
      primaryAction={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          data-testid="schedule-new"
          onClick={handleOpenCreate}
          fullWidth
          sx={{ borderRadius: 2, minHeight: 44, whiteSpace: "nowrap" }}
        >
          Novo Agendamento
        </Button>
      }
      beforeToolbar={
        <>
          {isLeader && !isAdmin && <LeaderInfoBanner />}
          {actionError && (
            <Alert
              severity="error"
              data-testid="shelter-schedule-action-error"
              onClose={() => setActionError(null)}
              sx={{ mb: 2 }}
            >
              {actionError}
            </Alert>
          )}
        </>
      }
      overlays={
        <>
          {isMobile && (
            <Fab
              color="primary"
              aria-label="Novo Agendamento"
              data-testid="schedule-new-fab"
              onClick={handleOpenCreate}
              sx={{ position: "fixed", bottom: 80, right: 16, zIndex: 10 }}
            >
              <AddIcon />
            </Fab>
          )}

          <ShelterScheduleFormModal
            open={formOpen}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            initialData={editingSchedule}
            loading={submitting}
            hideInfoBanner={isAdmin}
            teams={teams}
            teamsLoading={teamsLoading}
            teamsError={teamsError}
          />

          <ShelterScheduleDeleteDialog
            open={deleteDialogOpen}
            onClose={handleCloseDelete}
            onConfirm={handleConfirmDelete}
            schedule={deletingSchedule}
            loading={submitting}
          />

          <ScheduleDetailsModal
            open={detailsModalOpen}
            schedule={selectedSchedule}
            getVisitColor={getVisitColor}
            onClose={() => setDetailsModalOpen(false)}
            onEdit={handleOpenEdit}
          />
        </>
      }
    >
      <AdminCardGrid testId={`${p}-cards`}>
        {list.items.map((schedule) => (
          <VisitCard
            key={schedule.id}
            schedule={schedule}
            onViewDetails={handleViewDetails}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
