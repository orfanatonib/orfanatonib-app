import { Box, Alert } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import DownloadButton from './DownloadButton';
import { VISIT_MATERIAL_MEDIA_CONFIG } from '@/features/visit-materials/constants';
import { VisitMaterialMediaSection } from '@/features/visit-materials/types';
import VisitMediaCard from './VisitMediaCard';
import { formatMediaSizeMb } from './utils';
import { MediaItem, MediaPlatform, MediaUploadType } from 'store/slices/types';

interface Props {
  audio: MediaItem;
}

export default function VisitAudioPlayerView({ audio }: Props) {

  const getDropboxRawUrl = (url: string): string =>
    url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/\?dl=\d.*$/, '?raw=1');

  const getGoogleDrivePreviewUrl = (url: string): string | null => {
    const match = url.match(/\/d\/(.*?)\//);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return null;
  };

  const getFinalAudioUrl = (): string | null => {
    if (!audio.url) return null;
    if (audio.isLocalFile || audio.uploadType === MediaUploadType.UPLOAD) return audio.url;

    switch (audio.platformType) {
      case MediaPlatform.DROPBOX:
        return getDropboxRawUrl(audio.url);
      case MediaPlatform.GOOGLE_DRIVE:
        return null;
      default:
        return null;
    }
  };

  const finalUrl = getFinalAudioUrl();
  const googleDrivePreview =
    audio.platformType === MediaPlatform.GOOGLE_DRIVE ? getGoogleDrivePreviewUrl(audio.url) : null;

  const renderAudioPlayer = () => {
    if (googleDrivePreview) {
      return (
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            pt: { xs: '25%', md: '15%' },
            borderRadius: 3,
            bgcolor: 'grey.50',
            border: '2px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box
            component="iframe"
            src={googleDrivePreview}
            allow="autoplay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={audio.title}
          />
        </Box>
      );
    }

    if (!finalUrl) {
      return (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Áudio não disponível para reprodução.
        </Alert>
      );
    }

    return (
      <Box
        component="audio"
        controls
        sx={{
          width: '100%',
          borderRadius: 3,
          '&::-webkit-media-controls-panel': {
            bgcolor: 'primary.main',
          },
        }}
      >
        <source src={finalUrl} />
        Seu navegador não suporta o elemento de áudio.
      </Box>
    );
  };

  const fileSize = formatMediaSizeMb(audio.size);

  return (
    <VisitMediaCard
      testId="visit-media-audio"
      icon={MusicNoteIcon}
      accentColor={VISIT_MATERIAL_MEDIA_CONFIG[VisitMaterialMediaSection.AUDIOS].color}
      title={audio.title}
      fileSize={fileSize}
      description={audio.description}
      actions={
        <DownloadButton
          url={audio.url}
          filename={audio.originalName || audio.title || 'audio'}
          size="medium"
          fullWidth
        />
      }
    >
      {renderAudioPlayer()}
    </VisitMediaCard>
  );
}
