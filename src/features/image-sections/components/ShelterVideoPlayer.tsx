import { useEffect, useState } from 'react';
import { Alert, Box, Link } from '@mui/material';
import { SHELTER_UPLOAD_MESSAGES } from '../constants';
import type { ShelterVideoPlayerProps } from '../types';

/**
 * Player de vídeo reutilizável (envio, revisão do admin e o card do feed):
 * controles nativos (teclado e toque), `playsInline` para não abrir tela cheia
 * no celular e plano B com link quando o navegador não reproduz o formato.
 */
export function ShelterVideoPlayer({ src, title }: ShelterVideoPlayerProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <Box data-testid="shelter-video-player" sx={{ width: '100%', minWidth: 0 }}>
      {failed ? (
        <Alert data-testid="shelter-video-error" severity="warning">
          {SHELTER_UPLOAD_MESSAGES.VIDEO_UNPLAYABLE}{' '}
          <Link
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }}
          >
            Abrir arquivo
          </Link>
        </Alert>
      ) : (
        <Box
          component="video"
          key={src}
          src={src}
          controls
          playsInline
          preload="metadata"
          aria-label={title}
          onError={() => setFailed(true)}
          data-testid="shelter-video"
          sx={{
            display: 'block',
            width: '100%',
            maxHeight: '65dvh',
            aspectRatio: '16 / 9',
            objectFit: 'contain',
            bgcolor: 'common.black',
            borderRadius: 2,
          }}
        />
      )}
    </Box>
  );
}
