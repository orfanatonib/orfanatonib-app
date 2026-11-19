import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/slices';
import api from '@/config/axiosConfig';
import { fetchRoutes } from '@/store/slices/route/routeSlice';
import { AddImageModal } from './AddImageModal';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import { Notification } from './NotificationModal';
import { LoadingSpinner } from './LoadingSpinner';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  Paper,
  IconButton,
  Grid,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { ImagePageData } from '@/store/slices/image/imageSlice';
import ImageSection from './ImageSection';
import { MediaItem, MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';

interface ImageProps {
  fromTemplatePage?: boolean;
}

function sectionToEditable(section: SectionData): SectionData {
  return {
    ...section,
    public: section.public ?? true,
    mediaItems: section.mediaItems.map((media) => ({
      ...media,
      file: undefined,
    })),
  };
}

export default function ImagePageCreator({ fromTemplatePage }: ImageProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const imageData = useSelector((state: RootState) => state.image.imageData);

  const [sections, setSections] = useState<SectionData[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [touched, setTouched] = useState({ title: false, description: false });
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
      navigate('/feed-abrigos');
      return;
    }

    if (imageData) {
      setTitle(imageData.title ?? '');
      setDescription(imageData.description);
      setIsPublic(imageData.public ?? true);
      setSections(imageData.sections.map(sectionToEditable));
    }
  }, [imageData, navigate, fromTemplatePage]);

  const setError = (message: string): false => {
    setErrorMessage(message);
    setErrorSnackbarOpen(true);
    return false;
  };

  const validate = (): boolean => {
    if (!title.trim()) return setError('O título da galeria é obrigatório.');
    if (!description.trim()) return setError('A descrição da galeria é obrigatória.');
    if (sections.length === 0) return setError('Adicione pelo menos uma seção.');

    for (let i = 0; i < sections.length; i++) {
      const { caption, description, mediaItems } = sections[i];
      if (!caption.trim()) return setError(`A seção ${i + 1} precisa de um título.`);
      if (!description.trim()) return setError(`A seção ${i + 1} precisa de uma descrição.`);
      if (mediaItems.length === 0)
        return setError(`A seção ${i + 1} precisa conter pelo menos uma mídia.`);
    }

    return true;
  };

  const handleSaveAll = async () => {
    setTouched({ title: true, description: true });
    if (!validate()) return;

    try {
      setIsSaving(true);
      const formData = new FormData();

      const sectionsPayload: SectionData[] = sections.map((section, sectionIndex) => {
        const mediaItems: MediaItem[] = section.mediaItems.map((media, mediaIndex) => {
          const fieldKey = `file_sec${sectionIndex}_mid${mediaIndex}`;

          if (media.isLocalFile && media.file) {
            formData.append(fieldKey, media.file);
          }

          const baseMedia: MediaItem = {
            isLocalFile: media.isLocalFile,
            url: media.url || '',
            uploadType: media.uploadType || MediaUploadType.UPLOAD,
            mediaType: MediaType.IMAGE,
            title: media.title || '',
            description: media.description || '',
            platformType: media.platformType || MediaPlatform.ANY,
            originalName: media.originalName,
            size: media.size,
            fieldKey,
          };

          return fromTemplatePage && !media.id ? baseMedia : { ...baseMedia, id: media.id };
        });

        const baseSection = {
          public: section.public,
          caption: section.caption,
          description: section.description,
          mediaItems,
        };

        return fromTemplatePage && !section.id ? baseSection : { ...baseSection, id: section.id };
      });

      const payload: ImagePageData = {
        ...((fromTemplatePage === false || fromTemplatePage === undefined) &&
          imageData?.id && { id: imageData.id }),
        public: isPublic,
        title,
        description,
        sections: sectionsPayload,
      };

      formData.append('imageData', JSON.stringify(payload));

      const response = fromTemplatePage
        ? await api.post('/image-pages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        : await api.patch(`/image-pages/${imageData?.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

      await dispatch(fetchRoutes());
      navigate(`/${response.data.route.path}`);
      setSuccessSnackbarOpen(true);
    } catch {
      setError('Erro ao enviar dados.');
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
      setSections((prev) =>
        prev.map((section, i) =>
          i === currentEditingIndex
            ? { ...section, mediaItems: [...section.mediaItems, ...medias] }
            : section
        )
      );
    }
    closeModal();
  };

  const addSection = () =>
    setSections((prev) => [
      ...prev,
      { caption: '', description: '', public: true, mediaItems: [] },
    ]);

  const removeSection = (index: number) => {
    setConfirmMessage('Tem certeza que deseja excluir esta seção?');
    setOnConfirmAction(() => () => setSections((prev) => prev.filter((_, i) => i !== index)));
    setConfirmModalOpen(true);
  };

  const removeMediaFromSection = (sectionIndex: number, mediaIndex: number) => {
    setConfirmMessage('Tem certeza que deseja excluir esta mídia?');
    setOnConfirmAction(
      () => () =>
        setSections((prev) =>
          prev.map((section, i) =>
            i === sectionIndex
              ? {
                ...section,
                mediaItems: section.mediaItems.filter((_, j) => j !== mediaIndex),
              }
              : section
          )
        )
    );
    setConfirmModalOpen(true);
  };

  const updateCaption = (index: number, caption: string) => {
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, caption } : section))
    );
  };

  const updateDescription = (index: number, description: string) => {
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, description } : section))
    );
  };

  const updatePublicFlag = (index: number, value: boolean) => {
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, public: value } : section))
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth={false} sx={{ width: { xs: '98%', md: '95%' }, mx: 'auto', px: { xs: 1, md: 2 } }}>
        <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            {fromTemplatePage ? '📸 Criar Galeria de Fotos' : '✏️ Editar Galeria de Fotos'}
          </Typography>
        </Box>

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

        <Notification
          open={successSnackbarOpen}
          message="Página salva com sucesso!"
          severity="success"
          onClose={() => setSuccessSnackbarOpen(false)}
        />

        <Notification
          open={errorSnackbarOpen}
          message={errorMessage}
          severity="error"
          onClose={() => setErrorSnackbarOpen(false)}
        />

        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Informações Básicas
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título da Galeria"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (touched.title) setTouched((prev) => ({ ...prev, title: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                error={touched.title && !title.trim()}
                helperText={touched.title && !title.trim() ? 'Campo obrigatório' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover:not(.Mui-error)': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: 1,
                    fontSize: '0.75rem',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição da Galeria"
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (touched.description) setTouched((prev) => ({ ...prev, description: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                error={touched.description && !description.trim()}
                helperText={touched.description && !description.trim() ? 'Campo obrigatório' : ''}
                multiline
                rows={4}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover:not(.Mui-error)': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: 1,
                    fontSize: '0.75rem',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
                label="Página pública"
              />
            </Grid>
          </Grid>
        </Paper>

        {sections.map((section, index) => (
          <ImageSection
            key={index}
            mediaItems={section.mediaItems}
            caption={section.caption}
            description={section.description}
            isPublic={section.public}
            onCaptionChange={(val) => updateCaption(index, val)}
            onDescriptionChange={(val) => updateDescription(index, val)}
            onPublicChange={(val) => updatePublicFlag(index, val)}
            onRemoveMedia={(mediaIndex) => removeMediaFromSection(index, mediaIndex)}
            onOpenModal={() => openModal(index)}
            onRemoveSection={() => removeSection(index)}
          />
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: 2,
                bgcolor: 'action.hover',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={addSection}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              transition: 'all 0.2s ease',
            }}
          >
            + Nova Seção
          </Button>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<Save />}
            onClick={handleSaveAll}
            disabled={isSaving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover:not(:disabled)': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              '&:disabled': {
                opacity: 0.6,
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>

        <AddImageModal isOpen={isModalOpen} onClose={closeModal} onSubmit={handleModalSubmit} />
      </Container>
    </Box>
  );
}
