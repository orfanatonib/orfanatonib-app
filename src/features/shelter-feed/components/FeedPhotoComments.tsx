import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { FEED_COMMENT_MAX_LENGTH, FEED_MESSAGES, FEED_MIN_TOUCH_TARGET_PX } from '../constants';
import { useDeleteFeedComment, useFeedComments } from '../hooks';
import { FeedCommentStatusChip } from '@/features/feed-comments/components/FeedCommentStatusChip';
import { FEED_COMMENTS_MESSAGES, FEED_COMMENTS_TEST_IDS } from '@/features/feed-comments/constants';
import { useMyFeedComments, useSubmitFeedComment } from '@/features/feed-comments/hooks';
import { isAwaitingOrRejected, newRequestId } from '@/features/feed-comments/utils';
import { FeedCommentStatus } from '@/features/feed-comments/types';
import type { CommentDraftError } from '../types';
import { formatCommentDate, validateCommentDraft } from '../utils';

interface FeedPhotoCommentsProps {
  sectionId: string;
  viewerId: string;
}

/** Painel de comentários de uma publicação: lista paginada, envio e remoção. */
export default function FeedPhotoComments({ sectionId, viewerId }: FeedPhotoCommentsProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<CommentDraftError | null>(null);
  const comments = useFeedComments(sectionId, viewerId, true);
  const mine = useMyFeedComments(sectionId, viewerId, true);
  const create = useSubmitFeedComment(sectionId, viewerId);
  const remove = useDeleteFeedComment(sectionId, viewerId);
  const [sent, setSent] = useState(false);
  // Um id por tentativa: reenviar após falha de rede não duplica o comentário.
  const requestId = useRef(newRequestId());

  const items = comments.data?.pages.flatMap((page) => page.items) ?? [];
  const ownAwaiting = (mine.data?.pages.flatMap((page) => page.items) ?? []).filter((comment) =>
    isAwaitingOrRejected(comment.status),
  );

  const submit = () => {
    const error = validateCommentDraft(draft);
    setDraftError(error);
    if (error) return;
    create.mutate(
      { content: draft.trim(), requestId: requestId.current },
      {
        onSuccess: () => {
          setDraft('');
          setSent(true);
          requestId.current = newRequestId();
        },
      },
    );
  };

  return (
    <Box
      data-testid="shelter-feed-comments-panel"
      role="region"
      aria-label={FEED_MESSAGES.commentsTitle}
      sx={{ mt: 2 }}
    >
      <Stack spacing={1}>
        <TextField
          label={FEED_MESSAGES.commentLabel}
          placeholder={FEED_MESSAGES.commentPlaceholder}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (draftError) setDraftError(null);
            if (sent) setSent(false);
          }}
          multiline
          minRows={2}
          fullWidth
          error={draftError !== null}
          helperText={
            draftError ? FEED_MESSAGES.commentErrors[draftError] : FEED_MESSAGES.commentPrivacyHint
          }
          slotProps={{
            htmlInput: {
              'data-testid': 'shelter-feed-comment-input',
              maxLength: FEED_COMMENT_MAX_LENGTH,
            },
          }}
        />
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            {draft.length}/{FEED_COMMENT_MAX_LENGTH}
          </Typography>
          <Button
            data-testid="shelter-feed-comment-submit"
            variant="contained"
            color="success"
            onClick={submit}
            disabled={create.isPending}
            sx={{ minHeight: FEED_MIN_TOUCH_TARGET_PX }}
          >
            {create.isPending ? FEED_MESSAGES.commentSubmitting : FEED_MESSAGES.commentSubmit}
          </Button>
        </Box>
        {sent && (
          <Alert data-testid={FEED_COMMENTS_TEST_IDS.PENDING_NOTICE} severity="success">
            {FEED_COMMENTS_MESSAGES.pendingNotice} {FEED_COMMENTS_MESSAGES.pendingNoticeDetail}
          </Alert>
        )}
        {create.isError && (
          <Alert data-testid="shelter-feed-comment-create-error" severity="error">
            {getApiErrorMessage(create.error, FEED_MESSAGES.commentCreateError)}
          </Alert>
        )}
        {remove.isError && (
          <Alert data-testid="shelter-feed-comment-delete-error" severity="error">
            {getApiErrorMessage(remove.error, FEED_MESSAGES.commentDeleteError)}
          </Alert>
        )}
      </Stack>

      {ownAwaiting.length > 0 && (
        <Box component="section" aria-label={FEED_COMMENTS_MESSAGES.mineTitle} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {FEED_COMMENTS_MESSAGES.mineTitle}
          </Typography>
          <Stack
            component="ul"
            data-testid={FEED_COMMENTS_TEST_IDS.MINE_LIST}
            spacing={1}
            sx={{ listStyle: 'none', p: 0, m: 0 }}
          >
            {ownAwaiting.map((comment) => (
              <Box
                component="li"
                key={comment.id}
                data-testid={FEED_COMMENTS_TEST_IDS.MINE_ITEM}
                data-comment-id={comment.id}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}
              >
                <Box flex={1} minWidth={0}>
                  <FeedCommentStatusChip status={comment.status} data-testid={FEED_COMMENTS_TEST_IDS.MINE_STATUS} />
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {comment.content}
                  </Typography>
                  {comment.status === FeedCommentStatus.REJECTED && comment.moderationReason && (
                    <Typography
                      data-testid={FEED_COMMENTS_TEST_IDS.MINE_REASON}
                      variant="caption"
                      color="error"
                      sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}
                    >
                      {FEED_COMMENTS_MESSAGES.rejectedReasonLabel}: {comment.moderationReason}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  data-testid={FEED_COMMENTS_TEST_IDS.MINE_DELETE}
                  aria-label={FEED_COMMENTS_MESSAGES.deleteMineAria}
                  onClick={() => remove.mutate(comment.id)}
                  disabled={remove.isPending}
                  sx={{ width: FEED_MIN_TOUCH_TARGET_PX, height: FEED_MIN_TOUCH_TARGET_PX }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {comments.isLoading && (
        <Box display="flex" justifyContent="center" py={2} data-testid="shelter-feed-comments-loading">
          <CircularProgress size={28} />
        </Box>
      )}

      {comments.isError && (
        <Alert
          data-testid="shelter-feed-comments-error"
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" onClick={() => comments.refetch()} sx={{ minHeight: FEED_MIN_TOUCH_TARGET_PX }}>
              {FEED_MESSAGES.commentsRetry}
            </Button>
          }
        >
          {FEED_MESSAGES.commentsLoadError}
        </Alert>
      )}

      {comments.isSuccess && items.length === 0 && (
        <Typography
          data-testid="shelter-feed-comments-empty"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          {FEED_MESSAGES.commentsEmpty}
        </Typography>
      )}

      <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0, mt: 2 }}>
        {items.map((comment) => (
          <Box
            component="li"
            key={comment.id}
            data-testid="shelter-feed-comment-item"
            data-comment-id={comment.id}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
          >
            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle2" data-testid="shelter-feed-comment-author">
                {comment.author?.displayName ?? 'Participante'}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {formatCommentDate(comment.createdAt)}
                </Typography>
              </Typography>
              <Typography
                variant="body2"
                data-testid="shelter-feed-comment-content"
                sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
              >
                {comment.content}
              </Typography>
            </Box>
            {comment.canDelete && (
              <IconButton
                data-testid="shelter-feed-comment-delete"
                aria-label={FEED_MESSAGES.commentDeleteAria}
                onClick={() => remove.mutate(comment.id)}
                disabled={remove.isPending}
                sx={{ width: FEED_MIN_TOUCH_TARGET_PX, height: FEED_MIN_TOUCH_TARGET_PX }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            )}
          </Box>
        ))}
      </Stack>

      {comments.hasNextPage && (
        <Box textAlign="center" mt={2}>
          <Button
            data-testid="shelter-feed-comments-load-more"
            onClick={() => comments.fetchNextPage()}
            disabled={comments.isFetchingNextPage}
            sx={{ minHeight: FEED_MIN_TOUCH_TARGET_PX }}
          >
            {FEED_MESSAGES.commentsLoadMore}
          </Button>
        </Box>
      )}
    </Box>
  );
}
