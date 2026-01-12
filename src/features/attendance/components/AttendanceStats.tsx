import { memo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChecklistIcon from '@mui/icons-material/Checklist';

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  badge?: number;
}

const StatTile = memo(({
  icon,
  label,
  value,
  helper,
  color = 'primary',
  badge,
}: StatTileProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        borderColor: `${color}.light`,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="center" gap={1.2}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: `${color}.main`,
              color: `${color}.contrastText`,
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ lineHeight: 1.15 }}>
              {value}
            </Typography>
          </Box>
        </Stack>

        {typeof badge === 'number' && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: badge > 0 ? 'error.main' : 'default',
            }}
            aria-label={`${badge} itens destacados`}
          />
        )}
      </Stack>

      {helper && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {helper}
        </Typography>
      )}
    </Paper>
  );
});

StatTile.displayName = 'StatTile';

interface AttendanceStatsProps {
  teamId: string;
  teamLabel: string;
  teamSubtitle: string;
  schedulesCount: number;
  membersCount: number;
  loadingTeamData: boolean;
  isLeaderOrAdmin: boolean;
}

const AttendanceStats = memo(({
  teamId,
  teamLabel,
  teamSubtitle,
  schedulesCount,
  membersCount,
  loadingTeamData,
  isLeaderOrAdmin,
}: AttendanceStatsProps) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <StatTile
            icon={<GroupsIcon />}
            label="Time"
            value={teamId ? teamLabel : '—'}
            helper={teamSubtitle}
            color="info"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatTile
            icon={<CalendarMonthIcon />}
            label="Eventos retornados"
            value={loadingTeamData ? <Skeleton width={60} /> : schedulesCount}
            helper={
              loadingTeamData
                ? <Skeleton width={120} />
                : "Próximos e passados conforme backend."
            }
            color="success"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StatTile
            icon={<ChecklistIcon />}
            label="Membros retornados"
            value={loadingTeamData ? <Skeleton width={60} /> : membersCount}
            helper={
              loadingTeamData
                ? <Skeleton width={140} />
                : isLeaderOrAdmin ? 'Inclui líder e membros.' : 'Visível apenas para líder/admin.'
            }
            color="warning"
          />
        </Grid>
      </Grid>
    </Box>
  );
});

AttendanceStats.displayName = 'AttendanceStats';

export { StatTile };
export default AttendanceStats;
