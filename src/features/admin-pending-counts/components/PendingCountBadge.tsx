import { useSelector } from 'react-redux';
import { Badge } from '@mui/material';

import type { RootState } from '@/store/slices';

import {
  PENDING_COUNT_ARIA,
  PENDING_COUNT_BADGE_MAX,
  PENDING_COUNT_TEST_IDS,
} from '../constants';
import { usePendingCount } from '../hooks';
import type { PendingCountBadgeProps } from '../types';
import { clampBadgeCount } from '../utils';

/**
 * Envolve o ícone do item de menu/cartão com o total de itens aguardando o admin.
 * Só é montado para o item que o admin com a flag já enxerga.
 */
export function PendingCountBadge({ kind, children }: PendingCountBadgeProps) {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const { data } = usePendingCount(kind, userId, Boolean(userId));
  const pending = data?.pending ?? 0;
  return (
    <Badge
      color="error"
      max={PENDING_COUNT_BADGE_MAX}
      badgeContent={pending}
      invisible={pending === 0}
      slotProps={{
        badge: {
          'data-testid': PENDING_COUNT_TEST_IDS[kind],
          'data-count': String(pending),
          'aria-label': `${clampBadgeCount(pending, PENDING_COUNT_BADGE_MAX)} ${PENDING_COUNT_ARIA[kind]}`,
        } as Record<string, string>,
      }}
    >
      {children}
    </Badge>
  );
}
