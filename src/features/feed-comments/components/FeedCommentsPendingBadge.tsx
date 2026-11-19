import { useSelector } from 'react-redux';
import { Badge } from '@mui/material';
import type { RootState } from '@/store/slices';
import { FEED_COMMENTS_MESSAGES, FEED_COMMENTS_PENDING_BADGE_MAX, FEED_COMMENTS_TEST_IDS } from '../constants';
import { usePendingFeedCommentsCount } from '../hooks';
import type { FeedCommentsPendingBadgeProps } from '../types';
import { clampBadgeCount } from '../utils';

/**
 * Envolve o ícone do item de menu/cartão com o total de comentários aguardando aprovação.
 * Só é montado para o admin com a flag ligada (o item do menu já some sem elas).
 */
export function FeedCommentsPendingBadge({ children }: FeedCommentsPendingBadgeProps) {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const { data } = usePendingFeedCommentsCount(userId, Boolean(userId));
  const pending = data?.pending ?? 0;
  return (
    <Badge
      color="error"
      max={FEED_COMMENTS_PENDING_BADGE_MAX}
      badgeContent={pending}
      invisible={pending === 0}
      slotProps={{
        badge: {
          'data-testid': FEED_COMMENTS_TEST_IDS.PENDING_BADGE,
          'data-count': String(pending),
          'aria-label': `${clampBadgeCount(pending, FEED_COMMENTS_PENDING_BADGE_MAX)} ${FEED_COMMENTS_MESSAGES.pendingBadgeAria}`,
        } as Record<string, string>,
      }}
    >
      {children}
    </Badge>
  );
}
