import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { getAllPendings } from '../api';
import { EventCategory } from '../types';
import type { PendingForLeaderDto, TeamPendingsDto } from '../types';

interface Props {
  teamId?: string;
  disabled?: boolean;
}

const formatScheduleLabel = (pending: PendingForLeaderDto) => {
  const readableDate = pending.date ? new Date(pending.date).toLocaleDateString('pt-BR') : 'Data a definir';
  const kind = pending.category === EventCategory.VISIT ? 'Visita' : 'Reunião';
  return `${kind} #${pending.visitNumber} • ${readableDate}`;
};

const PendingLeader = ({ teamId, disabled }: Props) => {
  const [teamPendings, setTeamPendings] = useState<TeamPendingsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllPendings();
      let leaderPendings = res.leaderPendings;
      if (teamId) {
        leaderPendings = leaderPendings.filter(tp => tp.teamId === teamId);
      }
      setTeamPendings(leaderPendings);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências.';
      setError(message);
      setTeamPendings([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPendings = teamPendings.reduce((acc, tp) => acc + tp.pendings.length, 0);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Pendências do líder/admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Eventos passados com membros sem registro de presença/falta.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleFetch}
            disabled={loading || disabled}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? 'Buscando...' : 'Buscar pendências'}
          </Button>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading && (
            <Stack spacing={2}>
              {[1, 2].map(i => (
                <Card key={i} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Skeleton width={180} height={24} />
                      <Skeleton width={120} height={20} />
                      <Box>
                        <Skeleton width={100} height={20} />
                        <Skeleton width={120} height={20} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {totalPendings === 0 && !loading && (
            <Alert severity="info">Nenhuma pendência encontrada.</Alert>
          )}

          {!loading && totalPendings > 0 && (
          <Stack spacing={3}>
            {teamPendings.map(team => (
              <Box key={team.teamId}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  {team.teamName} • {team.shelterName}
                </Typography>
                <Stack spacing={2}>
                  {team.pendings.map(pending => (
                    <Card key={`${pending.scheduleId}-${pending.category}`} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Stack spacing={1}>
                          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="subtitle1">{formatScheduleLabel(pending)}</Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {pending.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pending.lessonContent}
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
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PendingLeader;
