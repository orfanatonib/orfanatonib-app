import React, { useMemo } from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import { Close as CloseIcon, Celebration as CelebrationIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PROFILE_DETAIL_TEXTS } from './constants';
import { buildConfetti } from './utils';

interface Props {
  gradient: string;
  isBirthdayToday: boolean;
  onClose: () => void;
}

const ProfileHeaderBanner: React.FC<Props> = ({ gradient, isBirthdayToday, onClose }) => {
  const confetti = useMemo(() => (isBirthdayToday ? buildConfetti() : []), [isBirthdayToday]);

  return (
    <Box sx={{ background: gradient, pt: 2, pb: 5, px: 2, position: 'relative', textAlign: 'center' }} data-testid="profile-detail-banner">
      <IconButton
        onClick={onClose}
        size="small"
        aria-label={PROFILE_DETAIL_TEXTS.close}
        data-testid="profile-detail-close"
        sx={{ position: 'absolute', top: 4, right: 4, color: 'white', bgcolor: 'rgba(255,255,255,0.2)', zIndex: 10, width: 44, height: 44, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {isBirthdayToday && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ position: 'absolute', top: 8, left: 8 }}
        >
          <Chip
            icon={<CelebrationIcon sx={{ color: 'white !important', fontSize: 16 }} />}
            label={PROFILE_DETAIL_TEXTS.birthdayToday}
            size="small"
            data-testid="profile-detail-birthday"
            sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: '0.7rem', height: 24 }}
          />
        </motion.div>
      )}

      {isBirthdayToday && (
        <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {confetti.map((piece) => (
            <motion.div
              key={`${piece.left}-${piece.delay}`}
              initial={{ y: -10, x: piece.left, opacity: 1 }}
              animate={{ y: '100%', rotate: piece.rotate, opacity: [1, 1, 0] }}
              transition={{ duration: piece.duration, repeat: Infinity, delay: piece.delay }}
              style={{ position: 'absolute', width: 6, height: 6, borderRadius: piece.round ? '50%' : 0, backgroundColor: piece.color }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProfileHeaderBanner;
