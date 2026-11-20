import { useEffect, useRef, useState } from 'react';
import { Box, Chip, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Typography } from '@mui/material';
import { Lock, Public } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/slices';
import { clearIdeasSectionData, type IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { attachIdeasSectionToPage, ideasSectionErrorMessage } from '@/features/ideas-sections';
import { IdeasMaterialSection } from '../IdeasMaterialPageCreator/IdeasMaterialSection';
import PageFormBase from '../shared/PageFormBase';
import PageFormActions from '../shared/PageFormActions';
import PageFeedbackSnackbar from '../shared/PageFeedbackSnackbar';
import { PAGE_PAPER_SX } from '../shared/styles';
import {
  ADMIN_IDEAS_SECTIONS_PATH,
  ADMIN_REDIRECT_DELAY_MS,
  ADMIN_SAVE_ISSUE_MESSAGES,
  CLOSED_FEEDBACK,
  EMPTY_IDEA_SECTION,
  IDEAS_SECTION_ADMIN_COPY,
  IDEAS_SECTION_ADMIN_TEST_ID,
  IDEAS_SECTION_ADMIN_TEST_IDS,
  MIN_TOUCH_TARGET_PX,
} from './constants';
import type { IdeaFeedbackState, IdeasPageOption, IdeasSectionAdminEditorProps } from './types';
import { useIdeasPageOptions } from './useIdeasPageOptions';
import {
  buildAdminSectionFormData,
  findPageOption,
  isPublicValue,
  publicToValue,
  validateAdminSave,
} from './utils';

export function IdeasSectionAdminEditor({ existingSection }: IdeasSectionAdminEditorProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { ideasSectionData } = useSelector((state: RootState) => state.ideas);

  const [sectionData, setSectionData] = useState<IdeasSection>(
    existingSection || ideasSectionData || EMPTY_IDEA_SECTION,
  );
  const [selectedPage, setSelectedPage] = useState<IdeasPageOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageTouched, setPageTouched] = useState(false);
  const [feedback, setFeedback] = useState<IdeaFeedbackState>(CLOSED_FEEDBACK);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showError = (message: string) => setFeedback({ open: true, message, severity: 'error' });
  const { pages, loading: pagesLoading } = useIdeasPageOptions(showError);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const handleBack = () => {
    dispatch(clearIdeasSectionData());
    navigate(ADMIN_IDEAS_SECTIONS_PATH);
  };

  const handleSaveSection = async () => {
    setPageTouched(true);

    const issue = validateAdminSave({ pageId: selectedPage?.id ?? null, sectionId: existingSection?.id });
    if (issue || !selectedPage || !existingSection?.id) {
      if (issue) showError(ADMIN_SAVE_ISSUE_MESSAGES[issue]);
      return;
    }

    setLoading(true);
    try {
      await attachIdeasSectionToPage(existingSection.id, selectedPage.id, buildAdminSectionFormData(sectionData));
      dispatch(clearIdeasSectionData());
      setFeedback({ open: true, message: IDEAS_SECTION_ADMIN_COPY.SUCCESS, severity: 'success' });
      redirectTimer.current = setTimeout(() => navigate(ADMIN_IDEAS_SECTIONS_PATH), ADMIN_REDIRECT_DELAY_MS);
    } catch (error: unknown) {
      showError(ideasSectionErrorMessage(error, IDEAS_SECTION_ADMIN_COPY.SAVE_FAILED));
    } finally {
      setLoading(false);
    }
  };

  const pageInvalid = pageTouched && !selectedPage;

  return (
    <PageFormBase
      testId={IDEAS_SECTION_ADMIN_TEST_ID}
      heading={IDEAS_SECTION_ADMIN_COPY.HEADING}
      onBack={handleBack}
    >
      <Paper
        data-testid={IDEAS_SECTION_ADMIN_TEST_IDS.SETTINGS}
        elevation={2}
        sx={PAGE_PAPER_SX}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          {IDEAS_SECTION_ADMIN_COPY.SETTINGS}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl
              data-testid={IDEAS_SECTION_ADMIN_TEST_IDS.PAGE_SELECT}
              fullWidth
              required
              error={pageInvalid}
            >
              <InputLabel>{IDEAS_SECTION_ADMIN_COPY.PAGE_LABEL}</InputLabel>
              <Select
                value={selectedPage?.id || ''}
                label={IDEAS_SECTION_ADMIN_COPY.PAGE_LABEL}
                onChange={(event) => {
                  setSelectedPage(findPageOption(pages, event.target.value));
                  setPageTouched(false);
                }}
                onBlur={() => setPageTouched(true)}
                disabled={pagesLoading}
                sx={{ borderRadius: 2, minHeight: MIN_TOUCH_TARGET_PX }}
              >
                <MenuItem value="" disabled>
                  <em>{IDEAS_SECTION_ADMIN_COPY.PAGE_PLACEHOLDER}</em>
                </MenuItem>
                {pages.map((page) => (
                  <MenuItem key={page.id} value={page.id} sx={{ minHeight: MIN_TOUCH_TARGET_PX }}>
                    {page.title}
                  </MenuItem>
                ))}
              </Select>
              {pageInvalid && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                  {IDEAS_SECTION_ADMIN_COPY.PAGE_REQUIRED}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl data-testid={IDEAS_SECTION_ADMIN_TEST_IDS.VISIBILITY} fullWidth>
              <InputLabel>{IDEAS_SECTION_ADMIN_COPY.VISIBILITY_LABEL}</InputLabel>
              <Select
                value={publicToValue(sectionData.public)}
                label={IDEAS_SECTION_ADMIN_COPY.VISIBILITY_LABEL}
                onChange={(event) => setSectionData({ ...sectionData, public: isPublicValue(event.target.value) })}
                sx={{ borderRadius: 2, minHeight: MIN_TOUCH_TARGET_PX }}
              >
                <MenuItem value="true" sx={{ minHeight: MIN_TOUCH_TARGET_PX }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Public fontSize="small" />
                    {IDEAS_SECTION_ADMIN_COPY.PUBLIC}
                  </Box>
                </MenuItem>
                <MenuItem value="false" sx={{ minHeight: MIN_TOUCH_TARGET_PX }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lock fontSize="small" />
                    {IDEAS_SECTION_ADMIN_COPY.PRIVATE}
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {selectedPage && (
          <Box
            data-testid={IDEAS_SECTION_ADMIN_TEST_IDS.SELECTED_PAGE}
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'success.lighter',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'success.main',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Chip
              icon={<Public />}
              label={IDEAS_SECTION_ADMIN_COPY.SELECTED_PAGE_CHIP}
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              <strong>{selectedPage.title}</strong>
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper
        data-testid={IDEAS_SECTION_ADMIN_TEST_IDS.MEDIA_CARD}
        elevation={2}
        sx={PAGE_PAPER_SX}
      >
        <IdeasMaterialSection section={sectionData} onUpdate={setSectionData} isCreationMode={false} />
      </Paper>

      <PageFormActions
        testId={IDEAS_SECTION_ADMIN_TEST_ID}
        saveLabel={IDEAS_SECTION_ADMIN_COPY.SAVE}
        savingLabel={IDEAS_SECTION_ADMIN_COPY.SAVING}
        saveColor="primary"
        savingSpinner
        isSaving={loading}
        saveDisabled={!selectedPage}
        onCancel={handleBack}
        onSave={handleSaveSection}
      />

      <PageFeedbackSnackbar
        testId={IDEAS_SECTION_ADMIN_TEST_IDS.FEEDBACK}
        open={feedback.open}
        message={feedback.message}
        severity={feedback.severity}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </PageFormBase>
  );
}
