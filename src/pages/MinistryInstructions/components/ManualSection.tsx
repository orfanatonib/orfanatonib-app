import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { MEMBER_CARD_SX } from '@/pages/MemberArea/constants/navigation';
import { MANUAL_SECTION_SCROLL_MARGIN_TOP } from '../constants';
import { ManualSectionVariant, type ManualSectionProps } from '../types';

/** Cartão padrão de uma seção do manual (mesma forma para as variantes em gradiente e clara). */
const ManualSection: React.FC<ManualSectionProps> = ({ id, title, subtitle, variant, gradient, children }) => {
  const isGradient = variant === ManualSectionVariant.Gradient;
  return (
    <Paper
      id={id}
      data-testid={`manual-section-${id}`}
      elevation={0}
      sx={{
        ...MEMBER_CARD_SX,
        p: 0,
        overflow: 'hidden',
        scrollMarginTop: MANUAL_SECTION_SCROLL_MARGIN_TOP,
        ...(isGradient && gradient ? { background: gradient, borderColor: 'transparent' } : {}),
      }}
    >
      <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: { xs: 1.5, md: 2 } }}>
        <Typography
          data-testid={`manual-section-${id}-title`}
          component="h3"
          variant="h5"
          fontWeight={800}
          sx={{ color: isGradient ? '#ffffff' : '#0f2942', fontSize: { xs: '1.2rem', md: '1.5rem' } }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: isGradient ? 'rgba(255,255,255,0.9)' : 'text.secondary' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>{children}</Box>
    </Paper>
  );
};

export default ManualSection;
