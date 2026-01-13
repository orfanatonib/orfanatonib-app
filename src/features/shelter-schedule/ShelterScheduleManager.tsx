import React, { useState, useMemo } from "react";
import { Box, CircularProgress, Alert, Button, Fab, useTheme, useMediaQuery, TextField, InputAdornment } from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";

import { useShelterSchedules, useMyTeams } from "./hooks";
import { ShelterScheduleResponseDto } from "./types";
import ShelterScheduleFormModal from "./components/ShelterScheduleFormModal";
import ShelterScheduleDeleteDialog from "./components/ShelterScheduleDeleteDialog";
import LeaderInfoBanner from "./components/LeaderInfoBanner";
import ScheduleHeader from "./components/ScheduleHeader";
import EmptyState from "./components/EmptyState";
import NoTeamsState from "./components/NoTeamsState";
import ShelterCard from "./components/ShelterCard";
import ScheduleDetailsModal from "./components/ScheduleDetailsModal";

interface TeamGroup {
  teamId: string;
  teamNumber: number;
  schedules: ShelterScheduleResponseDto[];
}

interface ShelterGroup {
  shelterId: string;
  shelterName: string;
  shelterDescription: string;
  address: {
    city: string;
    state: string;
    street: string;
    number: string;
  };
  teams: TeamGroup[];
  totalSchedules: number;
}

export default function ShelterScheduleManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isLeader = user?.role === UserRole.LEADER;

  const {
    schedules,
    loading,
    error,
    refetch,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useShelterSchedules();

  const { teams, loading: teamsLoading } = useMyTeams();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ShelterScheduleResponseDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<ShelterScheduleResponseDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedShelterId, setExpandedShelterId] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ShelterScheduleResponseDto | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const groupedData = useMemo((): ShelterGroup[] => {
    const shelterMap = new Map<string, ShelterGroup>();

    schedules.forEach((schedule) => {
      const shelter = schedule.shelter;
      const team = shelter.team;

      if (!shelterMap.has(shelter.id)) {
        shelterMap.set(shelter.id, {
          shelterId: shelter.id,
          shelterName: shelter.name,
          shelterDescription: shelter.description || "",
          address: {
            city: shelter.address?.city || "",
            state: shelter.address?.state || "",
            street: shelter.address?.street || "",
            number: shelter.address?.number || "",
          },
          teams: [],
          totalSchedules: 0,
        });
      }

      const shelterGroup = shelterMap.get(shelter.id)!;
      shelterGroup.totalSchedules++;

      let teamGroup = shelterGroup.teams.find((t) => t.teamId === team.id);
      if (!teamGroup) {
        teamGroup = {
          teamId: team.id,
          teamNumber: team.numberTeam,
          schedules: [],
        };
        shelterGroup.teams.push(teamGroup);
      }

      teamGroup.schedules.push(schedule);
    });

    shelterMap.forEach((shelter) => {
      shelter.teams.sort((a, b) => a.teamNumber - b.teamNumber);
      shelter.teams.forEach((team) => {
        team.schedules.sort((a, b) => a.visitNumber - b.visitNumber);
      });
    });

    return Array.from(shelterMap.values()).sort((a, b) =>
      a.shelterName.localeCompare(b.shelterName)
    );
  }, [schedules]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return groupedData;

    const term = searchTerm.toLowerCase();
    return groupedData.filter(shelter =>
      shelter.shelterName.toLowerCase().includes(term)
    );
  }, [groupedData, searchTerm]);

  React.useEffect(() => {
    if (groupedData.length > 0 && expandedShelterId === null && isLeader && !isAdmin) {
      setExpandedShelterId(groupedData[0].shelterId);
    }
  }, [groupedData, isLeader, isAdmin]);

  const toggleShelter = (shelterId: string) => {
    setExpandedShelterId((prev) => (prev === shelterId ? null : shelterId));
  };

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

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await createSchedule(data);
      }
      handleCloseForm();
    } catch (err: any) {
      console.error("Error saving schedule");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    setSubmitting(true);
    try {
      await deleteSchedule(deletingSchedule.id);
      handleCloseDelete();
      if (selectedSchedule?.id === deletingSchedule.id) {
        setSelectedSchedule(null);
      }
    } catch (err: any) {
      console.error("Error deleting schedule:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getVisitColor = (visitNumber: number) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
    ];
    return colors[(visitNumber - 1) % colors.length];
  };

  if (loading || (teamsLoading && schedules.length === 0)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={<Button onClick={refetch}>Tentar novamente</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto", boxSizing: "border-box", width: "100%" }}>
      {isLeader && !isAdmin && <LeaderInfoBanner />}

      <ScheduleHeader
        schedulesCount={schedules.length}
        sheltersCount={groupedData.length}
        onCreateClick={handleOpenCreate}
      />

      {schedules.length === 0 && (
        teams.length === 0 && !isAdmin ? (
          <NoTeamsState />
        ) : (
          <EmptyState onCreateClick={handleOpenCreate} />
        )
      )}

      {schedules.length > 0 && (
        <>
          <TextField
            fullWidth
            placeholder="Buscar por nome do abrigo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: { xs: 2, md: 3 },
            }}
          >
            {filteredData.length === 0 ? (
              <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 8 }}>
                <Alert severity="info">
                  Nenhum abrigo encontrado com o termo "{searchTerm}"
                </Alert>
              </Box>
            ) : (
              filteredData.map((shelter) => (
                <ShelterCard
                  key={shelter.shelterId}
                  shelter={shelter}
                  isExpanded={expandedShelterId === shelter.shelterId}
                  selectedScheduleId={selectedSchedule?.id || null}
                  getVisitColor={getVisitColor}
                  onToggleExpand={toggleShelter}
                  onViewDetails={handleViewDetails}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))
            )}
          </Box>
        </>
      )}

      {isMobile && (
        <Fab
          color="primary"
          aria-label="Novo Agendamento"
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
    </Box>
  );
}
