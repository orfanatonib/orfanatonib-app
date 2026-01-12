import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import { AttendanceType } from '../types';
import type {
  ShelterWithTeamsDto,
  TeamWithMembersDto,
  TeamScheduleDto,
  RegisterTeamAttendanceDto,
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
  const showComment = attendance.type === AttendanceType.ABSENT;
  const isPresent = attendance.type === AttendanceType.PRESENT;

  return (
    <Box sx={{ transition: 'all 0.2s ease-in-out' }}>
      <Stack spacing={0}>
        <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={{ xs: 1.5, sm: 2 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: isPresent
                    ? 'success.main'
                    : attendance.type === AttendanceType.ABSENT
                      ? 'error.main'
                      : 'grey.300',
                  color: isPresent || attendance.type === AttendanceType.ABSENT ? 'white' : 'grey.600',
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
                onClick={() => !disabled && onTypeChange(isPresent ? AttendanceType.ABSENT : AttendanceType.PRESENT)}
              >
                {isPresent ? (
                  <CheckCircleIcon fontSize="small" />
                ) : attendance.type === AttendanceType.ABSENT ? (
                  <CancelIcon fontSize="small" />
                ) : (
                  <PersonIcon fontSize="small" />
                )}
              </Box>

              <Box flex={1} minWidth={0} sx={{ overflow: 'hidden' }}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {member.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={member.role === 'leader' ? 'Líder' : 'Membro'}
                    color={member.role === 'leader' ? 'primary' : 'secondary'}
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.6rem', flexShrink: 0 }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ flexShrink: 0 }}
            >
              <Button
                size="small"
                variant={isPresent ? 'contained' : 'outlined'}
                color="success"
                onClick={() => !disabled && onTypeChange(AttendanceType.PRESENT)}
                disabled={disabled}
                sx={{
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { xs: 0, sm: 90 },
                  textTransform: 'none',
                  fontWeight: isPresent ? 'bold' : 'normal',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                }}
              >
                ✓ Presente
              </Button>
              <Button
                size="small"
                variant={attendance.type === AttendanceType.ABSENT ? 'contained' : 'outlined'}
                color="error"
                onClick={() => !disabled && onTypeChange(AttendanceType.ABSENT)}
                disabled={disabled}
                sx={{
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { xs: 0, sm: 80 },
                  textTransform: 'none',
                  fontWeight: attendance.type === AttendanceType.ABSENT ? 'bold' : 'normal',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                }}
              >
                ✕ Falta
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Collapse in={showComment}>
          <Box
            sx={{
              px: { xs: 1, sm: 1.5 },
              pb: 1.5,
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'error.50',
            }}
          >
            <TextField
              label="Motivo da falta (opcional)"
              placeholder="Ex: Doente, viagem..."
              value={attendance.comment}
              onChange={e => onCommentChange(e.target.value)}
              size="small"
              multiline
              minRows={2}
              maxRows={4}
              disabled={disabled}
              fullWidth
              helperText="Explique brevemente o motivo da ausência"
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

  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  const [scheduleId, setScheduleId] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<'visit' | 'meeting'>('visit');

  const filteredSchedules = useMemo(() => {
    return safeSchedules.filter(s => {
      
      const type = s.category || (s.visitDate ? 'visit' : 'meeting');
      return type === eventTypeFilter;
    });
  }, [safeSchedules, eventTypeFilter]);

  useEffect(() => {
    if (filteredSchedules.length > 0) {
      
      const currentScheduleWithCategory = scheduleId
        ? filteredSchedules.find(s => s.id === scheduleId && s.category === eventTypeFilter)
        : null;

      if (!currentScheduleWithCategory) {
        
        const firstSchedule = filteredSchedules[0];
        if (firstSchedule) {
          
          if (firstSchedule.id !== scheduleId) {
            console.log('🔄 Changing scheduleId from', scheduleId, 'to', firstSchedule.id, 'due to filter change to', eventTypeFilter);
            setScheduleId(firstSchedule.id);
          }
          
        }
      }
      
    } else if (scheduleId) {
      setScheduleId('');
    }
  }, [filteredSchedules, eventTypeFilter]); 

  const membersOnly = useMemo(() => {
    return team.members.filter(member => member.role === 'member' || !member.role);
  }, [team.members]);

  const [memberAttendances, setMemberAttendances] = useState<Record<string, MemberAttendanceRow>>(() => {
    const initial: Record<string, MemberAttendanceRow> = {};

    const members = team.members.filter(member => member.role === 'member' || !member.role);
    members.forEach(member => {
      initial[member.id] = {
        member,
        type: AttendanceType.PRESENT,
        comment: '',
      };
    });
    return initial;
  });

  useEffect(() => {
    setMemberAttendances(prev => {
      const updated = { ...prev };
      let changed = false;

      membersOnly.forEach(member => {
        if (!updated[member.id]) {
          updated[member.id] = {
            member,
            type: AttendanceType.PRESENT,
            comment: '',
          };
          changed = true;
        }
      });

      Object.keys(updated).forEach(memberId => {
        if (!membersOnly.find(m => m.id === memberId)) {
          delete updated[memberId];
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [membersOnly]);

  const [formState, setFormState] = useState<AttendanceFormState>({
    loading: false,
    error: null,
    feedback: null,
  });

  const [existingRecords, setExistingRecords] = useState<AttendanceResponseDto[]>([]);
  const [loadingExistingRecords, setLoadingExistingRecords] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  const lastLoadedKey = useRef<string | null>(null);

  useEffect(() => {
    const loadExistingRecords = async () => {
      if (!scheduleId) {
        lastLoadedKey.current = null;
        setExistingRecords([]);
        setHasExistingAttendance(false);
        const resetAttendances: Record<string, MemberAttendanceRow> = {};
        membersOnly.forEach(member => {
          resetAttendances[member.id] = {
            member,
            type: AttendanceType.PRESENT,
            comment: '',
          };
        });
        setMemberAttendances(resetAttendances);
        return;
      }

      const selectedSchedule = safeSchedules.find(s => s.id === scheduleId);
      const category = selectedSchedule?.category || eventTypeFilter;
      const uniqueKey = `${scheduleId}-${category}`;

      if (lastLoadedKey.current === uniqueKey) {
        console.log('⏭️ Skipping duplicate load for key:', uniqueKey);
        return;
      }

      console.log('🔄 loadExistingRecords - scheduleId:', scheduleId, 'category:', category, 'uniqueKey:', uniqueKey);

      try {
        setLoadingExistingRecords(true);
        lastLoadedKey.current = uniqueKey; 

        console.log('📡 Fetching records for scheduleId:', scheduleId, 'category:', category);
        const response = await getAttendanceRecords({
          scheduleId,
          category: category as 'visit' | 'meeting',
          limit: 100,
        });

        const records = response.data || [];
        console.log('📦 Received', records.length, 'records:', records);
        setExistingRecords(records);
        setHasExistingAttendance(records.length > 0);

        const updated: Record<string, MemberAttendanceRow> = {};
        membersOnly.forEach(member => {
          const existingRecord = records.find(r => r.memberId === member.id);
          if (existingRecord) {
            updated[member.id] = {
              member,
              type: existingRecord.type,
              comment: existingRecord.comment || '',
            };
          } else {
            updated[member.id] = {
              member,
              type: AttendanceType.PRESENT,
              comment: '',
            };
          }
        });
        console.log('💾 Setting memberAttendances with', Object.keys(updated).length, 'members');
        setMemberAttendances(updated);
      } catch (err: any) {
        console.error('Erro ao carregar registros existentes:', err);
        lastLoadedKey.current = null; 
        setExistingRecords([]);
        setHasExistingAttendance(false);
        const resetAttendances: Record<string, MemberAttendanceRow> = {};
        membersOnly.forEach(member => {
          resetAttendances[member.id] = {
            member,
            type: AttendanceType.PRESENT,
            comment: '',
          };
        });
        setMemberAttendances(resetAttendances);
      } finally {
        setLoadingExistingRecords(false);
      }
    };

    loadExistingRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, eventTypeFilter]); 

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
          comment: type === AttendanceType.PRESENT ? '' : prev[memberId].comment,
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
      if (safeSchedules.length > 0) {
        setScheduleId(safeSchedules[0].id);
      }
      return;
    }

    if (membersOnly.length === 0) {
      setFormState(prev => ({
        ...prev,
        error: 'Nenhum membro na equipe para registrar presença.',
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

      const scheduleCategory = selectedSchedule.category || eventTypeFilter;

      const dto: RegisterTeamAttendanceDto = {
        teamId: team.teamId,
        scheduleId,
        category: scheduleCategory as 'visit' | 'meeting',
        attendances,
      };

      console.log('💾 Salvando frequência com DTO:', { teamId: dto.teamId, scheduleId: dto.scheduleId, category: dto.category, count: dto.attendances.length });

      await registerTeamAttendance(dto);
      
      const response = await getAttendanceRecords({
        scheduleId,
        category: scheduleCategory as 'visit' | 'meeting',
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
            ? `Frequência atualizada com sucesso para ${attendances.length} membro${attendances.length > 1 ? 's' : ''}!`
            : `Frequência registrada com sucesso para ${attendances.length} membro${attendances.length > 1 ? 's' : ''}!`,
        },
      }));

      onAttendanceRegistered();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar frequência. Tente novamente.';
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [scheduleId, safeSchedules, memberAttendances, team.teamId, membersOnly.length, hasExistingAttendance, registerTeamAttendance, onAttendanceRegistered]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

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
              Equipe {team.teamNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {shelter.shelterName} • {membersOnly.length} membro{membersOnly.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              minWidth: { md: 300, lg: 400 },
              maxWidth: { md: 300, lg: 400 },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                  value={eventTypeFilter}
                  exclusive
                  onChange={(e, value) => value && setEventTypeFilter(value)}
                  size="small"
                  aria-label="Filtro de eventos"
                  fullWidth
                >
                  <ToggleButton value="visit">Visitas</ToggleButton>
                  <ToggleButton value="meeting">Reuniões</ToggleButton>
                </ToggleButtonGroup>
              </Box>
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
                disabled={loadingSchedules || filteredSchedules.length === 0 || loadingExistingRecords}
                fullWidth
                helperText={
                  loadingSchedules
                    ? 'Carregando...'
                    : loadingExistingRecords
                      ? 'Carregando registros...'
                      : safeSchedules.length === 0
                        ? 'Nenhum evento'
                        : hasExistingAttendance
                          ? 'Frequência já lançada - editando'
                          : 'Selecione o evento'
                }
              >
                {filteredSchedules.length === 0 && (
                  <MenuItem disabled value="">
                    Nenhum evento encontrado
                  </MenuItem>
                )}
                {filteredSchedules.map(schedule => {
                  const scheduleHasRecords = existingRecords.length > 0 && existingRecords[0]?.scheduleId === schedule.id;
                  return (
                    <MenuItem key={schedule.id} value={schedule.id}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                        <Box
                          flex={1}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatScheduleLabel(schedule)}
                        </Box>
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

      <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden' }}>
        <Grid item xs={12} md={4} lg={3}>
          <Stack spacing={3}>

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
                  <Box sx={{ mb: 2 }}>
                    <ToggleButtonGroup
                      value={eventTypeFilter}
                      exclusive
                      onChange={(e, value) => value && setEventTypeFilter(value)}
                      size="small"
                      aria-label="Filtro de eventos"
                      fullWidth
                    >
                      <ToggleButton value="visit">Visitas</ToggleButton>
                      <ToggleButton value="meeting">Reuniões</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
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
                      disabled={loadingSchedules || filteredSchedules.length === 0 || loadingExistingRecords}
                      fullWidth
                      helperText={
                        loadingSchedules
                          ? 'Carregando eventos...'
                          : loadingExistingRecords
                            ? 'Carregando registros...'
                            : safeSchedules.length === 0
                              ? 'Nenhum evento encontrado'
                              : hasExistingAttendance
                                ? 'Frequência já lançada - editando'
                                : 'Selecione o evento'
                      }
                    >
                      {filteredSchedules.length === 0 && (
                        <MenuItem disabled value="">
                          Nenhum evento encontrado
                        </MenuItem>
                      )}
                      {filteredSchedules.map(schedule => {
                        const scheduleHasRecords = existingRecords.length > 0 && existingRecords[0]?.scheduleId === schedule.id;
                        return (
                          <MenuItem key={schedule.id} value={schedule.id}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                              <Box
                                flex={1}
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {formatScheduleLabel(schedule)}
                              </Box>
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

            {hasExistingAttendance && (
              <Alert
                severity="info"
                icon={<EditIcon />}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                  <strong>Frequência já lançada.</strong> Você está editando os registros existentes.
                </Typography>
              </Alert>
            )}

            <Card variant="outlined">
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Resumo
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Total:</Typography>
                      <Chip label={membersOnly.length} size="small" color="default" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="success.main">Presentes:</Typography>
                      <Chip
                        label={
                          Object.values(memberAttendances).filter(m => m.type === AttendanceType.PRESENT).length
                        }
                        size="small"
                        color="success"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="error.main">Faltas:</Typography>
                      <Chip
                        label={
                          Object.values(memberAttendances).filter(m => m.type === AttendanceType.ABSENT).length
                        }
                        size="small"
                        color="error"
                      />
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

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
                    onClick={() => bulkSetType(AttendanceType.PRESENT)}
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
                    onClick={() => bulkSetType(AttendanceType.ABSENT)}
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

            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'sticky',
                bottom: 0,
                pt: 2,
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
                        membersOnly.length === 0
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
                              : membersOnly.length === 0
                                ? 'Nenhum membro na equipe'
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
              title={`Membros do Time (${membersOnly.length})`}
              subheader="Marque presença ou falta para cada membro"
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
              {membersOnly.length === 0 ? (
                <Alert severity="info">Nenhum membro encontrado nesta equipe.</Alert>
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
                  {membersOnly.map((member, index) => (
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

      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10,
        }}
      >
        <Card variant="outlined" sx={{ bgcolor: 'primary.50', borderColor: 'primary.main' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
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
                  membersOnly.length === 0
                }
                startIcon={formState.loading ? <CircularProgress size={20} color="inherit" /> : null}
                fullWidth
                sx={{
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
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
    </Box>
  );
});

TeamMemberAttendance.displayName = 'TeamMemberAttendance';

export default TeamMemberAttendance;
