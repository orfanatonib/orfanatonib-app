import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { AppDispatch } from '@/store/slices';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import { apiSaveVideoPage } from '@/features/video-pages/api';
import { useVideoPageById } from '@/features/video-pages/hooks';
import { VIDEO_PAGES_LIST_PATH } from '@/features/video-pages/utils';
import { MediaItem, MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';
import VideoForm from './VideoForm';
import VideoList from './VideoList';
import {
  UPLOAD_SIMULATED_DELAY_MS,
  VIDEO_PAGE_MESSAGES,
  VIDEO_PAGE_TEST_ID,
} from './constants';
import { SnackbarKind, VideoFieldErrors } from './types';
import {
  NO_VIDEO_ERRORS,
  buildVideoFormData,
  createEmptyVideo,
  validateNewVideo,
  validateVideoPage,
  videoToEditable,
} from './utils';
import PageFormBase from '../shared/PageFormBase';
import PageBasicInfoSection from '../shared/PageBasicInfoSection';
import PageFormActions from '../shared/PageFormActions';
import PageFeedbackSnackbar from '../shared/PageFeedbackSnackbar';
import { MediaFileKind } from '../shared/types';
import { useMediaUpload } from '../shared/useMediaUpload';
import { useTouchedFields } from '../shared/useTouchedFields';

interface VideoProps {
  fromTemplatePage?: boolean;
}

export default function VideoPageCreator({ fromTemplatePage = false }: VideoProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const editId = fromTemplatePage ? null : searchParams.get('id');
  const { page: videoData, error: loadError } = useVideoPageById(editId);
  const upload = useMediaUpload({ kind: MediaFileKind.VIDEO });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [newVideo, setNewVideo] = useState<MediaItem>(createEmptyVideo);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<VideoFieldErrors>(NO_VIDEO_ERRORS);
  const { touched, setField, touchAll } = useTouchedFields();
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarKind>(SnackbarKind.SUCCESS);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDeleteIndex, setVideoToDeleteIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (fromTemplatePage) {
      setTitle('');
      setDescription('');
      setVideos([]);
      setIsPublic(true);
      return;
    }
    if (!editId || loadError) {
      navigate(VIDEO_PAGES_LIST_PATH, { replace: true });
      return;
    }
    if (videoData) {
      setTitle(videoData.title ?? '');
      setDescription(videoData.description ?? '');
      setIsPublic(videoData.public ?? true);
      setVideos(videoData.videos.map(videoToEditable));
    }
  }, [fromTemplatePage, editId, loadError, videoData, navigate]);

  const areUploadsComplete = () => Object.values(uploadProgress).every((v) => v !== false);

  const notify = (message: string, kind: SnackbarKind) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(kind);
    setSnackbarOpen(true);
  };
  const showError = (message: string) => notify(message, SnackbarKind.ERROR);

  const handleSavePage = async () => {
    touchAll();
    const problem = validateVideoPage({
      title,
      description,
      hasId: Boolean(videoData?.id),
      fromTemplatePage,
      videoCount: videos.length,
      uploadsComplete: areUploadsComplete(),
    });
    if (problem) return showError(problem);

    setLoading(true);
    try {
      const formData = buildVideoFormData({
        videos,
        title,
        description,
        isPublic,
        fromTemplatePage,
        existingId: videoData?.id,
      });
      const response = await apiSaveVideoPage(formData, fromTemplatePage ? undefined : videoData?.id);

      await dispatch(fetchRoutes());
      navigate(`/${response.route.path}`);
      notify(
        fromTemplatePage ? VIDEO_PAGE_MESSAGES.CREATED : VIDEO_PAGE_MESSAGES.UPDATED,
        SnackbarKind.SUCCESS,
      );
    } catch {
      showError(VIDEO_PAGE_MESSAGES.SAVE_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = () => {
    const validation = validateNewVideo(newVideo, editingIndex !== null);
    setErrors(validation.errors);
    if (validation.hasError || !validation.isValidUrl) {
      if (!validation.isValidUrl) showError(VIDEO_PAGE_MESSAGES.INVALID_URL);
      return;
    }

    const updatedVideo: MediaItem = {
      ...newVideo,
      id: editingIndex !== null ? videos[editingIndex].id : undefined,
      isLocalFile: newVideo.uploadType === MediaUploadType.UPLOAD,
      mediaType: MediaType.VIDEO,
    };

    if (editingIndex !== null) {
      setVideos((prev) => prev.map((v, i) => (i === editingIndex ? updatedVideo : v)));
      setEditingIndex(null);
    } else {
      setVideos((prev) => [...prev, updatedVideo]);
    }

    if (newVideo.uploadType === MediaUploadType.UPLOAD && newVideo.file) {
      setUploadProgress((prev) => ({ ...prev, [newVideo.file!.name]: true }));
    }
    // O vídeo adicionado passa a ser dono da URL de pré-visualização.
    upload.detachAll();
    setNewVideo(createEmptyVideo());
  };

  const handleConfirmDelete = () => {
    if (videoToDeleteIndex !== null) {
      setVideos((prev) => prev.filter((_, i) => i !== videoToDeleteIndex));
      if (editingIndex === videoToDeleteIndex) {
        setEditingIndex(null);
        setNewVideo(createEmptyVideo());
      }
      notify(VIDEO_PAGE_MESSAGES.VIDEO_REMOVED, SnackbarKind.SUCCESS);
    }
    setDeleteDialogOpen(false);
    setVideoToDeleteIndex(null);
  };

  const handleEditVideo = (index: number) => {
    setNewVideo({ ...videos[index], file: undefined });
    setEditingIndex(index);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [selection] = upload.selectFiles(e.target.files);
    if (!selection) return;
    const { file, previewUrl } = selection;

    setUploadProgress((prev) => ({ ...prev, [file.name]: false }));
    setNewVideo((prev) => ({
      ...prev,
      file,
      url: previewUrl,
      isLocalFile: true,
      uploadType: MediaUploadType.UPLOAD,
      platformType: undefined,
    }));
    setTimeout(() => {
      setUploadProgress((prev) => ({ ...prev, [file.name]: true }));
    }, UPLOAD_SIMULATED_DELAY_MS);
  };

  return (
    <PageFormBase
      testId={VIDEO_PAGE_TEST_ID}
      heading={fromTemplatePage ? VIDEO_PAGE_MESSAGES.CREATE_HEADING : VIDEO_PAGE_MESSAGES.EDIT_HEADING}
      onBack={() => navigate(-1)}
    >
      <PageBasicInfoSection
        testId={VIDEO_PAGE_TEST_ID}
        titleLabel={VIDEO_PAGE_MESSAGES.TITLE_LABEL}
        descriptionLabel={VIDEO_PAGE_MESSAGES.DESCRIPTION_LABEL}
        title={title}
        description={description}
        isPublic={isPublic}
        touched={touched}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onPublicChange={setIsPublic}
        onTouchedChange={setField}
      />

      <VideoForm
        newVideo={newVideo}
        errors={errors}
        setNewVideo={setNewVideo}
        handleUploadFile={handleUploadFile}
        handleAddVideo={handleAddVideo}
        isEditing={editingIndex !== null}
        uploadProgress={uploadProgress}
      />

      <VideoList
        videos={videos}
        handleRemoveVideo={(index) => {
          setVideoToDeleteIndex(index);
          setDeleteDialogOpen(true);
        }}
        handleEditVideo={handleEditVideo}
      />

      <PageFormActions
        testId={VIDEO_PAGE_TEST_ID}
        saveLabel={VIDEO_PAGE_MESSAGES.SAVE}
        savingLabel={VIDEO_PAGE_MESSAGES.SAVING}
        isSaving={loading}
        saveDisabled={!areUploadsComplete()}
        savingSpinner
        onCancel={() => navigate(-1)}
        onSave={handleSavePage}
      />

      <Dialog data-testid={`${VIDEO_PAGE_TEST_ID}-delete-dialog`} open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            data-testid={`${VIDEO_PAGE_TEST_ID}-delete-cancel`}
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
          >
            Cancelar
          </Button>
          <Button
            data-testid={`${VIDEO_PAGE_TEST_ID}-delete-confirm`}
            onClick={handleConfirmDelete}
            color="error"
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <PageFeedbackSnackbar
        testId={`${VIDEO_PAGE_TEST_ID}-feedback`}
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </PageFormBase>
  );
}
