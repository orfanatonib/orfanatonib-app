import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

import { ShelterScheduleResponseDto } from "../types";

dayjs.locale("pt-br");

interface ShelterScheduleDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  schedule: ShelterScheduleResponseDto | null;
  loading?: boolean;
}

export default function ShelterScheduleDeleteDialog({
  open,
  onClose,
  onConfirm,
  schedule,
  loading = false,
}: ShelterScheduleDeleteDialogProps) {
  if (!schedule) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Não definida";
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon color="error" />
        <Typography variant="h6" fontWeight="bold">
          Confirmar Exclusão
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Tem certeza que deseja excluir este agendamento?
        </Typography>

        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Equipe {schedule.shelter.team.numberTeam} - {schedule.shelter.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Visita: {formatDate(schedule.visitDate)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reunião: {formatDate(schedule.meetingDate)}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Atenção:</strong> Os eventos de visita e reunião já criados{" "}
            <strong>não serão removidos</strong> automaticamente.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Excluindo..." : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
