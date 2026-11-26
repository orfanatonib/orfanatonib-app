import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';

import { FEED_PALETTE, FEED_TEST_IDS } from '../constants';
import type { FeedBentoMuralProps } from '../componentTypes';
import type { FeedSectionViewModel } from '../types';
import { formatCountLabel, resolveBentoTileColSpan } from '../feedLayout.utils';

interface BentoMonthGridProps {
  sections: FeedSectionViewModel[];
  onOpenLightbox: FeedBentoMuralProps['onOpenLightbox'];
}

function BentoMonthGrid({ sections, onOpenLightbox }: BentoMonthGridProps) {
  const total = sections.length;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(12, 1fr)',
        },
        gap: { xs: 2, sm: 2.25, md: 2.5 },
      }}
    >
      {sections.map((section, idx) => {
        const mdSpan = resolveBentoTileColSpan(idx, total);
        const isWide = mdSpan >= 7;

        return (
          <Box
            key={section.id}
            data-testid={`${FEED_TEST_IDS.BENTO_TILE_PREFIX}-${section.id}`}
            id={section.anchorId}
            component="article"
            sx={{
              position: 'relative',
              gridColumn: {
                xs: 'span 1',
                sm: total === 1 ? 'span 2' : 'span 1',
                md: `span ${mdSpan}`,
              },
              minHeight: {
                xs: 290,
                sm: 310,
                md: isWide ? 360 : 320,
              },
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: FEED_PALETTE.brandForestDeep,
              boxShadow: FEED_PALETTE.cardShadow,
              scrollMarginTop: '148px',
              transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: FEED_PALETTE.cardShadowHover,
                '& .bento-cover-img': {
                  transform: 'scale(1.06)',
                },
              },
            }}
          >
            {/* Botão principal cobrindo o cartão */}
            <ButtonBase
              type="button"
              onClick={() => onOpenLightbox(section, 0)}
              aria-label={`Abrir momento ${section.caption}`}
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: 'inherit',
                p: { xs: 2.25, sm: 2.75, md: 3 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'stretch',
                textAlign: 'left',
                bgcolor: 'transparent',
                '&:hover': {
                  bgcolor: 'transparent',
                },
                '&:focus-visible': {
                  outline: `3px solid ${FEED_PALETTE.brandLeaf}`,
                  outlineOffset: '-3px',
                },
              }}
            >
              {/* Neutral fallback keeps white captions readable without a photo. */}
              {section.isVideo ? (
                <PlayCircleOutlineRoundedIcon
                  sx={{
                    position: 'absolute',
                    top: '34%',
                    left: '42%',
                    fontSize: 70,
                    color: 'common.white',
                  }}
                />
              ) : section.coverUrl ? (
                <Box
                  component="img"
                  className="bento-cover-img"
                  src={section.coverUrl}
                  alt={section.caption}
                  loading="lazy"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                    zIndex: 0,
                  }}
                />
              ) : (
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: FEED_PALETTE.mediaFallbackGradient,
                    zIndex: 0,
                  }}
                />
              )}

              {/* Vinheta escura editorial para contraste legível */}
              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(17, 24, 32, 0.32) 0%, rgba(17, 24, 32, 0.45) 45%, rgba(17, 24, 32, 0.94) 100%)',
                  zIndex: 1,
                }}
              />

              {/* Linha superior de selos */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ position: 'relative', zIndex: 2 }}
              >
                <Box
                  component="span"
                  sx={{
                    px: 1.3,
                    py: 0.45,
                    borderRadius: 99,
                    bgcolor: 'rgba(129, 215, 66, 0.24)',
                    border: '1px solid rgba(129, 215, 66, 0.45)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                  }}
                >
                  {section.relativeDate}
                </Box>

                {section.mediaCount > 0 && (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{
                      px: 1.15,
                      py: 0.4,
                      borderRadius: 99,
                      bgcolor: 'rgba(0, 0, 0, 0.46)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    <CollectionsOutlinedIcon sx={{ fontSize: 14 }} />
                    <span>{section.isVideo ? 'Vídeo' : formatCountLabel(section.mediaCount, 'foto', 'fotos')}</span>
                  </Stack>
                )}
              </Stack>

              {/* Conteúdo inferior */}
              <Box sx={{ position: 'relative', zIndex: 2, mt: 'auto', pt: 6 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: 'rgba(231, 248, 219, 0.86)',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {section.formattedDate}
                </Typography>

                <Typography
                  component="h2"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: isWide
                      ? { xs: '1.25rem', md: '1.6rem' }
                      : { xs: '1.18rem', md: '1.3rem' },
                    fontWeight: 800,
                    lineHeight: 1.22,
                    color: '#ffffff',
                    mb: section.description ? 0.75 : 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {section.caption}
                </Typography>

                {section.description && (
                  <Typography
                    sx={{
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      color: 'rgba(255, 255, 255, 0.84)',
                      mb: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {section.description}
                  </Typography>
                )}

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.6}
                  sx={{ color: FEED_PALETTE.brandLeaf }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: 'inherit', fontSize: '0.78rem' }}
                  >
                    Explorar publicação
                  </Typography>
                  <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                </Stack>
              </Box>
            </ButtonBase>

          </Box>
        );
      })}
    </Box>
  );
}

/** Modo "Momentos": mosaico de cartões, com um título por mês. */
export function FeedBentoMural({ groups, onOpenLightbox }: FeedBentoMuralProps) {
  return (
    <Box data-testid={FEED_TEST_IDS.BENTO_MURAL} sx={{ display: 'grid', gap: { xs: 3, md: 4 } }}>
      {groups.map((group) => (
        <Box key={group.key} component="section" aria-label={group.label}>
          <Typography
            component="h2"
            data-testid={`${FEED_TEST_IDS.RAIL_MONTH_PREFIX}-bento-${group.key}`}
            sx={{
              mb: 1.5,
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: FEED_PALETTE.inkSecondary,
            }}
          >
            {group.label}
          </Typography>
          <BentoMonthGrid sections={group.sections} onOpenLightbox={onOpenLightbox} />
        </Box>
      ))}
    </Box>
  );
}
