
import React, { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useNavigate } from 'react-router-dom';
import { getPendingForMember, registerAttendance, getPendingForLeader, listTeams } from '@/features/attendance/api';
import type { AttendanceType, PendingForMemberDto, RegisterAttendanceDto, PendingForLeaderDto } from '@/features/attendance/types';
import type { RootState as RootStateType } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';

export interface ProfileAlert {
  id: string;
  message: string;
  to?: string; // optional redirect path
}

export interface CompleteProfileAlertProps {
  alerts: ProfileAlert[];
  onAlertClick?: () => void;
}

const CompleteProfileAlert: React.FC<CompleteProfileAlertProps> = ({ alerts, onAlertClick }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { isAuthenticated, user } = useSelector((state: RootStateType) => state.auth);

  // Estados para professores/membros
  const [pendings, setPendings] = useState<PendingForMemberDto[]>([]);
  const [loadingPendings, setLoadingPendings] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [type, setType] = useState<AttendanceType>('present');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Estados para líderes/admin
  const [leaderPendings, setLeaderPendings] = useState<PendingForLeaderDto[]>([]);
  const [loadingLeaderPendings, setLoadingLeaderPendings] = useState(false);

  const isMember = isAuthenticated && user?.role === UserRole.MEMBER;
  const isLeaderOrAdmin = isAuthenticated && (user?.role === UserRole.LEADER || user?.role === UserRole.ADMIN);

  // Contagem de pendências baseada no papel do usuário
  const pendingCount = isMember ? pendings.length : leaderPendings.length;
  const badgeCount = alerts.length + pendingCount;
  const hasAnyAlert = badgeCount > 0;

  const selectedPending = useMemo(
    () => pendings.find(p => p.scheduleId === selectedId),
    [pendings, selectedId]
  );

  // Carregar pendências para professores/membros
  const loadPendings = async () => {
    if (!isAuthenticated || !isMember) return;
    setLoadingPendings(true);
    setPendingError(null);
    try {
      const res = await getPendingForMember();
      setPendings(res);
      setSelectedId(prev => prev || res[0]?.scheduleId || '');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências.';
      setPendingError(message);
      setPendings([]);
    } finally {
      setLoadingPendings(false);
    }
  };

  // Carregar pendências para líderes/admin (pendências de lançamento de pagela)
  const loadLeaderPendings = async () => {
    if (!isAuthenticated || !isLeaderOrAdmin) return;
    setLoadingLeaderPendings(true);
    try {
      // Primeiro, buscar os times do líder
      const teams = await listTeams();
      
      // Buscar pendências para cada time
      const allPendings: PendingForLeaderDto[] = [];
      for (const team of teams) {
        try {
          const teamPendings = await getPendingForLeader(team.teamId);
          allPendings.push(...teamPendings);
        } catch (err) {
          // Ignorar erros de times específicos, continuar com os outros
          console.warn(`Erro ao buscar pendências para o time ${team.teamId}:`, err);
        }
      }
      
      setLeaderPendings(allPendings);
    } catch (err: any) {
      console.error('Erro ao buscar pendências de pagela:', err);
      setLeaderPendings([]);
    } finally {
      setLoadingLeaderPendings(false);
    }
  };

  useEffect(() => {
    if (isMember) {
      loadPendings();
    } else if (isLeaderOrAdmin) {
      loadLeaderPendings();
    }
  }, [isAuthenticated, isMember, isLeaderOrAdmin]); // carregar na montagem da navbar

  const handleOpenPendingDialog = () => {
    setPendingDialogOpen(true);
    setFeedback(null);
    setPendingError(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (!hasAnyAlert) {
      if (isMember) {
        loadPendings();
      } else if (isLeaderOrAdmin) {
        loadLeaderPendings();
      }
    }
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
      const dto: RegisterAttendanceDto = { scheduleId: selectedId, type, comment: comment.trim() || undefined };
      await registerAttendance(dto);
      setFeedback('Presença registrada. Se já existia registro, foi atualizada.');
      setComment('');
      await loadPendings();
      
      // Fechar modal automaticamente após 5 segundos
      setTimeout(() => {
        setPendingDialogOpen(false);
        setSelectedId('');
        setType('present');
        setComment('');
        setFeedback(null);
      }, 5000);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar presença.';
      setPendingError(message);
    } finally {
      setSaving(false);
    }
  };

  const formatScheduleLabel = (pending: PendingForMemberDto | PendingForLeaderDto) => {
    const date = pending.visitDate || pending.meetingDate;
    const readableDate = date ? new Date(date).toLocaleDateString('pt-BR') : 'Data a definir';
    const kind = pending.visitDate ? 'Visita' : 'Reunião';
    return `${kind} #${pending.visitNumber} • ${readableDate}`;
  };

  const formatLeaderPendingLabel = (pending: PendingForLeaderDto) => {
    const date = pending.visitDate || pending.meetingDate;
    const readableDate = date ? new Date(date).toLocaleDateString('pt-BR') : 'Data a definir';
    const kind = pending.visitDate ? 'Visita' : 'Reunião';
    return `${kind} #${pending.visitNumber} • ${readableDate} • ${pending.teamName} • ${pending.pendingMembers.length} pendente${pending.pendingMembers.length !== 1 ? 's' : ''}`;
  };

  if (!alerts && pendingCount === 0) return null;

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
            overflowX: 'hidden', // Prevenir scroll horizontal
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            // Estilizar scrollbar para melhor visibilidade
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
            overflowX: 'hidden', // Prevenir scroll horizontal
            width: '100%',
          },
        }}
      >
        {/* Header do menu */}
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
            overflowX: 'hidden', // Prevenir scroll horizontal
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
          {/* Alertas de perfil */}
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

          {/* Separador se houver alertas e pendências */}
          {alerts?.length > 0 && pendingCount > 0 && (
            <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 0.5 }} />
          )}

          {/* Item de menu para professores/membros - apenas se houver pendências */}
          {isMember && pendingCount > 0 && (
            <MenuItem
              onClick={() => {
                loadPendings();
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
                        minWidth: 0, // Permite que o texto encolha
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

          {/* Item de menu para líderes/admin - apenas se houver pendências */}
          {isLeaderOrAdmin && pendingCount > 0 && (
            <MenuItem
              onClick={() => {
                handleClose();
                navigate('/adm/presenca');
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
                <AssignmentIcon fontSize="small" />
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
                      Pendências de pagela
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
                    {`${pendingCount} evento${pendingCount !== 1 ? 's' : ''} aguardando lançamento de pagela`}
                  </Typography>
                }
              />
            </MenuItem>
          )}

          {/* Mensagem quando não há notificações */}
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

      {/* Dialog apenas para professores/membros */}
      {isMember && (
        <Dialog
          open={pendingDialogOpen}
          onClose={() => {
            setPendingDialogOpen(false);
            setSelectedId('');
            setType('present');
            setComment('');
          }}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              pb: 2,
              borderBottom: '2px solid',
              borderColor: 'divider',
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            Pendências de presença
          </DialogTitle>
          <DialogContent
            sx={{
              maxHeight: '70vh',
              overflow: 'auto',
              // Estilizar scrollbar para melhor visibilidade
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.5)',
                },
              },
            }}
          >
            <Stack spacing={2} sx={{ mt: 2 }}>
              {loadingPendings && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              {!loadingPendings && pendingCount === 0 && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Nenhuma pendência de presença para você.
                </Alert>
              )}

              {!loadingPendings && pendingCount > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Selecione um evento para registrar sua presença:
                </Typography>
              )}

              {pendings.map(pending => (
                <Button
                  key={pending.scheduleId}
                  variant={pending.scheduleId === selectedId ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => setSelectedId(pending.scheduleId)}
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    py: 1.5,
                    px: 2,
                    mb: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderWidth: pending.scheduleId === selectedId ? 2 : 1,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  <Stack alignItems="flex-start" spacing={0.5} sx={{ width: '100%' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: pending.scheduleId === selectedId ? 600 : 500,
                        wordBreak: 'break-word',
                      }}
                    >
                      {formatScheduleLabel(pending)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.8125rem',
                        wordBreak: 'break-word',
                      }}
                    >
                      {pending.lessonContent} — Time #{pending.teamNumber} • {pending.shelterName}
                    </Typography>
                  </Stack>
                </Button>
              ))}

            {selectedPending && (
              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: '2px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack spacing={2.5}>
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.125rem' }}>
                    Registrar presença
                  </Typography>
                  
                  <ToggleButtonGroup
                    value={type}
                    exclusive
                    onChange={(_, value) => {
                      if (value) {
                        setType(value);
                        // Limpar comentário se mudar para presente
                        if (value === 'present') {
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
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderWidth: 2,
                        '&.Mui-selected': {
                          borderWidth: 2,
                        },
                      },
                    }}
                  >
                    <ToggleButton value="present">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon />
                        Presente
                      </Box>
                    </ToggleButton>
                    <ToggleButton value="absent">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CancelIcon />
                        Falta
                      </Box>
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {/* Mostrar campo de comentário apenas quando "falta" estiver selecionado */}
                  {type === 'absent' && (
                    <TextField
                      label="Motivo da falta"
                      placeholder="Descreva o motivo da falta (opcional)"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      size="medium"
                      multiline
                      minRows={3}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                </Stack>
              </Box>
            )}

            {pendingError && <Alert severity="error">{pendingError}</Alert>}
            {feedback && <Alert severity="success">{feedback}</Alert>}
          </Stack>
        </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              gap: 1,
            }}
          >
            <Button
              onClick={() => {
                setPendingDialogOpen(false);
                setSelectedId('');
                setType('present');
                setComment('');
              }}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitPending}
              variant="contained"
              disabled={!selectedId || saving || loadingPendings || pendingCount === 0}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {saving ? 'Registrando...' : 'Registrar Presença'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default CompleteProfileAlert;
