import { memo, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GroupsIcon from '@mui/icons-material/Groups';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';

import type { SheltersTeamsMembersResponse, ShelterWithTeamsDto, TeamWithMembersDto } from '../types';

interface TeamSelectionProps {
  data: SheltersTeamsMembersResponse;
  loading?: boolean;
  onTeamSelect: (shelter: ShelterWithTeamsDto, team: TeamWithMembersDto) => void;
  searchTerm?: string;
}

const TeamCard = memo(({
  shelter,
  expandedShelters,
  onToggle,
  onTeamSelect,
  loading
}: {
  shelter: ShelterWithTeamsDto;
  expandedShelters: Set<string>;
  onToggle: (shelterId: string) => void;
  onTeamSelect: (shelter: ShelterWithTeamsDto, team: TeamWithMembersDto) => void;
  loading?: boolean;
}) => {
  const isExpanded = expandedShelters.has(shelter.shelterId);
  const totalMembers = shelter.teams.reduce((sum, team) => sum + team.members.length, 0);

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderWidth: 2,
        borderColor: isExpanded ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: isExpanded ? 'primary.main' : 'primary.100',
              color: isExpanded ? 'primary.contrastText' : 'primary.main',
              display: 'grid',
              placeItems: 'center',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <BusinessIcon fontSize="large" />
          </Box>
        }
        title={
          <Typography variant="h6" fontWeight="bold">
            {shelter.shelterName}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip
              size="small"
              icon={<GroupsIcon />}
              label={`${shelter.teams.length} equipe${shelter.teams.length !== 1 ? 's' : ''}`}
              color="primary"
              variant={isExpanded ? 'filled' : 'outlined'}
            />
            <Chip
              size="small"
              icon={<PeopleIcon />}
              label={`${totalMembers} membro${totalMembers !== 1 ? 's' : ''}`}
              color="secondary"
              variant="outlined"
            />
          </Stack>
        }
        action={
          <IconButton
            onClick={() => onToggle(shelter.shelterId)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} equipes do abrigo ${shelter.shelterName}`}
            sx={{
              bgcolor: isExpanded ? 'primary.50' : 'transparent',
              '&:hover': {
                bgcolor: 'primary.100',
              },
            }}
          >
            {isExpanded ? <ExpandLessIcon color="primary" /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />

      <Collapse in={isExpanded}>
        <CardContent sx={{ pt: 0 }}>
          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map(i => (
                <Card key={i} variant="outlined" sx={{ opacity: 0.6 }}>
                  <CardContent>
                    <Skeleton width="60%" height={24} />
                    <Skeleton width="40%" height={20} />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Grid container spacing={2}>
              {shelter.teams.map(team => (
                <Grid item xs={12} sm={6} md={4} key={team.teamId}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderWidth: 2,
                      '&:hover': {
                        boxShadow: 4,
                        borderColor: 'primary.main',
                        transform: 'translateY(-4px)',
                      },
                    }}
                    onClick={() => onTeamSelect(shelter, team)}
                  >
                    <CardContent sx={{ flex: 1, pb: '16px !important' }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                          <Box>
                            <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                              Time {team.teamNumber}
                            </Typography>
                            {team.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {team.description}
                              </Typography>
                            )}
                          </Box>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              bgcolor: 'primary.100',
                              color: 'primary.main',
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <GroupsIcon />
                          </Box>
                        </Stack>

                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <PeopleIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="medium">
                              {team.members.length} Membro{team.members.length !== 1 ? 's' : ''}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {team.members.slice(0, 4).map(member => (
                              <Chip
                                key={member.id}
                                size="small"
                                icon={<PersonIcon fontSize="small" />}
                                label={member.name.split(' ')[0]}
                                variant="outlined"
                                color={member.role === 'leader' ? 'primary' : 'default'}
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 24,
                                  '& .MuiChip-icon': {
                                    fontSize: '0.875rem',
                                  },
                                }}
                              />
                            ))}
                            {team.members.length > 4 && (
                              <Chip
                                size="small"
                                label={`+${team.members.length - 4}`}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 24 }}
                              />
                            )}
                          </Stack>
                        </Box>

                        <Button
                          size="medium"
                          variant="contained"
                          fullWidth
                          sx={{
                            mt: 'auto !important',
                            fontWeight: 'bold',
                            textTransform: 'none',
                            py: 1,
                          }}
                          aria-label={`Selecionar Time ${team.teamNumber} - ${team.members.length} membros`}
                        >
                          Gerenciar Presenças
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
});

const TeamSelection = memo(({ data, loading, onTeamSelect, searchTerm }: TeamSelectionProps) => {
  const [expandedShelters, setExpandedShelters] = useState<Set<string>>(new Set());

  // Expandir automaticamente quando há busca
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      const allShelterIds = new Set(data.map(s => s.shelterId));
      setExpandedShelters(allShelterIds);
    }
  }, [searchTerm, data]);

  const handleToggleShelter = (shelterId: string) => {
    setExpandedShelters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shelterId)) {
        newSet.delete(shelterId);
      } else {
        newSet.add(shelterId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Stack spacing={3}>
        {[1, 2, 3].map(i => (
          <Card key={i} variant="outlined">
            <CardHeader
              avatar={<Skeleton variant="circular" width={40} height={40} />}
              title={<Skeleton width="60%" height={28} />}
              subheader={<Skeleton width="40%" height={20} />}
              action={<Skeleton width={40} height={40} variant="circular" />}
            />
          </Card>
        ))}
      </Stack>
    );
  }

  if (data.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {searchTerm
          ? 'Nenhum resultado encontrado para sua busca.'
          : 'Nenhum abrigo ou equipe encontrado para o seu perfil.'}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={1} sx={{ mb: { xs: 2, md: 3 } }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Selecione uma Equipe
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Escolha o abrigo e depois a equipe para visualizar os membros e gerenciar presenças.
        </Typography>
      </Stack>

      <Stack spacing={{ xs: 2, md: 2 }}>
        {data.map(shelter => (
          <TeamCard
            key={shelter.shelterId}
            shelter={shelter}
            expandedShelters={expandedShelters}
            onToggle={handleToggleShelter}
            onTeamSelect={onTeamSelect}
            loading={loading}
          />
        ))}
      </Stack>
    </Box>
  );
});

TeamSelection.displayName = 'TeamSelection';

export default TeamSelection;
