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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/slices';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import {
  clearVisitMaterialData,
  setVisitMaterialData,
} from '@/store/slices/visit-material/visitMaterialSlice';
import VisitVideos from './VisitVideos';
import VisitDocuments from './VisitDocuments';
import VisitAudios from './VisitAudios';
import VisitImages from './VisitImages';
import { MediaItem } from 'store/slices/types';
import {
  createVisitMaterial,
  getVisitMaterialById,
  updateVisitMaterial,
} from '@/features/visit-materials/api';
import {
  VISIT_MATERIAL_MESSAGES,
  VISIT_MATERIAL_TESTAMENT_LABELS,
} from '@/features/visit-materials/constants';
import { visitMaterialErrorMessage } from '@/features/visit-materials/errors';
import { buildVisitMaterialFormData } from '@/features/visit-materials/payload';
import {
  TestamentType,
  VisitMaterialFormErrors,
  VisitMaterialPageCreatorProps,
  VisitMaterialSnackbarState,
} from '@/features/visit-materials/types';

export default function VisitMaterialPageCreator({
  fromTemplatePage,
}: VisitMaterialPageCreatorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitMaterialSData = useSelector((state: RootState) => state.visitMaterial.visitMaterialSData);
  const requestedMaterialId = searchParams.get('id');

  const [pageTitle, setPageTitle] = useState('');
  const [pageSubtitle, setPageSubtitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [testament, setTestament] = useState<TestamentType>(
    TestamentType.OLD_TESTAMENT,
  );

  const [pageCurrentWeek, setPageCurrentWeek] = useState(false);
  const [tab, setTab] = useState(0);

  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [audios, setAudios] = useState<MediaItem[]>([]);

  const [errors, setErrors] = useState<VisitMaterialFormErrors>({
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
  const [snackbar, setSnackbar] = useState<VisitMaterialSnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [initialLoading, setInitialLoading] = useState(false);
  const [initialError, setInitialError] = useState('');

  useEffect(() => {
    if (fromTemplatePage) {
      dispatch(clearVisitMaterialData());
      setPageTitle('');
      setPageSubtitle('');
      setPageDescription('');
      setTestament(TestamentType.OLD_TESTAMENT);
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
      setTestament(visitMaterialSData.testament);
      setPageCurrentWeek(visitMaterialSData.currentWeek);
      setVideos(visitMaterialSData.videos);
      setDocuments(visitMaterialSData.documents);
      setImages(visitMaterialSData.images);
      setAudios(visitMaterialSData.audios);
    }
  }, [fromTemplatePage, visitMaterialSData]);

  useEffect(() => {
    if (
      fromTemplatePage ||
      !requestedMaterialId ||
      visitMaterialSData?.id === requestedMaterialId
    ) {
      return;
    }

    let active = true;
    setInitialLoading(true);
    setInitialError('');
    void getVisitMaterialById({ id: requestedMaterialId })
      .then((material) => {
        if (active) dispatch(setVisitMaterialData(material));
      })
      .catch((caught: unknown) => {
        if (active) {
          setInitialError(
            visitMaterialErrorMessage(
              caught,
              VISIT_MATERIAL_MESSAGES.DETAIL_ERROR,
            ),
          );
        }
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, fromTemplatePage, requestedMaterialId, visitMaterialSData?.id]);

  const handleSavePage = async () => {
    setTouched({ title: true, subtitle: true, description: true });

    const hasError =
      !pageTitle.trim() || !pageSubtitle.trim() || !pageDescription.trim();

    setErrors({
      title: !pageTitle.trim(),
      subtitle: !pageSubtitle.trim(),
      description: !pageDescription.trim(),
    });

    if (hasError) {
      setSnackbar({
        open: true,
        message: VISIT_MATERIAL_MESSAGES.REQUIRED_FIELDS,
        severity: 'error',
      });
      return;
    }

    if (!fromTemplatePage && !visitMaterialSData?.id) {
      setSnackbar({
        open: true,
        message: VISIT_MATERIAL_MESSAGES.DETAIL_ERROR,
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = buildVisitMaterialFormData(
        {
          id: visitMaterialSData?.id,
          pageTitle,
          pageSubtitle,
          testament,
          pageDescription,
          currentWeek: pageCurrentWeek,
          videos,
          documents,
          images,
          audios,
        },
        fromTemplatePage ? 'create' : 'update',
      );

      const res = fromTemplatePage
        ? await createVisitMaterial(formData)
        : await updateVisitMaterial(
            { id: visitMaterialSData?.id ?? '' },
            formData,
          );

      await dispatch(fetchRoutes());

      setSnackbar({
        open: true,
        message: VISIT_MATERIAL_MESSAGES.SAVE_SUCCESS,
        severity: 'success',
      });

      navigate(`/${res.route.path}`);
    } catch (caught: unknown) {
      setSnackbar({
        open: true,
        message: visitMaterialErrorMessage(
          caught,
          VISIT_MATERIAL_MESSAGES.SAVE_ERROR,
        ),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box
        data-testid="visit-material-editor-loading"
        sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (initialError) {
    return (
      <Box data-testid="visit-material-editor-error" sx={{ p: 3 }}>
        <Alert severity="error">{initialError}</Alert>
      </Box>
    );
  }

  return (
    <Box
      data-testid="visit-material-page-editor"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth={false} sx={{ width: { xs: '98%', md: '95%' }, mx: 'auto', px: { xs: 1, md: 2 } }}>
        <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <IconButton
            data-testid="visit-material-page-editor-back"
            aria-label="Voltar"
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
                data-testid="visit-material-page-editor-title"
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
                data-testid="visit-material-page-editor-subtitle"
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
                data-testid="visit-material-page-editor-description"
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
                  data-testid="visit-material-page-editor-testament"
                  value={testament}
                  label="Testamento"
                  onChange={(e) => setTestament(e.target.value as TestamentType)}
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
                  {Object.values(TestamentType).map((value) => (
                    <MenuItem key={value} value={value}>
                      {value === TestamentType.OLD_TESTAMENT ? '📖' : '✝️'}{' '}
                      {VISIT_MATERIAL_TESTAMENT_LABELS[value]}
                    </MenuItem>
                  ))}
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
            data-testid="visit-material-page-editor-media-tabs"
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
            data-testid="visit-material-page-editor-cancel"
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
            data-testid="visit-material-page-editor-save"
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
        data-testid="visit-material-page-editor-feedback"
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
