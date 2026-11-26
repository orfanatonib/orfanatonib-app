import { useEffect, useState } from 'react';
import { Alert, Box, Link } from '@mui/material';
import { getYouTubeId } from '@/utils/video';
import { FEED_TEST_IDS } from '../constants';
import type { FeedVideoPlayerProps } from '../componentTypes';

/** Player do feed: iframe para YouTube, `<video>` nativo para arquivos; com falha tratada. */
export function FeedVideoPlayer({ src, title }: FeedVideoPlayerProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const youTubeId = getYouTubeId(src);

  return (
    <Box data-testid={FEED_TEST_IDS.VIDEO_PLAYER} sx={{ width: '100%', minWidth: 0 }}>
      {failed ? (
        <Alert data-testid={FEED_TEST_IDS.VIDEO_ERROR} severity="warning">
          Não foi possível reproduzir este vídeo.{' '}
          <Link href={src} target="_blank" rel="noopener noreferrer">
            Abrir arquivo
          </Link>
        </Alert>
      ) : youTubeId ? (
        <Box
          component="iframe"
          title={title}
          src={`https://www.youtube.com/embed/${youTubeId}`}
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          sx={{ display: 'block', width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 2 }}
        />
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
