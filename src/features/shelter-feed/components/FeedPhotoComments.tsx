import { useState } from 'react';
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
import { useCreateFeedComment, useDeleteFeedComment, useFeedComments } from '../hooks';
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
  const create = useCreateFeedComment(sectionId, viewerId);
  const remove = useDeleteFeedComment(sectionId, viewerId);

  const items = comments.data?.pages.flatMap((page) => page.items) ?? [];

  const submit = () => {
    const error = validateCommentDraft(draft);
    setDraftError(error);
    if (error) return;
    create.mutate(draft.trim(), {
      onSuccess: () => setDraft(''),
    });
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
