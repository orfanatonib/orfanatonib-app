import { ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from 'store/slices';
import { setVisitMaterialData } from 'store/slices/visit-material/visitMaterialSlice';
import { MEMBER_CARD_SX, MEMBER_TABS_SX } from '@/pages/MemberArea/constants/navigation';
import VisitDocumentViewer from './VisitDocumentViewer';
import VisitImageGalleryView from './VisitImageGalleryView';
import VisitAudioPlayerView from './VisitAudioPlayerView';
import VisitVideoPlayerView from './VisitVideoPlayerView';
import { VISIT_MATERIAL_VIEW_COPY, VISIT_MEDIA_GRID_MIN_WIDTH } from './constants';
import { useVisitMaterial } from '@/features/visit-materials/hooks';
import { VISIT_MATERIAL_TESTAMENT_LABELS } from '@/features/visit-materials/constants';
import {
  VisitMaterialMediaResponseDto,
  VisitMaterialMediaSection,
  VisitMaterialMediaSectionView,
} from '@/features/visit-materials/types';
import { buildVisitMaterialCategoryViews } from '@/features/visit-materials/utils';
import { VisitMaterialCategory } from '@/features/visit-materials/types';
import VisitCategorySelector from './VisitCategorySelector';

interface VisitMaterialsPageViewProps {
  idToFetch: string;
}

const renderMediaItem = (
  section: VisitMaterialMediaSectionView,
  item: VisitMaterialMediaResponseDto,
): ReactNode => {
  switch (section.kind) {
    case VisitMaterialMediaSection.VIDEOS:
      return <VisitVideoPlayerView video={item} />;
    case VisitMaterialMediaSection.DOCUMENTS:
      return <VisitDocumentViewer document={item} />;
    case VisitMaterialMediaSection.IMAGES:
      return <VisitImageGalleryView image={item} />;
    case VisitMaterialMediaSection.AUDIOS:
      return <VisitAudioPlayerView audio={item} />;
  }
};

/** Estados (carregando, erro, vazio) usam o mesmo contêiner da página. */
const StateFrame = ({ children }: { children: ReactNode }) => (
  <Container maxWidth={false} disableGutters sx={{ px: 0, py: { xs: 2, md: 0 } }}>
    {children}
  </Container>
);

export default function VisitMaterialsPageView({ idToFetch }: VisitMaterialsPageViewProps) {
  const { material: visitMaterials, loading, error } = useVisitMaterial(idToFetch);
  const [activeTab, setActiveTab] = useState(0);
  const [activeCategory, setActiveCategory] = useState<VisitMaterialCategory | null>(null);

  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (visitMaterials) dispatch(setVisitMaterialData(visitMaterials));
  }, [dispatch, visitMaterials]);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <StateFrame>
        <Box
          data-testid="visit-material-page-loading"
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="40vh"
        >
          <CircularProgress size={48} aria-label="Carregando material" />
        </Box>
      </StateFrame>
    );
  }

  if (error) {
    return (
      <StateFrame>
        <Alert data-testid="visit-material-page-error" severity="error">
          {error}
        </Alert>
      </StateFrame>
    );
  }

  if (!visitMaterials) {
    return (
      <StateFrame>
        <Alert data-testid="visit-material-page-empty" severity="info">
          {VISIT_MATERIAL_VIEW_COPY.NOT_FOUND}
        </Alert>
      </StateFrame>
    );
  }

  const categories = buildVisitMaterialCategoryViews(visitMaterials);
  const currentCategory =
    categories.find((item) => item.category === activeCategory) ?? categories[0] ?? null;
  const mediaTypes = currentCategory?.mediaSections ?? [];
  const activeSection = mediaTypes[Math.min(activeTab, mediaTypes.length - 1)];
  // Só mostra o seletor quando há mais de uma categoria (página antiga: só o Geral, sem mudança na tela).
  const showCategories = categories.length > 1 || currentCategory?.category !== VisitMaterialCategory.GENERAL;
  const handleCategoryChange = (category: VisitMaterialCategory) => {
    setActiveCategory(category);
    setActiveTab(0);
  };

  return (
    <StateFrame>
      <Stack data-testid="visit-material-page" spacing={{ xs: 2, md: 3 }}>
        <Paper data-testid="visit-material-header" elevation={0} sx={MEMBER_CARD_SX}>
          <Button
            data-testid="visit-material-back"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 1.5, ml: -1, minHeight: 44, textTransform: 'none', fontWeight: 600 }}
          >
            {VISIT_MATERIAL_VIEW_COPY.BACK}
          </Button>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={VISIT_MATERIAL_TESTAMENT_LABELS[visitMaterials.testament]}
            />
            {visitMaterials.currentWeek && (
              <Chip size="small" color="success" label={VISIT_MATERIAL_VIEW_COPY.CURRENT_WEEK} />
            )}
          </Stack>
          <Typography
            data-testid="visit-material-title"
            component="h3"
            variant="h5"
            fontWeight={800}
            color="#0f2942"
          >
            {visitMaterials.title}
          </Typography>
          {visitMaterials.subtitle && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              {visitMaterials.subtitle}
            </Typography>
          )}
          {visitMaterials.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 760 }}>
              {visitMaterials.description}
            </Typography>
          )}
        </Paper>

        {currentCategory && showCategories && (
          <Paper data-testid="visit-material-categories" elevation={0} sx={MEMBER_CARD_SX}>
            <VisitCategorySelector
              categories={categories}
              active={currentCategory.category}
              onChange={handleCategoryChange}
            />
            {(currentCategory.title || currentCategory.description) && (
              <Box sx={{ mt: 1.5 }}>
                {currentCategory.title && (
                  <Typography component="h4" variant="subtitle1" fontWeight={700}>
                    {currentCategory.title}
                  </Typography>
                )}
                {currentCategory.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {currentCategory.description}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}

        {mediaTypes.length > 0 && activeSection ? (
          <Paper data-testid="visit-material-media" elevation={0} sx={MEMBER_CARD_SX}>
            <Tabs
              data-testid="visit-material-page-media-tabs"
              value={Math.min(activeTab, mediaTypes.length - 1)}
              onChange={(_, newValue: number) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={MEMBER_TABS_SX}
            >
              {mediaTypes.map((type) => (
                <Tab
                  key={type.kind}
                  data-testid={`visit-material-tab-${type.kind}`}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span aria-hidden>{type.icon}</span>
                      <span>{type.label}</span>
                      <Chip
                        label={type.items.length}
                        size="small"
                        sx={{ bgcolor: type.color, color: 'white', height: 20, fontWeight: 700 }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${VISIT_MEDIA_GRID_MIN_WIDTH}px), 1fr))`,
              }}
            >
              {activeSection.items.map((item) => (
                <Box key={item.id} data-testid="visit-material-page-media-item">
                  {renderMediaItem(activeSection, item)}
                </Box>
              ))}
            </Box>
          </Paper>
        ) : (
          <Paper
            data-testid="visit-material-page-no-media"
            elevation={0}
            sx={{ ...MEMBER_CARD_SX, textAlign: 'center', py: 5 }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {VISIT_MATERIAL_VIEW_COPY.EMPTY_TITLE}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {VISIT_MATERIAL_VIEW_COPY.EMPTY_HINT}
            </Typography>
          </Paper>
        )}
      </Stack>
    </StateFrame>
  );
}
