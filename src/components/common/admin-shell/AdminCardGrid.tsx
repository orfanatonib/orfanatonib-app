import { Children } from 'react';
import { Grid } from '@mui/material';
import { ADMIN_GRID_COLUMNS, ADMIN_GRID_SPACING } from './constants';
import type { AdminCardGridProps } from './types';

/** Grade responsiva padrão de cartões administrativos. */
export default function AdminCardGrid({ testId, children }: AdminCardGridProps) {
  return (
    <Grid container spacing={ADMIN_GRID_SPACING} alignItems="stretch" data-testid={testId}>
      {Children.map(children, (child) => (
        <Grid item {...ADMIN_GRID_COLUMNS} sx={{ display: 'flex' }}>
          {child}
        </Grid>
      ))}
    </Grid>
  );
}
