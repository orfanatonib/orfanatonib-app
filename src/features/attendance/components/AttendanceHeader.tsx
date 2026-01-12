import { memo } from 'react';
import { useSelector } from 'react-redux';
import {
  Badge,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ShieldIcon from '@mui/icons-material/Shield';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from '@mui/material/MenuItem';

import type { LeaderTeamDto } from '../types';
import type { RootState as RootStateType } from '@/store/slices';

interface AttendanceHeaderProps {
  teams: LeaderTeamDto[];
  selectedTeam: LeaderTeamDto | null;
  teamId: string;
  teamLabel: string;
  teamSubtitle: string;
  roleLabel: string;
  pendingMemberCount: number;
  pendingLeaderCount: number;
  loadingTeamData: boolean;
  loadingPendingsPreview: boolean;
  isLeaderOrAdmin: boolean;
  onTeamChange: (teamId: string) => void;
  onRefreshTeamData: () => void;
}

const AttendanceHeader = memo(({
  teams,
  selectedTeam,
  teamId,
  teamLabel,
  teamSubtitle,
  roleLabel,
  pendingMemberCount,
  pendingLeaderCount,
  loadingTeamData,
  loadingPendingsPreview,
  isLeaderOrAdmin,
  onTeamChange,
  onRefreshTeamData,
}: AttendanceHeaderProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        position: 'sticky',
        top: 12,
        zIndex: 10,
        borderRadius: 3,
        overflow: 'hidden',
        borderColor: 'divider',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <CardContent sx={{ py: 2.25 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
            gap={2}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <EventAvailableIcon />
              </Box>

              <Box>
                <Typography variant="h5" sx={{ lineHeight: 1.1 }}>
                  Controle de Frequência
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registre presença, envie os registros e monitore pendências — tudo em um só lugar.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
              <Chip
                size="small"
                color="primary"
                label="JWT obrigatório"
                icon={<ShieldIcon fontSize="small" />}
              />
              <Chip size="small" color="secondary" label={roleLabel} />
              {loadingPendingsPreview ? (
                <Chip size="small" label="Atualizando pendências..." />
              ) : (
                <Chip
                  size="small"
                  icon={<PendingActionsIcon fontSize="small" />}
                  color={pendingMemberCount + pendingLeaderCount > 0 ? 'warning' : 'default'}
                  label={`Pendências: ${pendingMemberCount + pendingLeaderCount}`}
                />
              )}
            </Stack>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              gap={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <Autocomplete
                fullWidth
                size="small"
                options={teams}
                value={selectedTeam}
                isOptionEqualToValue={(a, b) => a.teamId === b.teamId}
                groupBy={option => option.shelterName || 'Sem abrigo'}
                getOptionLabel={option =>
                  option?.description
                    ? `${option.description} • Time ${option.teamNumber || ''}`
                    : `Time ${option?.teamNumber || ''}`
                }
                onChange={(_, value) => onTeamChange(value?.teamId || '')}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={isLeaderOrAdmin ? 'Selecione um time' : 'Seu time'}
                    placeholder="Busque por abrigo/descrição"
                    aria-describedby="team-selector-helper"
                  />
                )}
                noOptionsText={isLeaderOrAdmin ? 'Nenhum time retornado' : 'Time do membro carregado'}
                disableClearable={!isLeaderOrAdmin}
                aria-label="Seletor de time para controle de presença"
              />

              <Tooltip title={teamId ? 'Recarregar dados do time' : 'Selecione um time'}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={onRefreshTeamData}
                    disabled={!teamId || loadingTeamData}
                    sx={{ alignSelf: { xs: 'flex-end', md: 'center' } }}
                    aria-label={loadingTeamData ? 'Recarregando dados do time' : 'Recarregar dados do time'}
                  >
                    {loadingTeamData ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {teamId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                <b>{teamLabel}</b> • {teamSubtitle}
              </Typography>
            )}
          </Paper>
        </Stack>
      </CardContent>
    </Card>
  );
});

AttendanceHeader.displayName = 'AttendanceHeader';

export default AttendanceHeader;
