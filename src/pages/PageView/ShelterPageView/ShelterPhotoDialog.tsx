import React from 'react';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';

export type ShelterPhoto = { name: string; url: string };

type Props = { photo: ShelterPhoto | null; onClose: () => void };

/** Foto de perfil ampliada, aberta ao clicar no avatar de um líder ou membro. */
const ShelterPhotoDialog: React.FC<Props> = ({ photo, onClose }) => (
  <Dialog
    open={Boolean(photo)}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    aria-label={photo ? `Foto de ${photo.name}` : undefined}
    PaperProps={{ 'data-testid': 'shelter-photo-dialog', sx: { borderRadius: 3, overflow: 'hidden', bgcolor: '#111' } } as object}
  >
    {photo && (
      <Box sx={{ position: 'relative' }}>
        <IconButton
          aria-label="Fechar foto"
          data-testid="shelter-photo-close"
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, width: 44, height: 44, bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' } }}
        >
          <Close />
        </IconButton>
        <Box
          component="img"
          src={photo.url}
          alt={photo.name}
          sx={{ display: 'block', width: '100%', maxHeight: '75vh', objectFit: 'contain', bgcolor: '#111' }}
        />
        <Typography sx={{ p: 1.5, textAlign: 'center', color: '#fff', fontWeight: 800 }}>{photo.name}</Typography>
      </Box>
    )}
  </Dialog>
);

export default ShelterPhotoDialog;
