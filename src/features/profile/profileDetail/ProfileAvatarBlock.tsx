import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { PROFILE_DETAIL_TEXTS } from './constants';

interface Props {
  name?: string;
  imageUrl?: string;
  gradient: string;
  color: string;
  onZoom: () => void;
}

const ProfileAvatarBlock: React.FC<Props> = ({ name, imageUrl, gradient, color, onZoom }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', mt: -4, position: 'relative', zIndex: 1 }}>
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <Box
        data-testid="profile-detail-avatar"
        sx={{ position: 'relative', width: 72, height: 72, cursor: imageUrl ? 'pointer' : 'default', '&:hover .overlay': { opacity: 1 } }}
        onClick={() => imageUrl && onZoom()}
      >
        <Avatar
          sx={{ width: 72, height: 72, fontSize: '1.8rem', fontWeight: 700, background: gradient, border: '3px solid white', boxShadow: `0 4px 20px ${color}50` }}
          src={imageUrl}
        >
          {name?.charAt(0).toUpperCase()}
        </Avatar>
        {imageUrl && (
          <Box
            className="overlay"
            sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', opacity: 0, transition: 'opacity 0.2s', border: '3px solid white' }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, textAlign: 'center', lineHeight: 1 }}>
              {PROFILE_DETAIL_TEXTS.viewPhoto}
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  </Box>
);

export default ProfileAvatarBlock;
