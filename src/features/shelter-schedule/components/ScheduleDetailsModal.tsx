import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Avatar,
  Typography,
  IconButton,
  Button,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  MenuBook as LessonIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  MeetingRoom as RoomIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

import { ShelterScheduleResponseDto } from "../types";

dayjs.locale("pt-br");

interface ScheduleDetailsModalProps {
  open: boolean;
  schedule: ShelterScheduleResponseDto | null;
  getVisitColor: (visitNumber: number) => string;
  onClose: () => void;
  onEdit: (schedule: ShelterScheduleResponseDto) => void;
}

export default function ScheduleDetailsModal({
  open,
  schedule,
  getVisitColor,
  onClose,
  onEdit,
}: ScheduleDetailsModalProps) {
  const theme = useTheme();

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return dayjs(dateStr).format("DD/MM/YYYY [às] HH:mm");
  };

  if (!schedule) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: { xs: 1, sm: 2 },
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            sx={{
              bgcolor: getVisitColor(schedule.visitNumber),
              width: 48,
              height: 48,
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
          >
            {schedule.visitNumber}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold" component="span">
              Visita {schedule.visitNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" display="block">
              Equipe {schedule.shelter.team.numberTeam}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Abrigo */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <HomeIcon color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Abrigo
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight="medium">
            {schedule.shelter.name}
          </Typography>
          {schedule.shelter.address && (
            <Typography variant="caption" color="text.secondary" display="block">
              {schedule.shelter.address.street}, {schedule.shelter.address.number} -{" "}
              {schedule.shelter.address.city}/{schedule.shelter.address.state}
            </Typography>
          )}
        </Box>

        {/* Conteúdo da Lição */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LessonIcon color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Conteúdo da Lição
            </Typography>
          </Box>
          <Typography variant="body1">{schedule.lessonContent}</Typography>
        </Box>

        {/* Data/Hora da Visita */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <EventIcon color="success" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Data/Hora da Visita
            </Typography>
          </Box>
          <Typography variant="body1">
            {formatDateTime(schedule.visitDate) || "Não definida"}
          </Typography>
        </Box>

        {/* Data/Hora da Reunião */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <ScheduleIcon color="info" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Data/Hora da Reunião
            </Typography>
          </Box>
          <Typography variant="body1">
            {formatDateTime(schedule.meetingDate) || "Não definida"}
          </Typography>
        </Box>

        {/* Sala da Reunião */}
        {schedule.meetingRoom && (
          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <RoomIcon color="warning" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Sala da Reunião
              </Typography>
            </Box>
            <Typography variant="body1">{schedule.meetingRoom}</Typography>
          </Box>
        )}

        {/* Observações */}
        {schedule.observation && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Observações
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.grey[500], 0.05),
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                {schedule.observation}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
          Fechar
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            onClose();
            onEdit(schedule);
          }}
          sx={{ borderRadius: 2 }}
        >
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
