import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';

import BackHeader from '@/components/common/header/BackHeader';
import { RootState } from '@/store/slices';
import { setData, clearData, SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { extractErrorMessage } from '@/utils/apiError';
import { LoadingSpinner, NotificationModal } from '@/pages/MemberArea/components/Modals';

import { updateImageSection } from './api';
import { RejectImageSectionDialog } from './components/RejectImageSectionDialog';
import { ShelterMediaEditor } from './components/ShelterMediaEditor';
import { ADMIN_IMAGE_SECTIONS_ROUTE, REVIEW_STATUS_COLORS, REVIEW_STATUS_LABELS, TOUCH_TARGET_PX } from './constants';
import { validateShelterPublication } from './media-utils';
import { buildSectionFormData, buildSectionUpload, mediaSummary } from './utils';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

/**
 * Revisão do admin: confere título, descrição, fotos e vídeo (com player), ajusta
 * o que for preciso e aprova. Aprovar grava `public: true` e leva o post à galeria
 * do feed (a API usa `FEED_ORFANATO_PAGE_ID`).
 */
export default function ImageSectionEditorAdmin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sectionData = useSelector((state: RootState) => state.imageSection.data) as SectionData | null;

  const [isSaving, setIsSaving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!sectionData) navigate(ADMIN_IMAGE_SECTIONS_ROUTE);
  }, [sectionData, navigate]);

  if (!sectionData) return null;

  const showError = (message: string) => setNotification({ open: true, message, severity: 'error' });

  const handleApprove = async () => {
    if (isSaving) return;
    if (!sectionData.caption.trim()) return showError('O título da publicação é obrigatório.');
    if (!sectionData.description.trim()) return showError('A descrição da publicação é obrigatória.');
    const mediaError = validateShelterPublication(sectionData.mediaItems, true);
    if (mediaError) return showError(mediaError);
    if (!sectionData.id) return showError('ID da seção não encontrado.');

    setIsSaving(true);
    try {
      const { payload, uploads } = buildSectionUpload({
        caption: sectionData.caption.trim(),
        description: sectionData.description.trim(),
        public: true,
        mediaItems: sectionData.mediaItems,
      });
      await updateImageSection(sectionData.id, buildSectionFormData(payload, uploads));
      dispatch(clearData());
      navigate(ADMIN_IMAGE_SECTIONS_ROUTE);
    } catch (error: unknown) {
      showError(extractErrorMessage(error, 'Falha ao publicar. Tente novamente.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (updated: Partial<SectionData>) => {
    dispatch(setData({ ...sectionData, ...updated }));
  };

  return (
    <Box
      data-testid="image-sections-image-section-editor-admin"
      sx={{ minHeight: '100vh', bgcolor: '#f9fafb', px: { xs: 2, md: 0 }, pb: 4 }}
    >
      <Container maxWidth="lg" disableGutters>
        <BackHeader title="Revisar fotos e vídeo" />
        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, mb: 2, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                data-testid="image-section-admin-status"
                color={REVIEW_STATUS_COLORS[sectionData.reviewStatus ?? 'pending']}
                label={REVIEW_STATUS_LABELS[sectionData.reviewStatus ?? 'pending']}
              />
              <Chip
                size="small"
                variant="outlined"
                data-testid="image-section-admin-media-summary"
                label={mediaSummary(sectionData.mediaItems)}
              />
              <Chip
                size="small"
                variant="outlined"
                data-testid="image-section-admin-author"
                label={`Enviado por: ${sectionData.author?.displayName ?? 'Autor não informado'}`}
              />
            </Stack>
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1}>
              <Button
                data-testid="image-section-admin-back"
                variant="outlined"
                disabled={isSaving}
                onClick={() => navigate(ADMIN_IMAGE_SECTIONS_ROUTE)}
                sx={{ minHeight: TOUCH_TARGET_PX }}
              >
                Voltar
              </Button>
              <Button
                data-testid="image-section-admin-reject"
                variant="outlined"
                color="error"
                disabled={isSaving}
                onClick={() => setRejecting(true)}
                sx={{ minHeight: TOUCH_TARGET_PX }}
              >
                Reprovar
              </Button>
              <Button
                data-testid="image-section-admin-approve"
                variant="contained"
                color="success"
                disabled={isSaving}
                onClick={() => void handleApprove()}
                startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <PublicIcon />}
                sx={{ minHeight: TOUCH_TARGET_PX }}
              >
                {isSaving ? 'Publicando…' : 'Aprovar e publicar'}
              </Button>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Confira o título, a descrição e as fotos ou o vídeo antes de decidir. Publicar leva o registro
            para o feed dos abrigos.
          </Typography>
        </Paper>

        <RejectImageSectionDialog
          open={rejecting}
          sectionId={sectionData.id ?? null}
          caption={sectionData.caption}
          onClose={() => setRejecting(false)}
          onRejected={() => {
            setRejecting(false);
            dispatch(clearData());
            navigate(ADMIN_IMAGE_SECTIONS_ROUTE);
          }}
        />

        <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <LoadingSpinner open={isSaving} aria-label="Publicando a seção" />
          <NotificationModal
            open={notification.open}
            message={notification.message}
            severity={notification.severity}
            onClose={() => setNotification({ ...notification, open: false })}
          />
          <ShelterMediaEditor
            isEditMode
            disabled={isSaving}
            initialCaption={sectionData.caption || ''}
            initialDescription={sectionData.description || ''}
            initialMediaItems={sectionData.mediaItems || []}
            onChange={handleChange}
            captionPlaceholder="EX: Abrigo São Lucas: Gincana de Páscoa"
            descriptionPlaceholder="EX: dinâmicas, brincadeiras e momentos especiais registrados."
          />
        </Paper>
      </Container>
    </Box>
  );
}
