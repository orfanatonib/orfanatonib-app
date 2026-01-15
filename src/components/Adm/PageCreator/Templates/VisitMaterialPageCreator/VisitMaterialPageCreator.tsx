import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Container,
  IconButton,
  Grid,
} from '@mui/material';
import { ArrowBack, VideoLibrary, Description, Image, Audiotrack, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/slices';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import { clearVisitMaterialData } from '@/store/slices/visit-material/visitMaterialSlice';
import VisitVideos from './VisitVideos';
import VisitDocuments from './VisitDocuments';
import VisitAudios from './VisitAudios';
import VisitImages from './VisitImages';
import api from '@/config/axiosConfig';
import { MediaItem, MediaType, MediaUploadType } from 'store/slices/types';

interface VisitMaterialPageCreatorProps {
  fromTemplatePage?: boolean;
}

interface FileItem {
  uploadType: MediaUploadType;
  url?: string;
  file?: File;
  [key: string]: any;
}

function buildFileItem<T extends FileItem>(
  item: T,
  index: number,
  prefix: string,
  formData: FormData
): T & { fileField?: string } {
  if (item.uploadType === MediaUploadType.UPLOAD && item.file instanceof File) {
    const extension = item.file.name.split('.').pop() || 'bin';
    const filename = `${prefix}_${index}.${extension}`;
    formData.append(filename, item.file, filename);

    return {
      ...item,
      url: undefined,
      fileField: filename,
    };
  }

  return {
    ...item,
    fileField: undefined,
  };
}

export default function VisitMaterialPageCreator({
  fromTemplatePage,
}: VisitMaterialPageCreatorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const visitMaterialSData = useSelector((state: RootState) => state.visitMaterial.visitMaterialSData);

  const [pageTitle, setPageTitle] = useState('');
  const [pageSubtitle, setPageSubtitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [testament, setTestament] = useState<'OLD_TESTAMENT' | 'NEW_TESTAMENT'>('OLD_TESTAMENT');

  const [pageCurrentWeek, setPageCurrentWeek] = useState(false);
  const [tab, setTab] = useState(0);

  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [audios, setAudios] = useState<MediaItem[]>([]);

  const [errors, setErrors] = useState({
    title: false,
    subtitle: false,
    description: false,
  });
  const [touched, setTouched] = useState({
    title: false,
    subtitle: false,
    description: false,
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    if (fromTemplatePage) {
      dispatch(clearVisitMaterialData());
      setPageTitle('');
      setPageSubtitle('');
      setPageDescription('');
      setTestament('OLD_TESTAMENT');
      setVideos([]);
      setDocuments([]);
      setImages([]);
      setAudios([]);
    }
  }, [fromTemplatePage, dispatch]);

  useEffect(() => {
    if (!fromTemplatePage && visitMaterialSData) {
      setPageTitle(visitMaterialSData.title);
      setPageSubtitle(visitMaterialSData.subtitle);
      setPageDescription(visitMaterialSData.description);
      setTestament(visitMaterialSData.testament || 'OLD_TESTAMENT');
      setPageCurrentWeek(visitMaterialSData.currentWeek);
      setVideos(visitMaterialSData.videos);
      setDocuments(visitMaterialSData.documents);
      setImages(visitMaterialSData.images);
      setAudios(visitMaterialSData.audios);
    }
  }, [fromTemplatePage, visitMaterialSData]);

  const handleSavePage = async () => {
    setTouched({ title: true, subtitle: true, description: true });
    
    const hasError = !pageTitle || !pageSubtitle || !pageDescription;

    setErrors({
      title: !pageTitle,
      subtitle: !pageSubtitle,
      description: !pageDescription,
    });

    if (hasError) {
      setSnackbar({
        open: true,
        message: 'Preencha todos os campos obrigatórios.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      const processedVideos = videos.map((v, i) => buildFileItem(v, i, 'video', formData));
      const processedDocs = documents.map((d, i) => buildFileItem(d, i, 'document', formData));
      const processedImgs = images.map((i, n) => buildFileItem(i, n, 'image', formData));
      const processedAudios = audios.map((a, x) => buildFileItem(a, x, 'audio', formData));

      const mapItem = (item: MediaItem & { fileField?: string }, type: MediaType) => ({
        ...(item.id && { id: item.id }),
        title: item.title,
        description: item.description,
        mediaType: type,
        uploadType: item.uploadType,
        isLocalFile: item.uploadType === MediaUploadType.UPLOAD,
        url: item.url,
        platformType:
          item.uploadType === MediaUploadType.UPLOAD ? null : (item.platformType ?? null),
        ...(item.uploadType === MediaUploadType.LINK && item.url && { url: item.url }),
        ...(item.uploadType === MediaUploadType.UPLOAD &&
          item.fileField && {
          fieldKey: item.fileField,
        }),
        ...(item.uploadType === MediaUploadType.UPLOAD &&
          item.size && {
          size: item.size,
        }),
      });

      const payload = {
        ...(fromTemplatePage ? {} : { id: visitMaterialSData?.id }),
        pageTitle,
        pageSubtitle,
        testament,
        pageDescription,
        ...(fromTemplatePage ? {} : { currentWeek: pageCurrentWeek }),
        videos: processedVideos.map((v) => mapItem(v, MediaType.VIDEO)),
        documents: processedDocs.map((d) => mapItem(d, MediaType.DOCUMENT)),
        images: processedImgs.map((i) => mapItem(i, MediaType.IMAGE)),
        audios: processedAudios.map((a) => mapItem(a, MediaType.AUDIO)),
      };

      formData.append('visitMaterialsPageData', JSON.stringify(payload));

      const res = fromTemplatePage
        ? await api.post('/visit-material-pages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        : await api.patch(`/visit-material-pages/${visitMaterialSData?.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

      if (!res?.data) throw new Error('Erro ao salvar');

      await dispatch(fetchRoutes());

      setSnackbar({
        open: true,
        message: 'Página salva com sucesso!',
        severity: 'success',
      });

      navigate(`/${res.data.route.path}`);
    } catch {
      setSnackbar({
        open: true,
        message: 'Erro ao salvar a página.',
        severity: 'error',
      });
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
            {fromTemplatePage ? '➕ Adicionar Material de Visita' : '✏️ Editar Material de Visita'}
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
                label="Título da Página"
                fullWidth
                required
                value={pageTitle}
                onChange={(e) => {
                  setPageTitle(e.target.value);
                  if (touched.title) setTouched((prev) => ({ ...prev, title: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                error={touched.title && errors.title}
                helperText={touched.title && errors.title ? 'Campo obrigatório' : ''}
                variant="outlined"
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
                label="Subtítulo da Página"
                fullWidth
                required
                value={pageSubtitle}
                onChange={(e) => {
                  setPageSubtitle(e.target.value);
                  if (touched.subtitle) setTouched((prev) => ({ ...prev, subtitle: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, subtitle: true }))}
                error={touched.subtitle && errors.subtitle}
                helperText={touched.subtitle && errors.subtitle ? 'Campo obrigatório' : ''}
                variant="outlined"
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
                label="Descrição da Página"
                fullWidth
                required
                multiline
                rows={4}
                value={pageDescription}
                onChange={(e) => {
                  setPageDescription(e.target.value);
                  if (touched.description) setTouched((prev) => ({ ...prev, description: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                error={touched.description && errors.description}
                helperText={touched.description && errors.description ? 'Campo obrigatório' : ''}
                variant="outlined"
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
                <InputLabel required>Testamento</InputLabel>
                <Select
                  value={testament}
                  label="Testamento"
                  onChange={(e) => setTestament(e.target.value as 'OLD_TESTAMENT' | 'NEW_TESTAMENT')}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      transition: 'all 0.2s ease',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="OLD_TESTAMENT">📖 Antigo Testamento</MenuItem>
                  <MenuItem value="NEW_TESTAMENT">✝️ Novo Testamento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

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
            📚 Materiais de Visita
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 56,
                fontSize: '0.95rem',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
            }}
          >
            <Tab icon={<VideoLibrary />} iconPosition="start" label="Vídeos" />
            <Tab icon={<Description />} iconPosition="start" label="Documentos" />
            <Tab icon={<Image />} iconPosition="start" label="Imagens" />
            <Tab icon={<Audiotrack />} iconPosition="start" label="Áudios" />
          </Tabs>

          <Box sx={{ minHeight: 300 }}>
            {tab === 0 && <VisitVideos videos={videos} setVideos={setVideos} />}
            {tab === 1 && <VisitDocuments documents={documents} setDocuments={setDocuments} />}
            {tab === 2 && <VisitImages images={images} setImages={setImages} />}
            {tab === 3 && <VisitAudios audios={audios} setAudios={setAudios} />}
          </Box>
        </Paper>

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
              },
              transition: 'all 0.2s ease',
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSavePage}
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
            {loading ? 'Salvando...' : 'Salvar Página'}
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
