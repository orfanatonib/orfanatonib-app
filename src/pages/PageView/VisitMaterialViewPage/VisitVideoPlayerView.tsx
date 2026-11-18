import { Box, Alert } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DownloadButton from './DownloadButton';
import { VISIT_MATERIAL_MEDIA_CONFIG } from '@/features/visit-materials/constants';
import { VisitMaterialMediaSection } from '@/features/visit-materials/types';
import VisitMediaCard from './VisitMediaCard';
import { formatMediaSizeMb } from './utils';
import { MediaItem, MediaUploadType, MediaPlatform } from 'store/slices/types';

interface Props {
  video: MediaItem;
}

export default function VisitVideoPlayer({ video }: Props) {

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (url.includes('youtube.com')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=0&mute=0` : null;
    }
    if (url.includes('youtu.be')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=0&mute=0` : null;
    }
    return null;
  };

  const getGoogleDriveEmbedUrl = (url: string): string | null => {
    const match = url.match(/\/d\/(.*?)\//);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
  };

  const getDropboxRawUrl = (url: string): string => {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com') + '?raw=1';
  };

  const shouldRenderVideo = (): boolean => {
    if (video.isLocalFile || video.uploadType === MediaUploadType.UPLOAD) return true;
    if (
      video.uploadType === MediaUploadType.LINK &&
      (video.platformType === MediaPlatform.YOUTUBE ||
        video.platformType === MediaPlatform.GOOGLE_DRIVE)
    )
      return true;
    return false;
  };

  const shouldAllowDownload = (): boolean => {
    return (
      video.isLocalFile ||
      video.uploadType === MediaUploadType.UPLOAD ||
      video.platformType === MediaPlatform.GOOGLE_DRIVE ||
      video.platformType === MediaPlatform.DROPBOX ||
      video.platformType === MediaPlatform.ONEDRIVE
    );
  };

  const renderVideo = () => {
    if (!video.url) {
      return (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Vídeo não disponível.
        </Alert>
      );
    }

    if (!shouldRenderVideo()) {
      return (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Este vídeo não pode ser renderizado na página.
        </Alert>
      );
    }

    if (video.isLocalFile || video.uploadType === MediaUploadType.UPLOAD) {
      return (
        <Box
          component="video"
          controls
          sx={{
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <source src={video.url} />
          Seu navegador não suporta vídeo embutido.
        </Box>
      );
    }

    if (video.uploadType === MediaUploadType.LINK) {
      switch (video.platformType) {
        case MediaPlatform.YOUTUBE: {
          const embedUrl = getYouTubeEmbedUrl(video.url);
          return embedUrl ? (
            <Box
              component="iframe"
              src={embedUrl}
              title={video.title}
              allowFullScreen
              sx={{
                width: '100%',
                aspectRatio: '16/9',
                border: 'none',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              URL do YouTube inválida.
            </Alert>
          );
        }

        case MediaPlatform.GOOGLE_DRIVE: {
          const embedUrl = getGoogleDriveEmbedUrl(video.url);
          return embedUrl ? (
            <Box
              component="iframe"
              src={embedUrl}
              title={video.title}
              allowFullScreen
              sx={{
                width: '100%',
                aspectRatio: '16/9',
                border: 'none',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              URL do Google Drive inválida.
            </Alert>
          );
        }

        default:
          return (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              Plataforma de vídeo não suportada para visualização.
            </Alert>
          );
      }
    }

    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        Tipo de vídeo não suportado.
      </Alert>
    );
  };

  const fileSize = formatMediaSizeMb(video.size);

  return (
    <VisitMediaCard
      testId="visit-media-video"
      icon={PlayCircleOutlineIcon}
      accentColor={VISIT_MATERIAL_MEDIA_CONFIG[VisitMaterialMediaSection.VIDEOS].color}
      title={video.title}
      fileSize={fileSize}
      description={video.description}
      actions={
        shouldAllowDownload() ? (
          <DownloadButton
            url={video.platformType === MediaPlatform.DROPBOX ? getDropboxRawUrl(video.url) : video.url}
            filename={video.originalName || video.title || 'video'}
            size="medium"
            fullWidth
          />
        ) : undefined
      }
    >
      {renderVideo()}
    </VisitMediaCard>
  );
}
