import React from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { PROFILE_DETAIL_TEXTS } from './constants';

interface Props {
  open: boolean;
  imageUrl?: string;
  onClose: () => void;
}

const ProfileImageZoom: React.FC<Props> = ({ open, imageUrl, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    onClick={onClose}
    data-testid="profile-image-zoom"
    PaperProps={{
      elevation: 0,
      sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden', m: 0, p: 0, maxWidth: '100vw', maxHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    }}
    slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(4px)' } } }}
  >
    <IconButton
      onClick={onClose}
      aria-label={PROFILE_DETAIL_TEXTS.close}
      sx={{ position: 'fixed', top: 16, right: 16, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1301, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
    >
      <CloseIcon />
    </IconButton>
    {imageUrl && (
      <Box
        component="img"
        src={imageUrl}
        alt={PROFILE_DETAIL_TEXTS.zoomAlt}
        sx={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      />
    )}
  </Dialog>
);

export default ProfileImageZoom;
