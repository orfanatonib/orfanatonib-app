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
import { getPendingForLeader } from '../api';
import type { PendingForLeaderDto } from '../types';

interface Props {
  teamId: string;
  disabled?: boolean;
}

const formatScheduleLabel = (pending: PendingForLeaderDto) => {
  const date = pending.visitDate || pending.meetingDate;
  const readableDate = date ? new Date(date).toLocaleDateString('pt-BR') : 'Data a definir';
  const kind = pending.visitDate ? 'Visita' : 'Reunião';
  return `${kind} #${pending.visitNumber} • ${readableDate}`;
};

const PendingLeader = ({ teamId, disabled }: Props) => {
  const [pendings, setPendings] = useState<PendingForLeaderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!teamId) {
      setError('Selecione um time para buscar pendências.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingForLeader(teamId);
      setPendings(res);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências.';
      setError(message);
      setPendings([]);
    } finally {
      setLoading(false);
    }
  };

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
            disabled={loading || !teamId || disabled}
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

          {pendings.length === 0 && !loading && (
            <Alert severity="info">Nenhuma pendência encontrada.</Alert>
          )}

          {!loading && pendings.length > 0 && (
          <Stack spacing={2}>
            {pendings.map(pending => (
              <Card key={pending.scheduleId} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle1">{formatScheduleLabel(pending)}</Typography>
                    </Stack>
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
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PendingLeader;
