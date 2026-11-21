import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '@mui/material';
import { AppDispatch } from '@/store/slices';
import { apiCreateImagePage, apiUpdateImagePage } from '@/features/image-pages/api';
import type { ImagePageEditState } from '@/features/image-pages/types';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import { MediaItem } from 'store/slices/types';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { AddImageModal } from './AddImageModal';
import { LoadingSpinner } from './LoadingSpinner';
import ImageSection from './ImageSection';
import {
  GALLERY_FALLBACK_PATH,
  IMAGE_PAGE_MESSAGES,
  IMAGE_PAGE_TEST_ID,
} from './constants';
import { buildImageFormData, sectionToEditable, validateImageDraft } from './utils';
import PageFormBase from '../shared/PageFormBase';
import PageBasicInfoSection from '../shared/PageBasicInfoSection';
import PageFormActions from '../shared/PageFormActions';
import PageFeedbackSnackbar from '../shared/PageFeedbackSnackbar';
import { PAGE_ACTION_BUTTON_SX } from '../shared/styles';
import { useTouchedFields } from '../shared/useTouchedFields';

interface ImageProps {
  fromTemplatePage?: boolean;
}

export default function ImagePageCreator({ fromTemplatePage }: ImageProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const imageData = (location.state as ImagePageEditState | null)?.imagePage ?? null;

  const [sections, setSections] = useState<SectionData[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const { touched, setField, touchAll } = useTouchedFields();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => { });
  const [isSaving, setIsSaving] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!imageData && !fromTemplatePage) {
      navigate(GALLERY_FALLBACK_PATH);
      return;
    }
    if (imageData) {
      setTitle(imageData.title ?? '');
      setDescription(imageData.description);
      setIsPublic(imageData.public ?? true);
      setSections(imageData.sections.map(sectionToEditable));
    }
  }, [imageData, navigate, fromTemplatePage]);

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorSnackbarOpen(true);
  };

  const handleSaveAll = async () => {
    touchAll();
    const problem = validateImageDraft({ title, description, sections });
    if (problem) return showError(problem);

    try {
      setIsSaving(true);
      const formData = buildImageFormData({
        draft: { title, description, sections },
        isPublic,
        fromTemplatePage: Boolean(fromTemplatePage),
        existingId: imageData?.id,
      });
      const saved = fromTemplatePage
        ? await apiCreateImagePage(formData)
        : await apiUpdateImagePage(imageData?.id ?? '', formData);

      await dispatch(fetchRoutes());
      navigate(`/${saved.route?.path}`);
      setSuccessSnackbarOpen(true);
    } catch {
      showError(IMAGE_PAGE_MESSAGES.SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (index: number) => {
    setCurrentEditingIndex(index);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleModalSubmit = (medias: MediaItem[]) => {
    if (currentEditingIndex !== null) {
      updateSection(currentEditingIndex, (section) => ({
        ...section,
        mediaItems: [...section.mediaItems, ...medias],
      }));
    }
    closeModal();
  };

  const updateSection = (index: number, change: (section: SectionData) => SectionData) =>
    setSections((prev) => prev.map((section, i) => (i === index ? change(section) : section)));

  const addSection = () =>
    setSections((prev) => [...prev, { caption: '', description: '', public: true, mediaItems: [] }]);

  const askConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setConfirmModalOpen(true);
  };

  const removeSection = (index: number) =>
    askConfirmation(IMAGE_PAGE_MESSAGES.CONFIRM_REMOVE_SECTION, () =>
      setSections((prev) => prev.filter((_, i) => i !== index)),
    );

  const removeMediaFromSection = (sectionIndex: number, mediaIndex: number) =>
    askConfirmation(IMAGE_PAGE_MESSAGES.CONFIRM_REMOVE_MEDIA, () =>
      updateSection(sectionIndex, (section) => ({
        ...section,
        mediaItems: section.mediaItems.filter((_, j) => j !== mediaIndex),
      })),
    );

  return (
    <PageFormBase
      testId={IMAGE_PAGE_TEST_ID}
      heading={fromTemplatePage ? IMAGE_PAGE_MESSAGES.CREATE_HEADING : IMAGE_PAGE_MESSAGES.EDIT_HEADING}
      onBack={() => navigate(-1)}
    >
      <LoadingSpinner open={isSaving} />

      <DeleteConfirmationModal
        open={confirmModalOpen}
        description={confirmMessage}
        onConfirm={() => {
          onConfirmAction();
          setConfirmModalOpen(false);
        }}
        onClose={() => setConfirmModalOpen(false)}
        loading={false}
      />

      <PageFeedbackSnackbar
        testId={`${IMAGE_PAGE_TEST_ID}-success`}
        open={successSnackbarOpen}
        message={IMAGE_PAGE_MESSAGES.SAVED}
        severity="success"
        filled
        onClose={() => setSuccessSnackbarOpen(false)}
      />
      <PageFeedbackSnackbar
        testId={`${IMAGE_PAGE_TEST_ID}-error`}
        open={errorSnackbarOpen}
        message={errorMessage}
        severity="error"
        filled
        onClose={() => setErrorSnackbarOpen(false)}
      />

      <PageBasicInfoSection
        testId={IMAGE_PAGE_TEST_ID}
        titleLabel={IMAGE_PAGE_MESSAGES.TITLE_LABEL}
        descriptionLabel={IMAGE_PAGE_MESSAGES.DESCRIPTION_LABEL}
        title={title}
        description={description}
        isPublic={isPublic}
        touched={touched}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onPublicChange={setIsPublic}
        onTouchedChange={setField}
      />

      {sections.map((section, index) => (
        <ImageSection
          key={index}
          mediaItems={section.mediaItems}
          caption={section.caption}
          description={section.description}
          isPublic={section.public}
          onCaptionChange={(caption) => updateSection(index, (s) => ({ ...s, caption }))}
          onDescriptionChange={(value) => updateSection(index, (s) => ({ ...s, description: value }))}
          onPublicChange={(value) => updateSection(index, (s) => ({ ...s, public: value }))}
          onRemoveMedia={(mediaIndex) => removeMediaFromSection(index, mediaIndex)}
          onOpenModal={() => openModal(index)}
          onRemoveSection={() => removeSection(index)}
        />
      ))}

      <PageFormActions
        testId={IMAGE_PAGE_TEST_ID}
        saveLabel={IMAGE_PAGE_MESSAGES.SAVE}
        savingLabel="Salvando..."
        isSaving={isSaving}
        onCancel={() => navigate(-1)}
        onSave={handleSaveAll}
      >
        <Button
          data-testid={`${IMAGE_PAGE_TEST_ID}-add-section`}
          variant="contained"
          size="large"
          onClick={addSection}
          sx={{ ...PAGE_ACTION_BUTTON_SX, '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}
        >
          {IMAGE_PAGE_MESSAGES.NEW_SECTION}
        </Button>
      </PageFormActions>

      <AddImageModal isOpen={isModalOpen} onClose={closeModal} onSubmit={handleModalSubmit} />
    </PageFormBase>
  );
}
