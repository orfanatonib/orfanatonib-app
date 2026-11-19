import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import {
  FEED_COMMENTS_MESSAGES,
  FEED_COMMENTS_REASON_MAX_LENGTH,
  FEED_COMMENTS_TEST_IDS,
  FEED_COMMENTS_TOUCH_TARGET_PX,
} from '../constants';
import { FeedCommentStatus } from '../types';
import type { FeedCommentReviewDialogProps } from '../types';
import {
  formatFeedCommentDate,
  getCoverPreviewUrl,
  isVideoCover,
  validateRejectionReason,
} from '../utils';
import { FeedCommentStatusChip } from './FeedCommentStatusChip';

const ACTION_SX = { minHeight: FEED_COMMENTS_TOUCH_TARGET_PX, textTransform: 'none' } as const;

/** Abre o comentário com a publicação de contexto e permite aprovar, reprovar (com motivo) ou excluir. */
export function FeedCommentReviewDialog({
  comment,
  pending,
  error,
  onClose,
  onDecide,
  onDelete,
}: FeedCommentReviewDialogProps) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const coverUrl = comment ? getCoverPreviewUrl(comment.post?.cover ?? null) : null;
  const isPending = comment?.status === FeedCommentStatus.PENDING;

  return (
    <Dialog
      data-testid={FEED_COMMENTS_TEST_IDS.REVIEW_DIALOG}
      open={Boolean(comment)}
      onClose={() => {
        if (!pending) onClose();
      }}
      fullWidth
      fullScreen={isMobile}
      maxWidth="sm"
      aria-labelledby="feed-comments-review-title"
      slotProps={{
        paper: { sx: { m: { xs: 0, sm: 3 }, width: '100%', maxHeight: { xs: '100dvh', sm: 'calc(100dvh - 48px)' } } },
      }}
    >
      <DialogTitle id="feed-comments-review-title">{FEED_COMMENTS_MESSAGES.reviewTitle}</DialogTitle>
      {comment && (
        <>
          <DialogContent dividers>
            <Box data-testid={FEED_COMMENTS_TEST_IDS.REVIEW_POST}>
              {coverUrl ? (
                <Box
                  data-testid={FEED_COMMENTS_TEST_IDS.REVIEW_PHOTO}
                  component="img"
                  src={coverUrl}
                  alt={comment.post?.caption ?? FEED_COMMENTS_MESSAGES.noPost}
                  sx={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 2, bgcolor: 'grey.100' }}
                />
              ) : (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={1}
                  sx={{ minHeight: 120, bgcolor: 'grey.100', borderRadius: 2, color: 'text.secondary' }}
                >
                  {isVideoCover(comment.post?.cover ?? null) && <VideocamOutlinedIcon fontSize="large" />}
                  <Typography variant="body2">
                    {isVideoCover(comment.post?.cover ?? null)
                      ? FEED_COMMENTS_MESSAGES.videoPost
                      : FEED_COMMENTS_MESSAGES.noPhoto}
                  </Typography>
                </Stack>
              )}
              <Typography variant="subtitle2" sx={{ mt: 1, overflowWrap: 'anywhere' }}>
                {FEED_COMMENTS_MESSAGES.postLabel}: {comment.post?.caption ?? FEED_COMMENTS_MESSAGES.noPost}
              </Typography>
            </Box>

            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 2 }}
            >
              <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere', minWidth: 0 }}>
                {comment.author?.displayName ?? FEED_COMMENTS_MESSAGES.unknownAuthor}
              </Typography>
              <FeedCommentStatusChip status={comment.status} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatFeedCommentDate(comment.createdAt)}
            </Typography>
            <Typography
              data-testid={FEED_COMMENTS_TEST_IDS.REVIEW_TEXT}
              sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.7, my: 2 }}
            >
              {comment.content}
            </Typography>

            {comment.reviewedAt && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {FEED_COMMENTS_MESSAGES.lastReview}: {comment.moderatedByName ?? FEED_COMMENTS_MESSAGES.administrator} ·{' '}
                {formatFeedCommentDate(comment.reviewedAt)}
              </Typography>
            )}
            {comment.moderationReason && (
              <Alert severity="info" sx={{ mb: 2, overflowWrap: 'anywhere' }}>
                {FEED_COMMENTS_MESSAGES.previousReason}: {comment.moderationReason}
              </Alert>
            )}

            {isPending && (
              <TextField
                fullWidth
                multiline
                minRows={2}
                label={FEED_COMMENTS_MESSAGES.rejectReasonLabel}
                error={reasonError}
                value={reason}
                disabled={pending}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError(false);
                }}
                slotProps={{
                  htmlInput: {
                    'data-testid': FEED_COMMENTS_TEST_IDS.REVIEW_REASON,
                    maxLength: FEED_COMMENTS_REASON_MAX_LENGTH,
                  },
                }}
                helperText={
                  reasonError ? FEED_COMMENTS_MESSAGES.rejectReasonRequired : FEED_COMMENTS_MESSAGES.rejectReasonHelp
                }
              />
            )}
            {error && (
              <Alert data-testid={FEED_COMMENTS_TEST_IDS.REVIEW_ERROR} severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1,
              p: 2,
              pb: 'max(16px, env(safe-area-inset-bottom))',
              '& > :not(style) ~ :not(style)': { ml: 0 },
            }}
          >
            <Button data-testid={FEED_COMMENTS_TEST_IDS.CLOSE} type="button" disabled={pending} onClick={onClose} sx={ACTION_SX}>
              {FEED_COMMENTS_MESSAGES.close}
            </Button>
            <Button
              data-testid={FEED_COMMENTS_TEST_IDS.DELETE}
              type="button"
              color="error"
              disabled={pending}
              onClick={() => onDelete(comment)}
              sx={ACTION_SX}
            >
              {FEED_COMMENTS_MESSAGES.delete}
            </Button>
            {isPending && (
              <>
                <Button
                  data-testid={FEED_COMMENTS_TEST_IDS.REJECT}
                  type="button"
                  color="error"
                  variant="outlined"
                  disabled={pending}
                  onClick={() => {
                    if (validateRejectionReason(reason)) {
                      setReasonError(true);
                      return;
                    }
                    void onDecide(comment, { status: FeedCommentStatus.REJECTED, reason: reason.trim() });
                  }}
                  sx={ACTION_SX}
                >
                  {FEED_COMMENTS_MESSAGES.reject}
                </Button>
                <Button
                  data-testid={FEED_COMMENTS_TEST_IDS.APPROVE}
                  type="button"
                  color="success"
                  variant="contained"
                  disabled={pending}
                  onClick={() => {
                    void onDecide(comment, { status: FeedCommentStatus.APPROVED });
                  }}
                  sx={ACTION_SX}
                >
                  {pending ? FEED_COMMENTS_MESSAGES.saving : FEED_COMMENTS_MESSAGES.approve}
                </Button>
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
