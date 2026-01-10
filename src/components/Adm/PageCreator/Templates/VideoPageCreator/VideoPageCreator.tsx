import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  IconButton,
  Grid,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import api from '@/config/axiosConfig';
import { AppDispatch, RootState } from '@/store/slices';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import { clearVideoData } from '@/store/slices/video/videoSlice';
import { validateMediaURL } from '@/utils/validateMediaURL';
import VideoForm from './VideoForm';
import VideoList from './VideoList';
import { MediaItem, MediaType, MediaUploadType, MediaPlatform } from 'store/slices/types';

interface VideoProps {
  fromTemplatePage?: boolean;
}

function videoToEditable(video: MediaItem): MediaItem {
  return { ...video, file: undefined };
}

export default function VideoPageCreator({ fromTemplatePage = false }: VideoProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const videoData = useSelector((state: RootState) => state.video.videoData);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [newVideo, setNewVideo] = useState<MediaItem>({
    title: '',
    description: '',
    uploadType: MediaUploadType.LINK,
    platformType: MediaPlatform.YOUTUBE,
    url: '',
    isLocalFile: false,
    mediaType: MediaType.VIDEO,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState({
    pageTitle: false,
    pageDescription: false,
    newVideoTitle: false,
    newVideoDescription: false,
    newVideoSrc: false,
    newVideoURL: false,
  });
  const [touched, setTouched] = useState({
    pageTitle: false,
    pageDescription: false,
  });
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDeleteIndex, setVideoToDeleteIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!videoData && !fromTemplatePage) {
      navigate('/feed-abrigos');
      return;
    }

    if (fromTemplatePage) {
      dispatch(clearVideoData());
      setTitle('');
      setDescription('');
      setVideos([]);
      setIsPublic(true);
    } else if (videoData) {
      setTitle(videoData.title ?? '');
      setDescription(videoData.description ?? '');
      setIsPublic(videoData.public ?? true);
      setVideos(videoData.videos.map(videoToEditable));
    }
  }, [fromTemplatePage, videoData, dispatch, navigate]);

  const areUploadsComplete = () => Object.values(uploadProgress).every((v) => v !== false);

  const validate = (): boolean => {
    if (!title.trim()) return showError('O título da galeria é obrigatório.', 'pageTitle');
    if (!description.trim())
      return showError('A descrição da galeria é obrigatória.', 'pageDescription');
    if (videos.length === 0) return showError('Adicione pelo menos um vídeo.');
    if (!fromTemplatePage && !videoData?.id)
      return showError('ID da página é obrigatório no modo de edição.');
    if (!areUploadsComplete())
      return showError('Aguarde o upload de todos os vídeos antes de salvar.');
    return true;
  };

  const showError = (msg: string, field?: keyof typeof errors) => {
    if (field) setErrors((prev) => ({ ...prev, [field]: true }));
    setSnackbarMessage(msg);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return false;
  };

  const handleSavePage = async () => {
    setTouched({ pageTitle: true, pageDescription: true });
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();

      const videosPayload = videos.map((video, index) => {
        const fieldKey = `video-${index}`;
        if (video.uploadType === MediaUploadType.UPLOAD && video.file && !video.id) {
          formData.append(fieldKey, video.file);
        }

        return {
          id: !fromTemplatePage && video.id ? video.id : undefined,
          title: video.title,
          description: video.description,
          uploadType: video.uploadType,
          isLocalFile: video.uploadType === MediaUploadType.UPLOAD,
          url:
            video.uploadType === MediaUploadType.LINK ||
            (video.uploadType === MediaUploadType.UPLOAD && video.id)
              ? video.url
              : undefined,
          platformType: video.uploadType === MediaUploadType.LINK ? video.platformType : undefined,
          originalName: video.file?.name,
          mediaType: MediaType.VIDEO,
          fieldKey: video.uploadType === MediaUploadType.UPLOAD && !video.id ? fieldKey : undefined,
        };
      });

      const payload = {
        ...(fromTemplatePage ? {} : { id: videoData?.id }),
        public: isPublic,
        title,
        description,
        videos: videosPayload,
      };

      formData.append('videosPageData', JSON.stringify(payload));

      const response = fromTemplatePage
        ? await api.post('/video-pages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : await api.patch(`/video-pages/${videoData!.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

      await dispatch(fetchRoutes());
      navigate(`/${response.data.route.path}`);
      setSnackbarMessage(
        fromTemplatePage ? 'Página criada com sucesso!' : 'Página atualizada com sucesso!'
      );
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Erro ao salvar página', error);
      showError('Erro ao salvar a página. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = () => {
    const hasError =
      !newVideo.title ||
      !newVideo.description ||
      (newVideo.uploadType === MediaUploadType.LINK && !newVideo.url) ||
      (newVideo.uploadType === MediaUploadType.UPLOAD && !newVideo.file && editingIndex === null);

    const isValidURL =
      newVideo.uploadType === MediaUploadType.LINK && newVideo.platformType
        ? validateMediaURL(newVideo.url, newVideo.platformType)
        : true;

    setErrors((prev) => ({
      ...prev,
      newVideoTitle: !newVideo.title,
      newVideoDescription: !newVideo.description,
      newVideoSrc:
        newVideo.uploadType === MediaUploadType.LINK
          ? !newVideo.url
          : !newVideo.file && editingIndex === null,
      newVideoURL: newVideo.uploadType === MediaUploadType.LINK && !isValidURL,
    }));

    if (hasError || !isValidURL) {
      if (!isValidURL) showError('URL inválida para a plataforma selecionada.');
      return;
    }

    const updatedVideo: MediaItem = {
      ...newVideo,
      id: editingIndex !== null ? videos[editingIndex].id : undefined,
      isLocalFile: newVideo.uploadType === MediaUploadType.UPLOAD,
      mediaType: MediaType.VIDEO,
    };

    if (editingIndex !== null) {
      setVideos((prev) => prev.map((v, i) => (i === editingIndex ? updatedVideo : v)));
      setEditingIndex(null);
    } else {
      setVideos((prev) => [...prev, updatedVideo]);
    }

    if (newVideo.uploadType === MediaUploadType.UPLOAD && newVideo.file) {
      setUploadProgress((prev) => ({ ...prev, [newVideo.file!.name]: true }));
    }

    setNewVideo({
      title: '',
      description: '',
      uploadType: MediaUploadType.LINK,
      platformType: MediaPlatform.YOUTUBE,
      url: '',
      isLocalFile: false,
      mediaType: MediaType.VIDEO,
    });
  };

  const handleOpenDeleteDialog = (index: number) => {
    setVideoToDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (videoToDeleteIndex !== null) {
      setVideos((prev) => prev.filter((_, i) => i !== videoToDeleteIndex));
      if (editingIndex === videoToDeleteIndex) {
        setEditingIndex(null);
        setNewVideo({
          title: '',
          description: '',
          uploadType: MediaUploadType.LINK,
          platformType: MediaPlatform.YOUTUBE,
          url: '',
          isLocalFile: false,
          mediaType: MediaType.VIDEO,
        });
      }
      setSnackbarMessage('Vídeo removido com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
    setDeleteDialogOpen(false);
    setVideoToDeleteIndex(null);
  };

  const handleEditVideo = (index: number) => {
    const videoToEdit = videos[index];
    setNewVideo({ ...videoToEdit, file: undefined });
    setEditingIndex(index);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setUploadProgress((prev) => ({ ...prev, [file.name]: false }));
    setNewVideo((prev) => ({
      ...prev,
      file,
      url: previewUrl,
      isLocalFile: true,
      uploadType: MediaUploadType.UPLOAD,
      platformType: undefined,
    }));

    setTimeout(() => {
      setUploadProgress((prev) => ({ ...prev, [file.name]: true }));
    }, 1000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            {fromTemplatePage ? '🎥 Criar Galeria de Vídeos' : '✏️ Editar Galeria de Vídeos'}
          </Typography>
        </Box>

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
            Informações Básicas
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título da Galeria"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (touched.pageTitle) setTouched((prev) => ({ ...prev, pageTitle: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, pageTitle: true }))}
                error={touched.pageTitle && errors.pageTitle}
                helperText={touched.pageTitle && errors.pageTitle ? 'Campo obrigatório' : ''}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição da Galeria"
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (touched.pageDescription) setTouched((prev) => ({ ...prev, pageDescription: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, pageDescription: true }))}
                error={touched.pageDescription && errors.pageDescription}
                helperText={touched.pageDescription && errors.pageDescription ? 'Campo obrigatório' : ''}
                multiline
                rows={4}
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
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
                label="Página pública"
              />
            </Grid>
          </Grid>
        </Paper>

        <VideoForm
          newVideo={newVideo}
          errors={errors}
          setNewVideo={setNewVideo}
          handleUploadFile={handleUploadFile}
          handleAddVideo={handleAddVideo}
          isEditing={editingIndex !== null}
          uploadProgress={uploadProgress}
        />

        <VideoList
          videos={videos}
          handleRemoveVideo={handleOpenDeleteDialog}
          handleEditVideo={handleEditVideo}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: 2,
                bgcolor: 'action.hover',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={handleSavePage}
            disabled={loading || !areUploadsComplete()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
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
            {loading ? 'Salvando...' : 'Salvar Página'}
          </Button>
        </Box>
      </Container>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
