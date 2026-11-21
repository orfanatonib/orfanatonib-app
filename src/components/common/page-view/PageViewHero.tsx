import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PAGE_VIEW_COPY, PAGE_VIEW_MIN_TOUCH_TARGET } from './constants';
import type { PageViewHeroProps } from './types';
import { buildHeroGradient, getPageViewAccent } from './utils';

/** Herói padrão das páginas públicas (galeria, vídeos, ideias). */
export default function PageViewHero({
  type,
  title,
  subtitle,
  description,
  icon: Icon,
  chips,
  onBack,
  backLabel = PAGE_VIEW_COPY.BACK,
  actions,
  testIds,
}: PageViewHeroProps) {
  const accent = getPageViewAccent(type);
  return (
    <Paper
      data-testid={testIds?.root}
      elevation={3}
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: { xs: 3, md: 4 },
        background: buildHeroGradient(accent),
        color: 'common.white',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 180,
          height: 180,
          bgcolor: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
          <Button
            data-testid={testIds?.back}
            aria-label={backLabel}
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{
              minHeight: PAGE_VIEW_MIN_TOUCH_TARGET,
              minWidth: PAGE_VIEW_MIN_TOUCH_TARGET,
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.2)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            {backLabel}
          </Button>
          {actions && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {actions}
            </Stack>
          )}
        </Stack>

        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          {Icon && <Icon aria-hidden sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, mt: 0.5, flexShrink: 0 }} />}
          <Typography
            data-testid={testIds?.title}
            component="h1"
            fontWeight={800}
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.6rem' },
              lineHeight: 1.15,
              minWidth: 0,
              overflowWrap: 'anywhere',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {title}
          </Typography>
        </Stack>

        {subtitle && (
          <Typography
            data-testid={testIds?.subtitle}
            component="h2"
            fontWeight={600}
            sx={{ mt: 1, fontSize: { xs: '1.05rem', md: '1.4rem' }, opacity: 0.95, overflowWrap: 'anywhere' }}
          >
            {subtitle}
          </Typography>
        )}
        {description && (
          <Typography
            data-testid={testIds?.description}
            sx={{ mt: 1.5, fontSize: { xs: '0.95rem', md: '1.1rem' }, lineHeight: 1.6, opacity: 0.92, maxWidth: 800, overflowWrap: 'anywhere' }}
          >
            {description}
          </Typography>
        )}
        {chips && chips.length > 0 && (
          <Stack data-testid={testIds?.chips} direction="row" gap={1} mt={2.5} flexWrap="wrap" useFlexGap>
            {chips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'common.white', fontWeight: 700 }}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
