import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { VideoLibrary, Description, Image, Audiotrack } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/slices';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import {
  clearVisitMaterialData,
} from '@/store/slices/visit-material/visitMaterialSlice';
import PageFormBase from '../shared/PageFormBase';
import PageBasicInfoSection from '../shared/PageBasicInfoSection';
import PageFormActions from '../shared/PageFormActions';
import PageFeedbackSnackbar from '../shared/PageFeedbackSnackbar';
import { PAGE_PAPER_SX } from '../shared/styles';
import { useTouchedFields } from '../shared/useTouchedFields';
import { VISIT_EDITOR_HEADINGS, VISIT_EDITOR_TEST_ID, VISIT_TABS_SX } from './constants';
import { useRequestedVisitMaterial } from './useRequestedVisitMaterial';
import VisitVideos from './VisitVideos';
import VisitDocuments from './VisitDocuments';
import VisitAudios from './VisitAudios';
import VisitImages from './VisitImages';
import { MediaItem } from 'store/slices/types';
import {
  createVisitMaterial,
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

  const { touched, setField, touchAll } = useTouchedFields();

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<VisitMaterialSnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

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

  const { initialLoading, initialError } = useRequestedVisitMaterial({
    fromTemplatePage: Boolean(fromTemplatePage),
    requestedMaterialId,
    loadedMaterialId: visitMaterialSData?.id,
  });

  const handleSavePage = async () => {
    touchAll();

    const hasError =
      !pageTitle.trim() || !pageSubtitle.trim() || !pageDescription.trim();

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
    <PageFormBase
      testId={VISIT_EDITOR_TEST_ID}
      heading={fromTemplatePage ? VISIT_EDITOR_HEADINGS.CREATE : VISIT_EDITOR_HEADINGS.EDIT}
      onBack={() => navigate(-1)}
    >
      <PageBasicInfoSection
        testId={VISIT_EDITOR_TEST_ID}
        titleLabel="Título da Página"
        descriptionLabel="Descrição da Página"
        title={pageTitle}
        description={pageDescription}
        isPublic
        showPublicSwitch={false}
        subtitle={{ label: 'Subtítulo da Página', value: pageSubtitle, onChange: setPageSubtitle }}
        touched={touched}
        onTitleChange={setPageTitle}
        onDescriptionChange={setPageDescription}
        onPublicChange={() => undefined}
        onTouchedChange={setField}
      >
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
                '& .MuiOutlinedInput-notchedOutline': { transition: 'all 0.2s ease' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
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
      </PageBasicInfoSection>

      <Paper elevation={2} sx={PAGE_PAPER_SX}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          📚 Materiais de Visita
        </Typography>

        <Tabs
          data-testid="visit-material-page-editor-media-tabs"
          value={tab}
          onChange={(_, val) => setTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={VISIT_TABS_SX}
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

      <PageFormActions
        testId={VISIT_EDITOR_TEST_ID}
        saveLabel="Salvar Página"
        savingLabel="Salvando..."
        saveColor="primary"
        isSaving={loading}
        savingSpinner
        onCancel={() => navigate(-1)}
        onSave={handleSavePage}
      />

      <PageFeedbackSnackbar
        testId="visit-material-page-editor-feedback"
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        filled
        showCloseButton={false}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </PageFormBase>
  );
}
