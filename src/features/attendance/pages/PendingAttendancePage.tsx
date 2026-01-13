import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HomeIcon from '@mui/icons-material/Home';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close'; // Import CloseIcon
import { getAllPendings } from '../api';
import { EventCategory } from '../types';
import type { TeamPendingsDto, PendingForLeaderDto, PendingForMemberDto, TeamScheduleDto } from '../types';
import RegisterAttendance from '../components/RegisterAttendance';

const PendingAttendancePage = () => {
  const navigate = useNavigate();
  const [leaderPendings, setLeaderPendings] = useState<TeamPendingsDto[]>([]);
  const [memberPendings, setMemberPendings] = useState<PendingForMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion state: holding the ID of the expanded item (or null)
  const [expandedShelter, setExpandedShelter] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Modal State for Member Attendance
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [selectedPendingMember, setSelectedPendingMember] = useState<TeamScheduleDto | null>(null);

  const fetchPendings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllPendings();
      setLeaderPendings(res.leaderPendings);
      setMemberPendings(res.memberPendings);
      // Do not auto-expand grouped items by default for cleaner initial view
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências.';
      setError(message);
      setLeaderPendings([]);
      setMemberPendings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendings();
  }, []);

  // Group by shelter
  const groupedByShelter = leaderPendings.reduce((acc, team) => {
    if (!acc[team.shelterName]) {
      acc[team.shelterName] = [];
    }
    acc[team.shelterName].push(team);
    return acc;
  }, {} as Record<string, TeamPendingsDto[]>);

  // Sort shelters alphabetically
  const sortedShelters = Object.entries(groupedByShelter).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const totalLeaderPendings = leaderPendings.reduce((acc, tp) => acc + tp.pendings.length, 0);
  // Separate member total for distinct display
  const totalMemberPendings = memberPendings.length;
  // Combined total for header badge? Or keep separate? Let's keep separate sections.

  const toggleShelter = (shelterName: string) => {
    setExpandedShelter(prev => (prev === shelterName ? null : shelterName));
    // Reset nested expansions when switching shelter
    setExpandedTeam(null);
    setExpandedEvent(null);
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeam(prev => (prev === teamId ? null : teamId));
    // Reset nested expansions when switching team
    setExpandedEvent(null);
  };

  const toggleEvent = (eventKey: string) => {
    setExpandedEvent(prev => (prev === eventKey ? null : eventKey));
  };

  const formatScheduleLabel = (pending: PendingForLeaderDto | PendingForMemberDto) => {
    const readableDate = pending.date ? new Date(pending.date).toLocaleDateString('pt-BR') : 'Data a definir';
    const kind = pending.category === EventCategory.VISIT ? 'Visita' : 'Reunião';
    return `${kind} #${pending.visitNumber} • ${readableDate}`;
  };

  const handleNavigateToRegister = (teamId: string, scheduleId: string, category: EventCategory) => {
    navigate(`/adm/presenca?teamId=${teamId}&scheduleId=${scheduleId}&category=${category}`);
  };

  const handleOpenMemberRegister = (pending: PendingForMemberDto) => {
    // Map PendingForMemberDto to TeamScheduleDto for the RegisterAttendance component
    // Note: Some optional fields might be missing, but core fields for display/id are present.
    const scheduleDto: TeamScheduleDto = {
      id: pending.scheduleId,
      category: pending.category,
      date: pending.date,
      visitNumber: pending.visitNumber,
      lessonContent: pending.lessonContent,
      location: pending.location,
      teamId: pending.teamId,
      teamNumber: pending.teamNumber,
      teamName: pending.teamName,
      shelterName: pending.shelterName,
      // Map date to appropriate field based on category or generic date
      visitDate: pending.category === EventCategory.VISIT ? pending.date : undefined,
      meetingDate: pending.category === EventCategory.MEETING ? pending.date : undefined,
    };

    setSelectedPendingMember(scheduleDto);
    setOpenRegisterModal(true);
  };

  const handleCloseMemberRegister = () => {
    setOpenRegisterModal(false);
    setSelectedPendingMember(null);
    // Refresh pendings to remove the completed one
    fetchPendings();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/adm')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Admin
        </Link>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/adm/presenca')}
        >
          <EventAvailableIcon sx={{ mr: 0.5 }} fontSize="small" />
          Presenças
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          Pendências
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Pendências de Pagela
        </Typography>
        {(totalLeaderPendings > 0 || totalMemberPendings > 0) && (
          <Chip
            label={`${totalLeaderPendings + totalMemberPendings} evento${(totalLeaderPendings + totalMemberPendings) !== 1 ? 's' : ''}`}
            color="error"
            size="medium"
          />
        )}
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Eventos passados que ainda precisam do lançamento de presença.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {totalLeaderPendings === 0 && totalMemberPendings === 0 && !loading && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Nenhuma pendência de pagela encontrada. Todas as presenças estão em dia!
        </Alert>
      )}

      <Stack spacing={4}>
        {/* Member Pendings Section */}
        {totalMemberPendings > 0 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" color="secondary.main" sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              Suas Pendências Pessoais ({totalMemberPendings})
            </Typography>
            <Grid container spacing={2}>
              {memberPendings.map(pending => {
                const eventKey = `${pending.scheduleId}-${pending.category}-member`;
                return (
                  <Grid item xs={12} sm={6} md={4} key={eventKey}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        borderColor: 'secondary.light',
                        borderWidth: 1,
                        '&:hover': {
                          boxShadow: 2,
                          borderColor: 'secondary.main',
                        }
                      }}
                      onClick={() => handleOpenMemberRegister(pending)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Chip
                              label={pending.category === EventCategory.VISIT ? 'Visita' : 'Reunião'}
                              size="small"
                              color={pending.category === EventCategory.VISIT ? 'success' : 'info'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {pending.teamName}
                            </Typography>
                          </Stack>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatScheduleLabel(pending)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pending.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {pending.lessonContent}
                          </Typography>
                          <Box sx={{ pt: 1 }}>
                            <Typography variant="body2" color="secondary" fontWeight="medium">
                              Clique para registrar sua presença
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Leader Pendings Section */}
        {totalLeaderPendings > 0 && (
          <Box>
            {totalMemberPendings > 0 && (
              <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 2, mt: 4, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                Pendências das Equipes ({totalLeaderPendings})
              </Typography>
            )}

            {/* Shelters with pendings - Grid Layout */}
            <Grid container spacing={3}>
              {sortedShelters.map(([shelterName, teams]) => {
                const isShelterExpanded = expandedShelter === shelterName;
                const shelterPendingsCount = teams.reduce((acc, t) => acc + t.pendings.length, 0);

                return (
                  <Grid item xs={12} md={isShelterExpanded ? 12 : 6} key={shelterName}>
                    <Card variant="outlined" sx={{ overflow: 'visible', borderColor: 'primary.light', borderWidth: 1, height: 'fit-content' }}>
                      <CardContent
                        sx={{
                          p: { xs: 1.5, md: 2 },
                          bgcolor: 'primary.50',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'primary.100' },
                          transition: 'background-color 0.2s',
                          '&:last-child': { pb: { xs: 1.5, md: 2 } }
                        }}
                        onClick={() => toggleShelter(shelterName)}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ overflow: 'hidden' }}>
                            <HomeIcon color="primary" fontSize="large" sx={{ fontSize: { xs: 30, md: 35 } }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="h6" fontWeight="bold" color="primary.main" noWrap sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                {shelterName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                {teams.length} equipe{teams.length !== 1 ? 's' : ''} com pendências
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, ml: 1 }}>
                            <Chip
                              label={`${shelterPendingsCount}`}
                              color="error"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                            <IconButton size="medium" sx={{ p: 0.5 }}>
                              {isShelterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Stack>
                        </Stack>
                      </CardContent>

                      <Collapse in={isShelterExpanded}>
                        <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'primary.light' }}>
                          <Stack spacing={2}>
                            {teams.map(team => {
                              const isTeamExpanded = expandedTeam === team.teamId;
                              const teamPendingsCount = team.pendings.length;

                              return (
                                <Card key={team.teamId} variant="outlined" sx={{ ml: { sm: 1 }, borderLeft: 4, borderLeftColor: 'secondary.main' }}>
                                  <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      justifyContent="space-between"
                                      onClick={() => toggleTeam(team.teamId)}
                                      sx={{ cursor: 'pointer' }}
                                    >
                                      <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <GroupsIcon color="secondary" />
                                        <Box>
                                          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', md: '1.25rem' } }}>
                                            {team.teamName}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <Chip
                                          label={`${teamPendingsCount}`}
                                          color="warning"
                                          size="small"
                                        />
                                        <IconButton size="small" sx={{ p: 0.5 }}>
                                          {isTeamExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                      </Stack>
                                    </Stack>
                                  </CardContent>

                                  <Collapse in={isTeamExpanded}>
                                    <Box sx={{ px: { xs: 1, md: 2 }, py: 2 }}>
                                      <Stack spacing={1.5}>
                                        {team.pendings.map(pending => {
                                          const eventKey = `${pending.scheduleId}-${pending.category}`;
                                          const isEventExpanded = expandedEvent === eventKey;

                                          return (
                                            <Card
                                              key={eventKey}
                                              variant="outlined"
                                              sx={{
                                                bgcolor: 'grey.50',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                  bgcolor: 'grey.100',
                                                  borderColor: 'primary.main',
                                                },
                                              }}
                                            >
                                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  justifyContent="space-between"
                                                  onClick={() => toggleEvent(eventKey)}
                                                >
                                                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Chip
                                                        label={pending.category === EventCategory.VISIT ? 'Visita' : 'Reunião'}
                                                        size="small"
                                                        color={pending.category === EventCategory.VISIT ? 'success' : 'info'}
                                                      />
                                                      <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>
                                                        {formatScheduleLabel(pending)}
                                                      </Typography>
                                                    </Stack>

                                                    {!isEventExpanded && (
                                                      <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.85rem' }}>
                                                        {pending.lessonContent}
                                                      </Typography>
                                                    )}

                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <PersonIcon fontSize="small" color="action" />
                                                      <Typography variant="body2" color="error.main" fontWeight="medium" sx={{ fontSize: '0.85rem' }}>
                                                        {pending.pendingMembers.length} membro{pending.pendingMembers.length !== 1 ? 's' : ''} sem registro
                                                      </Typography>
                                                    </Stack>
                                                  </Stack>
                                                  <IconButton size="small">
                                                    {isEventExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                  </IconButton>
                                                </Stack>

                                                <Collapse in={isEventExpanded}>
                                                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="body2" color="text.secondary" paragraph>
                                                      <strong>Local:</strong> {pending.location}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" paragraph>
                                                      <strong>Conteúdo:</strong> {pending.lessonContent}
                                                    </Typography>

                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                                      Membros pendentes:
                                                    </Typography>
                                                    <List dense disablePadding>
                                                      {pending.pendingMembers.map(member => (
                                                        <ListItem key={member.memberId} disableGutters>
                                                          <ListItemText
                                                            primary={member.memberName}
                                                            secondary={member.memberEmail}
                                                          />
                                                        </ListItem>
                                                      ))}
                                                    </List>
                                                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                                                      <Chip
                                                        label="Registrar presença"
                                                        color="primary"
                                                        clickable
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleNavigateToRegister(team.teamId, pending.scheduleId, pending.category);
                                                        }}
                                                      />
                                                    </Box>
                                                  </Box>
                                                </Collapse>
                                              </CardContent>
                                            </Card>
                                          );
                                        })}
                                      </Stack>
                                    </Box>
                                  </Collapse>
                                </Card>
                              );
                            })}
                          </Stack>
                        </Box>
                      </Collapse>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Stack>

      {/* Member Registration Modal */}
      <Dialog
        open={openRegisterModal}
        onClose={() => setOpenRegisterModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Registrar Minha Presença
          <IconButton
            aria-label="close"
            onClick={() => setOpenRegisterModal(false)}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPendingMember && (
            <RegisterAttendance
              schedules={[selectedPendingMember]}
              disabled={false}
              onSuccess={handleCloseMemberRegister}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
export default PendingAttendancePage;
