import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Badge,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';

import { registerTeamAttendance, getAttendanceRecords } from '../api';
import type {
  ShelterWithTeamsDto,
  TeamWithMembersDto,
  TeamScheduleDto,
  RegisterTeamAttendanceDto,
  AttendanceType,
  AttendanceFormState,
  TeamMemberDto,
  AttendanceResponseDto
} from '../types';
import { formatScheduleLabel } from '../utils';

interface TeamMemberAttendanceProps {
  shelter: ShelterWithTeamsDto;
  team: TeamWithMembersDto;
  schedules: TeamScheduleDto[];
  loadingSchedules?: boolean;
  onBack: () => void;
  onAttendanceRegistered: () => void;
}

interface MemberAttendanceRow {
  member: TeamMemberDto;
  type: AttendanceType;
  comment: string;
}

const MemberAttendanceCard = memo(({
  member,
  attendance,
  onTypeChange,
  onCommentChange,
  disabled
}: {
  member: TeamMemberDto;
  attendance: { type: AttendanceType; comment: string };
  onTypeChange: (type: AttendanceType) => void;
  onCommentChange: (comment: string) => void;
  disabled?: boolean;
}) => {
  const showComment = attendance.type === 'absent';
  const isPresent = attendance.type === 'present';

  return (
    <Box
      sx={{
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Stack spacing={0}>
        {/* Linha principal compacta */}
        <Box sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Checkbox/Indicador */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: isPresent
                  ? 'success.main'
                  : attendance.type === 'absent'
                  ? 'error.main'
                  : 'grey.300',
                color: isPresent || attendance.type === 'absent' ? 'white' : 'grey.600',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  opacity: disabled ? 1 : 0.8,
                  transform: disabled ? 'none' : 'scale(1.05)',
                },
              }}
              onClick={() => !disabled && onTypeChange(isPresent ? ('absent' as AttendanceType) : ('present' as AttendanceType))}
            >
              {isPresent ? (
                <CheckCircleIcon fontSize="small" />
              ) : attendance.type === 'absent' ? (
                <CancelIcon fontSize="small" />
              ) : (
                <PersonIcon fontSize="small" />
              )}
            </Box>

            {/* Informações do membro */}
            <Box flex={1} minWidth={0} sx={{ overflow: 'hidden' }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography 
                  variant="body1" 
                  fontWeight="medium" 
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: { xs: '100%', sm: 200, md: 250, lg: 300 },
                  }}
                >
                  {member.name}
                </Typography>
                <Chip
                  size="small"
                  label={member.role === 'leader' ? 'Líder' : 'Professor'}
                  color={member.role === 'leader' ? 'primary' : 'secondary'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem', flexShrink: 0 }}
                />
              </Stack>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {member.email}
              </Typography>
            </Box>

            {/* Botões de ação rápida */}
            <Stack 
              direction={{ xs: 'row', sm: 'row' }} 
              spacing={1}
              sx={{ 
                flexShrink: 0,
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              }}
            >
              <Button
                size="small"
                variant={isPresent ? 'contained' : 'outlined'}
                color="success"
                onClick={() => !disabled && onTypeChange('present')}
                disabled={disabled}
                sx={{
                  minWidth: { xs: '100%', sm: 90 },
                  textTransform: 'none',
                  fontWeight: isPresent ? 'bold' : 'normal',
                }}
              >
                ✓ Presente
              </Button>
              <Button
                size="small"
                variant={attendance.type === 'absent' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => !disabled && onTypeChange('absent')}
                disabled={disabled}
                sx={{
                  minWidth: { xs: '100%', sm: 80 },
                  textTransform: 'none',
                  fontWeight: attendance.type === 'absent' ? 'bold' : 'normal',
                }}
              >
                ✕ Falta
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Campo de comentário (expande quando falta) */}
        <Collapse in={showComment}>
          <Box
            sx={{
              px: 1.5,
              pb: 1.5,
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'error.50',
            }}
          >
            <TextField
              label="Motivo da falta (opcional)"
              placeholder="Ex: Doente, viagem, compromisso pessoal..."
              value={attendance.comment}
              onChange={e => onCommentChange(e.target.value)}
              size="small"
              multiline
              minRows={2}
              maxRows={4}
              disabled={disabled}
              fullWidth
              helperText="Explique brevemente o motivo da ausência (opcional)"
            />
          </Box>
        </Collapse>
      </Stack>
    </Box>
  );
});

const TeamMemberAttendance = memo(({
  shelter,
  team,
  schedules,
  loadingSchedules = false,
  onBack,
  onAttendanceRegistered
}: TeamMemberAttendanceProps) => {
  // Garantir que schedules seja sempre um array
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  
  const [scheduleId, setScheduleId] = useState<string>('');
  
  // Atualizar scheduleId quando schedules mudar
  useEffect(() => {
    if (safeSchedules.length > 0) {
      // Se não tem scheduleId selecionado ou o selecionado não existe mais, usa o primeiro
      const currentScheduleExists = scheduleId && safeSchedules.find(s => s.id === scheduleId);
      if (!currentScheduleExists) {
        // Sempre seleciona o primeiro evento quando os schedules são carregados
        setScheduleId(safeSchedules[0].id);
      }
    } else if (scheduleId) {
      // Se não há schedules mas ainda tem um scheduleId, limpa
      setScheduleId('');
    }
  }, [safeSchedules, scheduleId]);
  // Filtrar apenas professores (líderes não registram presença)
  const teachersOnly = useMemo(() => {
    return team.members.filter(member => member.role === 'teacher' || !member.role);
  }, [team.members]);

  const [memberAttendances, setMemberAttendances] = useState<Record<string, MemberAttendanceRow>>(() => {
    const initial: Record<string, MemberAttendanceRow> = {};
    // Inicializar apenas professores, todos como presente
    const teachers = team.members.filter(member => member.role === 'teacher' || !member.role);
    teachers.forEach(member => {
      initial[member.id] = {
        member,
        type: 'present' as AttendanceType,
        comment: '',
      };
    });
    return initial;
  });

  // Atualizar memberAttendances quando teachersOnly mudar (adicionar novos professores)
  useEffect(() => {
    setMemberAttendances(prev => {
      const updated = { ...prev };
      let changed = false;
      
      teachersOnly.forEach(member => {
        if (!updated[member.id]) {
          updated[member.id] = {
            member,
            type: 'present' as AttendanceType,
            comment: '',
          };
          changed = true;
        }
      });
      
      // Remover membros que não são mais professores
      Object.keys(updated).forEach(memberId => {
        if (!teachersOnly.find(m => m.id === memberId)) {
          delete updated[memberId];
          changed = true;
        }
      });
      
      return changed ? updated : prev;
    });
  }, [teachersOnly]);

  const [formState, setFormState] = useState<AttendanceFormState>({
    loading: false,
    error: null,
    feedback: null,
  });

  const [existingRecords, setExistingRecords] = useState<AttendanceResponseDto[]>([]);
  const [loadingExistingRecords, setLoadingExistingRecords] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  // Carregar registros existentes quando scheduleId mudar
  useEffect(() => {
    const loadExistingRecords = async () => {
      if (!scheduleId) {
        setExistingRecords([]);
        setHasExistingAttendance(false);
        // Resetar para valores padrão quando não há evento selecionado
        setMemberAttendances(prev => {
          const updated: Record<string, MemberAttendanceRow> = {};
          teachersOnly.forEach(member => {
            updated[member.id] = {
              member,
              type: 'present' as AttendanceType,
              comment: '',
            };
          });
          return updated;
        });
        return;
      }

      try {
        setLoadingExistingRecords(true);
        const response = await getAttendanceRecords({
          scheduleId,
          limit: 100, // Buscar todos os registros do evento
        });
        
        const records = response.data || [];
        setExistingRecords(records);
        setHasExistingAttendance(records.length > 0);

        // Preencher formulário com dados existentes
        if (records.length > 0) {
          setMemberAttendances(prev => {
            const updated: Record<string, MemberAttendanceRow> = {};
            teachersOnly.forEach(member => {
              const existingRecord = records.find(r => r.memberId === member.id);
              if (existingRecord) {
                updated[member.id] = {
                  member,
                  type: existingRecord.type,
                  comment: existingRecord.comment || '',
                };
              } else {
                // Se não tem registro, inicializar como presente
                updated[member.id] = {
                  member,
                  type: 'present' as AttendanceType,
                  comment: '',
                };
              }
            });
            return updated;
          });
        } else {
          // Se não há registros, inicializar todos como presente
          setMemberAttendances(prev => {
            const updated: Record<string, MemberAttendanceRow> = {};
            teachersOnly.forEach(member => {
              updated[member.id] = {
                member,
                type: 'present' as AttendanceType,
                comment: '',
              };
            });
            return updated;
          });
        }
      } catch (err: any) {
        console.error('Erro ao carregar registros existentes:', err);
        // Em caso de erro, manter valores padrão
        setExistingRecords([]);
        setHasExistingAttendance(false);
      } finally {
        setLoadingExistingRecords(false);
      }
    };

    loadExistingRecords();
  }, [scheduleId, teachersOnly]);

  const handleMemberTypeChange = useCallback((memberId: string, type: AttendanceType) => {
    setMemberAttendances(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        type,
      },
    }));
  }, []);

  const handleMemberCommentChange = useCallback((memberId: string, comment: string) => {
    setMemberAttendances(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        comment,
      },
    }));
  }, []);

  const bulkSetType = useCallback((type: AttendanceType) => {
    setMemberAttendances(prev => {
      const updated: Record<string, MemberAttendanceRow> = {};
      Object.keys(prev).forEach(memberId => {
        updated[memberId] = {
          ...prev[memberId],
          type,
          // Limpar comentário se mudar de falta para presente
          comment: type === 'present' ? '' : prev[memberId].comment,
        };
      });
      return updated;
    });
  }, []);

  const clearAllComments = useCallback(() => {
    setMemberAttendances(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(memberId => {
        updated[memberId] = {
          ...updated[memberId],
          comment: '',
        };
      });
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!scheduleId) {
      setFormState(prev => ({
        ...prev,
        error: 'Selecione um evento para registrar a presença.',
      }));
      return;
    }

    if (safeSchedules.length === 0) {
      setFormState(prev => ({
        ...prev,
        error: 'Nenhum evento disponível para esta equipe. Tente novamente mais tarde.',
      }));
      return;
    }

    const selectedSchedule = safeSchedules.find(s => s.id === scheduleId);
    if (!selectedSchedule) {
      setFormState(prev => ({
        ...prev,
        error: 'Evento selecionado não encontrado. Por favor, selecione outro evento.',
      }));
      // Tentar definir o primeiro schedule disponível
      if (safeSchedules.length > 0) {
        setScheduleId(safeSchedules[0].id);
      }
      return;
    }

    if (teachersOnly.length === 0) {
      setFormState(prev => ({
        ...prev,
        error: 'Nenhum professor na equipe para registrar presença.',
      }));
      return;
    }

    setFormState(prev => ({
      ...prev,
      loading: true,
      error: null,
      feedback: null,
    }));

    try {
      const attendances = Object.values(memberAttendances).map(row => ({
        memberId: row.member.id,
        type: row.type,
        comment: row.comment.trim() || undefined,
      }));

      const dto: RegisterTeamAttendanceDto = {
        teamId: team.teamId,
        scheduleId,
        attendances,
      };

      await registerTeamAttendance(dto);

      // Recarregar registros existentes após salvar
      const response = await getAttendanceRecords({
        scheduleId,
        limit: 100,
      });
      setExistingRecords(response.data || []);
      setHasExistingAttendance(response.data && response.data.length > 0);

      setFormState(prev => ({
        ...prev,
        loading: false,
        feedback: {
          status: 'success',
          message: hasExistingAttendance
            ? `Pagela atualizada com sucesso para ${attendances.length} membro${attendances.length > 1 ? 's' : ''}!`
            : `Pagela registrada com sucesso para ${attendances.length} membro${attendances.length > 1 ? 's' : ''}!`,
        },
      }));

      onAttendanceRegistered();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar pagela. Tente novamente.';
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [scheduleId, safeSchedules, memberAttendances, team.teamId, teachersOnly.length, hasExistingAttendance, registerTeamAttendance, onAttendanceRegistered]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header fixo no topo */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: 2,
          mb: 2,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={onBack}
            aria-label="Voltar para seleção de equipes"
            sx={{ flexShrink: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box flex={1} minWidth={0}>
            <Typography variant="h5" fontWeight="bold" noWrap>
              Time {team.teamNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {shelter.shelterName} • {teachersOnly.length} professor{teachersOnly.length !== 1 ? 'es' : ''}
            </Typography>
          </Box>

          {/* Seleção de evento compacta no header (desktop) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              minWidth: { md: 300, lg: 400 },
              maxWidth: { md: 300, lg: 400 },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              {loadingExistingRecords && (
                <CircularProgress
                  size={20}
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                  }}
                />
              )}
              <TextField
                select
                label="Evento"
                value={scheduleId}
                onChange={e => setScheduleId(e.target.value)}
                required
                size="small"
                disabled={loadingSchedules || safeSchedules.length === 0 || loadingExistingRecords}
                fullWidth
                helperText={
                  loadingSchedules
                    ? 'Carregando...'
                    : loadingExistingRecords
                    ? 'Carregando registros...'
                    : safeSchedules.length === 0
                    ? 'Nenhum evento'
                    : hasExistingAttendance
                    ? 'Pagela já lançada - editando'
                    : 'Selecione o evento'
                }
              >
                {safeSchedules.map(schedule => {
                  // Verificar se este evento tem registros (precisa buscar ou manter estado)
                  const scheduleHasRecords = existingRecords.length > 0 && existingRecords[0]?.scheduleId === schedule.id;
                  return (
                    <MenuItem key={schedule.id} value={schedule.id}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                        <Box flex={1}>{formatScheduleLabel(schedule)}</Box>
                        {scheduleHasRecords && (
                          <CheckCircleOutlineIcon fontSize="small" color="success" />
                        )}
                      </Stack>
                    </MenuItem>
                  );
                })}
              </TextField>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Layout de duas colunas no desktop */}
      <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Coluna esquerda: Seleção de evento (mobile) e ações */}
        <Grid item xs={12} md={4} lg={3}>
          <Stack spacing={3}>
            {/* Seleção de evento (visível apenas no mobile) */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Card variant="outlined">
                <CardHeader
                  avatar={
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <EventAvailableIcon />
                    </Box>
                  }
                  title="Selecionar Evento"
                  subheader="Escolha o evento para registrar a presença"
                />
                <CardContent>
                  <Box sx={{ position: 'relative' }}>
                    {loadingExistingRecords && (
                      <CircularProgress
                        size={20}
                        sx={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <TextField
                      select
                      label="Evento"
                      value={scheduleId}
                      onChange={e => setScheduleId(e.target.value)}
                      required
                      size="small"
                      disabled={loadingSchedules || safeSchedules.length === 0 || loadingExistingRecords}
                      fullWidth
                      helperText={
                        loadingSchedules
                          ? 'Carregando eventos...'
                          : loadingExistingRecords
                          ? 'Carregando registros...'
                          : safeSchedules.length === 0
                          ? 'Nenhum evento encontrado'
                          : hasExistingAttendance
                          ? 'Pagela já lançada - editando'
                          : 'Selecione o evento'
                      }
                    >
                      {safeSchedules.map(schedule => {
                        const scheduleHasRecords = existingRecords.length > 0 && existingRecords[0]?.scheduleId === schedule.id;
                        return (
                          <MenuItem key={schedule.id} value={schedule.id}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                              <Box flex={1}>{formatScheduleLabel(schedule)}</Box>
                              {scheduleHasRecords && (
                                <CheckCircleOutlineIcon fontSize="small" color="success" />
                              )}
                            </Stack>
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Indicador de status da pagela */}
            {hasExistingAttendance && (
              <Alert
                severity="info"
                icon={<EditIcon />}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                  <strong>Pagela já lançada.</strong> Você está editando os registros existentes.
                </Typography>
              </Alert>
            )}

            {/* Estatísticas rápidas */}
            <Card variant="outlined">
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Resumo
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Total:</Typography>
                      <Chip label={teachersOnly.length} size="small" color="default" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="success.main">Presentes:</Typography>
                      <Chip
                        label={
                          Object.values(memberAttendances).filter(m => m.type === 'present').length
                        }
                        size="small"
                        color="success"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="error.main">Faltas:</Typography>
                      <Chip
                        label={
                          Object.values(memberAttendances).filter(m => m.type === 'absent').length
                        }
                        size="small"
                        color="error"
                      />
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Ações rápidas */}
            <Card variant="outlined">
              <CardHeader
                title="Ações Rápidas"
                titleTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
              />
              <CardContent>
                <Stack spacing={1.5}>
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    fullWidth
                    startIcon={<CheckCircleIcon />}
                    onClick={() => bulkSetType('present' as AttendanceType)}
                    disabled={formState.loading}
                  >
                    Todos Presentes
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    fullWidth
                    startIcon={<CancelIcon />}
                    onClick={() => bulkSetType('absent' as AttendanceType)}
                    disabled={formState.loading}
                  >
                    Todos Faltas
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<ClearAllIcon />}
                    onClick={clearAllComments}
                    disabled={formState.loading}
                  >
                    Limpar Comentários
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Botão salvar (sticky no desktop) */}
            <Box
              sx={{
                position: { xs: 'relative', md: 'sticky' },
                bottom: { md: 0 },
                pt: { md: 2 },
              }}
            >
              <Card variant="outlined" sx={{ bgcolor: 'primary.50', borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack spacing={2}>
                    {formState.error && (
                      <Alert
                        severity="error"
                        onClose={() => setFormState(prev => ({ ...prev, error: null }))}
                        sx={{ mb: 0 }}
                      >
                        {formState.error}
                      </Alert>
                    )}

                    {formState.feedback && (
                      <Alert
                        severity={formState.feedback.status}
                        onClose={() => setFormState(prev => ({ ...prev, feedback: null }))}
                        sx={{ mb: 0 }}
                      >
                        {formState.feedback.message}
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={
                        formState.loading ||
                        loadingSchedules ||
                        safeSchedules.length === 0 ||
                        !scheduleId ||
                        teachersOnly.length === 0
                      }
                      startIcon={formState.loading ? <CircularProgress size={20} color="inherit" /> : null}
                      fullWidth
                      sx={{
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                      }}
                      title={
                        loadingSchedules
                          ? 'Carregando eventos...'
                          : safeSchedules.length === 0
                          ? 'Nenhum evento disponível para esta equipe'
                          : !scheduleId
                          ? 'Selecione um evento'
                          : teachersOnly.length === 0
                          ? 'Nenhum professor na equipe'
                          : ''
                      }
                    >
                      {formState.loading
                        ? hasExistingAttendance
                          ? 'Atualizando...'
                          : 'Registrando...'
                        : hasExistingAttendance
                        ? 'Atualizar Pagela'
                        : 'Salvar Pagela'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Grid>

        {/* Coluna direita: Lista de membros (scrollável) */}
        <Grid item xs={12} md={8} lg={9}>
          <Card
            variant="outlined"
            sx={{
              height: { xs: 'auto', md: 'calc(100vh - 200px)' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardHeader
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    color: 'secondary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <GroupsIcon />
                </Box>
              }
              title={`Professores do Time (${teachersOnly.length})`}
              subheader="Marque presença ou falta para cada professor"
              action={
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ display: { xs: 'none', md: 'flex' } }}
                >
                  <Tooltip title="Marcar todos como presentes">
                    <IconButton
                      onClick={() => bulkSetType('present' as AttendanceType)}
                      size="small"
                      aria-label="Marcar todos como presentes"
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Marcar todos como falta">
                    <IconButton
                      onClick={() => bulkSetType('absent' as AttendanceType)}
                      size="small"
                      aria-label="Marcar todos como falta"
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            />

            <CardContent
              sx={{
                flex: 1,
                overflow: 'auto',
                p: '16px !important',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'grey.100',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: 'grey.500',
                  },
                },
              }}
            >
              {teachersOnly.length === 0 ? (
                <Alert severity="info">Nenhum professor encontrado nesta equipe.</Alert>
              ) : (
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                  }}
                >
                  {teachersOnly.map((member, index) => (
                    <Box
                      key={member.id}
                      sx={{
                        bgcolor: index % 2 === 0 ? 'background.paper' : 'grey.50',
                        '&:not(:last-child)': {
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        },
                      }}
                    >
                      <MemberAttendanceCard
                        member={member}
                        attendance={memberAttendances[member.id]}
                        onTypeChange={(type) => handleMemberTypeChange(member.id, type)}
                        onCommentChange={(comment) => handleMemberCommentChange(member.id, comment)}
                        disabled={formState.loading}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});

TeamMemberAttendance.displayName = 'TeamMemberAttendance';

export default TeamMemberAttendance;
