import { useEffect, useState, useMemo } from 'react';
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
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HomeIcon from '@mui/icons-material/Home';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { getAllPendings } from '../api';
import { EventCategory } from '../types';
import BackHeader from '@/components/common/header/BackHeader';
import type { TeamPendingsDto, PendingForLeaderDto, PendingForMemberDto, TeamScheduleDto } from '../types';
import RegisterAttendance from '../components/RegisterAttendance';

const PendingAttendancePage = () => {
  const navigate = useNavigate();
  const [leaderPendings, setLeaderPendings] = useState<TeamPendingsDto[]>([]);
  const [memberPendings, setMemberPendings] = useState<PendingForMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedShelter, setExpandedShelter] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [selectedPendingMember, setSelectedPendingMember] = useState<TeamScheduleDto | null>(null);

  const fetchPendings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllPendings();
      setLeaderPendings(res.leaderPendings);
      setMemberPendings(res.memberPendings);
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

  const filteredLeaderPendings = useMemo(() => {
    if (!searchTerm.trim()) return leaderPendings;

    const lowerTerm = searchTerm.toLowerCase();

    return leaderPendings.map(shelterGroup => {
      const shelterMatches = shelterGroup.shelterName.toLowerCase().includes(lowerTerm);
      const teamMatches = shelterGroup.teamName.toLowerCase().includes(lowerTerm);

      if (shelterMatches || teamMatches) return shelterGroup;

      return null;
    }).filter(Boolean) as TeamPendingsDto[];

  }, [leaderPendings, searchTerm]);

  const groupedByShelter = useMemo(() => {
    return filteredLeaderPendings.reduce((acc, team) => {
      if (!acc[team.shelterName]) {
        acc[team.shelterName] = [];
      }
      acc[team.shelterName].push(team);
      return acc;
    }, {} as Record<string, TeamPendingsDto[]>);
  }, [filteredLeaderPendings]);

  const sortedShelters = useMemo(() => {
    return Object.entries(groupedByShelter).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [groupedByShelter]);

  const totalLeaderPendings = leaderPendings.reduce((acc, tp) => acc + tp.pendings.length, 0);
  const totalMemberPendings = memberPendings.length;
  const filteredCount = filteredLeaderPendings.reduce((acc, tp) => acc + tp.pendings.length, 0);


  const toggleShelter = (shelterName: string) => {
    setExpandedShelter(prev => (prev === shelterName ? null : shelterName));
    setExpandedTeam(null);
    setExpandedEvent(null);
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeam(prev => (prev === teamId ? null : teamId));
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
      visitDate: pending.category === EventCategory.VISIT ? pending.date : undefined,
      meetingDate: pending.category === EventCategory.MEETING ? pending.date : undefined,
    };

    setSelectedPendingMember(scheduleDto);
    setOpenRegisterModal(true);
  };

  const handleCloseMemberRegister = () => {
    setOpenRegisterModal(false);
    setSelectedPendingMember(null);
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
      <BackHeader title="Central de Pendências" />
      <Breadcrumbs sx={{ mb: 3, display: { xs: 'none', md: 'flex' } }}>
        <Link underline="hover" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} color="inherit" onClick={() => navigate('/adm')}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Admin
        </Link>
        <Link underline="hover" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} color="inherit" onClick={() => navigate('/adm/presenca')}>
          <EventAvailableIcon sx={{ mr: 0.5 }} fontSize="small" />
          Presenças
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          Pendências
        </Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, display: { xs: 'none', md: 'flex' } }}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Central de Pendências
        </Typography>
        {(totalLeaderPendings > 0 || totalMemberPendings > 0) && (
          <Chip
            label={`${totalLeaderPendings + totalMemberPendings} pendências`}
            color="error"
            size="medium"
          />
        )}
      </Stack>

      <TextField
        fullWidth
        placeholder="Buscar por abrigo ou equipe..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {totalLeaderPendings === 0 && totalMemberPendings === 0 && !loading && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Nenhuma pendência encontrada. Tudo em dia!
        </Alert>
      )}

      <Stack spacing={4}>
        {totalMemberPendings > 0 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" color="secondary.main" sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              Suas Pendências Pessoais ({totalMemberPendings})
            </Typography>
            <Grid container spacing={2}>
              {memberPendings.map(pending => (
                <Grid item xs={12} sm={6} md={4} key={`${pending.scheduleId}-${pending.category}`}>
                  <Card variant="outlined" onClick={() => handleOpenMemberRegister(pending)} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between">
                        <Chip label={pending.category} size="small" color={pending.category === 'visit' ? 'success' : 'info'} />
                        <Typography variant="caption">{pending.teamName}</Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold" mt={1}>
                        {formatScheduleLabel(pending)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{pending.lessonContent}</Typography>
                      <Typography variant="body2" color="secondary" mt={1}>Clique para registrar</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {filteredLeaderPendings.length > 0 ? (
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              Pendências de Pagela ({filteredCount})
            </Typography>
            <Grid container spacing={3}>
              {sortedShelters.map(([shelterName, teams]) => {
                const isShelterExpanded = expandedShelter === shelterName || searchTerm.length > 0;
                const shelterPendingsCount = teams.reduce((acc, t) => acc + t.pendings.length, 0);

                return (
                  <Grid item xs={12} md={isShelterExpanded ? 12 : 6} key={shelterName}>
                    <Card variant="outlined" sx={{ overflow: 'visible', borderColor: 'primary.light', borderWidth: 1, height: 'fit-content' }}>
                      <CardContent
                        sx={{ p: 2, bgcolor: 'primary.50', cursor: 'pointer', '&:hover': { bgcolor: 'primary.100' } }}
                        onClick={() => toggleShelter(shelterName)}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <HomeIcon color="primary" fontSize="large" sx={{ fontSize: { xs: 30, md: 35 } }} />
                            <Box>
                              <Typography variant="h6" fontWeight="bold" color="primary.main" noWrap>{shelterName}</Typography>
                              <Typography variant="body2" color="text.secondary">{teams.length} equipes com pendências</Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip label={shelterPendingsCount} color="error" size="small" sx={{ fontWeight: 'bold' }} />
                            <IconButton size="medium">{isShelterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                          </Stack>
                        </Stack>
                      </CardContent>

                      <Collapse in={isShelterExpanded}>
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'primary.light' }}>
                          <Stack spacing={2}>
                            {teams.map(team => {
                              const isTeamExpanded = expandedTeam === team.teamId || searchTerm.length > 0;
                              return (
                                <Card key={team.teamId} variant="outlined" sx={{ ml: { sm: 1 }, borderLeft: 4, borderLeftColor: 'secondary.main' }}>
                                  <CardContent sx={{ p: 2 }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleTeam(team.teamId)} sx={{ cursor: 'pointer' }}>
                                      <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <GroupsIcon color="secondary" />
                                        <Typography variant="h6" fontWeight="bold">{team.teamName}</Typography>
                                      </Stack>
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <Chip label={team.pendings.length} color="warning" size="small" />
                                        <IconButton size="small">{isTeamExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                                      </Stack>
                                    </Stack>
                                  </CardContent>
                                  <Collapse in={isTeamExpanded}>
                                    <Box sx={{ px: 2, py: 2 }}>
                                      <Stack spacing={1.5}>
                                        {team.pendings.map(pending => {
                                          const eventKey = `${pending.scheduleId}-${pending.category}`;
                                          const isEventExpanded = expandedEvent === eventKey;
                                          return (
                                            <Card key={eventKey} variant="outlined" sx={{ bgcolor: 'grey.50', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}>
                                              <CardContent sx={{ p: 1.5 }}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleEvent(eventKey)}>
                                                  <Stack spacing={0.5}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Chip label={pending.category === 'visit' ? 'Visita' : 'Reunião'} size="small" color={pending.category === 'visit' ? 'success' : 'info'} />
                                                      <Typography variant="subtitle1" fontWeight="medium">{formatScheduleLabel(pending)}</Typography>
                                                    </Stack>
                                                    <Typography variant="body2" color="error.main">{pending.pendingMembers.length} membros sem registro</Typography>
                                                  </Stack>
                                                  <IconButton size="small">{isEventExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                                                </Stack>
                                                <Collapse in={isEventExpanded}>
                                                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="body2" paragraph><strong>Local:</strong> {pending.location}</Typography>
                                                    <Typography variant="body2" paragraph><strong>Conteúdo:</strong> {pending.lessonContent}</Typography>
                                                    <List dense disablePadding>
                                                      {pending.pendingMembers.map(member => (
                                                        <ListItem key={member.memberId} disableGutters><ListItemText primary={member.memberName} secondary={member.memberEmail} /></ListItem>
                                                      ))}
                                                    </List>
                                                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                                                      <Chip label="Registrar presença" color="primary" clickable onClick={(e) => { e.stopPropagation(); handleNavigateToRegister(team.teamId, pending.scheduleId, pending.category); }} />
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
        ) : (
          totalLeaderPendings > 0 && searchTerm && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhuma equipe ou abrigo encontrado para "{searchTerm}".
            </Alert>
          )
        )}
      </Stack>

      <Dialog open={openRegisterModal} onClose={() => setOpenRegisterModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Registrar Minha Presença
          <IconButton onClick={() => setOpenRegisterModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPendingMember && <RegisterAttendance schedules={[selectedPendingMember]} disabled={false} onSuccess={handleCloseMemberRegister} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PendingAttendancePage;
