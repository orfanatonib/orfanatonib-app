import { Box, LinearProgress } from '@mui/material';
import {
  ADMIN_CONTENT_MIN_HEIGHT,
  ADMIN_FETCH_BAR_HEIGHT_PX,
} from './constants';
import AdminEmptyState from './AdminEmptyState';
import AdminErrorAlert from './AdminErrorAlert';
import AdminListSkeleton from './AdminListSkeleton';
import { resolveEmptyMessage } from './utils';
import type { AdminListContentProps } from './types';

/**
 * Área de conteúdo com altura mínima fixa: esqueleto, erro, vazio e lista ocupam o mesmo espaço,
 * e a barra fina de "buscando" tem lugar reservado. Troca de filtro/página não faz a tela pular.
 */
export default function AdminListContent({
  testIdPrefix,
  initialLoading,
  fetching,
  error,
  onRetry,
  isEmpty,
  hasActiveFilters,
  emptyMessage,
  emptyIcon,
  skeletonWithCover = true,
  children,
}: AdminListContentProps) {
  let body;
  if (initialLoading) {
    body = <AdminListSkeleton testId={`${testIdPrefix}-loading`} withCover={skeletonWithCover} />;
  } else if (error) {
    body = <AdminErrorAlert testId={`${testIdPrefix}-error`} message={error} onRetry={onRetry} />;
  } else if (isEmpty) {
    body = (
      <AdminEmptyState
        testId={`${testIdPrefix}-empty`}
        message={resolveEmptyMessage(hasActiveFilters, emptyMessage)}
        icon={emptyIcon}
      />
    );
  } else {
    body = children;
  }

  return (
    <Box
      data-testid={`${testIdPrefix}-content`}
      aria-busy={fetching}
      sx={{ minHeight: ADMIN_CONTENT_MIN_HEIGHT }}
    >
      <Box sx={{ height: ADMIN_FETCH_BAR_HEIGHT_PX, mb: 1 }}>
        {fetching && !initialLoading ? (
          <LinearProgress data-testid={`${testIdPrefix}-fetching`} sx={{ borderRadius: 1 }} />
        ) : null}
      </Box>
      <Box
        sx={{
          opacity: fetching && !initialLoading ? 0.6 : 1,
          transition: 'opacity .15s',
          pointerEvents: fetching && !initialLoading ? 'none' : 'auto',
        }}
      >
        {body}
      </Box>
    </Box>
  );
}
