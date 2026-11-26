import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';
import { ADMIN_LABELS, ADMIN_TOUCH_TARGET_PX } from './constants';
import type { AdminListSkeletonProps } from './types';
import AdminCardGrid from './AdminCardGrid';
import { clampSkeletonCount } from './utils';

/** Esqueleto da listagem: grade de cartões com a mesma geometria dos reais. */
export default function AdminListSkeleton({
  testId,
  count,
  withCover = true,
}: AdminListSkeletonProps) {
  const total = clampSkeletonCount(count);

  return (
    <Box role="status" aria-busy="true" aria-label={ADMIN_LABELS.LOADING} data-testid={testId}>
      <AdminCardGrid testId={`${testId}-grid`}>
        {Array.from({ length: total }, (_, index) => (
          <Card key={index} variant="outlined" sx={{ borderRadius: 2, width: '100%' }}>
            {withCover ? <Skeleton variant="rectangular" sx={{ aspectRatio: '16 / 9', height: 'auto' }} /> : null}
            <CardContent>
              <Skeleton variant="text" width="70%" height={28} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="85%" />
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Skeleton variant="rounded" height={ADMIN_TOUCH_TARGET_PX} />
                <Skeleton variant="rounded" height={ADMIN_TOUCH_TARGET_PX} />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </AdminCardGrid>
    </Box>
  );
}
