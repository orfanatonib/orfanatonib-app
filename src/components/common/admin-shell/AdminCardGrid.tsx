import { Children } from 'react';
import { Box } from '@mui/material';
import { ADMIN_GRID_MIN_CARD_PX, ADMIN_GRID_SPACING } from './constants';
import type { AdminCardGridProps } from './types';

/** Grade responsiva padrão de cartões administrativos (colunas pela largura do conteúdo). */
export default function AdminCardGrid({ testId, children }: AdminCardGridProps) {
  return (
    <Box
      data-testid={testId}
      sx={{
        display: 'grid',
        alignItems: 'stretch',
        gap: ADMIN_GRID_SPACING,
        gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${ADMIN_GRID_MIN_CARD_PX}px), 1fr))`,
      }}
    >
      {Children.map(children, (child) => (
        <Box sx={{ display: 'flex', minWidth: 0 }}>{child}</Box>
      ))}
    </Box>
  );
}
