import { useRef } from 'react';
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import type { FeedPostCardProps } from '../componentTypes';
import { FEED_MIN_TOUCH_TARGET_PX, FEED_PAGE_MESSAGES, FEED_PALETTE, FEED_TEST_IDS } from '../constants';
import { formatCountLabel } from '../feedLayout.utils';
import { AdaptiveMediaCollage } from './AdaptiveMediaCollage';
import FeedAuthorLine from './FeedAuthorLine';
import FeedSectionActions from './FeedSectionActions';
import { FeedVideoPlayer } from './FeedVideoPlayer';

/** Cartão de uma publicação: cabeçalho, texto, mídia, celebrar/comentar e compartilhar. */
export function FeedPostCard({ section, isCopied, onShare, onOpenLightbox }: FeedPostCardProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const openMedia = (index: number) => {
    mediaRef.current?.querySelector('video')?.pause();
    onOpenLightbox(section, index);
  };

  return (
    <Paper
      data-testid={FEED_TEST_IDS.POST_CARD}
      data-section-id={section.id}
      id={section.anchorId}
      component="article"
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: FEED_PALETTE.canvasElevated,
        border: `1px solid ${FEED_PALETTE.borderSubtle}`,
        boxShadow: FEED_PALETTE.cardShadow,
        scrollMarginTop: '88px',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            aria-hidden="true"
            sx={{
              width: 44,
              height: 44,
              bgcolor: FEED_PALETTE.brandSoft,
              color: FEED_PALETTE.brandLeafDark,
              fontSize: '0.9rem',
              fontWeight: 800,
            }}
          >
            {section.monogram}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: FEED_PALETTE.inkPrimary }}>
              {FEED_PAGE_MESSAGES.PUBLISHER}
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: FEED_PALETTE.inkMuted }}>
              {section.formattedDate}
              {section.formattedTime && ` · ${section.formattedTime}`}
            </Typography>
            <FeedAuthorLine author={section.author} />
          </Box>
          {!section.isPublic && (
            <Chip
              icon={<LockOutlinedIcon />}
              label="Equipe"
              size="small"
              sx={{ bgcolor: FEED_PALETTE.canvasSubtle, color: FEED_PALETTE.inkSecondary }}
            />
          )}
        </Stack>
        <Typography
          component="h2"
          sx={{
            color: FEED_PALETTE.inkPrimary,
            fontSize: { xs: '1.2rem', sm: '1.4rem' },
            fontWeight: 750,
            lineHeight: 1.35,
            letterSpacing: '-0.02em',
            overflowWrap: 'anywhere',
          }}
        >
          {section.caption}
        </Typography>
        {section.description && (
          <Typography
            sx={{
              color: FEED_PALETTE.inkSecondary,
              fontSize: '0.94rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
              overflowWrap: 'anywhere',
              mt: 1,
            }}
          >
            {section.description}
          </Typography>
        )}
      </Box>
      {section.mediaCount > 0 && (
        <Box ref={mediaRef} sx={{ px: { xs: 1, sm: 1.5 } }}>
          {section.isVideo ? (
            <FeedVideoPlayer src={section.mediaItems[0].originalUrl} title={section.caption} />
          ) : (
            <AdaptiveMediaCollage
              sectionId={section.id}
              caption={section.caption}
              mediaItems={section.mediaItems}
              onSelectMedia={openMedia}
            />
          )}
          <Button
            data-testid={`${FEED_TEST_IDS.POST_PHOTOS_PREFIX}-${section.id}`}
            type="button"
            onClick={() => openMedia(0)}
            startIcon={section.isVideo ? <VideocamOutlinedIcon /> : <CollectionsOutlinedIcon sx={{ fontSize: 17 }} />}
            sx={{
              minHeight: FEED_MIN_TOUCH_TARGET_PX,
              px: 1.5,
              textTransform: 'none',
              color: FEED_PALETTE.inkSecondary,
              fontSize: '0.78rem',
            }}
          >
            {section.isVideo
              ? 'Vídeo · Abrir visualização'
              : `${formatCountLabel(section.mediaCount, 'foto', 'fotos')} · Ver álbum completo`}
          </Button>
        </Box>
      )}
      <Box sx={{ mx: { xs: 0, sm: 1 }, borderTop: `1px solid ${FEED_PALETTE.borderSubtle}`, pt: 1 }}>
        <FeedSectionActions section={section}>
          <Button
            data-testid={`${FEED_TEST_IDS.POST_SHARE_PREFIX}-${section.id}`}
            type="button"
            onClick={() => onShare(section)}
            startIcon={isCopied ? <CheckRoundedIcon /> : <IosShareRoundedIcon />}
            sx={{
              minHeight: FEED_MIN_TOUCH_TARGET_PX,
              px: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: isCopied ? FEED_PALETTE.brandLeafDark : FEED_PALETTE.inkSecondary,
            }}
          >
            {isCopied ? FEED_PAGE_MESSAGES.SHARE_COPIED : FEED_PAGE_MESSAGES.SHARE}
          </Button>
        </FeedSectionActions>
      </Box>
    </Paper>
  );
}
