import React from 'react';
import { Dialog, IconButton, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ImagePreviewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
  alt?: string;
}

const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  imageUrl,
  onClose,
  alt = 'Preview',
}) => {
  return (
    <Dialog
      open={!!imageUrl}
      onClose={onClose}
      maxWidth={false}
      onClick={onClose}
      PaperProps={{
        elevation: 0,
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          overflow: 'hidden',
          m: 0,
          p: 0,
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          color: 'white',
          bgcolor: 'rgba(0,0,0,0.5)',
          zIndex: 1301,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
        }}
      >
        <CloseIcon />
      </IconButton>
      {imageUrl && (
        <Box
          component="img"
          src={imageUrl}
          alt={alt}
          sx={{
            maxWidth: '95vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        />
      )}
    </Dialog>
  );
};

export default ImagePreviewDialog;
