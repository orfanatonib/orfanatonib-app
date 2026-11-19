import { MediaType } from '@/store/slices/types';
import { Box, Dialog, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

import {
  FEED_PAGE_MESSAGES,
  FEED_PALETTE,
  FEED_TEST_IDS,
  FEED_MIN_TOUCH_TARGET_PX,
} from '../constants';
import type { FeedLightboxDialogProps } from '../componentTypes';
import FeedAuthorLine from './FeedAuthorLine';
import { FeedLightboxThumbnails } from './FeedLightboxThumbnails';
import FeedSectionActions from './FeedSectionActions';
import { useLightboxNavigation } from '../useLightboxNavigation';
import { FeedVideoPlayer } from './FeedVideoPlayer';

export function FeedLightboxDialog({ activeState, isCopied, onShare, onClose }: FeedLightboxDialogProps) {
  const {
    currentIndex,
    setCurrentIndex,
    imageFailed,
    setImageFailed,
    activeThumbRef,
    handlePrev,
    handleNext,
    handleTouchStart,
    handleTouchEnd,
  } = useLightboxNavigation(activeState);

  const open = Boolean(activeState);
  const section = activeState?.section ?? null;
  const mediaItems = section?.mediaItems ?? [];
  const mediaCount = mediaItems.length;

  const currentMedia = mediaItems[currentIndex] ?? null;

  return (
    <Dialog
      data-testid={FEED_TEST_IDS.LIGHTBOX_DIALOG}
      open={open}
      onClose={onClose}
      fullScreen
      aria-labelledby="shelter-feed-lightbox-title"
      PaperProps={{
        sx: {
          bgcolor: FEED_PALETTE.lightboxBackdrop,
          color: '#ffffff',
          backgroundImage: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {section && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            width: '100%',
          }}
        >
          {/* Barra superior do cinema */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{
              px: { xs: 2, sm: 3 },
              py: 1.5,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              bgcolor: 'rgba(5, 11, 8, 0.72)',
              backdropFilter: 'blur(12px)',
              flexShrink: 0,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: FEED_PALETTE.brandLeaf,
                    overflowWrap: 'anywhere',
                    minWidth: 0,
                  }}
                >
                  {FEED_PAGE_MESSAGES.PUBLISHER} · {section.relativeDate}
                </Typography>
                {mediaCount > 0 && (
                  <Typography
                    data-testid={FEED_TEST_IDS.LIGHTBOX_COUNTER}
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.15,
                      borderRadius: 99,
                      bgcolor: 'rgba(255, 255, 255, 0.14)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    {currentIndex + 1} / {mediaCount}
                  </Typography>
                )}
              </Stack>

              <Typography
                id="shelter-feed-lightbox-title"
                component="h2"
                sx={{
                  fontSize: { xs: '0.98rem', sm: '1.15rem' },
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {section.caption}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {currentMedia?.originalUrl && (
                <Tooltip title="Abrir arquivo original em nova aba">
                  <IconButton
                    data-testid="shelter-feed-lightbox-original"
                    component="a"
                    href={currentMedia.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir arquivo original em nova aba"
                    sx={{
                      width: FEED_MIN_TOUCH_TARGET_PX,
                      height: FEED_MIN_TOUCH_TARGET_PX,
                      color: '#ffffff',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    <OpenInNewRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title={isCopied ? FEED_PAGE_MESSAGES.SHARE_COPIED : 'Compartilhar esta mídia'}>
                <IconButton
                  data-testid={FEED_TEST_IDS.LIGHTBOX_SHARE}
                  type="button"
                  onClick={() => onShare(section, currentIndex)}
                  aria-label={isCopied ? FEED_PAGE_MESSAGES.SHARE_COPIED : 'Compartilhar esta foto ou vídeo'}
                  sx={{
                    width: FEED_MIN_TOUCH_TARGET_PX,
                    height: FEED_MIN_TOUCH_TARGET_PX,
                    color: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                >
                  {isCopied ? <CheckRoundedIcon fontSize="small" /> : <IosShareRoundedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Fechar visualização (Esc)">
                <IconButton
                  data-testid={FEED_TEST_IDS.LIGHTBOX_CLOSE}
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar visualização em tela cheia"
                  sx={{
                    width: FEED_MIN_TOUCH_TARGET_PX,
                    height: FEED_MIN_TOUCH_TARGET_PX,
                    color: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.14)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.26)',
                    },
                  }}
                >
                  <CloseRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              flex: 1,
              minHeight: 0,
              overflowY: { xs: 'auto', md: 'hidden' },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                minHeight: 0,
                height: {
                  xs: currentMedia?.mediaType === MediaType.VIDEO ? 'auto' : '45dvh',
                  md: '100%',
                },
                flex: { xs: '0 0 auto', md: 1 },
              }}
            >
              {/* Palco central da fotografia */}
              <Box
                onTouchStart={
                  currentMedia?.mediaType === MediaType.VIDEO ? undefined : handleTouchStart
                }
                onTouchEnd={
                  currentMedia?.mediaType === MediaType.VIDEO ? undefined : handleTouchEnd
                }
                sx={{
                  position: 'relative',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: { xs: 1.5, sm: 7, md: 9 },
                  py: { xs: 1.5, sm: 2.5 },
                  userSelect: 'none',
                }}
              >
                {mediaCount > 1 && (
                  <IconButton
                    data-testid={FEED_TEST_IDS.LIGHTBOX_PREV}
                    type="button"
                    onClick={handlePrev}
                    aria-label="Foto anterior"
                    sx={{
                      position: 'absolute',
                      left: { xs: 8, sm: 18 },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 4,
                      width: 48,
                      height: 48,
                      color: '#ffffff',
                      bgcolor: 'rgba(15, 31, 21, 0.72)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        bgcolor: 'rgba(129, 215, 66, 0.35)',
                      },
                    }}
                  >
                    <ChevronLeftRoundedIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                )}

                {currentMedia?.mediaType === MediaType.VIDEO ? (
                  <FeedVideoPlayer
                    key={currentMedia.key}
                    src={currentMedia.originalUrl}
                    title={currentMedia.title}
                  />
                ) : currentMedia && !imageFailed ? (
                  <Box
                    key={currentMedia.key}
                    data-testid={FEED_TEST_IDS.LIGHTBOX_IMAGE}
                    component="img"
                    src={currentMedia.previewUrl}
                    alt={currentMedia.title}
                    onError={() => setImageFailed(true)}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 2,
                      boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
                    }}
                  />
                ) : (
                  <Stack
                    alignItems="center"
                    spacing={1.5}
                    sx={{ color: 'rgba(255, 255, 255, 0.72)', p: 3, textAlign: 'center' }}
                  >
                    <BrokenImageOutlinedIcon sx={{ fontSize: 44 }} />
                    <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                      Não foi possível exibir esta imagem
                    </Typography>
                  </Stack>
                )}

                {mediaCount > 1 && (
                  <IconButton
                    data-testid={FEED_TEST_IDS.LIGHTBOX_NEXT}
                    type="button"
                    onClick={handleNext}
                    aria-label="Próxima foto"
                    sx={{
                      position: 'absolute',
                      right: { xs: 8, sm: 18 },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 4,
                      width: 48,
                      height: 48,
                      color: '#ffffff',
                      bgcolor: 'rgba(15, 31, 21, 0.72)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        bgcolor: 'rgba(129, 215, 66, 0.35)',
                      },
                    }}
                  >
                    <ChevronRightRoundedIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                )}
              </Box>

              {/* Doca inferior: relato + tira cinematográfica de miniaturas */}
              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  pt: 1.5,
                  pb: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  bgcolor: 'rgba(5, 11, 8, 0.84)',
                  backdropFilter: 'blur(12px)',
                  flexShrink: 0,
                }}
              >
                {section.description && (
                  <Typography
                    sx={{
                      maxWidth: 880,
                      mx: 'auto',
                      mb: mediaCount > 1 ? 1.5 : 0.25,
                      fontSize: { xs: '0.84rem', sm: '0.92rem' },
                      lineHeight: 1.5,
                      color: 'rgba(255, 255, 255, 0.86)',
                      textAlign: 'center',
                      maxHeight: { xs: 64, sm: 80 },
                      overflowY: 'auto',
                    }}
                  >
                    {section.description}
                  </Typography>
                )}

                {mediaCount > 1 && (
                  <FeedLightboxThumbnails
                    mediaItems={mediaItems}
                    currentIndex={currentIndex}
                    activeThumbRef={activeThumbRef}
                    onSelect={setCurrentIndex}
                  />
                )}
              </Box>
            </Box>
            <Box
              data-testid={FEED_TEST_IDS.LIGHTBOX_SIDE_PANEL}
              sx={{
                width: { xs: '100%', md: 360 },
                flexShrink: 0,
                minHeight: 0,
                minWidth: 0,
                overflowY: 'auto',
                bgcolor: 'background.paper',
                color: 'text.primary',
                pt: 1.5,
              }}
            >
              <Box sx={{ px: 2, pb: 1 }}>
                <FeedAuthorLine author={section.author} />
              </Box>
              <FeedSectionActions section={section} />
            </Box>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
