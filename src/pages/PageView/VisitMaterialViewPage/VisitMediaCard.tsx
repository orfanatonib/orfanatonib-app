import React from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { MEMBER_CARD_SX } from '@/pages/MemberArea/constants/navigation';
import type { VisitMediaCardProps } from './types';

/** Cartão padrão de uma mídia do material (vídeo, documento, imagem ou áudio). */
const VisitMediaCard: React.FC<VisitMediaCardProps> = ({
  testId,
  icon: Icon,
  accentColor,
  title,
  fileSize,
  description,
  children,
  actions,
}) => (
  <Paper
    data-testid={testId}
    elevation={0}
    sx={{ ...MEMBER_CARD_SX, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: `${accentColor}1a`,
          color: accentColor,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component="h4"
          variant="subtitle1"
          fontWeight={700}
          color="#0f2942"
          sx={{ lineHeight: 1.3, wordBreak: 'break-word' }}
        >
          {title}
        </Typography>
        {fileSize && <Chip label={fileSize} size="small" variant="outlined" sx={{ mt: 0.5 }} />}
      </Box>
    </Box>

    {children}

    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flex: 1 }}>
        {description}
      </Typography>
    )}

    {actions && <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>{actions}</Box>}
  </Paper>
);

export default VisitMediaCard;
