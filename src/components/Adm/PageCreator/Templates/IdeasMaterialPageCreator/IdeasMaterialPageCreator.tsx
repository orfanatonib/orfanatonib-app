import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'store/slices';
import { fetchRoutes } from 'store/slices/route/routeSlice';
import { clearIdeasData, IdeasSection } from 'store/slices/ideas/ideasSlice';
import api from '@/config/axiosConfig';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import { IdeasMaterialSection } from './IdeasMaterialSection';
import {
  IDEAS_PAGES_ENDPOINT,
  IDEAS_PAGE_MESSAGES,
  IDEAS_PAGE_TEST_ID,
} from './constants';
import { buildIdeasFormData, hasIdeasErrors } from './utils';
import PageFormBase from '../shared/PageFormBase';
import PageBasicInfoSection from '../shared/PageBasicInfoSection';
import PageFormActions from '../shared/PageFormActions';
import PageFeedbackSnackbar from '../shared/PageFeedbackSnackbar';
import { PAGE_ACTION_BUTTON_SX, PAGE_PAPER_SX } from '../shared/styles';
import { useTouchedFields } from '../shared/useTouchedFields';
import { FeedbackSeverity } from '../shared/types';

interface PageCreatorProps {
  fromTemplatePage?: boolean;
}

export function IdeasMaterialPageCreator({ fromTemplatePage }: PageCreatorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const ideasData = useSelector((state: RootState) => state.ideas.ideasData);

  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [sections, setSections] = useState<IdeasSection[]>([]);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { touched, setField, touchAll } = useTouchedFields();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: FeedbackSeverity }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (fromTemplatePage) {
      dispatch(clearIdeasData());
      setPageTitle('');
      setPageDescription('');
      setSections([]);
    } else if (ideasData) {
      setPageTitle(ideasData.title || '');
      setPageDescription(ideasData.description || '');
      setSections(ideasData.sections || []);
    }
  }, [fromTemplatePage, ideasData, dispatch]);

  const handleAddSection = () => {
    const newSection: IdeasSection = {
      title: '',
      description: '',
      medias: [],
    };
    setSections((prev) => [...prev, newSection]);
    setExpandedSectionIndex(sections.length);
  };

  const handleUpdateSection = (index: number, updatedSection: IdeasSection) => {
    setSections((prev) => prev.map((s, i) => (i === index ? updatedSection : s)));
  };

  const handleDeleteSectionClick = (index: number) => {
    setSectionToDelete(index);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSection = () => {
    if (sectionToDelete !== null) {
      setSections((prev) => prev.filter((_, i) => i !== sectionToDelete));
      if (expandedSectionIndex === sectionToDelete) {
        setExpandedSectionIndex(null);
      }
      setSectionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSavePage = async () => {
    touchAll();

    if (hasIdeasErrors({ title: pageTitle, description: pageDescription, sectionCount: sections.length })) {
      setSnackbar({ open: true, message: IDEAS_PAGE_MESSAGES.REQUIRED, severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const formData = buildIdeasFormData({
        title: pageTitle,
        description: pageDescription,
        sections,
        fromTemplatePage: Boolean(fromTemplatePage),
        existingId: ideasData?.id,
      });
      const headers = { 'Content-Type': 'multipart/form-data' };
      const response = await (fromTemplatePage
        ? api.post(IDEAS_PAGES_ENDPOINT, formData, { headers })
        : api.patch(`${IDEAS_PAGES_ENDPOINT}/${ideasData?.id}`, formData, { headers }));

      if (!response?.data) throw new Error(IDEAS_PAGE_MESSAGES.SAVE_FAILED);

      setSnackbar({ open: true, message: IDEAS_PAGE_MESSAGES.SAVED, severity: 'success' });
      await dispatch(fetchRoutes());
      navigate(`/${response.data.route.path}`);
    } catch {
      setSnackbar({ open: true, message: IDEAS_PAGE_MESSAGES.SAVE_ERROR, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFormBase
      testId={IDEAS_PAGE_TEST_ID}
      heading={fromTemplatePage ? IDEAS_PAGE_MESSAGES.CREATE_HEADING : IDEAS_PAGE_MESSAGES.EDIT_HEADING}
      onBack={() => navigate(-1)}
    >
      <PageBasicInfoSection
        testId={IDEAS_PAGE_TEST_ID}
        titleLabel={IDEAS_PAGE_MESSAGES.TITLE_LABEL}
        descriptionLabel={IDEAS_PAGE_MESSAGES.DESCRIPTION_LABEL}
        title={pageTitle}
        description={pageDescription}
        isPublic
        showPublicSwitch={false}
        touched={touched}
        onTitleChange={setPageTitle}
        onDescriptionChange={setPageDescription}
        onPublicChange={() => undefined}
        onTouchedChange={setField}
      />

      {sections.length > 0 && (
        <Paper elevation={2} sx={PAGE_PAPER_SX}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            📚 Seções ({sections.length})
          </Typography>
          {sections.map((section, index) => (
            <Accordion
              key={index}
              expanded={expandedSectionIndex === index}
              onChange={() => setExpandedSectionIndex(expandedSectionIndex === index ? null : index)}
              sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  borderRadius: 2,
                  '&.Mui-expanded': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                }}
              >
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                  {section.title || `Seção ${index + 1}`}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <IdeasMaterialSection
                  section={section}
                  onUpdate={(updatedSection) => handleUpdateSection(index, updatedSection)}
                />
              </AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderTop: 1, borderColor: 'divider' }}>
                <IconButton
                  color="error"
                  aria-label="Excluir seção"
                  onClick={() => handleDeleteSectionClick(index)}
                  sx={{ '&:hover': { bgcolor: 'error.lighter' } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Accordion>
          ))}
        </Paper>
      )}

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddSection}
          sx={{
            ...PAGE_ACTION_BUTTON_SX,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-2px)',
              boxShadow: 3,
              bgcolor: 'action.hover',
            },
          }}
        >
          Adicionar Seção
        </Button>
      </Box>

      <PageFormActions
        testId={IDEAS_PAGE_TEST_ID}
        saveLabel={IDEAS_PAGE_MESSAGES.SAVE}
        savingLabel={IDEAS_PAGE_MESSAGES.SAVING}
        saveColor="primary"
        isSaving={loading}
        savingSpinner
        onCancel={() => navigate(-1)}
        onSave={handleSavePage}
      />

      <DeleteConfirmationModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteSection}
        loading={false}
        description={IDEAS_PAGE_MESSAGES.DELETE_SECTION}
      />

      <PageFeedbackSnackbar
        testId={`${IDEAS_PAGE_TEST_ID}-feedback`}
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
