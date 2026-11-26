import React from 'react';
import { Box, Typography } from '@mui/material';
import { MEMBER_SHELL_LAYOUT } from '../../constants/navigation';
import type { MemberPageHeaderProps } from '../../types/navigation';

/**
 * Cabeçalho padrão de toda subpágina (ícone, título e descrição), desenhado pela
 * casca a partir do item do menu. As subpáginas não declaram título próprio.
 */
const MemberPageHeader: React.FC<MemberPageHeaderProps> = ({ item }) => {
  const Icon = item.icon;
  return (
    <Box
      data-testid="member-page-header"
      component="header"
      sx={{
        minHeight: MEMBER_SHELL_LAYOUT.pageHeaderMinHeight,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: { xs: 2, md: 2.5 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: `${item.accentColor}1a`,
          color: item.accentColor,
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          data-testid="member-page-header-title"
          component="h2"
          variant="h5"
          fontWeight={800}
          color="#0f2942"
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, lineHeight: 1.2 }}
        >
          {item.label}
        </Typography>
        <Typography
          data-testid="member-page-header-description"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.25 }}
        >
          {item.description}
        </Typography>
      </Box>
    </Box>
  );
};

export default MemberPageHeader;
