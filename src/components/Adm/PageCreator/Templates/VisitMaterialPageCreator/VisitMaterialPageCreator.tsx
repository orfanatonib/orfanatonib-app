import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
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
import { useTouchedFields } from '../shared/useTouchedFields';
import { VISIT_EDITOR_HEADINGS, VISIT_EDITOR_TEST_ID } from './constants';
import { useRequestedVisitMaterial } from './useRequestedVisitMaterial';
import VisitCategoriesEditor from './VisitCategoriesEditor';
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
  VisitMaterialCategory,
  VisitMaterialCategoryDraft,
  VisitMaterialCategoryDrafts,
  VisitMaterialPageCreatorProps,
  VisitMaterialSectionCategory,
  VisitMaterialSnackbarState,
} from '@/features/visit-materials/types';
import { VISIT_MATERIAL_SECTION_CATEGORIES } from '@/features/visit-materials/constants';
import { draftsFromMaterial, emptyCategoryDrafts } from '@/features/visit-materials/utils';

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
  /** Mídias por categoria: o Geral (padrão) são as mídias da página; as faixas etárias viram seções. */
  const [drafts, setDrafts] = useState<VisitMaterialCategoryDrafts>(emptyCategoryDrafts);
  const handleDraftChange = (category: VisitMaterialCategory, draft: VisitMaterialCategoryDraft) =>
    setDrafts((current) => ({ ...current, [category]: draft }));

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
      setDrafts(emptyCategoryDrafts());
    }
  }, [fromTemplatePage, dispatch]);

  useEffect(() => {
    if (!fromTemplatePage && visitMaterialSData) {
      setPageTitle(visitMaterialSData.title);
      setPageSubtitle(visitMaterialSData.subtitle);
      setPageDescription(visitMaterialSData.description);
      setTestament(visitMaterialSData.testament);
      setPageCurrentWeek(visitMaterialSData.currentWeek);
      setDrafts(draftsFromMaterial(visitMaterialSData));
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
          videos: drafts[VisitMaterialCategory.GENERAL].videos,
          documents: drafts[VisitMaterialCategory.GENERAL].documents,
          images: drafts[VisitMaterialCategory.GENERAL].images,
          audios: drafts[VisitMaterialCategory.GENERAL].audios,
          sections: Object.fromEntries(
            VISIT_MATERIAL_SECTION_CATEGORIES.map((category) => [category, drafts[category]]),
          ) as Partial<Record<VisitMaterialSectionCategory, VisitMaterialCategoryDraft>>,
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

      <VisitCategoriesEditor drafts={drafts} onChange={handleDraftChange} />

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
