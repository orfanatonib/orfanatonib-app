import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { MediaType } from '@/store/slices/types';
import type { ShelterMediaPreviewProps } from '../types';
import { ShelterVideoPlayer } from './ShelterVideoPlayer';

/** Pré-visualização de uma mídia: arquivo local (object URL) ou já gravada (url). */
export function ShelterMediaPreview({ media }: ShelterMediaPreviewProps) {
  const [localUrl, setLocalUrl] = useState('');
  useEffect(() => {
    if (!media.file) {
      setLocalUrl('');
      return;
    }
    const url = URL.createObjectURL(media.file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [media.file]);
  const src = media.file ? localUrl : media.url;
  return (
    <Box data-testid="shelter-media-preview" sx={{ width: '100%' }}>
      {src &&
        (media.mediaType === MediaType.VIDEO ? (
          <ShelterVideoPlayer src={src} title={media.title || 'Vídeo do abrigo'} />
        ) : (
          <Box
            component="img"
            src={src}
            alt={media.title || 'Foto do abrigo'}
            sx={{
              width: '100%',
              aspectRatio: '4 / 3',
              objectFit: 'cover',
              display: 'block',
              borderRadius: 2,
            }}
          />
        ))}
    </Box>
  );
}
