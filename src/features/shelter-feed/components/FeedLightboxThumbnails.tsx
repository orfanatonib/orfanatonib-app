import type { RefObject } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { FEED_MIN_TOUCH_TARGET_PX, FEED_PALETTE, FEED_TEST_IDS } from '../constants';
import type { FeedMediaViewModel } from '../types';

interface FeedLightboxThumbnailsProps {
  mediaItems: FeedMediaViewModel[];
  currentIndex: number;
  activeThumbRef: RefObject<HTMLButtonElement | null>;
  onSelect: (index: number) => void;
}

/** Tira de miniaturas do lightbox (alvos de 44 px, rolagem horizontal só dentro da tira). */
export function FeedLightboxThumbnails({ mediaItems, currentIndex, activeThumbRef, onSelect }: FeedLightboxThumbnailsProps) {
  return (
        <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', sm: 'center' },
              gap: 1,
              overflowX: 'auto',
              py: 0.5,
              scrollbarWidth: 'thin',
            }}
          >
            {mediaItems.map((media, idx) => {
              const isActive = idx === currentIndex;
              return (
                <ButtonBase
                  key={media.key}
                  ref={isActive ? activeThumbRef : null}
                  data-testid={`${FEED_TEST_IDS.LIGHTBOX_THUMB_PREFIX}-${media.key}`}
                  type="button"
                  onClick={() => onSelect(idx)}
                  aria-label={`Selecionar foto ${idx + 1} de ${mediaItems.length}`}
                  aria-current={isActive ? 'true' : undefined}
                  sx={{
                    width: 56,
                    height: 56,
                    minWidth: FEED_MIN_TOUCH_TARGET_PX,
                    minHeight: FEED_MIN_TOUCH_TARGET_PX,
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexShrink: 0,
                    p: 0,
                    bgcolor: '#17291e',
                    border: isActive
                      ? `2.5px solid ${FEED_PALETTE.brandLeaf}`
                      : '2px solid rgba(255, 255, 255, 0.18)',
                    opacity: isActive ? 1 : 0.62,
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#17291e',
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={media.previewUrl}
                    alt=""
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </ButtonBase>
              );
            })}
          </Box>
  );
}
