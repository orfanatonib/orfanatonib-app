import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, Grid2, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { ListingLayout, ListingToolbar } from '@/components/common/listing';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { RootState } from '@/store/slices';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import {
  FEED_COMMENT_STATUS_TAB_LABELS,
  FEED_COMMENT_TAB_ORDER,
  FEED_COMMENTS_ALL_STATUSES,
  FEED_COMMENTS_DEFAULT_STATUS,
  FEED_COMMENTS_INITIAL_PAGE,
  FEED_COMMENTS_MESSAGES,
  FEED_COMMENTS_PAGE_SIZE,
  FEED_COMMENTS_PAGE_SIZES,
  FEED_COMMENTS_TEST_IDS,
  FEED_COMMENTS_TOUCH_TARGET_PX,
} from './constants';
import { useDecideFeedComment, useDeleteModerationComment, useModerationComments } from './hooks';
import type { FeedCommentDecision, FeedCommentStatusFilter, ModerationFeedComment } from './types';
import { FeedCommentStatus } from './types';
import { buildModerationQuery, formatFeedCommentDate, getCoverPreviewUrl, isVideoCover, toStatusFilter } from './utils';
import { FeedCommentReviewDialog } from './components/FeedCommentReviewDialog';
import { FeedCommentStatusChip } from './components/FeedCommentStatusChip';

const TAB_ALL = 'all';

/** Painel do admin: fila de comentários do feed por status, com busca, aprovação, reprovação e exclusão. */
export function FeedCommentsManager() {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const [page, setPage] = useState(FEED_COMMENTS_INITIAL_PAGE);
  const [limit, setLimit] = useState(FEED_COMMENTS_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FeedCommentStatusFilter>(FEED_COMMENTS_DEFAULT_STATUS);
  const [reviewing, setReviewing] = useState<ModerationFeedComment | null>(null);
  const [deleting, setDeleting] = useState<ModerationFeedComment | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const params = buildModerationQuery(page, limit, debouncedSearch, status);
  const query = useModerationComments(userId, params);
  const decide = useDecideFeedComment();
  const remove = useDeleteModerationComment();
  const counts = query.data?.counts;
  const error = query.error ? getApiErrorMessage(query.error, FEED_COMMENTS_MESSAGES.loadError) : undefined;

  const changeStatus = (next: FeedCommentStatusFilter) => {
    setStatus(next);
    setPage(FEED_COMMENTS_INITIAL_PAGE);
  };

  const handleDecide = async (comment: ModerationFeedComment, decision: FeedCommentDecision): Promise<boolean> => {
    try {
      await decide.mutateAsync({ id: comment.id, decision });
      setReviewing(null);
      return true;
    } catch {
      void query.refetch();
      return false;
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
      setReviewing(null);
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
    <ListingLayout
      data-testid={FEED_COMMENTS_TEST_IDS.MANAGER}
      title={FEED_COMMENTS_MESSAGES.managerTitle}
      summary={FEED_COMMENTS_MESSAGES.managerSummary}
      loading={query.isPending}
      error={error}
      itemCount={query.data?.items.length ?? 0}
      emptyTitle={FEED_COMMENTS_MESSAGES.emptyTitle}
      emptySubtitle={
        status === FeedCommentStatus.PENDING ? FEED_COMMENTS_MESSAGES.emptyPending : FEED_COMMENTS_MESSAGES.emptyOther
      }
      toolbar={
        <>
          {tabs}
          <ListingToolbar
            searchValue={search}
            searchPlaceholder={FEED_COMMENTS_MESSAGES.searchPlaceholder}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(FEED_COMMENTS_INITIAL_PAGE);
            }}
            onRefresh={() => {
              void query.refetch();
            }}
          />
        </>
      }
      pagination={{
        page,
        pageSize: limit,
        total: query.data?.total ?? 0,
        onPageChange: setPage,
        onPageSizeChange: (value) => {
          setLimit(value);
          setPage(FEED_COMMENTS_INITIAL_PAGE);
        },
      }}
      pageSizeOptions={FEED_COMMENTS_PAGE_SIZES}
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
      {query.data?.items.map((comment) => {
        const coverUrl = getCoverPreviewUrl(comment.post?.cover ?? null);
        return (
          <Grid2 key={comment.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Paper
              data-testid={`${FEED_COMMENTS_TEST_IDS.CARD_PREFIX}-${comment.id}`}
              variant="outlined"
              sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {coverUrl ? (
                <Box
                  component="img"
                  src={coverUrl}
                  alt={comment.post?.caption ?? FEED_COMMENTS_MESSAGES.noPost}
                  loading="lazy"
                  sx={{ height: 140, width: '100%', objectFit: 'cover', bgcolor: 'grey.100' }}
                />
              ) : (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ height: 140, bgcolor: 'grey.100', color: 'text.secondary' }}
                >
                  {isVideoCover(comment.post?.cover ?? null) ? (
                    <VideocamOutlinedIcon fontSize="large" />
                  ) : (
                    <Typography variant="caption">{FEED_COMMENTS_MESSAGES.noPhoto}</Typography>
                  )}
                </Stack>
              )}
              <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
                <Box sx={{ mb: 1.5 }}>
                  <FeedCommentStatusChip
                    status={comment.status}
                    data-testid={`${FEED_COMMENTS_TEST_IDS.CARD_STATUS_PREFIX}-${comment.id}`}
                  />
                </Box>
                <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                  {comment.author?.displayName ?? FEED_COMMENTS_MESSAGES.unknownAuthor}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFeedCommentDate(comment.createdAt)}
                </Typography>
                <Typography
                  sx={{
                    my: 1.5,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {comment.content}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {FEED_COMMENTS_MESSAGES.postLabel}: {comment.post?.caption ?? FEED_COMMENTS_MESSAGES.noPost}
                </Typography>
              </Box>
              <Stack direction="row" sx={{ p: 2, pt: 0 }}>
                <Button
                  data-testid={`${FEED_COMMENTS_TEST_IDS.REVIEW_PREFIX}-${comment.id}`}
                  type="button"
                  fullWidth
                  variant="outlined"
                  disabled={decide.isPending}
                  onClick={() => {
                    decide.reset();
                    remove.reset();
                    setReviewing(comment);
                  }}
                  sx={{ minHeight: FEED_COMMENTS_TOUCH_TARGET_PX, textTransform: 'none' }}
                >
                  {FEED_COMMENTS_MESSAGES.review}
                </Button>
              </Stack>
            </Paper>
          </Grid2>
        );
      })}
    </ListingLayout>
  );
}
