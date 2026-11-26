import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Dialog,
  DialogContent,
  IconButton,
  Zoom,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import DownloadButton from './DownloadButton';
import { VISIT_MATERIAL_MEDIA_CONFIG } from '@/features/visit-materials/constants';
import { VisitMaterialMediaSection } from '@/features/visit-materials/types';
import VisitMediaCard from './VisitMediaCard';
import { formatMediaSizeMb } from './utils';
import { VISIT_MEDIA_PREVIEW_HEIGHT } from './constants';
import { MediaItem, MediaUploadType, MediaPlatform } from 'store/slices/types';

interface Props {
  image: MediaItem;
}

const getGoogleDriveThumbnailUrl = (url: string): string | null => {
  const match = url.match(/\/d\/(.*?)\//);
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}` : null;
};

export default function VisitImageGallery({ image }: Props) {
  const [open, setOpen] = useState(false);

  const canVisualize =
    image.isLocalFile ||
    image.uploadType === MediaUploadType.UPLOAD ||
    image.platformType === MediaPlatform.GOOGLE_DRIVE;

  const getImageUrl = (): string | null => {
    if (image.isLocalFile || image.uploadType === MediaUploadType.UPLOAD) {
      return image.url;
    }
    if (image.platformType === MediaPlatform.GOOGLE_DRIVE) {
      return getGoogleDriveThumbnailUrl(image.url);
    }
    return null;
  };

  const finalUrl = getImageUrl();
  const fileSize = formatMediaSizeMb(image.size);

  const handleImageClick = () => {
    if (canVisualize && finalUrl) {
      setOpen(true);
    }
  };

  return (
    <>
      <VisitMediaCard
        testId="visit-media-image"
        icon={ImageIcon}
        accentColor={VISIT_MATERIAL_MEDIA_CONFIG[VisitMaterialMediaSection.IMAGES].color}
        title={image.title}
        fileSize={fileSize}
        description={image.description}
        actions={
          <DownloadButton
            url={image.url}
            filename={image.originalName || image.title || 'imagem'}
            size="medium"
            fullWidth
          />
        }
      >
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            cursor: canVisualize && finalUrl ? 'pointer' : 'default',
            '&:hover .zoom-overlay': { opacity: canVisualize && finalUrl ? 1 : 0 },
          }}
          onClick={handleImageClick}
        >
          {canVisualize && finalUrl ? (
            <>
              <Box
                component="img"
                src={finalUrl}
                alt={image.title || 'Imagem'}
                sx={{ width: '100%', height: VISIT_MEDIA_PREVIEW_HEIGHT, objectFit: 'cover', display: 'block' }}
              />
              <Box
                className="zoom-overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <ZoomInIcon sx={{ color: 'white', fontSize: '2rem' }} />
              </Box>
            </>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: VISIT_MEDIA_PREVIEW_HEIGHT,
                bgcolor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                border: '1px dashed #cbd5e1',
              }}
            >
              <Typography color="text.secondary" textAlign="center">
                Visualização não disponível
              </Typography>
            </Box>
          )}
        </Box>
      </VisitMediaCard>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
          }}
        >
          <IconButton
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {finalUrl && (
            <Zoom in={open} timeout={300}>
              <Box
                component="img"
                src={finalUrl}
                alt={image.title || 'Imagem'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: 2,
                }}
              />
            </Zoom>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}