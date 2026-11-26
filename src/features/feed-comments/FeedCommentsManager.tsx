import { useMemo, useState } from 'react';
import { Box, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { AdminCardGrid, AdminEntityCard, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import {
  FEED_COMMENT_FILTER_KEYS,
  FEED_COMMENT_SORT_OPTIONS,
  FEED_COMMENT_STATUS_TAB_LABELS,
  FEED_COMMENT_TAB_ORDER,
  FEED_COMMENTS_ALL_STATUSES,
  FEED_COMMENTS_DEFAULT_SORT,
  FEED_COMMENTS_DEFAULT_STATUS,
  FEED_COMMENTS_MESSAGES,
  FEED_COMMENTS_TEST_ID_PREFIX,
  FEED_COMMENTS_TEST_IDS,
  FEED_COMMENTS_TOUCH_TARGET_PX,
} from './constants';
import { createModerationFetcher } from './api';
import { useDecideFeedComment, useDeleteModerationComment } from './hooks';
import type { FeedCommentCounts, FeedCommentDecision, ModerationFeedComment } from './types';
import { FeedCommentStatus } from './types';
import { formatFeedCommentDate, getCoverPreviewUrl, isVideoCover, toStatusFilter } from './utils';
import { FeedCommentReviewDialog } from './components/FeedCommentReviewDialog';
import { FeedCommentStatusChip } from './components/FeedCommentStatusChip';

const TAB_ALL = 'all';

const P = FEED_COMMENTS_TEST_ID_PREFIX;
const K = FEED_COMMENT_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  { kind: 'date', key: K.CREATED_FROM, label: FEED_COMMENTS_MESSAGES.filterCreatedFrom },
  { kind: 'date', key: K.CREATED_TO, label: FEED_COMMENTS_MESSAGES.filterCreatedTo },
  {
    kind: 'select',
    key: K.SORT,
    label: FEED_COMMENTS_MESSAGES.filterSort,
    allLabel: null,
    options: FEED_COMMENT_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

/** A aba de pendentes é o ponto de partida: não conta como "filtro ativo". */
const DEFAULT_FILTERS = { [K.STATUS]: FEED_COMMENTS_DEFAULT_STATUS, [K.SORT]: FEED_COMMENTS_DEFAULT_SORT };
const NEUTRAL_FILTERS = { [K.STATUS]: FEED_COMMENTS_DEFAULT_STATUS };

/** Painel do admin: fila de comentários do feed por status, com busca, datas, ordenação e paginação no servidor. */
export function FeedCommentsManager() {
  const [counts, setCounts] = useState<FeedCommentCounts | undefined>(undefined);
  const fetcher = useMemo(() => createModerationFetcher(setCounts), []);
  const list = useAdminList<ModerationFeedComment>({
    fetcher,
    defaultFilters: DEFAULT_FILTERS,
    neutralFilters: NEUTRAL_FILTERS,
    errorMessage: FEED_COMMENTS_MESSAGES.loadError,
  });
  const status = toStatusFilter(list.filters[K.STATUS] ?? '');
  const [reviewing, setReviewing] = useState<ModerationFeedComment | null>(null);
  const [deleting, setDeleting] = useState<ModerationFeedComment | null>(null);
  const decide = useDecideFeedComment();
  const remove = useDeleteModerationComment();

  const changeStatus = (next: string) => list.setFilter(K.STATUS, toStatusFilter(next));

  const handleDecide = async (comment: ModerationFeedComment, decision: FeedCommentDecision): Promise<boolean> => {
    try {
      await decide.mutateAsync({ id: comment.id, decision });
      setReviewing(null);
      list.reload();
      return true;
    } catch {
      list.reload();
      return false;
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
      setReviewing(null);
      list.reload();
    } catch {
      setDeleting(null);
    }
  };

  const tabs = (
    <Paper elevation={0} sx={{ mb: 1.5, borderRadius: 3, border: 1, borderColor: 'divider' }}>
      <Tabs
        value={status === FEED_COMMENTS_ALL_STATUSES ? TAB_ALL : status}
        onChange={(_, value: string) => changeStatus(value === TAB_ALL ? '' : toStatusFilter(value))}
        variant="scrollable"
        scrollButtons={false}
        aria-label={FEED_COMMENTS_MESSAGES.statusFilterLabel}
      >
        {FEED_COMMENT_TAB_ORDER.map((tabStatus) => (
          <Tab
            key={tabStatus}
            value={tabStatus}
            data-testid={`${FEED_COMMENTS_TEST_IDS.TAB_PREFIX}-${tabStatus}`}
            sx={{ minHeight: FEED_COMMENTS_TOUCH_TARGET_PX, textTransform: 'none' }}
            label={
              <span>
                {FEED_COMMENT_STATUS_TAB_LABELS[tabStatus]}{' '}
                <span data-testid={`${FEED_COMMENTS_TEST_IDS.TAB_COUNT_PREFIX}-${tabStatus}`}>
                  {counts ? counts[tabStatus] : '–'}
                </span>
              </span>
            }
          />
        ))}
        <Tab
          value={TAB_ALL}
          data-testid={`${FEED_COMMENTS_TEST_IDS.TAB_PREFIX}-${TAB_ALL}`}
          sx={{ minHeight: FEED_COMMENTS_TOUCH_TARGET_PX, textTransform: 'none' }}
          label={FEED_COMMENTS_MESSAGES.allStatuses}
        />
      </Tabs>
    </Paper>
  );

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={FEED_COMMENTS_MESSAGES.managerTitle}
      searchLabel={FEED_COMMENTS_MESSAGES.searchLabel}
      searchPlaceholder={FEED_COMMENTS_MESSAGES.searchPlaceholder}
      fields={FIELDS}
      list={list}
      emptyMessage={
        status === FeedCommentStatus.PENDING ? FEED_COMMENTS_MESSAGES.emptyPending : FEED_COMMENTS_MESSAGES.emptyOther
      }
      beforeToolbar={tabs}
      overlays={
        <>
          <FeedCommentReviewDialog
            key={reviewing?.id ?? 'closed'}
            comment={reviewing}
            pending={decide.isPending || remove.isPending}
            error={
              decide.error
                ? getApiErrorMessage(decide.error, FEED_COMMENTS_MESSAGES.decideError)
                : remove.error
                  ? getApiErrorMessage(remove.error, FEED_COMMENTS_MESSAGES.deleteError)
                  : null
            }
            onClose={() => setReviewing(null)}
            onDecide={handleDecide}
            onDelete={setDeleting}
          />
          <DeleteConfirmationModal
            open={Boolean(deleting)}
            onClose={() => setDeleting(null)}
            onConfirm={() => {
              void confirmDelete();
            }}
            loading={remove.isPending}
            title={FEED_COMMENTS_MESSAGES.deleteConfirmTitle}
            description={FEED_COMMENTS_MESSAGES.deleteConfirmBody}
            testId={FEED_COMMENTS_TEST_IDS.DELETE_CONFIRM}
          />
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
      {list.items.map((comment) => {
        const coverUrl = getCoverPreviewUrl(comment.post?.cover ?? null);
        const cover = coverUrl ? (
          <Box
            component="img"
            src={coverUrl}
            alt={comment.post?.caption ?? FEED_COMMENTS_MESSAGES.noPost}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isVideoCover(comment.post?.cover ?? null) ? (
          <VideocamOutlinedIcon fontSize="large" color="action" />
        ) : (
          <Typography variant="caption" color="text.secondary">
            {FEED_COMMENTS_MESSAGES.noPhoto}
          </Typography>
        );
        return (
          <AdminEntityCard
            key={comment.id}
            testId={`${FEED_COMMENTS_TEST_IDS.CARD_PREFIX}-${comment.id}`}
            title={comment.author?.displayName ?? FEED_COMMENTS_MESSAGES.unknownAuthor}
            titleTestId={`${FEED_COMMENTS_TEST_IDS.CARD_PREFIX}-title-${comment.id}`}
            subtitle={formatFeedCommentDate(comment.createdAt)}
            description={comment.content}
            descriptionTestId={`${FEED_COMMENTS_TEST_IDS.CARD_PREFIX}-content-${comment.id}`}
            cover={cover}
            meta={
              <Stack spacing={1}>
                <Box>
                  <FeedCommentStatusChip
                    status={comment.status}
                    data-testid={`${FEED_COMMENTS_TEST_IDS.CARD_STATUS_PREFIX}-${comment.id}`}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {FEED_COMMENTS_MESSAGES.postLabel}: {comment.post?.caption ?? FEED_COMMENTS_MESSAGES.noPost}
                </Typography>
              </Stack>
            }
            actions={[
              {
                key: 'review',
                label: FEED_COMMENTS_MESSAGES.review,
                variant: 'outlined',
                testId: `${FEED_COMMENTS_TEST_IDS.REVIEW_PREFIX}-${comment.id}`,
                onClick: () => {
                  decide.reset();
                  remove.reset();
                  setReviewing(comment);
                },
              },
            ]}
          />
        );
      })}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
