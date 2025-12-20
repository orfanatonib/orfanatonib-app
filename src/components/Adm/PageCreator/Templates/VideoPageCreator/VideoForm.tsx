import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Box,
} from '@mui/material';
import { Dispatch, Fragment, SetStateAction, useState } from 'react';
import { MediaItem, MediaPlatform, MediaUploadType } from 'store/slices/types';

interface VideoFormProps {
  newVideo: MediaItem;
  errors: {
    pageTitle: boolean;
    pageDescription: boolean;
    newVideoTitle: boolean;
    newVideoDescription: boolean;
    newVideoSrc: boolean;
    newVideoURL: boolean;
  };
  setNewVideo: Dispatch<SetStateAction<MediaItem>>;
  handleUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddVideo: () => void;
  isEditing: boolean;
  uploadProgress: Record<string, boolean>;
}

export default function VideoForm({
  newVideo,
  errors,
  setNewVideo,
  handleUploadFile,
  handleAddVideo,
  isEditing,
  uploadProgress,
}: VideoFormProps) {
  const [touched, setTouched] = useState({
    title: false,
    description: false,
    url: false,
  });

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
      <Typography variant="h6" mb={3} fontWeight="bold">
        {isEditing ? '✏️ Editar Vídeo' : '➕ Adicionar Novo Vídeo'}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Título do Vídeo"
            fullWidth
            required
            value={newVideo.title}
            onChange={(e) => {
              setNewVideo((prev) => ({ ...prev, title: e.target.value }));
              if (touched.title) setTouched((prev) => ({ ...prev, title: false }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            error={touched.title && errors.newVideoTitle}
            helperText={touched.title && errors.newVideoTitle ? 'Campo obrigatório' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover:not(.Mui-error)': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  },
                },
              },
              '& .MuiFormHelperText-root': {
                marginLeft: 0,
                marginTop: 1,
                fontSize: '0.75rem',
              },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Descrição do Vídeo"
            fullWidth
            required
            value={newVideo.description}
            onChange={(e) => {
              setNewVideo((prev) => ({ ...prev, description: e.target.value }));
              if (touched.description) setTouched((prev) => ({ ...prev, description: false }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
            error={touched.description && errors.newVideoDescription}
            helperText={touched.description && errors.newVideoDescription ? 'Campo obrigatório' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover:not(.Mui-error)': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  },
                },
              },
              '& .MuiFormHelperText-root': {
                marginLeft: 0,
                marginTop: 1,
                fontSize: '0.75rem',
              },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={newVideo.uploadType}
              label="Tipo"
              onChange={(e) =>
                setNewVideo((prev) => ({
                  ...prev,
                  uploadType: e.target.value as MediaUploadType,
                  platformType:
                    e.target.value === MediaUploadType.LINK ? MediaPlatform.YOUTUBE : undefined,
                  url: '',
                  file: undefined,
                  isLocalFile: e.target.value === MediaUploadType.UPLOAD,
                }))
              }
              sx={{
                borderRadius: 2,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value={MediaUploadType.LINK}>Link</MenuItem>
              <MenuItem value={MediaUploadType.UPLOAD}>Upload</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {newVideo.uploadType === MediaUploadType.LINK && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Plataforma</InputLabel>
              <Select
                value={newVideo.platformType || ''}
                label="Plataforma"
                onChange={(e) =>
                  setNewVideo((prev) => ({
                    ...prev,
                    platformType: e.target.value as MediaPlatform,
                  }))
                }
                sx={{
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  },
                }}
              >
                <MenuItem value={MediaPlatform.YOUTUBE}>YouTube</MenuItem>
                <MenuItem value={MediaPlatform.GOOGLE_DRIVE}>Google Drive</MenuItem>
                <MenuItem value={MediaPlatform.ONEDRIVE}>OneDrive</MenuItem>
                <MenuItem value={MediaPlatform.DROPBOX}>Dropbox</MenuItem>
                <MenuItem value={MediaPlatform.ANY}>Outro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {newVideo.uploadType === MediaUploadType.LINK && (
          <Grid item xs={12}>
            <TextField
              label="URL do Vídeo (embed)"
              fullWidth
              required
              value={newVideo.url || ''}
              onChange={(e) => {
                setNewVideo((prev) => ({ ...prev, url: e.target.value }));
                if (touched.url) setTouched((prev) => ({ ...prev, url: false }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, url: true }))}
              error={touched.url && (errors.newVideoSrc || errors.newVideoURL)}
              helperText={
                touched.url && errors.newVideoSrc
                  ? 'Campo obrigatório'
                  : touched.url && errors.newVideoURL
                    ? 'URL inválida para a plataforma selecionada'
                    : ''
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover:not(.Mui-error)': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                  },
                },
                '& .MuiFormHelperText-root': {
                  marginLeft: 0,
                  marginTop: 1,
                  fontSize: '0.75rem',
                },
              }}
            />
          </Grid>
        )}

        {newVideo.uploadType === MediaUploadType.UPLOAD && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                component="label"
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
                Escolher Vídeo
                <input type="file" hidden accept="video/*" onChange={handleUploadFile} />
              </Button>
              {newVideo.file && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {newVideo.file.name}
                  </Typography>
                  {uploadProgress[newVideo.file.name] === false ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Typography variant="body2" color="success.main">
                      ✔
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setTouched({ title: true, description: true, url: true });
              handleAddVideo();
            }}
            disabled={
              newVideo.uploadType === MediaUploadType.UPLOAD &&
              newVideo.file &&
              uploadProgress[newVideo.file.name] === false
            }
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              '&:hover:not(:disabled)': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              '&:disabled': {
                opacity: 0.6,
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isEditing ? 'Atualizar Vídeo' : 'Adicionar Vídeo'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
