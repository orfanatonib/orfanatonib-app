import React from 'react';
import { Box, Typography } from '@mui/material';
import { GroupOutlined, PersonOutline, SchoolOutlined } from '@mui/icons-material';

import { SHELTER_ACCENT, SHELTER_ACCENT_DARK, SHELTER_ACCENT_SOFT } from './constants';

type Props = { teams: number; leaders: number; members: number };

const Stat: React.FC<{ icon: React.ReactNode; value: number; label: string; testId: string }> = ({
  icon,
  value,
  label,
  testId,
}) => (
  <Box
    data-testid={testId}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: { xs: 1, sm: 1.5 },
      flexDirection: { xs: 'column', sm: 'row' },
      textAlign: { xs: 'center', sm: 'left' },
      p: { xs: 1.25, sm: 2 },
      bgcolor: '#fff',
      border: '1px solid #f1e3d0',
      borderRadius: 3,
      boxShadow: '0 6px 18px rgba(230,81,0,0.08)',
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2.5,
        display: 'grid',
        placeItems: 'center',
        bgcolor: SHELTER_ACCENT_SOFT,
        color: SHELTER_ACCENT_DARK,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', sm: '1.75rem' }, lineHeight: 1, color: '#1f2d3d' }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.25, fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: '#6b7280' }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

/** Três números do abrigo logo abaixo do hero. */
const ShelterStatsStrip: React.FC<Props> = ({ teams, leaders, members }) => (
  <Box
    data-testid="shelter-stats"
    sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 1, sm: 2 } }}
  >
    <Stat testId="shelter-stat-teams" icon={<GroupOutlined sx={{ color: SHELTER_ACCENT }} />} value={teams} label={teams === 1 ? 'Equipe' : 'Equipes'} />
    <Stat testId="shelter-stat-leaders" icon={<PersonOutline sx={{ color: SHELTER_ACCENT }} />} value={leaders} label={leaders === 1 ? 'Líder' : 'Líderes'} />
    <Stat testId="shelter-stat-members" icon={<SchoolOutlined sx={{ color: SHELTER_ACCENT }} />} value={members} label={members === 1 ? 'Membro' : 'Membros'} />
  </Box>
);

export default ShelterStatsStrip;
