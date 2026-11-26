import { Paper, Typography } from '@mui/material';
import { ADMIN_LABELS } from './constants';
import type { AdminEmptyStateProps } from './types';

/** Estado vazio padrão das listagens administrativas. */
export default function AdminEmptyState({
  testId,
  title = ADMIN_LABELS.EMPTY_TITLE,
  message,
  icon,
}: AdminEmptyStateProps) {
  return (
    <Paper
      data-testid={testId}
      elevation={1}
      sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 3, bgcolor: 'background.paper' }}
    >
      {icon}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Paper>
  );
}
