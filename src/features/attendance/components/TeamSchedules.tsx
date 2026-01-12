import {
  Alert,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import type { TeamScheduleDto } from '../types';

interface Props {
  schedules: TeamScheduleDto[];
  loading?: boolean;
}

const formatScheduleLabel = (schedule: TeamScheduleDto) => {
  const date = schedule.visitDate || schedule.meetingDate;
  const readableDate = date ? new Date(date).toLocaleDateString('pt-BR') : 'Data a definir';
  const kind = schedule.visitDate ? 'Visita' : 'Reunião';
  return `${kind} #${schedule.visitNumber} • ${readableDate}`;
};

const TeamSchedules = ({ schedules, loading }: Props) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Eventos do time</Typography>

          {loading && (
            <Stack spacing={1.5}>
              {[1, 2, 3].map(i => (
                <Card key={i} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                        <Skeleton width={200} height={24} />
                        <Skeleton width={60} height={24} variant="rounded" />
                        <Skeleton width={80} height={24} variant="rounded" />
                      </Stack>
                      <Skeleton width={150} height={20} />
                      <Stack direction="row" gap={1}>
                        <Skeleton width={100} height={20} />
                        <Skeleton width={120} height={20} />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {!loading && schedules.length === 0 && (
            <Alert severity="info">Nenhum evento retornado para este time.</Alert>
          )}

          {!loading && schedules.length > 0 && (
            <Stack spacing={1.5}>
              {schedules.map(schedule => (
                <Card key={schedule.id} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="subtitle1">{formatScheduleLabel(schedule)}</Typography>
                        {schedule.teamNumber && <Chip label={`Equipe ${schedule.teamNumber}`} size="small" />}
                        {schedule.shelterName && <Chip label={schedule.shelterName} size="small" />}
                      </Stack>
                      {schedule.lessonContent && (
                        <Typography variant="body2" color="text.secondary">
                          {schedule.lessonContent}
                        </Typography>
                      )}
                      {(schedule.meetingRoom || schedule.observation) && (
                        <Typography variant="body2">
                          {schedule.meetingRoom ? `Sala: ${schedule.meetingRoom}` : ''}{' '}
                          {schedule.observation ? `Obs.: ${schedule.observation}` : ''}
                        </Typography>
                      )}
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

export default TeamSchedules;
