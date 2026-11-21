import { Fragment } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MediaItem, MediaUploadType, MediaPlatform } from 'store/slices/types';
import { IdeasVideoCard } from './IdeasVideoCard';
import { useIdeasVideosDraft } from './useIdeasVideosDraft';

interface VideosUserProps {
  videos: MediaItem[];
  setVideos: (videos: MediaItem[]) => void;
  ideaTitle: string;
  onPendingChange: (pending: boolean) => void;
  shakeButton?: boolean;
}

export function IdeasMaterialVideosUser(props: VideosUserProps) {
  const { videos, shakeButton, onPendingChange } = props;
  const {
    addButtonRef,
    tempVideo,
    setTempVideo,
    fileName,
    editingIndex,
    errors,
    openDeleteDialog,
    setOpenDeleteDialog,
    handleUpload,
    handleAddOrUpdate,
    handleEdit,
    handleRemoveClick,
    confirmRemove,
  } = useIdeasVideosDraft(props);

  return (
    <Box>
      <Box sx={{
        mb: 3,
        p: 3,
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.default',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🎥 Adicionar Vídeo
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }} data-testid="idea-video-upload-type">
          <InputLabel>Tipo de Upload</InputLabel>
          <Select
            value={tempVideo.uploadType}
            label="Tipo de Upload"
            onChange={(e) =>
              setTempVideo({
                ...tempVideo,
                uploadType: e.target.value as MediaUploadType.LINK | MediaUploadType.UPLOAD,
                platformType: e.target.value === MediaUploadType.LINK ? MediaPlatform.YOUTUBE : undefined,
                url: '',
                file: undefined,
              })
            }
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              }
            }}
          >
            <MenuItem value="upload">📤 Upload de Arquivo</MenuItem>
            <MenuItem value="link">🔗 Link do YouTube</MenuItem>
          </Select>
        </FormControl>

        {tempVideo.uploadType === MediaUploadType.LINK && (
          <Fragment>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.08)', borderRadius: 2, border: '2px solid', borderColor: '#3B82F6' }}>
                  <Typography variant="body2" sx={{ color: '#2563EB', mb: 1, fontWeight: 600 }}>
                    💡 Como obter o link do YouTube:
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.6 }}>
                    1. Abra o vídeo no YouTube<br />
                    2. Clique em "Compartilhar"<br />
                    3. Copie o link e cole abaixo
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box>
                  <InputLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
                    🔗 URL do YouTube *
                  </InputLabel>
                  <input
                    type="text"
                    data-testid="idea-video-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={tempVideo.url}
                    onChange={(e) => {
                      setTempVideo({ ...tempVideo, url: e.target.value });
                      if (e.target.value) {
                        onPendingChange(true);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      border: errors.url ? '2px solid #EF4444' : '2px solid #D1D5DB',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      if (!errors.url) {
                        e.target.style.borderColor = '#3B82F6';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.url) {
                        e.target.style.borderColor = '#D1D5DB';
                      }
                    }}
                  />
                  {errors.url && (
                    <Typography variant="caption" sx={{ color: '#DC2626', mt: 1, display: 'block', fontWeight: 600 }}>
                      ⚠️ URL inválida ou obrigatória
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Fragment>
        )}

        {tempVideo.uploadType === MediaUploadType.UPLOAD && (
          <Fragment>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#3B82F6',
                    color: '#3B82F6',
                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#2563EB',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 2,
                      borderStyle: 'dashed',
                    }
                  }}
                >
                  Escolher Arquivo de Vídeo (MP4, AVI, MOV, etc.)
                  <input type="file" hidden accept="video/*" onChange={handleUpload} data-testid="idea-video-file" />
                </Button>
              </Grid>

              {fileName && (
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(34, 197, 94, 0.08)',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Typography variant="body2" sx={{ color: '#16A34A', fontWeight: 600, flex: 1 }}>
                      📎 Arquivo selecionado: <strong>{fileName}</strong>
                    </Typography>
                  </Box>
                </Grid>
              )}

              {tempVideo.url && tempVideo.uploadType === MediaUploadType.UPLOAD && (
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: '#3B82F6'
                  }}>
                    <video
                      controls
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      <source src={tempVideo.url} />
                    </video>
                  </Box>
                </Grid>
              )}

              {errors.url && (
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: '#EF4444'
                  }}>
                    <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 600 }}>
                      ⚠️ Por favor, selecione um arquivo
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Fragment>
        )}

        <Button
          ref={addButtonRef}
          data-testid="idea-video-add"
          variant="contained"
          fullWidth
          onClick={handleAddOrUpdate}
          disabled={!tempVideo.url}
          sx={{
            mt: 2,
            py: 1.5,
            bgcolor: '#3B82F6',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              bgcolor: '#2563EB',
              boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              bgcolor: 'rgba(0,0,0,0.12)',
              color: 'rgba(0,0,0,0.26)',
              boxShadow: 'none',
            },
            transition: 'all 0.2s ease',
            animation: shakeButton ? 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both' : 'none',
            '@keyframes shake': {
              '10%, 90%': {
                transform: 'translate3d(-1px, 0, 0)',
              },
              '20%, 80%': {
                transform: 'translate3d(2px, 0, 0)',
              },
              '30%, 50%, 70%': {
                transform: 'translate3d(-4px, 0, 0)',
              },
              '40%, 60%': {
                transform: 'translate3d(4px, 0, 0)',
              },
            },
          }}
        >
          {editingIndex !== null ? '💾 Salvar Alterações' : '➕ Adicionar Vídeo'}
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mt: 3 }} data-testid="idea-video-list">
        {videos.map((video, index) => (
          <IdeasVideoCard key={index} video={video} index={index} onEdit={handleEdit} onRemove={handleRemoveClick} />
        ))}
      </Grid>

      <Dialog data-testid="idea-video-delete-dialog" open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button data-testid="idea-video-delete-cancel" onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button data-testid="idea-video-delete-confirm" onClick={confirmRemove} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
