import React, { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
} from '@mui/material';
import { LightbulbOutlined as LightbulbIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearIdeasSectionData, type IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { MEMBER_AREA_HOME_PATH, MEMBER_CARD_SX } from '@/pages/MemberArea/constants/navigation';
import {
  IDEA_DRAFT_ISSUE_MESSAGES,
  IDEA_SHARE_COPY,
  IDEA_SHARE_REDIRECT_DELAY_MS,
  IDEA_SHARE_SNACKBAR_DURATION_MS,
  buildIdeasSectionFormData,
  createIdeasSection,
  getSendableMedias,
  ideasSectionErrorMessage,
  validateIdeaDraft,
} from '@/features/ideas-sections';
import { IdeasMaterialSectionUser } from '../IdeasMaterialPageCreator/IdeasMaterialSectionUser';

type SnackbarSeverity = 'success' | 'error';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

const EMPTY_SECTION: IdeasSection = { title: '', description: '', medias: [], public: true };

export function IdeasSectionUserCreator() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [sectionData, setSectionData] = useState<IdeasSection>(EMPTY_SECTION);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const sendableMediaCount = getSendableMedias(sectionData.medias).length;
  const hasMedia = sectionData.medias.length > 0;

  const showMessage = (message: string, severity: SnackbarSeverity) =>
    setSnackbar({ open: true, message, severity });

  const handleCancel = () => {
    dispatch(clearIdeasSectionData());
    navigate(MEMBER_AREA_HOME_PATH);
  };

  const handleShareIdea = async () => {
    const issue = validateIdeaDraft(sectionData);
    if (issue) {
      showMessage(IDEA_DRAFT_ISSUE_MESSAGES[issue], 'error');
      return;
    }

    setLoading(true);
    try {
      // A ideia enviada por um membro nasce pública e sempre com mídia nova.
      await createIdeasSection(
        buildIdeasSectionFormData({
          title: sectionData.title,
          description: sectionData.description,
          public: true,
          medias: sectionData.medias,
        }),
      );

      dispatch(clearIdeasSectionData());
      setSectionData(EMPTY_SECTION);
      showMessage(IDEA_SHARE_COPY.SUCCESS, 'success');
      setTimeout(() => navigate(MEMBER_AREA_HOME_PATH), IDEA_SHARE_REDIRECT_DELAY_MS);
    } catch (error: unknown) {
      showMessage(ideasSectionErrorMessage(error, IDEA_SHARE_COPY.FAILURE), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack data-testid="idea-share-page" spacing={{ xs: 2, md: 3 }}>
      <Paper
        data-testid="idea-share-form-card"
        elevation={0}
        sx={MEMBER_CARD_SX}
      >
        <IdeasMaterialSectionUser section={sectionData} onUpdate={setSectionData} />
      </Paper>

      <Paper
        data-testid="idea-share-actions"
        elevation={0}
        sx={{
          ...MEMBER_CARD_SX,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Alert
          data-testid="idea-share-media-status"
          severity={sendableMediaCount > 0 ? 'success' : hasMedia ? 'warning' : 'info'}
          variant="outlined"
          sx={{ py: 0, flex: 1 }}
        >
          {sendableMediaCount > 0
            ? `${sendableMediaCount} mídia(s) pronta(s) para envio`
            : hasMedia
              ? 'Complete os dados das mídias adicionadas'
              : 'Adicione pelo menos uma mídia (vídeo, imagem ou documento)'}
        </Alert>

        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
          <Button
            data-testid="idea-share-cancel"
            variant="outlined"
            color="inherit"
            onClick={handleCancel}
            disabled={loading}
            sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
          >
            {IDEA_SHARE_COPY.CANCEL}
          </Button>
          <Button
            data-testid="idea-share-submit"
            variant="contained"
            onClick={handleShareIdea}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LightbulbIcon />}
            sx={{ minHeight: 44, px: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {loading ? IDEA_SHARE_COPY.SUBMITTING : IDEA_SHARE_COPY.SUBMIT}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={IDEA_SHARE_SNACKBAR_DURATION_MS}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 1400 }}
      >
        <Alert
          data-testid="idea-share-snackbar"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
