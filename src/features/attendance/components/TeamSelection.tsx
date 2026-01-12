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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import type { SheltersTeamsMembersResponse, ShelterWithTeamsDto, TeamWithMembersDto } from '../types';

interface TeamSelectionProps {
  data: SheltersTeamsMembersResponse;
  loading?: boolean;
  onTeamSelect: (shelter: ShelterWithTeamsDto, team: TeamWithMembersDto) => void;
  searchTerm?: string;
  onBack?: () => void;
}

const TeamCard = memo(({
  shelter,
  expandedShelterId,
  onToggle,
  onTeamSelect,
  loading
}: {
  shelter: ShelterWithTeamsDto;
  expandedShelterId: string | null;
  onToggle: (shelterId: string) => void;
  onTeamSelect: (shelter: ShelterWithTeamsDto, team: TeamWithMembersDto) => void;
  loading?: boolean;
}) => {
  const isExpanded = expandedShelterId === shelter.shelterId;
  const totalMembers = shelter.teams.reduce((sum, team) => sum + team.members.length, 0);

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        height: 'fit-content',
        borderWidth: 1, 
        borderColor: isExpanded ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardHeader
        sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}
        avatar={
          <Box
            sx={{
              width: 48, 
              height: 48,
              borderRadius: 2,
              bgcolor: isExpanded ? 'primary.main' : 'primary.main', 
              color: 'primary.contrastText',
              display: 'grid',
              placeItems: 'center',
              transition: 'all 0.2s ease-in-out',
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
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip
              size="small"
              icon={<GroupsIcon />}
              label={`${shelter.teams.length} equipe${shelter.teams.length !== 1 ? 's' : ''}`}
              color="default"
              variant="outlined"
            />
          </Stack>
        }
        action={
          <IconButton
            onClick={() => onToggle(shelter.shelterId)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} equipes do abrigo ${shelter.shelterName}`}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />

      <Collapse in={isExpanded}>
        <CardContent sx={{ pt: 0, px: { xs: 1, sm: 2 }, pb: { xs: 2, sm: 2 } }}>
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
                <Grid item xs={12} sm={6} md={6} key={team.teamId}> {}
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: 'action.hover', 
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      },
                    }}
                    onClick={() => onTeamSelect(shelter, team)}
                  >
                    <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 } + ' !important' }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                              Equipe {team.teamNumber}
                            </Typography>
                            {team.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                                {team.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: 'background.paper', 
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <PeopleIcon fontSize="small" color="primary" sx={{ fontSize: '1rem' }} />
                            <Typography variant="caption" fontWeight="medium">
                              {team.members.length} Membro{team.members.length !== 1 ? 's' : ''}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {team.members.slice(0, 4).map(member => (
                              <Chip
                                key={member.id}
                                size="small"
                                icon={<PersonIcon />}
                                label={member.name.split(' ')[0]}
                                variant="outlined"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  mb: 0.5,
                                  '& .MuiChip-icon': {
                                    fontSize: '0.8rem',
                                  },
                                }}
                              />
                            ))}
                            {team.members.length > 4 && (
                              <Chip
                                size="small"
                                label={`+${team.members.length - 4}`}
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20, mb: 0.5 }}
                              />
                            )}
                          </Stack>
                        </Box>

                        <Button
                          size="small"
                          variant="contained"
                          fullWidth
                          sx={{
                            mt: 'auto !important',
                            textTransform: 'none',
                          }}
                          aria-label={`Selecionar Equipe ${team.teamNumber}`}
                        >
                          Selecionar
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

const TeamSelection = memo(({ data, loading, onTeamSelect, searchTerm, onBack }: TeamSelectionProps) => {
  
  const [expandedShelterId, setExpandedShelterId] = useState<string | null>(null);

  useEffect(() => {
    if (data.length === 1) {
      setExpandedShelterId(data[0].shelterId);
    } else if (searchTerm && searchTerm.trim()) {
      const filteredShelters = data; 
      if (filteredShelters.length === 1) {
        setExpandedShelterId(filteredShelters[0].shelterId);
      }
    }
  }, [searchTerm, data]);

  const handleToggleShelter = (shelterId: string) => {
    setExpandedShelterId(prev => (prev === shelterId ? null : shelterId));
  };

  const header = (
    <Stack spacing={1} sx={{ mb: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        {onBack && (
          <IconButton
            onClick={onBack}
            aria-label="Voltar"
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h5" fontWeight="bold">
          Selecione uma Equipe
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ ml: onBack ? 7 : 0 }}>
        Escolha o abrigo e depois a equipe para visualizar os membros e gerenciar presenças.
      </Typography>
    </Stack>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        {header}
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} md={6} key={i}>
              <Card variant="outlined">
                <CardHeader
                  avatar={<Skeleton variant="circular" width={40} height={40} />}
                  title={<Skeleton width="60%" height={28} />}
                  subheader={<Skeleton width="40%" height={20} />}
                  action={<Skeleton width={40} height={40} variant="circular" />}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        {header}
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchTerm
            ? 'Nenhum resultado encontrado para sua busca.'
            : 'Nenhum abrigo ou equipe encontrado para o seu perfil.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {header}

      <Grid container spacing={2}>
        {data.map(shelter => (
          <Grid item xs={12} md={6} key={shelter.shelterId}>
            <TeamCard
              shelter={shelter}
              expandedShelterId={expandedShelterId}
              onToggle={handleToggleShelter}
              onTeamSelect={onTeamSelect}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
});

TeamSelection.displayName = 'TeamSelection';

export default TeamSelection;
