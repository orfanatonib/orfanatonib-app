import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Stack,
  Paper,
  Container,
  IconButton,
  Grid,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/config/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/slices';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import {
  clearMeditationData,
  clearMedia,
  DayItem,
} from '@/store/slices/meditation/meditationSlice';
import MeditationForm from './MeditationForm';
import { AxiosError } from 'axios';
import { MediaItem, MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';
import MediaManager from './MediaManager';

interface Props {
  fromTemplatePage?: boolean;
}

function isMonday(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getDay() === 1;
}

function isFriday(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getDay() === 5;
}

export default function MeditationPageCreator({ fromTemplatePage }: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const meditationData = useSelector((state: RootState) => state.meditation.meditationData);

  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<MediaUploadType>(MediaUploadType.LINK);
  const [url, setUrl] = useState('');
  const [platformType, setPlatformType] = useState<MediaPlatform>(MediaPlatform.ANY);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState<DayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ topic: false, startDate: false, endDate: false });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    if (fromTemplatePage) {
      dispatch(clearMeditationData());
      dispatch(clearMedia());
      setTopic('');
      setFile(null);
      setUploadType(MediaUploadType.LINK);
      setUrl('');
      setPlatformType(MediaPlatform.ANY);
      setStartDate('');
      setEndDate('');
      setDays([]);
    }
  }, [fromTemplatePage, dispatch]);

  useEffect(() => {
    if (!fromTemplatePage && meditationData) {
      setTopic(meditationData.topic);
      setStartDate(meditationData.startDate);
      setEndDate(meditationData.endDate);
      setDays(meditationData.days);

      if (meditationData.media) {
        setUploadType(meditationData.media.uploadType);
        setUrl(meditationData.media.url ?? '');
        setPlatformType(meditationData.media.platformType ?? MediaPlatform.ANY);
      }
    }
  }, [fromTemplatePage, meditationData]);

  const handleSave = async () => {
    setTouched({ topic: true, startDate: true, endDate: true });

    if (!topic || !startDate || !endDate) {
      setSnackbar({
        open: true,
        message: 'Informe tema, data de início e fim.',
        severity: 'error',
      });
      return;
    }

    if (!isMonday(startDate)) {
      setSnackbar({
        open: true,
        message: 'A data de início deve ser uma segunda-feira.',
        severity: 'error',
      });
      return;
    }

    if (!isFriday(endDate)) {
      setSnackbar({
        open: true,
        message: 'A data de término deve ser uma sexta-feira.',
        severity: 'error',
      });
      return;
    }

    if (days.length !== 5) {
      setSnackbar({
        open: true,
        message: 'Adicione exatamente 5 dias de meditação.',
        severity: 'error',
      });
      return;
    }

    if (
      (uploadType === MediaUploadType.LINK && !url.trim()) ||
      (uploadType === MediaUploadType.UPLOAD && !file)
    ) {
      setSnackbar({
        open: true,
        message: 'Informe um link válido ou envie um arquivo.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      if (uploadType === MediaUploadType.UPLOAD && file) {
        formData.append('file', file);
      }

      const media: MediaItem = {
        title: topic.trim(),
        description: `Meditação da semana de ${startDate} a ${endDate}`,
        mediaType: MediaType.DOCUMENT,
        uploadType,
        url: uploadType === MediaUploadType.LINK ? url.trim() : '',
        isLocalFile: uploadType === MediaUploadType.UPLOAD,
        ...(file ? { originalName: file.name, size: file.size } : {}),
        ...(uploadType === MediaUploadType.LINK ? { platformType } : {}),
      };

      const meditationDataPayload = {
        ...(fromTemplatePage ? {} : { id: meditationData?.id }),
        topic: topic.trim(),
        startDate,
        endDate,
        media,
        days: days.map((day) => ({
          day: day.day,
          verse: day.verse.trim(),
          topic: day.topic.trim(),
        })),
      };

      formData.append('meditationData', JSON.stringify(meditationDataPayload));

      fromTemplatePage
        ? await api.post('/meditations', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        : await api.patch(`/meditations/${meditationData?.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

      await dispatch(fetchRoutes());
      setSnackbar({ open: true, message: 'Meditação salva com sucesso!', severity: 'success' });
      navigate('/adm/meditacoes');
    } catch (error) {
      if (error instanceof AxiosError) {
        return;
      }
      console.error(error);
      setSnackbar({ open: true, message: 'Erro ao salvar meditação.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth={false} sx={{ width: { xs: '98%', md: '95%' }, mx: 'auto', px: { xs: 1, md: 2 } }}>
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
            {fromTemplatePage ? '🧘 Criar Meditação da Semana' : '✏️ Editar Meditação'}
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
                label="Tema da Meditação"
                required
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (touched.topic) setTouched((prev) => ({ ...prev, topic: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, topic: true }))}
                error={touched.topic && !topic.trim()}
                helperText={touched.topic && !topic.trim() ? 'Campo obrigatório' : ''}
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
                fullWidth
                type="date"
                label="Data de Início"
                required
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (touched.startDate) setTouched((prev) => ({ ...prev, startDate: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, startDate: true }))}
                error={touched.startDate && !startDate}
                helperText={touched.startDate && !startDate ? 'Campo obrigatório' : ''}
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
                fullWidth
                type="date"
                label="Data de Término"
                required
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (touched.endDate) setTouched((prev) => ({ ...prev, endDate: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, endDate: true }))}
                error={touched.endDate && !endDate}
                helperText={touched.endDate && !endDate ? 'Campo obrigatório' : ''}
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
              <MediaManager
                uploadType={uploadType}
                setUploadType={setUploadType}
                file={file}
                setFile={setFile}
                url={url}
                setUrl={setUrl}
                platformType={platformType}
                setPlatformType={setPlatformType}
              />
            </Grid>
          </Grid>
        </Paper>

        <MeditationForm days={days} onDaysChange={setDays} />

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
            size="large"
            onClick={handleSave}
            disabled={loading}
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
            {loading ? 'Salvando...' : 'Salvar Meditação'}
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
