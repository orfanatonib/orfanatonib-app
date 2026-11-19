import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { useMemo } from 'react';
import { Box, ButtonBase, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import type { FeedHighlightsCarouselProps } from '../componentTypes';
import {
  FEED_HIGHLIGHTS_SLOT_PX,
  FEED_MAX_STORY_HIGHLIGHTS,
  FEED_MIN_TOUCH_TARGET_PX,
  FEED_PALETTE,
  FEED_TEST_IDS,
} from '../constants';
import { formatHighlightsMonthLabel, selectMonthHighlights } from '../feedHighlights.utils';
import { formatCountLabel } from '../feedLayout.utils';
import { useHighlightsCarousel } from '../useHighlightsCarousel';

const slideFromRight = keyframes`from { transform: translateX(${FEED_HIGHLIGHTS_SLOT_PX}px); } to { transform: translateX(0); }`;
const slideFromLeft = keyframes`from { transform: translateX(-${FEED_HIGHLIGHTS_SLOT_PX}px); } to { transform: translateX(0); }`;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * "Momentos em destaque": só as publicações do mês corrente, num mini carrossel
 * infinito que avança a cada 5 s (pausa com mouse/foco/toque; sem movimento
 * automático se o usuário prefere menos animação). Sem destaques no mês, o bloco some.
 */
export function FeedHighlightsCarousel({ sections, viewedStoryIds, referenceDate, onSelectStory }: FeedHighlightsCarouselProps) {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const reference = useMemo(() => referenceDate ?? new Date(), [referenceDate]);
  const highlights = useMemo(
    () => selectMonthHighlights(sections, reference, FEED_MAX_STORY_HIGHLIGHTS),
    [sections, reference],
  );
  const carousel = useHighlightsCarousel(highlights, reducedMotion);
  const monthLabel = formatHighlightsMonthLabel(reference);

  if (highlights.length === 0) {
    return <Box data-testid={FEED_TEST_IDS.HIGHLIGHTS_EMPTY} sx={{ display: 'none' }} />;
  }

  const navButtonSx = {
    width: FEED_MIN_TOUCH_TARGET_PX,
    height: FEED_MIN_TOUCH_TARGET_PX,
    flexShrink: 0,
    color: FEED_PALETTE.inkSecondary,
    bgcolor: FEED_PALETTE.canvasElevated,
    border: `1px solid ${FEED_PALETTE.borderSubtle}`,
  } as const;

  return (
    <Box
      data-testid={FEED_TEST_IDS.HIGHLIGHTS}
      data-paused={carousel.isPaused ? 'true' : 'false'}
      component="section"
      aria-roledescription="carrossel"
      aria-label={`Momentos em destaque de ${monthLabel}`}
      onMouseEnter={() => carousel.setPause('hover', true)}
      onMouseLeave={() => carousel.setPause('hover', false)}
      onFocus={() => carousel.setPause('focus', true)}
      onBlur={() => carousel.setPause('focus', false)}
      onTouchStart={carousel.onTouchStart}
      onTouchEnd={carousel.onTouchEnd}
      sx={{ py: { xs: 2, sm: 2.5 }, minWidth: 0, position: 'relative' }}
    >
      <Stack direction="row" alignItems="center" spacing={0.85} sx={{ mb: 1.25 }}>
        <AutoStoriesOutlinedIcon sx={{ fontSize: 18, color: FEED_PALETTE.brandLeafDark }} />
        <Typography
          data-testid={FEED_TEST_IDS.HIGHLIGHTS_TITLE}
          component="h2"
          sx={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: FEED_PALETTE.inkSecondary }}
        >
          Momentos em destaque — {monthLabel}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.5}>
        <IconButton
          data-testid={FEED_TEST_IDS.HIGHLIGHTS_PREV}
          type="button"
          onClick={carousel.prev}
          aria-label="Destaque anterior"
          sx={navButtonSx}
        >
          <ChevronLeftRoundedIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box
            key={carousel.offset}
            data-testid={FEED_TEST_IDS.HIGHLIGHTS_TRACK}
            sx={{
              display: 'flex',
              gap: 1.5,
              width: 'max-content',
              animation: reducedMotion
                ? 'none'
                : `${carousel.direction === 1 ? slideFromRight : slideFromLeft} 0.45s ease-out`,
            }}
          >
            {carousel.rotated.map(({ section, copy }) => {
              const isViewed = viewedStoryIds.has(section.id);
              return (
                <ButtonBase
                  key={`${section.id}-${copy}`}
                  data-testid={`${FEED_TEST_IDS.HIGHLIGHTS_ITEM_PREFIX}-${section.id}${copy > 0 ? `-copy-${copy}` : ''}`}
                  data-section-id={section.id}
                  type="button"
                  onClick={() => onSelectStory(section)}
                  aria-label={`Ver destaque de ${section.caption} (${formatCountLabel(section.mediaCount, 'foto', 'fotos')})`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: FEED_HIGHLIGHTS_SLOT_PX - 12,
                    minHeight: FEED_MIN_TOUCH_TARGET_PX,
                    flexShrink: 0,
                    p: 0.5,
                    borderRadius: 3.5,
                    '&:focus-visible': { outline: `3px solid ${FEED_PALETTE.brandLeaf}`, outlineOffset: '2px' },
                  }}
                >
                  <Box
                    sx={{
                      p: '3px',
                      borderRadius: '22px',
                      mb: 0.75,
                      background: isViewed ? FEED_PALETTE.storyRingViewed : FEED_PALETTE.storyRingActive,
                    }}
                  >
                    <Box sx={{ width: 66, height: 66, borderRadius: '19px', overflow: 'hidden', border: '2.5px solid #ffffff', bgcolor: FEED_PALETTE.canvasSubtle }}>
                      {section.coverUrl ? (
                        <Box component="img" src={section.coverUrl} alt="" loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <Box data-testid="shelter-feed-highlight-video-cover" sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: FEED_PALETTE.inkMuted }}>
                          <VideocamOutlinedIcon />
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Typography sx={{ width: '100%', fontSize: '0.73rem', fontWeight: isViewed ? 600 : 700, color: isViewed ? FEED_PALETTE.inkMuted : FEED_PALETTE.inkPrimary, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {section.caption}
                  </Typography>
                  <Typography sx={{ width: '100%', fontSize: '0.66rem', color: FEED_PALETTE.inkMuted, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {section.relativeDate}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
        <IconButton
          data-testid={FEED_TEST_IDS.HIGHLIGHTS_NEXT}
          type="button"
          onClick={carousel.next}
          aria-label="Próximo destaque"
          sx={navButtonSx}
        >
          <ChevronRightRoundedIcon />
        </IconButton>
      </Stack>

      <Stack
        data-testid={FEED_TEST_IDS.HIGHLIGHTS_DOTS}
        direction="row"
        justifyContent="center"
        sx={{ mt: 0.5 }}
      >
        {highlights.map((section, position) => (
          <ButtonBase
            key={section.id}
            data-testid={`${FEED_TEST_IDS.HIGHLIGHTS_DOT_PREFIX}-${section.id}`}
            type="button"
            onClick={() => carousel.goToItem(position)}
            aria-label={`Ir para o destaque ${position + 1} de ${carousel.total}`}
            aria-current={position === carousel.activeIndex ? 'true' : undefined}
            sx={{ width: FEED_MIN_TOUCH_TARGET_PX / 2 + 2, height: FEED_MIN_TOUCH_TARGET_PX, minWidth: 22 }}
          >
            <Box
              sx={{
                width: position === carousel.activeIndex ? 18 : 8,
                height: 8,
                borderRadius: 99,
                bgcolor: position === carousel.activeIndex ? FEED_PALETTE.brandForest : FEED_PALETTE.borderStrong,
                transition: 'width 0.2s ease',
              }}
            />
          </ButtonBase>
        ))}
      </Stack>

      <Typography
        data-testid={FEED_TEST_IDS.HIGHLIGHTS_STATE}
        variant="caption"
        sx={{ display: 'block', textAlign: 'center', color: FEED_PALETTE.inkMuted }}
      >
        {reducedMotion ? 'Use os botões para navegar' : carousel.isPaused ? 'Pausado' : 'Passa sozinho a cada 5 segundos'}
      </Typography>
      <Box
        data-testid={FEED_TEST_IDS.HIGHLIGHTS_LIVE}
        aria-live="polite"
        aria-atomic="true"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        {carousel.announcement}
      </Box>
    </Box>
  );
}
