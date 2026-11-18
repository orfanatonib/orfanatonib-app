import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Paper, Stack } from '@mui/material';

import api from '@/config/axiosConfig';
import { setData, clearData, SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { MediaType, MediaUploadType, MediaPlatform } from '@/store/slices/types';
import { RootState } from '@/store/slices';

import { MEMBER_AREA_HOME_PATH, MEMBER_CARD_SX } from '../constants/navigation';
import { LoadingSpinner } from '../components/Modals';
import { NotificationModal } from '../components/Modals';
import ImageSectionEditor from './ImageSectionEditor';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export default function ImageSectionPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sectionData = useSelector((state: RootState) => state.imageSection.data) as SectionData | null;

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    dispatch(clearData());
  }, [dispatch]);

  const showError = (message: string) => {
    setNotification({ open: true, message, severity: 'error' });
  };

  const validate = useCallback((): boolean => {
    if (!sectionData?.caption?.trim()) {
      showError('O título das atividades do seu Abrigo é obrigatório.');
      return false;
    }
    if (!sectionData?.description?.trim()) {
      showError('A descrição das atividades é obrigatória.');
      return false;
    }
    if (!sectionData?.mediaItems?.length) {
      showError('Adicione pelo menos uma imagem das atividades do seu Abrigo.');
      return false;
    }
    return true;
  }, [sectionData]);

  const prepareFormData = useCallback((): FormData => {
    const formData = new FormData();

    const mediaItems = sectionData!.mediaItems.map((media, index) => {
      const base = {
        isLocalFile: media.isLocalFile,
        url: media.url || '',
        uploadType: media.uploadType || MediaUploadType.UPLOAD,
        mediaType: MediaType.IMAGE,
        title: media.title || '',
        description: media.description || '',
        platformType: media.platformType || MediaPlatform.ANY,
        originalName: media.originalName,
        size: media.size,
      };

      if (media.isLocalFile && media.file) {
        const fieldKey = `file_${index}`;
        formData.append(fieldKey, media.file);
        return { ...base, fieldKey, id: media.id };
      }

      return { ...base, id: media.id };
    });

    const payload = {
      caption: sectionData!.caption,
      description: sectionData!.description,
      public: sectionData!.public,
      mediaItems,
    };

    formData.append('sectionData', JSON.stringify(payload));
    return formData;
  }, [sectionData]);

  const saveSection = async (formData: FormData) => {
    await api.post('/image-sections', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    setNotification({
      open: true,
      message: 'Imagens do seu Abrigo compartilhadas com sucesso!',
      severity: 'success',
    });

    dispatch(clearData());
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    const formData = prepareFormData();

    try {
      await saveSection(formData);

      navigate('/area-do-membro');
    } catch {
      showError('Falha ao compartilhar as imagens do seu Abrigo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (updatedData: Partial<SectionData>) => {
    dispatch(setData({ ...(sectionData || {}), ...updatedData } as SectionData));
  };

  const handleCancel = () => {
    navigate(MEMBER_AREA_HOME_PATH);
  };

  return (
    <>
    <LoadingSpinner open={isSaving} aria-label="Salvando a seção" />
    <NotificationModal
      open={notification.open}
      message={notification.message}
      severity={notification.severity}
      onClose={() => setNotification({ ...notification, open: false })}
    />
    <Stack data-testid="member-photos-page" spacing={{ xs: 2, md: 3 }}>
      <ImageSectionEditor
        isEditMode={false}
        initialCaption={sectionData?.caption || ''}
        initialDescription={sectionData?.description || ''}
        initialIsPublic={sectionData?.public ?? true}
        initialMediaItems={sectionData?.mediaItems || []}
        onChange={handleChange}
        captionPlaceholder="EX: Abrigo São Lucas: Gincana de Páscoa - Acolhidos aprendendo sobre ressurreição"
        descriptionPlaceholder="EX: Descreva as atividades realizadas no seu Abrigo: dinâmicas, brincadeiras, ensinamentos bíblicos, momentos especiais com as pessoas e como elas reagiram às atividades."
      />

      <Paper
        data-testid="member-photos-actions"
        elevation={0}
        sx={{
          ...MEMBER_CARD_SX,
          display: 'flex',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <Button
          data-testid="member-photos-cancel"
          variant="outlined"
          color="inherit"
          onClick={handleCancel}
          disabled={isSaving}
          sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          data-testid="member-photos-submit"
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          sx={{ minHeight: 44, px: 3, textTransform: 'none', fontWeight: 700 }}
          aria-label="Compartilhar imagens do Abrigo"
        >
          {isSaving ? 'Enviando...' : 'Compartilhar imagens'}
        </Button>
      </Paper>
    </Stack>
    </>
  );
}
