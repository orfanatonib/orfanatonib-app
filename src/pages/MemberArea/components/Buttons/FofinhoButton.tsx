import React from 'react';
import { Button, Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  MenuBook as MenuBookIcon,
  PhotoCamera as PhotoCameraIcon,
  StarRate as StarRateIcon,
  Favorite as FavoriteIcon,
  LibraryBooks as LibraryBooksIcon,
  Celebration as CelebrationIcon,
  Schedule as ScheduleIcon,
  PeopleAlt as PeopleAltIcon,
  HelpOutline as HelpOutlineIcon,
  EventAvailable as EventAvailableIcon,
  Badge as BadgeIcon,
  ChildCare as ShelteredCareIcon,
} from '@mui/icons-material';
import { useIsFeatureEnabled, FeatureFlagKeys } from '@/features/feature-flags';

type MUIButtonColor =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning'
  | 'inherit';

type IconType = React.ElementType;

interface FofinhoButtonProps {
  to: string;
  label: string;
  icon: IconType;
  color: MUIButtonColor;
}

type PaletteKey = Exclude<MUIButtonColor, 'inherit'>;
const toPaletteKey = (c: MUIButtonColor): PaletteKey => (c === 'inherit' ? 'primary' : c);

const FofinhoButton: React.FC<FofinhoButtonProps & { fullWidth?: boolean }> = ({
  to,
  label,
  icon: IconCmp,
  color,
  fullWidth = true,
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const paletteKey = toPaletteKey(color);

  return (
    <Button
      variant="contained"
      color={color}
      component={Link}
      to={to}
      startIcon={<IconCmp fontSize={isXs ? 'small' : 'medium'} />}
      fullWidth={fullWidth}
      aria-label={label}
      disableElevation
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.5, sm: 1.75 },
        minHeight: 52,
        borderRadius: 3,
        fontWeight: 700,
        fontSize: { xs: '0.9rem', md: '1rem' },
        textTransform: 'none',
        justifyContent: 'flex-start',
        gap: 1.5,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.08))',
        transition: reduceMotion
          ? 'box-shadow .3s ease'
          : 'transform .25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transition: 'left 0.5s ease',
        },
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          transform: reduceMotion ? 'none' : 'translateY(-3px)',
          '&::before': {
            left: '100%',
          },
        },
        '&:active': {
          transform: reduceMotion ? 'none' : 'translateY(-1px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
        },
        '&:focus-visible': {
          outline: `3px solid ${theme.palette[paletteKey].light}`,
          outlineOffset: 2,
        },
      }}
    >
      {label}
    </Button>
  );
};

const buttonMap: Record<string, FofinhoButtonProps> = {
  materials: {
    to: '/lista-materias-visita',
    label: 'Materiais de visita',
    icon: MenuBookIcon,
    color: 'primary',
  },
  photos: {
    to: '/imagens-abrigo',
    label: 'Envie fotos do seu Abrigo',
    icon: PhotoCameraIcon,
    color: 'success',
  },
  rate: {
    to: '/avaliar-site',
    label: 'Avalie nosso Site',
    icon: StarRateIcon,
    color: 'success',
  },
  love: {
    to: '/amor',
    label: 'Espalhe Amor',
    icon: FavoriteIcon,
    color: 'error',
  },
  teaching: {
    to: '/ensino',
    label: 'Plano de Aula',
    icon: LibraryBooksIcon,
    color: 'info',
  },
  fun: {
    to: '/diversao',
    label: 'Diversão Garantida',
    icon: CelebrationIcon,
    color: 'warning',
  },
  schedule: {
    to: '/horarios',
    label: 'Horários',
    icon: ScheduleIcon,
    color: 'secondary',
  },
  team: {
    to: '/equipe',
    label: 'Equipe',
    icon: PeopleAltIcon,
    color: 'primary',
  },
  help: {
    to: '/contato',
    label: 'Precisa de Ajuda?',
    icon: HelpOutlineIcon,
    color: 'error',
  },
  events: {
    to: '/eventos',
    label: 'Eventos do Mês',
    icon: EventAvailableIcon,
    color: 'info',
  },
  memberArea: {
    to: '/area-do-membro',
    label: 'Área do Membro',
    icon: BadgeIcon,
    color: 'primary',
  },
  shelteredrenArea: {
    to: '/area-dos-acolhidos',
    label: 'Área dos Acolhidos',
    icon: ShelteredCareIcon,
    color: 'primary',
  },
};

interface ButtonSectionProps {
  references: string[];
}

const ButtonSection: React.FC<ButtonSectionProps> = ({ references }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const isShelterManagementEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_MANAGEMENT);
  const isPagelasEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_PAGELAS);

  const buttonsToRender = references
    .map((ref) => buttonMap[ref])
    .filter((btn): btn is FofinhoButtonProps => {
      if (!btn) return false;
      if (btn.to === '/area-dos-acolhidos' && !isPagelasEnabled) return false;
      return true;
    });

  if (buttonsToRender.length === 0) return null;
  if (buttonsToRender.length === 1) {
    const btn = buttonsToRender[0];
    return (
      <Box display="flex" justifyContent="center" mt={2} mb={4} px={2}>
        <Box maxWidth={420} width="100%">
          <FofinhoButton {...btn} fullWidth />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, mt: 2, mb: 4 }}>
      <Grid container spacing={2} alignItems="stretch">
        {buttonsToRender.map((button, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%', display: 'flex' }}>
              <FofinhoButton {...button} fullWidth />
            </Box>
          </Grid>
        ))}
      </Grid>
      {isXs && <Box sx={{ height: 8 }} />}
    </Box>
  );
};

export default ButtonSection;
