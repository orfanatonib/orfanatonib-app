import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { getSheltersTeamsMembers, getTeamSchedules, getTeamMembers } from '../api';
import TeamSelection from './TeamSelection';
import TeamMemberAttendance from './TeamMemberAttendance';
import AttendanceModeSelector from './AttendanceModeSelector';
import ListSheets from './ListSheets';
import BackHeader from '@/components/common/header/BackHeader';

import type {
  SheltersTeamsMembersResponse,
  ShelterWithTeamsDto,
  TeamWithMembersDto,
  TeamScheduleDto,
  DrillDownState,
  PaginatedResponseDto,
  AttendanceMode,
} from '../types';

const DrillDownAttendance = memo(() => {
  const [mode, setMode] = useState<AttendanceMode>(null);
  const [hierarchyData, setHierarchyData] = useState<SheltersTeamsMembersResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drillDownState, setDrillDownState] = useState<DrillDownState>({
    selectedShelter: null,
    selectedTeam: null,
    viewMode: 'shelters',
  });

  const [teamSchedules, setTeamSchedules] = useState<TeamScheduleDto[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadHierarchyData = useCallback(async () => {
    if (mode !== 'register') return;
    try {
      setLoading(true);
      setError(null);
      const data = await getSheltersTeamsMembers();
      setHierarchyData(data);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao carregar dados das equipes.';
      setError(message);
      setHierarchyData([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const loadTeamSchedules = useCallback(async (teamId: string) => {
    try {
      setLoadingSchedules(true);

      const response = await getTeamSchedules(teamId, {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const schedules = response || [];

      setTeamSchedules(schedules);
    } catch {
      setTeamSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  const handleTeamSelect = useCallback(async (shelter: ShelterWithTeamsDto, team: TeamWithMembersDto) => {
    setDrillDownState({
      selectedShelter: shelter,
      selectedTeam: team,
      viewMode: 'team-members',
    });
    loadTeamSchedules(team.teamId);

    // Fetch members for the selected team
    try {
      const membersResponse = await getTeamMembers(team.teamId);
      setDrillDownState(prev => {
        if (prev.selectedTeam?.teamId === team.teamId) {
          return {
            ...prev,
            selectedTeam: {
              ...prev.selectedTeam,
              members: membersResponse.members,
              memberCount: membersResponse.members.length,
            },
          };
        }
        return prev;
      });
    } catch {
    }
  }, [loadTeamSchedules]);

  const handleBackToTeams = useCallback(() => {
    setDrillDownState(prev => ({
      ...prev,
      selectedTeam: null,
      viewMode: 'shelters',
    }));
    setTeamSchedules([]);
  }, []);

  const handleBackToMode = useCallback(() => {
    setMode(null);
    setDrillDownState({
      selectedShelter: null,
      selectedTeam: null,
      viewMode: 'shelters',
    });
    setTeamSchedules([]);
    setHierarchyData([]);
  }, []);

  const handleModeSelect = useCallback((selectedMode: AttendanceMode) => {
    setMode(selectedMode);
  }, []);

  const handleAttendanceRegistered = useCallback(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  const stats = useMemo(() => {
    const totalShelters = hierarchyData.length;
    const totalTeams = hierarchyData.reduce((sum, s) => sum + s.teams.length, 0);
    const totalMembers = hierarchyData.reduce((sum, s) =>
      sum + s.teams.reduce((teamSum, t) => teamSum + (t.memberCount || t.members.length || 0), 0), 0
    );
    return { totalShelters, totalTeams, totalMembers };
  }, [hierarchyData]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return hierarchyData;

    const term = searchTerm.toLowerCase();
    return hierarchyData
      .map(shelter => ({
        ...shelter,
        teams: shelter.teams.filter(team =>
          shelter.shelterName.toLowerCase().includes(term) ||
          team.description?.toLowerCase().includes(term) ||
          team.members.some(m => m.name.toLowerCase().includes(term))
        ),
      }))
      .filter(shelter => shelter.teams.length > 0);
  }, [hierarchyData, searchTerm]);

  useEffect(() => {
    if (mode === 'register') {
      loadHierarchyData();
    }
  }, [mode, loadHierarchyData]);

  if (mode === null) {
    return <AttendanceModeSelector onModeSelect={handleModeSelect} />;
  }

  if (mode === 'list') {
    return <ListSheets onBack={handleBackToMode} />;
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Carregando equipes...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Box sx={{ maxWidth: 600, width: '100%' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Não foi possível carregar os dados das equipes.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ cursor: 'pointer', textDecoration: 'underline', mt: 2 }}
              onClick={loadHierarchyData}
            >
              Tentar novamente
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 4 }, py: { xs: 2, md: 3 } }}>
        <BackHeader title="Controle de Frequência" />

        {drillDownState.viewMode === 'shelters' && !loading && hierarchyData.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor: 'primary.50',
                  borderColor: 'primary.main',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <BusinessIcon />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {stats.totalShelters}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Abrigo{stats.totalShelters !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor: 'secondary.50',
                  borderColor: 'secondary.main',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'secondary.main',
                        color: 'secondary.contrastText',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <GroupsIcon />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="secondary.main">
                        {stats.totalTeams}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Equipe{stats.totalTeams !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor: 'success.50',
                  borderColor: 'success.main',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'success.main',
                        color: 'success.contrastText',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <PeopleIcon />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {stats.totalMembers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Membro{stats.totalMembers !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {drillDownState.viewMode === 'shelters' && !loading && hierarchyData.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por abrigo, equipe ou membro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
          </Box>
        )}

        {drillDownState.viewMode === 'shelters' && (
          <TeamSelection
            data={filteredData}
            loading={loading}
            onTeamSelect={handleTeamSelect}
            searchTerm={searchTerm}
            onBack={handleBackToMode}
          />
        )}

        {drillDownState.viewMode === 'team-members' &&
          drillDownState.selectedShelter &&
          drillDownState.selectedTeam && (
            <TeamMemberAttendance
              key={drillDownState.selectedTeam.teamId}
              shelter={drillDownState.selectedShelter}
              team={drillDownState.selectedTeam}
              schedules={Array.isArray(teamSchedules) ? teamSchedules : []}
              loadingSchedules={loadingSchedules}
              onBack={handleBackToTeams}
              onAttendanceRegistered={handleAttendanceRegistered}
            />
          )}
      </Box>
    </Box>
  );
});

DrillDownAttendance.displayName = 'DrillDownAttendance';

export default DrillDownAttendance;
