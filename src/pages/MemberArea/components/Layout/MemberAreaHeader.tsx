import React from 'react';
import { Box, Typography } from '@mui/material';
import { MEMBER_AREA_SUBTITLE, MEMBER_AREA_TITLE, MEMBER_SHELL_LAYOUT } from '../../constants/navigation';

/** Cabeçalho da marca da área: altura constante, então trocar de subpágina não empurra o conteúdo. */
const MemberAreaHeader: React.FC = () => (
  <Box
    data-testid="member-area-header"
    component="header"
    sx={{
      minHeight: MEMBER_SHELL_LAYOUT.headerMinHeight,
      display: 'flex',
      alignItems: 'center',
      px: { xs: 1, md: 0 },
      py: { xs: 1.5, md: 0 },
      mb: { xs: 0, md: 2.5 },
    }}
  >
    <Box>
      <Typography
        data-testid="member-area-header-title"
        variant="h1"
        fontWeight={900}
        sx={{
          fontSize: { xs: '1.35rem', md: '1.9rem' },
          lineHeight: 1.2,
          letterSpacing: '-0.4px',
          background: 'linear-gradient(135deg, #2196f3 0%, #4caf50 50%, #ff9800 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        🎓 {MEMBER_AREA_TITLE}
      </Typography>
      <Typography
        data-testid="member-area-header-subtitle"
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}
      >
        {MEMBER_AREA_SUBTITLE}
      </Typography>
    </Box>
  </Box>
);

export default MemberAreaHeader;
