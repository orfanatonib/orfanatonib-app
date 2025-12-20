import { Box, Card, Grid, IconButton, Typography, Paper, Button } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { MediaItem, MediaUploadType } from 'store/slices/types';
import { motion } from 'framer-motion';

interface VideoListProps {
  videos: MediaItem[];
  handleRemoveVideo: (index: number) => void;
  handleEditVideo: (index: number) => void;
}

export default function VideoList({ videos, handleRemoveVideo, handleEditVideo }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Nenhum vídeo adicionado ainda. Adicione vídeos usando o formulário acima.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 4,
        borderRadius: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        🎥 Vídeos Adicionados ({videos.length})
      </Typography>
      <Grid container spacing={3}>
        {videos.map((video, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              sx={{
                p: 2.5,
                boxShadow: 2,
                borderRadius: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 1 }}>
                {video.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                {video.description}
              </Typography>

              {video.uploadType === MediaUploadType.LINK ? (
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    iframe: { width: '100%', height: '100%', border: 0 },
                  }}
                >
                  <iframe src={video.url} title={`Vídeo ${index + 1}`} allowFullScreen />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <video
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  >
                    <source src={video.url} />
                    Seu navegador não suporta vídeo.
                  </video>
                </Box>
              )}

              <Box display="flex" justifyContent="flex-end" gap={1} mt="auto">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleEditVideo(index)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => handleRemoveVideo(index)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  Excluir
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
