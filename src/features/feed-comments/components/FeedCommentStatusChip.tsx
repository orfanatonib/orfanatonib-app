import { Chip } from '@mui/material';
import { FEED_COMMENT_STATUS_COLORS } from '../constants';
import type { FeedCommentStatusChipProps } from '../types';
import { getStatusLabel } from '../utils';

/** Selo de status do comentário (pendente, publicado, não aprovado). */
export function FeedCommentStatusChip({ status, 'data-testid': testId }: FeedCommentStatusChipProps) {
  return (
    <Chip
      data-testid={testId}
      data-status={status}
      size="small"
      label={getStatusLabel(status)}
      color={FEED_COMMENT_STATUS_COLORS[status]}
    />
  );
}
