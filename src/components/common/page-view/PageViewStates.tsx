import { Alert, Box, Container, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { PAGE_VIEW_MIN_TOUCH_TARGET } from './constants';
import type { PageViewEmptyProps, PageViewErrorProps, PageViewLoadingProps } from './types';
import { getPageViewAccent, resolveSkeletonCount } from './utils';

export function PageViewLoading({ type, testId, cardCount }: PageViewLoadingProps) {
  const accent = getPageViewAccent(type);
  const count = resolveSkeletonCount(cardCount);
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid={testId} aria-busy="true">
      <Stack spacing={{ xs: 2, md: 3 }}>
        <Skeleton
          variant="rounded"
          sx={{ height: { xs: 160, md: 220 }, bgcolor: `${accent.color}33`, borderRadius: { xs: 3, md: 4 } }}
        />
        {Array.from({ length: count }, (_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ height: { xs: 140, md: 200 }, borderRadius: { xs: 3, md: 4 } }}
          />
        ))}
      </Stack>
    </Container>
  );
}

export function PageViewError({ testId, message }: PageViewErrorProps) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} data-testid={testId}>
      <Alert severity="error" sx={{ borderRadius: { xs: 3, md: 4 }, p: { xs: 2, md: 3 } }}>
        {message}
      </Alert>
    </Container>
  );
}

export function PageViewEmpty({ testId, heading, body }: PageViewEmptyProps) {
  return (
    <Paper
      data-testid={testId}
      elevation={2}
      sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: { xs: 3, md: 4 }, minHeight: PAGE_VIEW_MIN_TOUCH_TARGET }}
    >
      <Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: body ? 1.5 : 0, overflowWrap: 'anywhere' }}>
          {heading}
        </Typography>
        {body && <Typography color="text.secondary">{body}</Typography>}
      </Box>
    </Paper>
  );
}
