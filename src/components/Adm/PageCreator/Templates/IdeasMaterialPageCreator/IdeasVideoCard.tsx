import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { MediaItem, MediaPlatform, MediaUploadType } from 'store/slices/types';
import { toYoutubeEmbedUrl } from './utils';

interface Props {
  video: MediaItem;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function IdeasVideoCard({ video, index, onEdit, onRemove }: Props) {
  const isYoutube = video.uploadType === MediaUploadType.LINK && video.platformType === MediaPlatform.YOUTUBE;
  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Box data-testid="idea-video-card" sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
        <Typography fontWeight="bold">{video.title}</Typography>
        <Typography variant="body2">{video.description}</Typography>
        {isYoutube ? (
          <Box sx={{ aspectRatio: '16/9', mt: 1 }}>
            <iframe
              src={toYoutubeEmbedUrl(video.url)}
              title={video.title}
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          </Box>
        ) : (
          <video controls style={{ width: '100%', marginTop: 8 }}>
            <source src={video.url} />
          </video>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Tooltip title="Editar">
            <IconButton data-testid="idea-video-edit" onClick={() => onEdit(index)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remover">
            <IconButton data-testid="idea-video-remove" color="error" onClick={() => onRemove(index)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Grid>
  );
}
