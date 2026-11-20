import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import {
  FEED_CONTAINER_WIDTH,
  FEED_CONTENT_MAX_WIDTH,
  FEED_PAGE_MESSAGES,
  FEED_PALETTE,
  FEED_TEST_IDS,
  FEED_MIN_TOUCH_TARGET_PX,
} from '../constants';
import type { FeedHeroBannerProps } from '../componentTypes';
import { formatCountLabel } from '../feedLayout.utils';

export function FeedHeroBanner({
  title,
  description,
  totalSections,
  canUploadPhotos,
  canManageFeed,
  isRefreshing,
  onNavigateHome,
  onNavigateUpload,
  onNavigateManage,
  onRefresh,
}: FeedHeroBannerProps) {
  return (
    <Box
      data-testid={FEED_TEST_IDS.HERO_BANNER}
      component="header"
      sx={{
        bgcolor: FEED_PALETTE.canvasElevated,
        borderBottom: `1px solid ${FEED_PALETTE.borderSubtle}`,
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ width: FEED_CONTAINER_WIDTH, maxWidth: FEED_CONTENT_MAX_WIDTH, py: { xs: 0.5, sm: 2 } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 0, sm: 1 } }}>
          <Stack
            component="nav"
            aria-label="Localização"
            direction="row"
            alignItems="center"
            spacing={0.5}
          >
            <Button
              data-testid={FEED_TEST_IDS.HERO_HOME_BUTTON}
              type="button"
              onClick={onNavigateHome}
              sx={{
                minHeight: FEED_MIN_TOUCH_TARGET_PX,
                minWidth: FEED_MIN_TOUCH_TARGET_PX,
                p: 0,
                color: FEED_PALETTE.inkMuted,
                textTransform: 'none',
                justifyContent: 'flex-start',
              }}
            >
              Início
            </Button>
            <ChevronRightRoundedIcon sx={{ fontSize: 16, color: FEED_PALETTE.inkMuted }} />
            <Typography
              variant="body2"
              aria-current="page"
              sx={{ color: FEED_PALETTE.inkSecondary }}
            >
              Feed dos abrigos
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              data-testid={FEED_TEST_IDS.HERO_COUNT}
              variant="body2"
              sx={{ color: FEED_PALETTE.inkMuted, display: { xs: 'none', sm: 'block' } }}
            >
              {formatCountLabel(totalSections, 'publicação', 'publicações')}
            </Typography>
            <Tooltip title="Atualizar feed">
              <span>
                <IconButton
                  data-testid={FEED_TEST_IDS.HERO_REFRESH_BUTTON}
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label={isRefreshing ? 'Atualizando feed' : 'Atualizar feed'}
                  sx={{
                    width: FEED_MIN_TOUCH_TARGET_PX,
                    height: FEED_MIN_TOUCH_TARGET_PX,
                    color: FEED_PALETTE.inkSecondary,
                  }}
                >
                  {isRefreshing ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <RefreshRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: FEED_PALETTE.brandLeafDark,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                mb: { xs: 0.25, sm: 0.75 },
              }}
            >
              {FEED_PAGE_MESSAGES.HERO_EYEBROW}
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: FEED_PALETTE.inkPrimary,
                fontSize: { xs: '1.45rem', md: '2.25rem' },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                mb: { xs: 0.5, sm: 1 },
              }}
            >
              {title || FEED_PAGE_MESSAGES.DEFAULT_TITLE}
            </Typography>
            <Typography
              sx={{
                color: FEED_PALETTE.inkSecondary,
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: { xs: 2, sm: 'unset' },
                overflow: 'hidden',
              }}
            >
              {description || FEED_PAGE_MESSAGES.DEFAULT_SUBTITLE}
            </Typography>
          </Box>
          {(canManageFeed || canUploadPhotos) && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ flexShrink: 0 }}
            >
              {canManageFeed && (
                <Button
                  data-testid={FEED_TEST_IDS.HERO_MANAGE_BUTTON}
                  type="button"
                  onClick={onNavigateManage}
                  startIcon={<EditNoteRoundedIcon />}
                  sx={{
                    minHeight: FEED_MIN_TOUCH_TARGET_PX,
                    color: FEED_PALETTE.inkSecondary,
                    textTransform: 'none',
                  }}
                >
                  Gerenciar
                </Button>
              )}
              {canUploadPhotos && (
                <Button
                  data-testid={FEED_TEST_IDS.HERO_UPLOAD_BUTTON}
                  type="button"
                  variant="contained"
                  disableElevation
                  onClick={onNavigateUpload}
                  startIcon={<AddAPhotoRoundedIcon />}
                  sx={{
                    minHeight: FEED_MIN_TOUCH_TARGET_PX,
                    px: 2,
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: FEED_PALETTE.brandLeaf,
                    color: FEED_PALETTE.inkPrimary,
                    '&:hover': { bgcolor: FEED_PALETTE.brandSoft },
                  }}
                >
                  Enviar fotos do abrigo
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
