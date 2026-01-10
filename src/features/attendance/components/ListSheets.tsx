import { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getHierarchicalSheets } from '../api';
import type { HierarchicalSheetsResponse, ShelterWithTeamsSheetsDto, TeamWithSchedulesDto, ScheduleWithAttendanceDto } from '../types';
import { formatDateBR } from '../utils';

interface ListSheetsProps {
  onBack: () => void;
}

const ListSheets = memo(({ onBack }: ListSheetsProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<HierarchicalSheetsResponse>([]);
  const [expandedShelters, setExpandedShelters] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());

  const loadSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHierarchicalSheets();
      setSheets(data);
      // Expandir primeiro abrigo automaticamente
      if (data.length > 0) {
        setExpandedShelters(new Set([data[0].shelterId]));
        if (data[0].teams.length > 0) {
          setExpandedTeams(new Set([data[0].teams[0].teamId]));
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao carregar pagelas.';
      setError(message);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  const toggleShelter = useCallback((shelterId: string) => {
    setExpandedShelters(prev => {
      const next = new Set(prev);
      if (next.has(shelterId)) {
        next.delete(shelterId);
      } else {
        next.add(shelterId);
      }
      return next;
    });
  }, []);

  const toggleTeam = useCallback((teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  }, []);

  const toggleSchedule = useCallback((scheduleId: string) => {
    setExpandedSchedules(prev => {
      const next = new Set(prev);
      if (next.has(scheduleId)) {
        next.delete(scheduleId);
      } else {
        next.add(scheduleId);
      }
      return next;
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton
          onClick={onBack}
          aria-label="Voltar para seleção de modo"
          sx={{
            bgcolor: 'action.hover',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Lista de Pagelas
        </Typography>
      </Stack>

      {sheets.length === 0 ? (
        <Alert severity="info">Nenhuma pagela encontrada.</Alert>
      ) : (
        <Stack spacing={2}>
          {sheets.map((shelter: ShelterWithTeamsSheetsDto) => (
            <Card key={shelter.shelterId} variant="outlined">
              <CardHeader
                avatar={
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BusinessIcon />
                  </Box>
                }
                title={
                  <Typography variant="h6" fontWeight="bold">
                    {shelter.shelterName}
                  </Typography>
                }
                subheader={
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`${shelter.totalTeams} equipe${shelter.totalTeams !== 1 ? 's' : ''}`} size="small" />
                  </Stack>
                }
                action={
                  <IconButton onClick={() => toggleShelter(shelter.shelterId)}>
                    {expandedShelters.has(shelter.shelterId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                }
              />
              <Collapse in={expandedShelters.has(shelter.shelterId)}>
                <CardContent>
                  <Stack spacing={2}>
                    {shelter.teams.map((team: TeamWithSchedulesDto) => (
                      <Card key={team.teamId} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                        <CardHeader
                          avatar={
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: 'secondary.main',
                                color: 'secondary.contrastText',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <GroupsIcon />
                            </Box>
                          }
                          title={
                            <Typography variant="subtitle1" fontWeight="bold">
                              Time {team.teamNumber} {team.teamName && `- ${team.teamName}`}
                            </Typography>
                          }
                          subheader={
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip label={`${team.totalSchedules} evento${team.totalSchedules !== 1 ? 's' : ''}`} size="small" />
                            </Stack>
                          }
                          action={
                            <IconButton onClick={() => toggleTeam(team.teamId)} size="small">
                              {expandedTeams.has(team.teamId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          }
                        />
                        <Collapse in={expandedTeams.has(team.teamId)}>
                          <CardContent>
                            <Stack spacing={2}>
                              {team.schedules.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  Nenhum evento registrado
                                </Typography>
                              ) : (
                                team.schedules.map((schedule: ScheduleWithAttendanceDto) => (
                                  <Card key={schedule.scheduleId} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                                    <CardHeader
                                      avatar={
                                        <Box
                                          sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 1.5,
                                            bgcolor: 'info.main',
                                            color: 'info.contrastText',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                        >
                                          <EventIcon fontSize="small" />
                                        </Box>
                                      }
                                      title={
                                        <Typography variant="body1" fontWeight="medium">
                                          {(() => {
                                            const date = schedule.visitDate || schedule.meetingDate;
                                            const readableDate = formatDateBR(date);
                                            const kind = schedule.visitDate ? 'Visita' : 'Reunião';
                                            const extra = [schedule.lessonContent, schedule.meetingRoom].filter(Boolean).join(' • ');
                                            return `${kind} #${schedule.visitNumber} • ${readableDate}${extra ? ` • ${extra}` : ''}`;
                                          })()}
                                        </Typography>
                                      }
                                      subheader={
                                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                                          <Chip
                                            label={`${schedule.presentCount} presente${schedule.presentCount !== 1 ? 's' : ''}`}
                                            size="small"
                                            color="success"
                                            icon={<CheckCircleIcon />}
                                          />
                                          <Chip
                                            label={`${schedule.absentCount} falta${schedule.absentCount !== 1 ? 's' : ''}`}
                                            size="small"
                                            color="error"
                                            icon={<CancelIcon />}
                                          />
                                          {schedule.pendingCount > 0 && (
                                            <Chip
                                              label={`${schedule.pendingCount} pendente${schedule.pendingCount !== 1 ? 's' : ''}`}
                                              size="small"
                                              color="warning"
                                            />
                                          )}
                                          <Chip
                                            label={`${schedule.totalTeachers} professor${schedule.totalTeachers !== 1 ? 'es' : ''}`}
                                            size="small"
                                            color="default"
                                          />
                                        </Stack>
                                      }
                                      action={
                                        <IconButton onClick={() => toggleSchedule(schedule.scheduleId)} size="small">
                                          {expandedSchedules.has(schedule.scheduleId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                      }
                                    />
                                    {schedule.lessonContent && (
                                      <Box sx={{ px: 2, pb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                          <strong>Conteúdo:</strong> {schedule.lessonContent}
                                        </Typography>
                                      </Box>
                                    )}
                                    <Collapse in={expandedSchedules.has(schedule.scheduleId)}>
                                      <CardContent>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                          Registros de Presença ({schedule.attendanceRecords.length})
                                        </Typography>
                                        {schedule.attendanceRecords.length === 0 ? (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            Nenhum registro de presença
                                          </Typography>
                                        ) : (
                                          <Stack spacing={1}>
                                            {schedule.attendanceRecords.map((record) => (
                                              <Card key={record.id} variant="outlined" sx={{ bgcolor: record.type === 'present' ? 'success.50' : 'error.50' }}>
                                                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                  <Stack direction="row" spacing={2} alignItems="center">
                                                    {record.type === 'present' ? (
                                                      <CheckCircleIcon color="success" />
                                                    ) : (
                                                      <CancelIcon color="error" />
                                                    )}
                                                    <Box flex={1}>
                                                      <Typography variant="body2" fontWeight="medium">
                                                        {record.memberName}
                                                      </Typography>
                                                      {record.memberEmail && (
                                                        <Typography variant="caption" color="text.secondary">
                                                          {record.memberEmail}
                                                        </Typography>
                                                      )}
                                                      {record.comment && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                          {record.comment}
                                                        </Typography>
                                                      )}
                                                    </Box>
                                                    <Chip
                                                      label={record.type === 'present' ? 'Presente' : 'Falta'}
                                                      size="small"
                                                      color={record.type === 'present' ? 'success' : 'error'}
                                                    />
                                                  </Stack>
                                                </CardContent>
                                              </Card>
                                            ))}
                                          </Stack>
                                        )}
                                      </CardContent>
                                    </Collapse>
                                  </Card>
                                ))
                              )}
                            </Stack>
                          </CardContent>
                        </Collapse>
                      </Card>
                    ))}
                  </Stack>
                </CardContent>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
});

ListSheets.displayName = 'ListSheets';

export default ListSheets;

