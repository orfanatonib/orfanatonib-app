import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
  Box,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect } from 'react';
import { MediaItem } from 'store/slices/types';
import { getMediaPreviewUrl } from './getMediaPreviewUrl';

interface Props {
  open: boolean;
  onClose: () => void;
  media: MediaItem | null;
  title?: string;
}

export default function MediaDocumentPreviewModal({ open, onClose, media, title }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (open && media && isMobile) {
      const url = getMediaPreviewUrl(media);
      window.open(url, '_blank');
      onClose();
    }
  }, [open, media, isMobile, onClose]);

  if (!media || (isMobile && open)) return null;

  const previewUrl = getMediaPreviewUrl(media);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '90vw',
          height: '85vh',
          maxWidth: '90vw',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#000000',
          color: '#FFFF00',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          pr: 2,
        }}
      >
        {title || media.title}
        <IconButton onClick={onClose} size="small" sx={{ color: '#FFFF00' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, flexGrow: 1 }}>
        <iframe
          src={previewUrl}
          title={media.title}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </DialogContent>

      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          bgcolor: '#000000',
          color: '#FFFF00',
          borderTop: '1px solid #333',
        }}
      >
        <Button variant="outlined" onClick={onClose} sx={{ color: '#FFFF00', borderColor: '#FFFF00' }}>
          Fechar
        </Button>
      </Box>
    </Dialog>
  );
}
