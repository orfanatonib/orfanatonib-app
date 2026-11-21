import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Paper, Stack } from '@mui/material';
import { LightbulbOutlined as LightbulbIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { MEMBER_AREA_HOME_PATH, MEMBER_CARD_SX } from '@/pages/MemberArea/constants/navigation';
import {
  IDEA_DRAFT_ISSUE_MESSAGES,
  IDEA_SHARE_COPY,
  IDEA_SHARE_REDIRECT_DELAY_MS,
  createIdeasSection,
  getSendableMedias,
  ideasSectionErrorMessage,
  isDraftDirty,
  validateIdeaDraft,
} from '@/features/ideas-sections';
import { IdeasMaterialSectionUser } from '../IdeasMaterialPageCreator/IdeasMaterialSectionUser';
import PageFeedbackSnackbar from '../shared/PageFeedbackSnackbar';
import type { FeedbackSeverity } from '../shared/types';
import {
  CLOSED_FEEDBACK,
  EMPTY_IDEA_SECTION,
  IDEA_MEDIA_STATUS_SEVERITY,
  IDEA_SHARE_TEST_IDS,
  MIN_TOUCH_TARGET_PX,
} from './constants';
import type { IdeaFeedbackState } from './types';
import { buildMemberIdeaFormData, getIdeaMediaStatus, getIdeaMediaStatusMessage } from './utils';

export function IdeasSectionUserCreator() {
  const navigate = useNavigate();

  const [sectionData, setSectionData] = useState<IdeasSection>(EMPTY_IDEA_SECTION);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<IdeaFeedbackState>(CLOSED_FEEDBACK);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  useUnsavedChangesGuard(isDraftDirty(sectionData, EMPTY_IDEA_SECTION));

  const sendableMediaCount = getSendableMedias(sectionData.medias).length;
  const mediaStatus = getIdeaMediaStatus(sendableMediaCount, sectionData.medias.length);

  const showMessage = (message: string, severity: FeedbackSeverity) =>
    setFeedback({ open: true, message, severity });

  const handleCancel = () => {
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
      await createIdeasSection(buildMemberIdeaFormData(sectionData));

      setSectionData(EMPTY_IDEA_SECTION);
      showMessage(IDEA_SHARE_COPY.SUCCESS, 'success');
      redirectTimer.current = setTimeout(() => navigate(MEMBER_AREA_HOME_PATH), IDEA_SHARE_REDIRECT_DELAY_MS);
    } catch (error: unknown) {
      showMessage(ideasSectionErrorMessage(error, IDEA_SHARE_COPY.FAILURE), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack data-testid={IDEA_SHARE_TEST_IDS.PAGE} spacing={{ xs: 2, md: 3 }}>
      <Paper
        data-testid={IDEA_SHARE_TEST_IDS.FORM_CARD}
        elevation={0}
        sx={MEMBER_CARD_SX}
      >
        <IdeasMaterialSectionUser section={sectionData} onUpdate={setSectionData} />
      </Paper>

      <Paper
        data-testid={IDEA_SHARE_TEST_IDS.ACTIONS}
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
          data-testid={IDEA_SHARE_TEST_IDS.MEDIA_STATUS}
          severity={IDEA_MEDIA_STATUS_SEVERITY[mediaStatus]}
          variant="outlined"
          sx={{ py: 0, flex: 1 }}
        >
          {getIdeaMediaStatusMessage(mediaStatus, sendableMediaCount)}
        </Alert>

        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
          <Button
            data-testid={IDEA_SHARE_TEST_IDS.CANCEL}
            variant="outlined"
            color="inherit"
            onClick={handleCancel}
            disabled={loading}
            sx={{ minHeight: MIN_TOUCH_TARGET_PX, textTransform: 'none', fontWeight: 600 }}
          >
            {IDEA_SHARE_COPY.CANCEL}
          </Button>
          <Button
            data-testid={IDEA_SHARE_TEST_IDS.SUBMIT}
            variant="contained"
            onClick={handleShareIdea}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LightbulbIcon />}
            sx={{ minHeight: MIN_TOUCH_TARGET_PX, px: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {loading ? IDEA_SHARE_COPY.SUBMITTING : IDEA_SHARE_COPY.SUBMIT}
          </Button>
        </Stack>
      </Paper>

      <PageFeedbackSnackbar
        testId={IDEA_SHARE_TEST_IDS.SNACKBAR}
        open={feedback.open}
        message={feedback.message}
        severity={feedback.severity}
        filled
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </Stack>
  );
}
