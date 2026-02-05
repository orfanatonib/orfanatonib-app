import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Alert,
  CircularProgress,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useNavigate } from 'react-router-dom';
import { registerAttendance } from '@/features/attendance/api';
import { AttendanceType, EventCategory } from '@/features/attendance/types';
import type { PendingForMemberDto, RegisterAttendanceDto, PendingForLeaderDto, TeamPendingsDto, TeamVisitReportPendingsDto } from '@/features/attendance/types';
import type { RootState as RootStateType } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';
import { ATTENDANCE_ERROR_MESSAGES, ATTENDANCE_SUCCESS_MESSAGES } from '@/constants/errors';

export interface ProfileAlert {
  id: string;
  message: string;
  to?: string;
}

export interface AttendancePendingsProps {
  memberPendings: PendingForMemberDto[];
  leaderPendings: TeamPendingsDto[];
  visitReportPendings: TeamVisitReportPendingsDto[];
  leaderPendingsCount: number;
  memberPendingsCount: number;
  visitReportPendingsCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export interface CompleteProfileAlertProps {
  alerts: ProfileAlert[];
  attendancePendings?: AttendancePendingsProps;
  onAlertClick?: () => void;
}

const CompleteProfileAlert: React.FC<CompleteProfileAlertProps> = ({
  alerts,
  attendancePendings,
  onAlertClick
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { isAuthenticated, user } = useSelector((state: RootStateType) => state.auth);

  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [type, setType] = useState<AttendanceType>(AttendanceType.PRESENT);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const isMember = isAuthenticated && user?.role === UserRole.MEMBER;
  const isLeaderOrAdmin = isAuthenticated && (user?.role === UserRole.LEADER || user?.role === UserRole.ADMIN);

  const memberPendings = attendancePendings?.memberPendings || [];
  const leaderPendingsCount = attendancePendings?.leaderPendingsCount || 0;
  const memberPendingsCount = attendancePendings?.memberPendingsCount || 0;
  const visitReportPendingsCount = attendancePendings?.visitReportPendingsCount || 0;
  const loading = attendancePendings?.loading || false;

  const pendingCount = isMember ? memberPendingsCount : (leaderPendingsCount + visitReportPendingsCount);
  const badgeCount = alerts.length + pendingCount;
  const hasAnyAlert = badgeCount > 0;

  const selectedPending = useMemo(
    () => memberPendings.find(p => p.scheduleId === selectedId && p.category === selectedCategory),
    [memberPendings, selectedId, selectedCategory]
  );

  const handleOpenPendingDialog = () => {
    setPendingDialogOpen(true);
    setFeedback(null);
    setPendingError(null);
    if (memberPendings.length > 0 && !selectedId) {
      setSelectedId(memberPendings[0].scheduleId);
      setSelectedCategory(memberPendings[0].category);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAlertClick = (to?: string) => {
    handleClose();
    if (onAlertClick) onAlertClick();
    if (to) navigate(to);
  };

  const handleSubmitPending = async () => {
    if (!selectedId) return;
    setSaving(true);
    setFeedback(null);
    setPendingError(null);
    try {
      const dto: RegisterAttendanceDto = {
        scheduleId: selectedId,
        type,
        category: selectedCategory ?? undefined,
        comment: comment.trim() || undefined
      };
      await registerAttendance(dto);
      setFeedback(type === AttendanceType.ABSENT ? ATTENDANCE_SUCCESS_MESSAGES.ABSENCE_REGISTERED : ATTENDANCE_SUCCESS_MESSAGES.PRESENCE_REGISTERED);
      setComment('');

      if (attendancePendings?.refetch) {
        await attendancePendings.refetch();
      }

      setTimeout(() => {
        setPendingDialogOpen(false);
        setSelectedId('');
        setSelectedCategory(null);
        setType(AttendanceType.PRESENT);
        setComment('');
        setFeedback(null);
      }, 2000);
    } catch (err: any) {
      const message = err?.response?.data?.message || ATTENDANCE_ERROR_MESSAGES.REGISTER_GENERIC;
      setPendingError(message);
    } finally {
      setSaving(false);
    }
  };

  const formatScheduleLabel = (pending: PendingForMemberDto | PendingForLeaderDto) => {
    const readableDate = pending.date ? new Date(pending.date).toLocaleDateString('pt-BR') : 'Data a definir';
    const kind = pending.category === EventCategory.VISIT ? 'Visita' : 'Reunião';
    return `${kind} #${pending.visitNumber} • ${readableDate}`;
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if ((!alerts || alerts.length === 0) && pendingCount === 0) return null;

  const renderAttendanceContent = () => (
    <Stack spacing={2} sx={{ mt: 2, pb: isMobile ? 2 : 0 }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && memberPendings.length === 0 && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {ATTENDANCE_SUCCESS_MESSAGES.NO_PENDINGS}
        </Alert>
      )}

      {!loading && memberPendings.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Selecione um evento para registrar sua presença:
        </Typography>
      )}

      {/* Cards Layout: Horizontal Scroll on Mobile, Vertical Stack on Desktop */}
      {!loading && memberPendings.length > 0 && (
        <Box
          sx={
            isMobile
              ? {
                display: 'flex',
                overflowX: 'auto',
                gap: 1.5,
                pb: 1,
                mx: -2, // Negative margin for edge-to-edge
                px: 2,
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
              }
              : {
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }
          }
        >
          {memberPendings.map(pending => {
            const isSelected = pending.scheduleId === selectedId && pending.category === selectedCategory;
            return (
              <Box
                key={`${pending.scheduleId}-${pending.category}`}
                onClick={() => {
                  setSelectedId(pending.scheduleId);
                  setSelectedCategory(pending.category);
                }}
                sx={{
                  minWidth: isMobile ? '85%' : 'auto',
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
                <Typography variant="subtitle2" fontWeight={isSelected ? 'bold' : 'medium'} color={isSelected ? 'primary.main' : 'text.primary'}>
                  {formatScheduleLabel(pending)}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                  {pending.lessonContent}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip size="small" label={pending.teamName} sx={{ height: 20, fontSize: '0.7rem' }} />
                  <Chip
                    size="small"
                    label={pending.shelterName}
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      maxWidth: '100px',
                      '& .MuiChip-label': {
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        px: 1, // Minimize padding if needed
                      },
                    }}
                  />
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {selectedPending && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Registrar presença
            </Typography>

            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, value) => {
                if (value) {
                  setType(value);
                  if (value === AttendanceType.PRESENT) {
                    setComment('');
                  }
                }
              }}
              fullWidth
              size="large"
              color="primary"
              sx={{
                '& .MuiToggleButton-root': {
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                }
              }}
            >
              <ToggleButton value={AttendanceType.PRESENT}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon />
                  Presente
                </Box>
              </ToggleButton>
              <ToggleButton value={AttendanceType.ABSENT}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon />
                  Falta
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            {type === AttendanceType.ABSENT && (
              <TextField
                label="Motivo da falta"
                placeholder="Descreva o motivo (opcional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                size="medium"
                multiline
                minRows={2}
                fullWidth
              />
            )}
          </Stack>
        </Box>
      )}

      {pendingError && <Alert severity="error">{pendingError}</Alert>}
      {feedback && <Alert severity="success">{feedback}</Alert>}
    </Stack>
  );

  return (
    <>
      <Tooltip title={hasAnyAlert ? 'Você tem notificações' : 'Notificações'} arrow>
        <IconButton
          color="warning"
          onClick={handleClick}
          sx={{ ml: 1, p: 0.5 }}
        >
          <Badge color="error" overlap="circular" badgeContent={hasAnyAlert ? badgeCount : 0}>
            <NotificationsActiveIcon sx={{ fontSize: 26, color: '#FFD600' }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 320,
            maxWidth: 380,
            maxHeight: '75vh',
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 0, 0.3)',
            borderRadius: 2,
            overflow: 'hidden',
            overflowX: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',

            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 0, 0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 0, 0.2)',
              borderRadius: '5px',
              '&:hover': {
                background: 'rgba(255, 255, 0, 0.4)',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        MenuListProps={{
          sx: {
            py: 1,
            overflowX: 'hidden',
            width: '100%',
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid rgba(255, 255, 0, 0.2)',
            bgcolor: 'rgba(255, 255, 0, 0.05)',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: '#FFD600',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Notificações
          </Typography>
        </Box>

        <Box
          sx={{
            maxHeight: 'calc(75vh - 60px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 0, 0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 0, 0.2)',
              borderRadius: '5px',
              '&:hover': {
                background: 'rgba(255, 255, 0, 0.4)',
              },
            },
          }}
        >
          {alerts?.map((alert) => (
            <MenuItem
              key={alert.id}
              onClick={() => handleAlertClick(alert.to)}
              sx={{
                px: 2,
                py: 1.5,
                color: '#FFD600',
                borderLeft: '3px solid transparent',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%',
                width: '100%',
                overflow: 'hidden',
                overflowX: 'hidden',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 0, 0.1)',
                  borderLeftColor: '#FFD600',
                },
              }}
            >
              <ListItemText
                sx={{
                  width: '100%',
                  minWidth: 0,
                  margin: 0,
                }}
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#FFD600',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      maxWidth: '100%',
                      width: '100%',
                    }}
                  >
                    {alert.message}
                  </Typography>
                }
              />
            </MenuItem>
          ))}

          {alerts?.length > 0 && pendingCount > 0 && (
            <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 0.5 }} />
          )}

          {isMember && pendingCount > 0 && (
            <MenuItem
              onClick={() => {
                handleOpenPendingDialog();
                handleClose();
              }}
              sx={{
                px: 2,
                py: 1.5,
                color: '#FFD600',
                borderLeft: '3px solid transparent',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 0, 0.1)',
                  borderLeftColor: '#FFD600',
                },
              }}
            >
              <Box sx={{ mr: 1.5, color: '#FFD600' }}>
                <EventAvailableIcon fontSize="small" />
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#FFD600',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        flex: '1 1 auto',
                        minWidth: 0,
                      }}
                    >
                      Pendências de presença
                    </Typography>
                    <Chip
                      label={pendingCount}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: 'error.main',
                        color: 'white',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 0, 0.7)',
                      fontSize: '0.75rem',
                      mt: 0.5,
                      display: 'block',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      width: '100%',
                    }}
                  >
                    {`${pendingCount} evento${pendingCount !== 1 ? 's' : ''} aguardando sua presença/falta`}
                  </Typography>
                }
              />
            </MenuItem>
          )}

          {leaderPendingsCount > 0 && (
            <MenuItem
              onClick={() => {
                handleClose();
                navigate('/adm/presenca/pendencias');
              }}
              sx={{
                px: 2,
                py: 1.5,
                mb: 1, // Add separation
                color: '#FFD600',
                borderLeft: '3px solid transparent',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 0, 0.1)',
                  borderLeftColor: '#FFD600',
                },
              }}
            >
              <Box sx={{ mr: 1.5, color: '#FFD600' }}>
                <AssignmentIcon fontSize="small" />
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ color: '#FFD600', fontWeight: 600, fontSize: '0.875rem' }}>
                      Pendências de presença
                    </Typography>
                    <Chip label={leaderPendingsCount} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }} />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 0, 0.7)', fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    Clique para visualizar
                  </Typography>
                }
              />
            </MenuItem>
          )}

          {visitReportPendingsCount > 0 && (
            <MenuItem
              onClick={() => {
                handleClose();
                navigate('/adm/relatorios/pendencias');
              }}
              sx={{
                px: 2,
                py: 1.5,
                color: '#FFD600',
                borderLeft: '3px solid transparent',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 0, 0.1)',
                  borderLeftColor: '#FFD600',
                },
              }}
            >
              <Box sx={{ mr: 1.5, color: '#FFD600' }}>
                <DescriptionIcon fontSize="small" />
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ color: '#FFD600', fontWeight: 600, fontSize: '0.875rem' }}>
                      Relatórios pendentes
                    </Typography>
                    <Chip label={visitReportPendingsCount} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'warning.main', color: 'black', fontWeight: 'bold' }} />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 0, 0.7)', fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    Clique para visualizar
                  </Typography>
                }
              />
            </MenuItem>
          )}

          {!alerts?.length && pendingCount === 0 && (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 0, 0.5)',
                  fontSize: '0.875rem',
                }}
              >
                Nenhuma notificação
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>

      {/* Render Drawer for Mobile or Dialog for Desktop */}
      {isMember && (
        isMobile ? (
          <Drawer
            anchor="bottom"
            open={pendingDialogOpen}
            onClose={() => setPendingDialogOpen(false)}
            PaperProps={{
              sx: {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: '85vh',
                p: 0,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold">
                Pendências
              </Typography>
              <IconButton onClick={() => setPendingDialogOpen(false)} size="small" sx={{ bgcolor: 'grey.100' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 2, overflowY: 'auto' }}>
              {renderAttendanceContent()}
              <Button
                onClick={handleSubmitPending}
                variant="contained"
                fullWidth
                size="large"
                disabled={!selectedId || saving || loading || memberPendings.length === 0}
                sx={{ mt: 1, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
                color={type === AttendanceType.ABSENT ? 'error' : 'primary'}
              >
                {saving ? 'Confirmando...' : (type === AttendanceType.ABSENT ? 'Confirmar Falta' : 'Confirmar Presença')}
              </Button>
            </Box>
          </Drawer>
        ) : (
          <Dialog
            open={pendingDialogOpen}
            onClose={() => {
              setPendingDialogOpen(false);
              setSelectedId('');
              setSelectedCategory(null);
              setType(AttendanceType.PRESENT);
              setComment('');
            }}
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: { borderRadius: 3 }
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              Pendências de presença
              <IconButton onClick={() => setPendingDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {renderAttendanceContent()}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                onClick={() => setPendingDialogOpen(false)}
                color="inherit"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitPending}
                variant="contained"
                disabled={!selectedId || saving || loading || memberPendings.length === 0}
                color={type === AttendanceType.ABSENT ? 'error' : 'primary'}
              >
                {saving ? 'Registrando...' : (type === AttendanceType.ABSENT ? 'Registrar Falta' : 'Registrar Presença')}
              </Button>
            </DialogActions>
          </Dialog>
        )
      )}
    </>
  );
};


export default CompleteProfileAlert;
