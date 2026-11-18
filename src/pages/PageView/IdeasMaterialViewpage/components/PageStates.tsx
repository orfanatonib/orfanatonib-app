import React from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { IDEAS_VIEW_COPY } from '../constants';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = IDEAS_VIEW_COPY.LOADING }: LoadingStateProps) {
  return (
    <Box
      data-testid="ideas-page-loading"
      sx={{ minHeight: '40vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}
    >
      <Box>
        <CircularProgress size={48} aria-label={message} />
        <Typography variant="body1" mt={2} color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  );
}

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <Alert data-testid="ideas-page-error" severity="error">
      {message}
    </Alert>
  );
}

export function EmptyState() {
  return (
    <Alert data-testid="ideas-page-empty" severity="info">
      {IDEAS_VIEW_COPY.EMPTY}
    </Alert>
  );
}
