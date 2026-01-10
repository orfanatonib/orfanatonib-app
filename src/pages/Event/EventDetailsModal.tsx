import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

const fallbackImageUrl = import.meta.env.VITE_SHELTER_FALLBACK_IMAGE_URL;
console.log('Fallback Image URL:', fallbackImageUrl);

interface EventDetailsModalProps {
  open: boolean;
  onClose: () => void;
  event: {
    title: string;
    date: string;
    location: string;
    description: string;
    media?: { url: string };
  };
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ open, onClose, event }) => {
  const dataFormatada = dayjs(event.date).format('DD [de] MMMM');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': { borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          color: 'primary.main',
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        {event.title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <Box
            sx={{
              height: 180,
              backgroundImage: `url('${event.media?.url || fallbackImageUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mb: 2,
              borderRadius: '8px',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Roboto, sans-serif' }}>
            <strong>Data:</strong> {dataFormatada}
          </Typography>
          <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Roboto, sans-serif' }}>
            <strong>Local:</strong> {event.location}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontFamily: 'Roboto, sans-serif' }}>
            <strong>Descrição:</strong> {event.description}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} color="primary" variant="text" sx={{ fontFamily: 'Roboto, sans-serif' }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsModal;