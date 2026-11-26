import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import type { InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  NOTIFICATION_SOURCE_LABELS,
  NOTIFICATION_TYPE_COLORS,
  NOTIFICATIONS_TEXTS,
} from '../constants';
import type { InboxNotificationDto, InboxNotificationsPageDto } from '../types';
import { relativeTime } from '../utils';

interface InboxSectionProps {
  data: InfiniteData<InboxNotificationsPageDto> | undefined;
  unreadCount: number;
  loading: boolean;
  failed: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  busy: boolean;
  colors: { text: string; muted: string; faint: string };
  onOpen: (notice: InboxNotificationDto) => void;
  onMarkAll: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

/** Os avisos da caixa de entrada dentro do sininho: lista paginada, lido/não lido e "marcar todos". */
export function InboxSection({
  data,
  unreadCount,
  loading,
  failed,
  hasMore,
  loadingMore,
  busy,
  colors,
  onOpen,
  onMarkAll,
  onLoadMore,
  onRetry,
}: InboxSectionProps) {
  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const now = Date.now();

  return (
    <Box data-testid="notifications-inbox" sx={{ px: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.5 }}>
        <Typography variant="caption" sx={{ color: colors.muted, fontWeight: 700, textTransform: 'uppercase' }}>
          {NOTIFICATIONS_TEXTS.section}
          {unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Typography>
        <Button
          size="small"
          disabled={busy || unreadCount === 0}
          onClick={onMarkAll}
          data-testid="notifications-inbox-read-all"
          sx={{ color: colors.text, textTransform: 'none', minHeight: 44, '&.Mui-disabled': { color: colors.faint } }}
        >
          {NOTIFICATIONS_TEXTS.markAllRead}
        </Button>
      </Stack>

      {loading && items.length === 0 && (
        <Stack alignItems="center" sx={{ py: 2 }} data-testid="notifications-inbox-loading">
          <CircularProgress size={20} />
        </Stack>
      )}

      {failed && (
        <Alert
          severity="error"
          data-testid="notifications-inbox-error"
          action={
            <Button color="inherit" size="small" onClick={onRetry} sx={{ minHeight: 44 }}>
              {NOTIFICATIONS_TEXTS.retry}
            </Button>
          }
          sx={{ mx: 1, my: 0.5 }}
        >
          {NOTIFICATIONS_TEXTS.error}
        </Alert>
      )}

      {!loading && !failed && items.length === 0 && (
        <Typography variant="body2" sx={{ color: colors.faint, px: 2, py: 2, textAlign: 'center' }} data-testid="notifications-inbox-empty">
          {NOTIFICATIONS_TEXTS.empty}
        </Typography>
      )}

      <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {items.map((notice) => {
          const unread = notice.readAt === null;
          return (
            <Box component="li" key={notice.id}>
              <Box
                component="button"
                type="button"
                onClick={() => onOpen(notice)}
                aria-label={NOTIFICATIONS_TEXTS.openLabel(notice.title)}
                data-testid="notifications-inbox-item"
                data-unread={unread}
                sx={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  display: 'block',
                  width: '100%',
                  minHeight: 44,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: unread ? 'rgba(255, 255, 0, 0.08)' : 'transparent',
                  '&:hover, &:focus-visible': { bgcolor: 'rgba(255, 255, 0, 0.16)' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: colors.text },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    label={notice.title}
                    color={NOTIFICATION_TYPE_COLORS[notice.type]}
                    sx={{ fontWeight: 700 }}
                  />
                  {unread && (
                    <Box
                      component="span"
                      role="img"
                      aria-label={NOTIFICATIONS_TEXTS.unreadLabel}
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }}
                    />
                  )}
                  <Typography variant="caption" sx={{ color: colors.faint, ml: 'auto' }}>
                    {relativeTime(notice.createdAt, now)}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ color: colors.text, mt: 0.5, overflowWrap: 'anywhere', fontWeight: unread ? 600 : 400 }}
                >
                  {notice.preview || NOTIFICATION_SOURCE_LABELS[notice.source]}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>

      {hasMore && (
        <Button
          fullWidth
          size="small"
          disabled={loadingMore}
          onClick={onLoadMore}
          data-testid="notifications-inbox-more"
          sx={{ color: colors.text, textTransform: 'none', minHeight: 44, mt: 0.5 }}
        >
          {loadingMore ? NOTIFICATIONS_TEXTS.loading : NOTIFICATIONS_TEXTS.loadMore}
        </Button>
      )}
    </Box>
  );
}
