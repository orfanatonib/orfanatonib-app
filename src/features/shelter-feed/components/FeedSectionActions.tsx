import { useState, type ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/slices';
import { FeatureFlagKeys, useIsFeatureEnabled } from '@/features/feature-flags';
import { FEED_MESSAGES, FEED_MIN_TOUCH_TARGET_PX } from '../constants';
import type { FeedSectionData } from '../types';
import { formatCelebrationCount, formatCommentCount } from '../utils';
import CelebrateButton from './CelebrateButton';
import { useFeedComments } from '../hooks';
import FeedPhotoComments from './FeedPhotoComments';

interface FeedSectionActionsProps {
  section: Pick<FeedSectionData, 'id' | 'celebrationCount' | 'celebratedByMe' | 'commentCount'>;
  /** Ações extras na mesma linha (ex.: compartilhar). */
  children?: ReactNode;
}

/**
 * Barra de ações da publicação: celebrar (logado) ou só a contagem (visitante) e
 * comentários (só logado). Cada recurso respeita a sua flag.
 */
export default function FeedSectionActions({ section, children }: FeedSectionActionsProps) {
  const sectionId = section.id;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const viewerId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const celebrationsOn = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_FEED_CELEBRATIONS);
  const commentsOn = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_FEED_COMMENTS);
  // Mesma chave de cache do painel: depois de comentar/remover a contagem acompanha o servidor.
  const comments = useFeedComments(sectionId, viewerId ?? '', commentsOpen && Boolean(viewerId));

  const celebrationCount = section.celebrationCount ?? 0;
  const commentCount = comments.data?.pages[0]?.total ?? section.commentCount ?? 0;

  return (
    <Box data-testid="shelter-feed-actions" sx={{ px: { xs: 1.5, sm: 2 }, pb: 1.5, minWidth: 0 }}>
      <Box display="flex" flexWrap="wrap" alignItems="flex-start" gap={1.5}>
        {celebrationsOn &&
          (viewerId ? (
            <CelebrateButton
              sectionId={sectionId}
              initialCount={celebrationCount}
              initialCelebratedByMe={section.celebratedByMe ?? false}
              viewerId={viewerId}
            />
          ) : (
            <Typography
              data-testid="shelter-feed-celebration-readonly"
              variant="body2"
              color="text.secondary"
              sx={{ minHeight: FEED_MIN_TOUCH_TARGET_PX, display: 'flex', alignItems: 'center' }}
            >
              {formatCelebrationCount(celebrationCount)} · {FEED_MESSAGES.celebrateLoginHint}
            </Typography>
          ))}
        {commentsOn && viewerId && (
          <Button
            data-testid="shelter-feed-comments-toggle"
            variant="text"
            color="inherit"
            onClick={() => setCommentsOpen((open) => !open)}
            aria-expanded={commentsOpen}
            aria-label={`${FEED_MESSAGES.commentsToggle}: ${formatCommentCount(commentCount)}`}
            startIcon={<ChatBubbleOutlineIcon />}
            sx={{ minHeight: FEED_MIN_TOUCH_TARGET_PX }}
          >
            {FEED_MESSAGES.commentsToggle} ({commentCount})
          </Button>
        )}
        {children}
      </Box>
      {commentsOn && viewerId && commentsOpen && (
        <FeedPhotoComments sectionId={sectionId} viewerId={viewerId} />
      )}
    </Box>
  );
}
