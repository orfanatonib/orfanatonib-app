import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';
import { useIsFeatureEnabled, FeatureFlagKeys } from '@/features/feature-flags';
import { memberActionMap, type MemberActionConfig, type MUIButtonColor } from './memberActions';

type PaletteKey = Exclude<MUIButtonColor, 'inherit'>;
const toPaletteKey = (c: MUIButtonColor): PaletteKey => (c === 'inherit' ? 'primary' : c);

interface MemberQuickActionsProps {
  references: string[];
}

const ActionCard: React.FC<{
  action: MemberActionConfig;
  compact?: boolean;
  compactFullWidth?: boolean;
}> = ({ action, compact, compactFullWidth }) => {
  const theme = useTheme();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const paletteKey = toPaletteKey(action.color);
  const Icon = action.icon;
  const mainColor = theme.palette[paletteKey]?.main ?? theme.palette.primary.main;

  const baseLink = {
    display: 'flex',
    textDecoration: 'none',
    color: 'text.primary',
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: reduceMotion
      ? 'box-shadow .2s ease'
      : 'transform .2s ease, box-shadow .25s ease, border-color .2s ease',
    '&:hover': {
      borderColor: mainColor,
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      transform: reduceMotion ? 'none' : 'translateY(-2px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${mainColor}`,
      outlineOffset: 2,
    },
  };

  if (compact) {
    return (
      <Box
        component={Link}
        to={action.to}
        aria-label={action.label}
        sx={{
          ...baseLink,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.25,
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          ...(compactFullWidth
            ? { width: '100%', minWidth: 0 }
            : { minWidth: 'max-content', flexShrink: 0 }),
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${mainColor}18`,
            color: mainColor,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.3,
            ...(compactFullWidth ? {} : { whiteSpace: 'nowrap' }),
          }}
        >
          {action.label}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component={Link}
      to={action.to}
      aria-label={action.label}
      sx={{
        ...baseLink,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        px: 2,
        py: 2.5,
        minHeight: 96,
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${mainColor}18`,
          color: mainColor,
        }}
      >
        <Icon sx={{ fontSize: 28 }} />
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.3,
          fontSize: '0.875rem',
        }}
      >
        {action.label}
      </Typography>
    </Box>
  );
};

const MemberQuickActions: React.FC<MemberQuickActionsProps> = ({ references }) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));

  const isPagelasEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_PAGELAS);

  const actions = references
    .map((ref) => ({ key: ref, ...memberActionMap[ref] }))
    .filter((item): item is { key: string } & MemberActionConfig => {
      if (!memberActionMap[item.key]) return false;
      if (item.to === '/area-dos-acolhidos' && !isPagelasEnabled) return false;
      return true;
    });

  if (actions.length === 0) return null;

  const isMobile = !isSm;

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, mt: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 4 } }}>
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          color: 'text.secondary',
          fontWeight: 600,
          letterSpacing: 1.2,
          mb: { xs: 1, sm: 2 },
          fontSize: { xs: '0.65rem', sm: '0.7rem' },
        }}
      >
        O que você precisa?
      </Typography>

      {isMobile ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {actions.map(({ key, ...action }) => (
            <ActionCard key={key} action={action} compact compactFullWidth />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isMd
              ? 'repeat(4, 1fr)'
              : 'repeat(3, 1fr)',
            gap: 1.5,
            gridAutoRows: 'minmax(96px, auto)',
          }}
        >
          {actions.map(({ key, ...action }) => (
            <ActionCard key={key} action={action} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MemberQuickActions;
