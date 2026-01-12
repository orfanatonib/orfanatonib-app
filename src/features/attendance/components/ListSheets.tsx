import { memo, useCallback, useEffect, useState, useMemo } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
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

  const [expandedShelterId, setExpandedShelterId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const loadSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHierarchicalSheets();
      setSheets(data);
      
      if (data.length > 0) {
        setExpandedShelterId(data[0].shelterId);
        if (data[0].teams.length > 0) {
          setExpandedTeamId(data[0].teams[0].teamId);
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao carregar listas de frequência.';
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
    setExpandedShelterId(prev => (prev === shelterId ? null : shelterId));
    
    setExpandedTeamId(null);
    setExpandedScheduleId(null);
  }, []);

  const toggleTeam = useCallback((teamId: string) => {
    setExpandedTeamId(prev => (prev === teamId ? null : teamId));
    
    setExpandedScheduleId(null);
  }, []);

  const toggleSchedule = useCallback((scheduleKey: string) => {
    setExpandedScheduleId(prev => (prev === scheduleKey ? null : scheduleKey));
  }, []);

  const filteredSheets = useMemo(() => {
    
    if (!searchTerm.trim()) return sheets;

    const term = searchTerm.toLowerCase();
    return sheets.filter(s => s.shelterName.toLowerCase().includes(term));
  }, [sheets, searchTerm]);

  useEffect(() => {
    if (searchTerm && filteredSheets.length === 1) {
      setExpandedShelterId(filteredSheets[0].shelterId);
    }
  }, [searchTerm, filteredSheets]);

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
    <Box sx={{ width: '100%', p: { xs: 1, sm: 3 } }}>
      {}
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
          Lista de Frequências
        </Typography>
      </Stack>

      <Box sx={{ mb: 4, maxWidth: 400 }}>
        <TextField
          fullWidth
          placeholder="Filtrar abrigo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredSheets.length === 0 ? (
        <Alert severity="info">
          {searchTerm ? 'Nenhum abrigo encontrado com esse nome.' : 'Nenhuma frequência encontrada.'}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredSheets.map((shelter: ShelterWithTeamsSheetsDto) => (
            <Grid item xs={12} md={6} key={shelter.shelterId}>
              <Card variant="outlined">
                <CardHeader
                  sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}
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
                      {expandedShelterId === shelter.shelterId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  }
                />
                <Collapse in={expandedShelterId === shelter.shelterId}>
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={1}>
                      {shelter.teams.map((team: TeamWithSchedulesDto) => (
                        <Accordion
                          key={team.teamId}
                          disableGutters
                          elevation={0}
                          sx={{
                            '&:before': { display: 'none' },
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            overflow: 'hidden',
                            '&:last-child': { mb: 0 }
                          }}
                          expanded={expandedTeamId === team.teamId}
                          onChange={() => toggleTeam(team.teamId)}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                              px: { xs: 1, sm: 0 },
                              minHeight: 48,
                              '& .MuiAccordionSummary-content': { my: 1 },
                              flexDirection: 'row-reverse',
                              '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                                transform: 'rotate(90deg)',
                              },
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', ml: 2 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                Equipe {team.teamNumber} {team.teamName && `- ${team.teamName}`}
                              </Typography>
                              <Chip
                                label={`${team.totalSchedules} evento${team.totalSchedules !== 1 ? 's' : ''}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 24 }}
                              />
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0, pt: 0 }}>
                            <Stack spacing={1} sx={{ pl: { xs: 1, sm: 4 }, borderLeft: '2px solid', borderColor: 'divider' }}>
                              {team.schedules.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                                  Nenhum evento registrado
                                </Typography>
                              ) : (
                                team.schedules.map((schedule: ScheduleWithAttendanceDto) => {
                                  const scheduleKey = `${schedule.scheduleId}-${schedule.category}`;
                                  return (
                                    <Accordion
                                      key={scheduleKey}
                                      disableGutters
                                      elevation={0}
                                      expanded={expandedScheduleId === scheduleKey}
                                      onChange={() => toggleSchedule(scheduleKey)}
                                      sx={{
                                        bgcolor: 'background.paper',
                                        '&:before': { display: 'none' },
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 1,
                                        '&:last-child': { mb: 0 }
                                      }}
                                    >
                                      <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        sx={{
                                          px: { xs: 1, sm: 1 },
                                          minHeight: 40,
                                          '&.Mui-expanded': { minHeight: 40 },
                                          '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center' },
                                          
                                          bgcolor: schedule.pendingCount > 0 ? 'warning.50' : 'transparent',
                                          borderLeft: schedule.pendingCount > 0 ? '3px solid' : 'none',
                                          borderColor: schedule.pendingCount > 0 ? 'warning.main' : 'transparent',
                                        }}
                                      >
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="nowrap" sx={{ width: '100%', overflow: 'hidden' }}>
                                          {schedule.pendingCount > 0 && (
                                            <WarningIcon
                                              fontSize="small"
                                              color="warning"
                                              sx={{ flexShrink: 0, ml: -0.5 }}
                                            />
                                          )}
                                          <Typography
                                            variant="body2"
                                            fontWeight={schedule.pendingCount > 0 ? 'bold' : 'medium'}
                                            noWrap
                                            sx={{ flex: 1 }}
                                            color={schedule.pendingCount > 0 ? 'warning.dark' : 'text.primary'}
                                          >
                                            {(() => {
                                              const readableDate = formatDateBR(schedule.date);
                                              const kind = schedule.category === 'visit' ? 'Visita' : 'Reunião';
                                              return `${kind} #${schedule.visitNumber} • ${readableDate}`;
                                            })()}
                                          </Typography>
                                          <Stack direction="row" spacing={0.5}>
                                            {schedule.pendingCount > 0 && (
                                              <Chip
                                                icon={<AssignmentIcon sx={{ fontSize: 14 }} />}
                                                label={`${schedule.pendingCount} pendente${schedule.pendingCount > 1 ? 's' : ''}`}
                                                size="small"
                                                color="warning"
                                                sx={{
                                                  height: 22,
                                                  fontSize: '0.7rem',
                                                  fontWeight: 'bold',
                                                  '& .MuiChip-label': { px: 1 },
                                                  '& .MuiChip-icon': { fontSize: 14 }
                                                }}
                                              />
                                            )}
                                            <Chip
                                              label={`✓ ${schedule.presentCount}`}
                                              size="small"
                                              color="success"
                                              sx={{ height: 20, fontSize: '0.75rem', '& .MuiChip-label': { px: 1 } }}
                                            />
                                            {schedule.absentCount > 0 && (
                                              <Chip
                                                label={`✗ ${schedule.absentCount}`}
                                                size="small"
                                                color="error"
                                                sx={{ height: 20, fontSize: '0.75rem', '& .MuiChip-label': { px: 1 } }}
                                              />
                                            )}
                                          </Stack>
                                        </Stack>
                                      </AccordionSummary>
                                      <AccordionDetails sx={{ pt: 1, pb: 2, px: { xs: 1, sm: 2 } }}>
                                        {schedule.pendingCount > 0 && (
                                          <Alert
                                            severity="warning"
                                            sx={{ mb: 2 }}
                                            icon={<AssignmentIcon />}
                                          >
                                            <Typography variant="body2" fontWeight="bold">
                                              {schedule.pendingCount} pagela{schedule.pendingCount > 1 ? 's' : ''} pendente{schedule.pendingCount > 1 ? 's' : ''}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {schedule.totalMembers - (schedule.presentCount + schedule.absentCount)} membro{schedule.totalMembers - (schedule.presentCount + schedule.absentCount) > 1 ? 's' : ''} ainda não tem frequência registrada
                                            </Typography>
                                          </Alert>
                                        )}
                                        <List dense disablePadding>
                                          {(schedule.lessonContent || schedule.location) && (
                                            <ListItem disableGutters sx={{ display: 'block', mb: 1 }}>
                                              <Typography variant="caption" color="text.secondary" display="block">
                                                <strong>Local:</strong> {schedule.location || schedule.meetingRoom || '-'}
                                              </Typography>
                                              {schedule.lessonContent && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                  <strong>Conteúdo:</strong> {schedule.lessonContent}
                                                </Typography>
                                              )}
                                            </ListItem>
                                          )}
                                          {schedule.attendanceRecords.length === 0 ? (
                                            <ListItem disableGutters>
                                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                {schedule.pendingCount > 0
                                                  ? `Nenhuma pagela registrada ainda. ${schedule.pendingCount} pendente${schedule.pendingCount > 1 ? 's' : ''}.`
                                                  : 'Nenhum registro encontrado.'
                                                }
                                              </Typography>
                                            </ListItem>
                                          ) : (
                                            schedule.attendanceRecords.map((record) => (
                                              <ListItem
                                                key={record.id}
                                                disableGutters
                                                sx={{
                                                  py: 0.5,
                                                  borderBottom: '1px solid',
                                                  borderColor: 'divider',
                                                  '&:last-child': { borderBottom: 'none' }
                                                }}
                                              >
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                  {record.type === 'present' ? (
                                                    <CheckCircleIcon fontSize="small" color="success" />
                                                  ) : (
                                                    <CancelIcon fontSize="small" color="error" />
                                                  )}
                                                </ListItemIcon>
                                                <ListItemText
                                                  primary={
                                                    <Typography variant="body2">
                                                      {record.memberName}
                                                    </Typography>
                                                  }
                                                  secondary={
                                                    record.comment ? (
                                                      <Typography variant="caption" color="error.main">
                                                        {record.comment}
                                                      </Typography>
                                                    ) : null
                                                  }
                                                />
                                              </ListItem>
                                            ))
                                          )}
                                        </List>
                                      </AccordionDetails>
                                    </Accordion>
                                  );
                                })
                              )}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
});

ListSheets.displayName = 'ListSheets';

export default ListSheets;
