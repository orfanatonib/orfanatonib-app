import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { getPendingForMember, registerAttendance } from '../api';
import type { AttendanceType, PendingForMemberDto, RegisterAttendanceDto } from '../types';
import type { RootState as RootStateType } from '@/store/slices';

const formatScheduleLabel = (pending: PendingForMemberDto) => {
  const date = pending.visitDate || pending.meetingDate;
  const readableDate = date ? new Date(date).toLocaleDateString('pt-BR') : 'Data a definir';
  const kind = pending.visitDate ? 'Visita' : 'Reunião';
  return `${kind} #${pending.visitNumber} • ${readableDate}`;
};

const AttendanceBell = () => {
  const { isAuthenticated } = useSelector((state: RootStateType) => state.auth);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendings, setPendings] = useState<PendingForMemberDto[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [type, setType] = useState<AttendanceType>('present');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedPending = useMemo(
    () => pendings.find(p => p.scheduleId === selectedId),
    [pendings, selectedId]
  );

  const fetchPendings = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingForMember();
      setPendings(res);
      setSelectedId(prev => (prev ? prev : res[0]?.scheduleId || ''));
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências.';
      setError(message);
      setPendings([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendings();
    } else {
      setPendings([]);
    }
  }, [fetchPendings, isAuthenticated]);

  const handleOpen = () => {
    if (!open) {
      fetchPendings();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFeedback(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const dto: RegisterAttendanceDto = { scheduleId: selectedId, type, comment: comment.trim() || undefined };
      await registerAttendance(dto);
      setFeedback('Presença registrada. Se já existia registro, foi atualizado.');
      setComment('');
      await fetchPendings();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar presença.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Tooltip title="Pendências de presença">
        <IconButton
          color="inherit"
          onClick={handleOpen}
          sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { color: '#FFFF00' } }}
        >
          <Badge
            badgeContent={pendings.length}
            color={pendings.length > 0 ? 'error' : 'default'}
            overlap="circular"
          >
            {pendings.length > 0 ? <NotificationsActiveIcon /> : <PendingActionsIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Suas pendências de presença</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              O sininho consulta `/attendance/pending/member`. Ao clicar, escolha o evento e envie presença/falta
              (idempotente).
            </Typography>

            {loading && <Typography variant="body2">Carregando pendências...</Typography>}
            {!loading && pendings.length === 0 && (
              <Alert severity="success">Nenhuma pendência de presença para você.</Alert>
            )}

            {pendings.map(pending => (
              <Box
                key={pending.scheduleId}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: pending.scheduleId === selectedId ? 'primary.main' : 'divider',
                  bgcolor: pending.scheduleId === selectedId ? 'primary.light' : 'background.paper',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedId(pending.scheduleId)}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2">{formatScheduleLabel(pending)}</Typography>
                    <Chip size="small" label={`Time ${pending.teamNumber}`} />
                    {pending.shelterName && <Chip size="small" label={pending.shelterName} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {pending.lessonContent}
                  </Typography>
                </Stack>
              </Box>
            ))}

            {selectedPending && (
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                <Typography variant="subtitle1">Registrar presença para o evento selecionado</Typography>
                <ToggleButtonGroup
                  value={type}
                  exclusive
                  onChange={(_, value) => value && setType(value)}
                  size="small"
                  color="primary"
                >
                  <ToggleButton value="present">Presente</ToggleButton>
                  <ToggleButton value="absent">Falta</ToggleButton>
                </ToggleButtonGroup>
                <TextField
                  label="Comentário (opcional)"
                  placeholder="Motivo da falta ou observação"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  size="small"
                  multiline
                  minRows={2}
                  fullWidth
                />
              </Stack>
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {feedback && <Alert severity="success">{feedback}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Fechar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!selectedId || saving || loading || pendings.length === 0}
          >
            {saving ? 'Enviando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AttendanceBell;
