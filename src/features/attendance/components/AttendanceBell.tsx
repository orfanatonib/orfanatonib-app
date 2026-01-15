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
  Drawer,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { getAllPendings, registerAttendance } from '../api';
import { AttendanceType, EventCategory } from '../types';
import type { PendingForMemberDto, RegisterAttendanceDto } from '../types';
import type { RootState as RootStateType } from '@/store/slices';

const formatScheduleLabel = (pending: PendingForMemberDto) => {
  const readableDate = pending.date ? new Date(pending.date).toLocaleDateString('pt-BR') : 'Data a definir';
  const kind = pending.category === EventCategory.VISIT ? 'Visita' : 'Reunião';
  return `${kind} #${pending.visitNumber} • ${readableDate}`;
};

const AttendanceBell = () => {
  const { isAuthenticated } = useSelector((state: RootStateType) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendings, setPendings] = useState<PendingForMemberDto[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [type, setType] = useState<AttendanceType>(AttendanceType.PRESENT);
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
      const res = await getAllPendings();
      const memberPendings = res.memberPendings;
      setPendings(memberPendings);
      // Auto-select the first one if none selected or if previously selected is gone
      if (memberPendings.length > 0) {
        if (!selectedId || !memberPendings.find(p => p.scheduleId === selectedId)) {
          setSelectedId(memberPendings[0].scheduleId);
        }
      } else {
        setSelectedId('');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências.';
      setError(message);
      setPendings([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedId]);

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
      setFeedback('Presença registrada!');
      setComment('');
      // Wait a bit before refreshing to show success message
      setTimeout(async () => {
        await fetchPendings();
        setFeedback(null); // Clear feedback after refresh
        // If no more pendings, close modal automatically (optional but nice)
        // But we can't easily check future state here without re-fetching manually or trusting empty state
      }, 1500);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar presença.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  const renderContent = () => (
    <Stack spacing={2} sx={{ mb: isMobile ? 2 : 0 }}>
      <Typography variant="body2" color="text.secondary">
        Selecione um evento para registrar sua presença:
      </Typography>

      {loading && <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>Carregando...</Typography>}

      {!loading && pendings.length === 0 && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Você não tem nenhuma pendência!
        </Alert>
      )}

      {/* Horizontal Scroll for Cards on Mobile, Vertical Stack on Desktop */}
      {pendings.length > 0 && (
        <Box
          sx={
            isMobile
              ? {
                display: 'flex',
                overflowX: 'auto',
                gap: 1.5,
                pb: 1,
                mx: -2, // Negative margin to allow edge-to-edge scrolling
                px: 2, // Padding to bring content back in line
                '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar for cleaner look
                scrollbarWidth: 'none',
              }
              : {
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                maxHeight: '40vh',
                overflowY: 'auto'
              }
          }
        >
          {pendings.map(pending => {
            const isSelected = pending.scheduleId === selectedId;
            return (
              <Box
                key={pending.scheduleId}
                onClick={() => setSelectedId(pending.scheduleId)}
                sx={{
                  minWidth: isMobile ? '85%' : 'auto', // Show part of next card on mobile
                  p: 2,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? 2 : 0,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" color={isSelected ? 'primary.main' : 'text.primary'}>
                  {formatScheduleLabel(pending)}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, mb: 1 }}>
                  <Chip label={pending.shelterName} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                  <Chip label={`Time ${pending.teamNumber}`} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                </Stack>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {pending.lessonContent}
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}

      {selectedPending && (
        <Box sx={{
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 2
        }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Registrar presença
          </Typography>

          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, value) => value && setType(value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value={AttendanceType.PRESENT} color="success" sx={{ py: 1.5 }}>
              <CheckCircleIcon sx={{ mr: 1 }} /> Presente
            </ToggleButton>
            <ToggleButton value={AttendanceType.ABSENT} color="error" sx={{ py: 1.5 }}>
              <CancelIcon sx={{ mr: 1 }} /> Falta
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Comentário (opcional)"
            placeholder="Observação"
            value={comment}
            onChange={e => setComment(e.target.value)}
            size="small"
            multiline
            minRows={2}
            fullWidth
          />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
      {feedback && <Alert severity="success" sx={{ borderRadius: 2 }}>{feedback}</Alert>}
    </Stack>
  );

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

      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '85vh'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold">
              Pendências ({pendings.length})
            </Typography>
            <IconButton onClick={handleClose} size="small" sx={{ bgcolor: 'grey.100' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 2, overflowY: 'auto' }}>
            {renderContent()}
            <Button
              onClick={handleSubmit}
              variant="contained"
              fullWidth
              size="large"
              disabled={!selectedId || saving || loading || pendings.length === 0}
              sx={{ mt: 1, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
            >
              {saving ? 'Enviando...' : 'Confirmar Presença'}
            </Button>
          </Box>
        </Drawer>
      ) : (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Suas pendências de presença
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {renderContent()}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!selectedId || saving || loading || pendings.length === 0}
            >
              {saving ? 'Enviando...' : 'Registrar Presença'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default AttendanceBell;
