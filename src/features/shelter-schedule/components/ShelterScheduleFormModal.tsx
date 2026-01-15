import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";

import { useMyTeams } from "../hooks";
import { ShelterScheduleResponseDto, CreateShelterScheduleDto } from "../types";
import { useIsFeatureEnabled, FeatureFlagKeys } from "@/features/feature-flags";

dayjs.locale("pt-br");

interface ShelterScheduleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShelterScheduleDto) => Promise<void>;
  initialData?: ShelterScheduleResponseDto | null;
  loading?: boolean;
  hideInfoBanner?: boolean;
}

export default function ShelterScheduleFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  hideInfoBanner = false,
}: ShelterScheduleFormModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { teams, loading: teamsLoading, error: teamsError } = useMyTeams();
  const isAddressEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_ADDRESS);

  const [teamId, setTeamId] = useState("");
  const [visitNumber, setVisitNumber] = useState<number | "">(1);
  const [visitDate, setVisitDate] = useState<Dayjs | null>(null);
  const [visitTime, setVisitTime] = useState<Dayjs | null>(null);
  const [meetingDate, setMeetingDate] = useState<Dayjs | null>(null);
  const [meetingTime, setMeetingTime] = useState<Dayjs | null>(null);
  const [lessonContent, setLessonContent] = useState("");
  const [observation, setObservation] = useState("");
  const [meetingRoom, setMeetingRoom] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {

        setTeamId(initialData.shelter.team.id);
        setVisitNumber(initialData.visitNumber);
        setVisitDate(initialData.visitDate ? dayjs(initialData.visitDate) : null);
        setVisitTime(initialData.visitDate ? dayjs(initialData.visitDate) : null);
        setMeetingDate(initialData.meetingDate ? dayjs(initialData.meetingDate) : null);
        setMeetingTime(initialData.meetingDate ? dayjs(initialData.meetingDate) : null);
        setLessonContent(initialData.lessonContent);
        setObservation(initialData.observation || "");
        setMeetingRoom(initialData.meetingRoom || "");
      } else {

        setTeamId(teams.length === 1 ? teams[0].id : "");
        setVisitNumber(1);
        setVisitDate(null);
        setVisitTime(null);
        setMeetingDate(null);
        setMeetingTime(null);
        setLessonContent("");
        setObservation("");
        setMeetingRoom("");
      }
      setFormError(null);
    }
  }, [open, initialData, teams]);

  const combineDateAndTime = (date: Dayjs | null, time: Dayjs | null): string | undefined => {
    if (!date) return undefined;

    let combined = date.startOf("day");
    if (time) {
      combined = combined.hour(time.hour()).minute(time.minute());
    }
    return combined.toISOString();
  };

  const handleSubmit = async () => {
    if (!teamId || !visitNumber || !lessonContent.trim()) {
      setFormError("Preencha os campos obrigatórios: Equipe, Número da Visita e Conteúdo da Lição.");
      return;
    }

    try {
      setFormError(null);
      await onSubmit({
        visitNumber: Number(visitNumber),
        teamId,
        visitDate: combineDateAndTime(visitDate, visitTime),
        meetingDate: combineDateAndTime(meetingDate, meetingTime),
        lessonContent: lessonContent.trim(),
        observation: observation.trim() || undefined,
        meetingRoom: meetingRoom.trim() || undefined,
      });
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Erro ao salvar agendamento.");
    }
  };

  const selectedTeam = teams.find((t) => t.id === teamId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 3 },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography component="span" variant="h6" fontWeight="bold">
          {isEdit ? "Editar Agendamento" : "Novo Agendamento"}
        </Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!hideInfoBanner && (
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              textAlign: "center",
              boxShadow: 2,
            }}
          >
            <Typography variant="body1" fontWeight="bold" color="white" sx={{ mb: 0.5 }}>
              📋 Informe qual lição pretende adotar na visita!
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", fontStyle: "italic" }}>
              💡 Data, horário e sala podem ser preenchidos depois!
            </Typography>
          </Box>
        )}

        {teamsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {teamsError}
          </Alert>
        )}

        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
            <FormControl fullWidth required disabled={teamsLoading} sx={{ flex: 2 }}>
              <InputLabel>Equipe</InputLabel>
              <Select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                label="Equipe"
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    Equipe {team.numberTeam}{team.shelter ? ` - ${team.shelter.name}` : ' (Sem abrigo)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Nº da Visita"
              type="number"
              value={visitNumber}
              onChange={(e) => setVisitNumber(e.target.value ? Number(e.target.value) : "")}
              required
              sx={{ flex: 1, minWidth: 120 }}
              inputProps={{ min: 1 }}
              helperText="Ex: 1, 2, 3..."
            />
          </Box>

          <TextField
            label="Conteúdo da Lição"
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
            placeholder="Ex: Parábola do Bom Samaritano - Lucas 10:25-37"
            helperText="Descreva o conteúdo que será ministrado na visita"
          />

          {selectedTeam && selectedTeam.shelter && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: "grey.50",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.200",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Abrigo selecionado
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {selectedTeam.shelter.name}
              </Typography>
              {isAddressEnabled && selectedTeam.shelter.address && (
                <Typography variant="caption" color="text.secondary">
                  {selectedTeam.shelter.address.street}, {selectedTeam.shelter.address.number} -{" "}
                  {selectedTeam.shelter.address.city}/{selectedTeam.shelter.address.state}
                </Typography>
              )}
            </Box>
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Reunião
            </Typography>
            <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }} mb={1.5}>
              <DatePicker
                label="Data"
                value={meetingDate}
                onChange={(newValue) => setMeetingDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />
              <MobileTimePicker
                label="Hora"
                value={meetingTime}
                onChange={(newValue) => setMeetingTime(newValue)}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />
            </Box>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Visita
            </Typography>
            <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
              <DatePicker
                label="Data"
                value={visitDate}
                onChange={(newValue) => setVisitDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />
              <MobileTimePicker
                label="Hora"
                value={visitTime}
                onChange={(newValue) => setVisitTime(newValue)}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />
            </Box>
          </LocalizationProvider>

          <TextField
            label="Sala da Reunião"
            value={meetingRoom}
            onChange={(e) => setMeetingRoom(e.target.value)}
            fullWidth
            placeholder="Ex: Sala 3 - NIB"
            helperText="Deixe em branco para usar 'NIB - Nova Igreja Batista'"
          />

          <TextField
            label="Observações"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            multiline
            rows={2}
            fullWidth
            placeholder="Ex: Preparar materiais visuais para a história"
            helperText="Opcional - informações adicionais sobre a reunião/visita"
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: 1,
          "& > button": {
            width: { xs: "100%", sm: "auto" },
          },
        }}
      >
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || teamsLoading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ whiteSpace: "nowrap" }}
        >
          {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
