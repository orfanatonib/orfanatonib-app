import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { getAllPendings } from '../api';
import { EventCategory } from '../types';
import type { PendingForMemberDto } from '../types';

const formatScheduleLabel = (pending: PendingForMemberDto) => {
  const readableDate = pending.date ? new Date(pending.date).toLocaleDateString('pt-BR') : 'Data a definir';
  const kind = pending.category === EventCategory.VISIT ? 'Visita' : 'Reunião';
  return `${kind} #${pending.visitNumber} • ${readableDate}`;
};

const PendingMember = () => {
  const [pendings, setPendings] = useState<PendingForMemberDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllPendings();
      setPendings(res.memberPendings);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências do membro.';
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
              Pendências do membro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Eventos passados que ainda precisam do seu registro de presença/falta.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleFetch}
            disabled={loading}
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
                      <Skeleton width={140} height={20} />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {pendings.length === 0 && !loading && (
            <Alert severity="info">Nenhuma pendência para você.</Alert>
          )}

          {!loading && pendings.length > 0 && (
          <Stack spacing={2}>
            {pendings.map(pending => (
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
                    <Typography variant="body2">
                      {pending.teamName} • {pending.shelterName}
                    </Typography>
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

export default PendingMember;
